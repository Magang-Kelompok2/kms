import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken, AuthenticatedRequest } from "../middleware/auth";
import {
  buildErrorNotificationMessage,
  buildNotificationMessage,
  createNotificationSafe,
} from "../lib/notifications";

const router = Router();
const MAX_PERCOBAAN_KUIS = 5;

const isMissingColumnError = (error: any, columnName: string) => {
  const message = String(error?.message ?? error?.details ?? "").toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    error?.code === "42703" ||
    message.includes(`column '${normalizedColumn}'`) ||
    message.includes(`column "${normalizedColumn}"`) ||
    message.includes(normalizedColumn)
  );
};

const isDuplicateKeyError = (error: any) => {
  const message = String(error?.message ?? error?.details ?? "").toLowerCase();
  return error?.code === "23505" || message.includes("duplicate key");
};

async function getQuizAttemptState(tugasId: number, userId: number) {
  const { data, error } = await supabase
    .from("hasil_kuis")
    .select("id_hasil, skor, benar, total, created_at, jumlah_percobaan")
    .eq("id_tugas", tugasId)
    .eq("id_user", userId)
    .order("created_at", { ascending: false });

  if (!error) {
    const rows = data ?? [];
    const latest = rows[0] ?? null;
    const totalAttempts =
      rows.length > 1
        ? rows.length
        : Number(latest?.jumlah_percobaan ?? (latest ? 1 : 0));

    return {
      rows,
      latest,
      totalAttempts,
      hasAttemptCounterColumn: true,
    };
  }

  if (!isMissingColumnError(error, "jumlah_percobaan")) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("hasil_kuis")
    .select("id_hasil, skor, benar, total, created_at")
    .eq("id_tugas", tugasId)
    .eq("id_user", userId)
    .order("created_at", { ascending: false });

  if (legacyError) throw legacyError;

  const rows = legacyData ?? [];
  return {
    rows,
    latest: rows[0] ?? null,
    totalAttempts: rows.length,
    hasAttemptCounterColumn: false,
  };
}

// ── POST /api/kuis/:tugasId/soal ───────────────────────────────────────────
router.post("/:tugasId/soal", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  const { pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, urutan } =
    req.body;

  if (!pertanyaan || !opsi_a || !opsi_b || !opsi_c || !opsi_d || !jawaban_benar)
    return res
      .status(400)
      .json({ success: false, error: "Semua field soal wajib diisi" });

  try {
    const { data: tugas, error: tugasError } = await supabase
      .from("tugas")
      .select("id_tugas, type")
      .eq("id_tugas", tugasId)
      .single();

    if (tugasError || !tugas)
      return res
        .status(404)
        .json({ success: false, error: "Tugas tidak ditemukan" });

    if (tugas.type?.toLowerCase() !== "kuis")
      return res
        .status(400)
        .json({ success: false, error: "Tugas ini bukan kuis" });

    const { data, error } = await supabase
      .from("soal_kuis")
      .insert({
        id_tugas: tugasId,
        pertanyaan,
        opsi_a,
        opsi_b,
        opsi_c,
        opsi_d,
        jawaban_benar,
        urutan: urutan ?? 1,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("Error creating soal:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create soal",
      detail: error?.message ?? error,
    });
  }
});

