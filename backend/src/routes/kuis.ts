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

// Cek apakah user sudah lulus kuis tertentu
async function checkUserLulusKuis(tugasId: number, userId: number): Promise<boolean> {
  const { data: rows, error } = await supabase
    .from("hasil_kuis")
    .select("skor, jumlah_percobaan")
    .eq("id_tugas", tugasId)
    .eq("id_user", userId)
    .order("created_at", { ascending: true });

  if (error || !rows || rows.length === 0) return false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const percobaan = Number((row as any).jumlah_percobaan ?? (i + 1));
    const threshold = percobaan === 1 ? 70 : 80;
    if (row.skor >= threshold) return true;
  }
  return false;
}


// Ambil bonus percobaan dari tabel kuis_reset_percobaan (0 jika tabel belum ada)
async function getBonusPercobaan(tugasId: number, userId: number): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("kuis_reset_percobaan")
      .select("bonus_percobaan")
      .eq("id_tugas", tugasId)
      .eq("id_user", userId)
      .maybeSingle();

    if (error) return 0;
    return data?.bonus_percobaan ?? 0;
  } catch {
    return 0;
  }
}

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
    const bestRow = rows.length > 0
      ? rows.reduce((best, row) => row.skor > best.skor ? row : best, rows[0])
      : null;
    const totalAttempts =
      rows.length > 1
        ? rows.length
        : Number(latest?.jumlah_percobaan ?? (latest ? 1 : 0));

    return { rows, latest, bestRow, totalAttempts, hasAttemptCounterColumn: true };
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
  const bestRow = rows.length > 0
    ? rows.reduce((best, row) => row.skor > best.skor ? row : best, rows[0])
    : null;
  return { rows, latest: rows[0] ?? null, bestRow, totalAttempts: rows.length, hasAttemptCounterColumn: false };
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
    const [state, bonus] = await Promise.all([
      getQuizAttemptState(tugasId, userId),
      getBonusPercobaan(tugasId, userId),
    ]);
    const maxPercobaan = MAX_PERCOBAAN_KUIS + bonus;

    if (!state.latest)
      return res.json({
        success: true,
        sudahMengerjakan: false,
        jumlahPercobaan: 0,
        maxPercobaan,
        data: null,
      });

    const best = state.bestRow ?? state.latest;
    res.json({
      success: true,
      sudahMengerjakan: true,
      jumlahPercobaan: state.totalAttempts,
      maxPercobaan,
      data: {
        skor: best.skor,
        benar: best.benar,
        total: best.total,
        createdAt: state.latest.created_at,
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
    const [currentState, bonusPercobaan] = await Promise.all([
      getQuizAttemptState(tugasId, numericUserId),
      getBonusPercobaan(tugasId, numericUserId),
    ]);
    const maxPercobaan = MAX_PERCOBAAN_KUIS + bonusPercobaan;
    if (currentState.totalAttempts >= maxPercobaan) {
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
      jumlah_percobaan: nextAttemptCount,
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
      .select("nama_tugas")
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

    const previousBestSkor = currentState.rows.reduce((max, r) => Math.max(max, r.skor), 0);
    const bestSkor = Math.max(skor, previousBestSkor);

    res.json({
      success: true,
      data: { skor, benar, total, jumlahPercobaan: persistedAttempts, bestSkor, maxPercobaan },
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
    // Fetch ALL rows for this quiz (no pagination here — we need all to compute best per user)
    const { data: hasilList, error: hasilError } = await supabase
      .from("hasil_kuis")
      .select("id_hasil, id_user, skor, benar, total, created_at")
      .eq("id_tugas", tugasId)
      .order("created_at", { ascending: false });

    if (hasilError) throw hasilError;
    if (!hasilList || hasilList.length === 0)
      return res.json({ success: true, data: [], total: 0 });

    // Group by user — keep best score row per user
    const bestPerUser = new Map<number, typeof hasilList[0]>();
    const attemptCountPerUser = new Map<number, number>();
    for (const h of hasilList) {
      attemptCountPerUser.set(h.id_user, (attemptCountPerUser.get(h.id_user) ?? 0) + 1);
      const existing = bestPerUser.get(h.id_user);
      if (!existing || h.skor > existing.skor) {
        bestPerUser.set(h.id_user, h);
      }
    }

    const userIds = [...bestPerUser.keys()];
    const { data: users, error: userError } = await supabase
      .from("user")
      .select("id_user, username, email")
      .in("id_user", userIds);

    if (userError) throw userError;

    const userMap = Object.fromEntries(
      (users ?? []).map((u) => [u.id_user, u]),
    );

    const result = [...bestPerUser.values()].map((h) => ({
      id_hasil: h.id_hasil,
      skor: h.skor,
      benar: h.benar,
      total: h.total,
      created_at: h.created_at,
      jumlahPercobaan: attemptCountPerUser.get(h.id_user) ?? 1,
      user: userMap[h.id_user] ?? null,
    }));

    res.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error: any) {
    console.error("Error fetching semua hasil:", error);
    res.status(500).json({ success: false, error: "Failed to fetch hasil" });
  }
});

// ── GET /api/kuis/user/:userId/riwayat ───────────────────────────────────
// Admin: semua kuis yang pernah dikerjakan oleh user tertentu
router.get("/user/:userId/riwayat", verifySupabaseToken, async (req: any, res) => {
  if (req.user.role !== "superadmin")
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId))
    return res.status(400).json({ success: false, error: "userId tidak valid" });

  try {
    // 1. Semua hasil kuis user ini (diurutkan asc untuk hitung percobaan ke-berapa)
    // Tidak select jumlah_percobaan karena kolom mungkin belum ada di semua environment
    const { data: hasilList, error: hasilError } = await supabase
      .from("hasil_kuis")
      .select("id_tugas, skor, created_at")
      .eq("id_user", userId)
      .order("created_at", { ascending: true });

    if (hasilError) throw hasilError;
    if (!hasilList || hasilList.length === 0)
      return res.json({ success: true, data: [] });

    // 2. Group by id_tugas — hitung percobaan aktual (jumlah baris) & best skor
    const tugasStats = new Map<number, {
      rows: typeof hasilList;
      bestSkor: number;
      count: number;
    }>();
    for (const row of hasilList) {
      const s = tugasStats.get(row.id_tugas);
      if (!s) {
        tugasStats.set(row.id_tugas, { rows: [row], bestSkor: row.skor, count: 1 });
      } else {
        s.rows.push(row);
        s.count++;
        if (row.skor > s.bestSkor) s.bestSkor = row.skor;
      }
    }

    const tugasIds = [...tugasStats.keys()];

    // 3. Detail tugas — ID sudah dari hasil_kuis jadi pasti kuis, tidak perlu filter type
    const { data: tugasList, error: tugasError } = await supabase
      .from("tugas")
      .select("id_tugas, nama_tugas, pertemuan, id_materi, id_kelas")
      .in("id_tugas", tugasIds);

    if (tugasError) throw tugasError;
    if (!tugasList || tugasList.length === 0)
      return res.json({ success: true, data: [] });

    // 4. Ambil id_tingkatan via materi (tugas → id_materi → materi → id_tingkatan)
    const materiIds = [...new Set(tugasList.map((t) => t.id_materi).filter(Boolean))];
    let materiMap: Record<number, number> = {}; // id_materi → id_tingkatan
    if (materiIds.length > 0) {
      const { data: materiList } = await supabase
        .from("materi")
        .select("id_materi, id_tingkatan")
        .in("id_materi", materiIds);
      for (const m of materiList ?? []) {
        if (m.id_tingkatan) materiMap[m.id_materi] = m.id_tingkatan;
      }
    }

    // 5. Detail tingkatan
    const tingkatanIds = [...new Set(Object.values(materiMap))];
    let tingkatanMap: Record<number, { nama_tingkatan: string; level_urutan: number }> = {};
    if (tingkatanIds.length > 0) {
      const { data: tingkatanList } = await supabase
        .from("tingkatan")
        .select("id_tingkatan, nama_tingkatan, level_urutan")
        .in("id_tingkatan", tingkatanIds);
      for (const t of tingkatanList ?? [])
        tingkatanMap[t.id_tingkatan] = { nama_tingkatan: t.nama_tingkatan, level_urutan: t.level_urutan };
    }

    // 6. Nama kelas
    const kelasIds = [...new Set(tugasList.map((t) => t.id_kelas).filter(Boolean))];
    let kelasMap: Record<number, string> = {};
    if (kelasIds.length > 0) {
      const { data: kelasList } = await supabase
        .from("kelas")
        .select("id_kelas, nama_kelas")
        .in("id_kelas", kelasIds);
      for (const k of kelasList ?? []) kelasMap[k.id_kelas] = k.nama_kelas;
    }

    // 7. Gabungkan semua data
    const result = tugasList.map((tugas) => {
      const stats = tugasStats.get(tugas.id_tugas);
      const rows = stats?.rows ?? [];
      const bestSkor = stats?.bestSkor ?? 0;
      const count = stats?.count ?? 0;

      // Tentukan lulus — rows sudah sorted asc, index 0 = percobaan ke-1
      let lulus = false;
      for (let i = 0; i < rows.length; i++) {
        const threshold = i === 0 ? 70 : 80;
        if (rows[i].skor >= threshold) { lulus = true; break; }
      }

      const idTingkatan = tugas.id_materi ? materiMap[tugas.id_materi] : undefined;
      const tingkatan = idTingkatan ? tingkatanMap[idTingkatan] : null;

      return {
        id_tugas: tugas.id_tugas,
        nama_tugas: tugas.nama_tugas,
        pertemuan: tugas.pertemuan,
        id_kelas: tugas.id_kelas,
        nama_kelas: tugas.id_kelas ? (kelasMap[tugas.id_kelas] ?? null) : null,
        id_tingkatan: idTingkatan ?? null,
        nama_tingkatan: tingkatan?.nama_tingkatan ?? null,
        level_urutan: tingkatan?.level_urutan ?? null,
        best_skor: bestSkor,
        jumlah_percobaan: count,
        lulus,
      };
    });

    // Urutkan: kelas → level → pertemuan
    result.sort((a, b) => {
      if ((a.id_kelas ?? 0) !== (b.id_kelas ?? 0)) return (a.id_kelas ?? 0) - (b.id_kelas ?? 0);
      if ((a.level_urutan ?? 0) !== (b.level_urutan ?? 0)) return (a.level_urutan ?? 0) - (b.level_urutan ?? 0);
      return (a.pertemuan ?? 0) - (b.pertemuan ?? 0);
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error fetching riwayat kuis:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil riwayat kuis", detail: error?.message });
  }
});

// ── POST /api/kuis/:tugasId/reset-percobaan ───────────────────────────────
// Admin: tambah 5 percobaan lagi untuk user tertentu
router.post("/:tugasId/reset-percobaan", verifySupabaseToken, async (req: any, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res.status(400).json({ success: false, error: "tugasId tidak valid" });

  if (req.user.role !== "superadmin")
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  const { id_user } = req.body;
  if (!id_user)
    return res.status(400).json({ success: false, error: "id_user wajib diisi" });

  const numericUserId = Number(id_user);
  if (!Number.isFinite(numericUserId))
    return res.status(400).json({ success: false, error: "id_user tidak valid" });

  try {
    const { data: existing, error: selectError } = await supabase
      .from("kuis_reset_percobaan")
      .select("id, bonus_percobaan")
      .eq("id_tugas", tugasId)
      .eq("id_user", numericUserId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("kuis_reset_percobaan")
        .update({
          bonus_percobaan: existing.bonus_percobaan + MAX_PERCOBAAN_KUIS,
          reset_by: req.user.id_user,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("kuis_reset_percobaan")
        .insert({
          id_tugas: tugasId,
          id_user: numericUserId,
          bonus_percobaan: MAX_PERCOBAAN_KUIS,
          reset_by: req.user.id_user,
          updated_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;
    }

    res.json({
      success: true,
      message: `Berhasil menambah ${MAX_PERCOBAAN_KUIS} percobaan untuk user ${numericUserId}`,
    });
  } catch (error: any) {
    console.error("Error reset percobaan:", error);
    res.status(500).json({ success: false, error: "Gagal mereset percobaan", detail: error?.message });
  }
});

export default router;
