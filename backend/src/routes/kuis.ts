import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

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
    res
      .status(500)
      .json({
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
router.get("/:tugasId/hasil/:userId", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  const userId = Number(req.params.userId);

  if (isNaN(tugasId) || isNaN(userId))
    return res
      .status(400)
      .json({ success: false, error: "Parameter tidak valid" });

  try {
    const { data, error } = await supabase
      .from("hasil_kuis")
      .select("id_hasil, skor, benar, total, created_at")
      .eq("id_tugas", tugasId)
      .eq("id_user", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data)
      return res.json({ success: true, sudahMengerjakan: false, data: null });

    res.json({
      success: true,
      sudahMengerjakan: true,
      data: {
        skor: data.skor,
        benar: data.benar,
        total: data.total,
        createdAt: data.created_at,
      },
    });
  } catch (error: any) {
    console.error("Error fetching hasil:", error);
    res.status(500).json({ success: false, error: "Failed to fetch hasil" });
  }
});

// ── POST /api/kuis/:tugasId/submit ────────────────────────────────────────
router.post("/:tugasId/submit", async (req, res) => {
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

    // 3. Cek apakah sudah pernah submit
    const { data: existing } = await supabase
      .from("hasil_kuis")
      .select("id_hasil")
      .eq("id_user", Number(id_user))
      .eq("id_tugas", tugasId)
      .maybeSingle();

    let hasilError;

    if (existing) {
      // Update hasil lama
      const { error } = await supabase
        .from("hasil_kuis")
        .update({ skor, benar, total, jawaban: JSON.stringify(jawaban) })
        .eq("id_hasil", existing.id_hasil);
      hasilError = error;
    } else {
      // Insert baru
      const { error } = await supabase.from("hasil_kuis").insert({
        id_tugas: tugasId,
        id_user: Number(id_user),
        skor,
        benar,
        total,
        jawaban: JSON.stringify(jawaban),
      });
      hasilError = error;
    }

    if (hasilError) throw hasilError;

    res.json({ success: true, data: { skor, benar, total } });
  } catch (error: any) {
    console.error("Error submitting kuis:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to submit kuis",
        detail: error?.message ?? error,
      });
  }
});

// ── GET /api/kuis/:tugasId/hasil ──────────────────────────────────────────
router.get("/:tugasId/hasil", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  try {
    const { data: hasilList, error: hasilError } = await supabase
      .from("hasil_kuis")
      .select("id_hasil, id_user, skor, benar, total, created_at")
      .eq("id_tugas", tugasId)
      .order("created_at", { ascending: false });

    if (hasilError) throw hasilError;
    if (!hasilList || hasilList.length === 0)
      return res.json({ success: true, data: [] });

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

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error fetching semua hasil:", error);
    res.status(500).json({ success: false, error: "Failed to fetch hasil" });
  }
});

export default router;