// ── GET /api/kuis/:tugasId/soal ────────────────────────────────────────────
router.get("/:tugasId/soal", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  try {
    const { data, error } = await supabase
      .from("soal_kuis")
      .select(
        "id_soal, id_tugas, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, urutan",
      )
      .eq("id_tugas", tugasId)
      .order("urutan", { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    console.error("Error fetching soal:", error);
    res.status(500).json({ success: false, error: "Failed to fetch soal" });
  }
});

// ── GET /api/kuis/:tugasId/hasil/:userId ──────────────────────────────────
router.get("/:tugasId/hasil/:userId", verifySupabaseToken, async (req: any, res) => {
  const tugasId = Number(req.params.tugasId);
  const userId = Number(req.params.userId);

  if (isNaN(tugasId) || isNaN(userId))
    return res
      .status(400)
      .json({ success: false, error: "Parameter tidak valid" });

  if (req.user.role !== "superadmin" && Number(req.user.id_user) !== userId)
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  try {
    const state = await getQuizAttemptState(tugasId, userId);

    if (!state.latest)
      return res.json({
        success: true,
        sudahMengerjakan: false,
        jumlahPercobaan: 0,
        data: null,
      });

    const latest = state.latest;
    res.json({
      success: true,
      sudahMengerjakan: true,
      jumlahPercobaan: state.totalAttempts,
      data: {
        skor: latest.skor,
        benar: latest.benar,
        total: latest.total,
        createdAt: latest.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching hasil:", error);
    res.status(500).json({ success: false, error: "Failed to fetch hasil" });
  }
});

// ── POST /api/kuis/:tugasId/submit ────────────────────────────────────────
router.post("/:tugasId/submit", verifySupabaseToken, async (req: any, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  const { id_user, jawaban } = req.body;

  if (!id_user || !jawaban)
    return res
      .status(400)
      .json({ success: false, error: "id_user dan jawaban wajib diisi" });

  try {
    // 1. Ambil soal beserta jawaban benar
    const { data: soalList, error: soalError } = await supabase
      .from("soal_kuis")
      .select("id_soal, jawaban_benar")
      .eq("id_tugas", tugasId);

    if (soalError) throw soalError;
    if (!soalList || soalList.length === 0)
      return res
        .status(400)
        .json({ success: false, error: "Kuis ini belum memiliki soal" });

    // 2. Hitung skor
    let benar = 0;
    const total = soalList.length;

    for (const soal of soalList) {
      const jawabanUser = jawaban[soal.id_soal];
      if (jawabanUser?.toLowerCase() === soal.jawaban_benar?.toLowerCase())
        benar++;
    }

    const skor = Math.round((benar / total) * 100);

    // 3. Selalu insert percobaan baru (mendukung pengerjaan ulang maks. 5×)
    const numericUserId = Number(req.user?.id_user ?? id_user);
    const currentState = await getQuizAttemptState(tugasId, numericUserId);
    if (currentState.totalAttempts >= MAX_PERCOBAAN_KUIS) {
      return res.status(400).json({
        success: false,
        error: `Kuis hanya dapat dikerjakan maksimal ${MAX_PERCOBAAN_KUIS} kali`,
      });
    }

    const nextAttemptCount = currentState.totalAttempts + 1;
    const submittedAt = new Date().toISOString();
    const basePayload = {
      id_tugas: tugasId,
      id_user: numericUserId,
      skor,
      benar,
      total,
      jawaban: JSON.stringify(jawaban),
      created_at: submittedAt,
    };

    let persistedAttempts = nextAttemptCount;

    const { error: hasilError } = await supabase.from("hasil_kuis").insert({
      ...basePayload,
      jumlah_percobaan: 1,
    });

    if (hasilError) {
      if (isMissingColumnError(hasilError, "jumlah_percobaan")) {
        const { error: legacyInsertError } = await supabase
          .from("hasil_kuis")
          .insert(basePayload);

        if (legacyInsertError && !isDuplicateKeyError(legacyInsertError)) {
          throw legacyInsertError;
        }

        if (legacyInsertError && isDuplicateKeyError(legacyInsertError)) {
          const latestRowId = currentState.latest?.id_hasil;
          if (!latestRowId) throw legacyInsertError;

          const { error: legacyUpdateError } = await supabase
            .from("hasil_kuis")
            .update(basePayload)
            .eq("id_hasil", latestRowId);

          if (legacyUpdateError) throw legacyUpdateError;
        }
      } else if (isDuplicateKeyError(hasilError)) {
        const latestRowId = currentState.latest?.id_hasil;
        if (!latestRowId) throw hasilError;

        const { error: updateError } = await supabase
          .from("hasil_kuis")
          .update({
            ...basePayload,
            jumlah_percobaan: nextAttemptCount,
          })
          .eq("id_hasil", latestRowId);

        if (updateError) {
          if (!isMissingColumnError(updateError, "jumlah_percobaan")) {
            throw updateError;
          }

          const { error: legacyUpdateError } = await supabase
            .from("hasil_kuis")
            .update(basePayload)
            .eq("id_hasil", latestRowId);

          if (legacyUpdateError) throw legacyUpdateError;
        }
      } else {
        throw hasilError;
      }
    } else {
      persistedAttempts =
        currentState.totalAttempts > 0 ? nextAttemptCount : 1;
    }

    const { data: tugas } = await supabase
      .from("tugas")
      .select("nama_tugas, id_kelas, id_tingkatan")
      .eq("id_tugas", tugasId)
      .maybeSingle();

    await createNotificationSafe({
      userId: numericUserId,
      type: "SUCCESS",
      status: 200,
      category: "KUIS",
      message: buildNotificationMessage(
        200,
        "Berhasil",
        `Kuis ${tugas?.nama_tugas ?? tugasId} telah dikumpulkan dengan skor ${skor}`,
      ),
    });

    // ── Auto-update progress jika lulus ──────────────────────────
    // Attempt 1: lulus jika skor >= 70. Attempt 2+: skor >= 80
    const passingScore = persistedAttempts === 1 ? 70 : 80;
    if (skor >= passingScore && tugas?.id_kelas && tugas?.id_tingkatan) {
      try {
        const idKelas = Number(tugas.id_kelas);

        // Cari level_urutan dari tingkatan kuis ini
        const { data: thisLevel } = await supabase
          .from("tingkatan")
          .select("level_urutan")
          .eq("id_tingkatan", tugas.id_tingkatan)
          .maybeSingle();

        if (thisLevel?.level_urutan != null) {
          // Cari tingkatan berikutnya di kelas yang sama
          const { data: nextLevel } = await supabase
            .from("tingkatan")
            .select("id_tingkatan, level_urutan")
            .eq("id_kelas", idKelas)
            .eq("level_urutan", thisLevel.level_urutan + 1)
            .maybeSingle();

          if (nextLevel?.id_tingkatan) {
            const updatedAt = new Date().toISOString();

            // Cek progress user saat ini
            const { data: existingProg } = await supabase
              .from("user_progress")
              .select("id_progress, id_tingkatan")
              .eq("id_user", numericUserId)
              .eq("id_kelas", idKelas)
              .maybeSingle();

            if (!existingProg?.id_progress) {
              // Belum ada progress → insert
              await supabase.from("user_progress").insert({
                id_user: numericUserId,
                id_kelas: idKelas,
                id_tingkatan: nextLevel.id_tingkatan,
                updated_at: updatedAt,
              });
            } else {
              // Cek level_urutan user saat ini — hanya advance, jangan downgrade
              const { data: userCurrentLevel } = await supabase
                .from("tingkatan")
                .select("level_urutan")
                .eq("id_tingkatan", existingProg.id_tingkatan ?? 0)
                .maybeSingle();

              const currentUrutan = userCurrentLevel?.level_urutan ?? 0;

              if (nextLevel.level_urutan > currentUrutan) {
                const { error: updateErr } = await supabase
                  .from("user_progress")
                  .update({ id_tingkatan: nextLevel.id_tingkatan, updated_at: updatedAt })
                  .eq("id_progress", existingProg.id_progress);

                // Fallback ke kolom lama jika skema belum diupdate
                if (updateErr && isMissingColumnError(updateErr, "id_tingkatan")) {
                  await supabase
                    .from("user_progress")
                    .update({ tingkatan_saat_ini: nextLevel.id_tingkatan, updated_at: updatedAt })
                    .eq("id_progress", existingProg.id_progress);
                }
              }
            }
          }
        }
      } catch (progressErr) {
        console.error("Gagal update progress setelah submit kuis:", progressErr);
        // Tidak gagalkan response — hasil kuis sudah tersimpan
      }
    }

    res.json({
      success: true,
      data: { skor, benar, total, jumlahPercobaan: persistedAttempts },
    });
  } catch (error: any) {
    console.error("Error submitting kuis:", error);
    const numericUserId = Number(req.user?.id_user ?? id_user);
    if (Number.isFinite(numericUserId)) {
      await createNotificationSafe({
        userId: numericUserId,
        type: "FAILED",
        status: 400,
        category: "KUIS",
        message: buildErrorNotificationMessage(
          "Gagal",
          error,
          `Pengumpulan kuis ${tugasId} gagal`,
        ),
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to submit kuis",
      detail: error?.message ?? error,
    });
  }
});

// ── GET /api/kuis/:tugasId/hasil ──────────────────────────────────────────
router.get("/:tugasId/hasil", verifySupabaseToken, async (req: any, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  // Check if user is superadmin
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const { data: hasilList, error: hasilError, count } = await supabase
      .from("hasil_kuis")
      .select("id_hasil, id_user, skor, benar, total, created_at", {
        count: "exact",
      })
      .eq("id_tugas", tugasId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (hasilError) throw hasilError;
    if (!hasilList || hasilList.length === 0)
      return res.json({
        success: true,
        data: [],
        total: count ?? 0,
        limit,
        offset,
      });

    const userIds = [...new Set(hasilList.map((h) => h.id_user))];
    const { data: users, error: userError } = await supabase
      .from("user")
      .select("id_user, username, email")
      .in("id_user", userIds);

    if (userError) throw userError;

    const userMap = Object.fromEntries(
      (users ?? []).map((u) => [u.id_user, u]),
    );

    const result = hasilList.map((h) => ({
      id_hasil: h.id_hasil,
      skor: h.skor,
      benar: h.benar,
      total: h.total,
      created_at: h.created_at,
      user: userMap[h.id_user] ?? null,
    }));

    res.json({
      success: true,
      data: result,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching semua hasil:", error);
    res.status(500).json({ success: false, error: "Failed to fetch hasil" });
  }
});

export default router;
