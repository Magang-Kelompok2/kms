import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/kuis/:tugasId/soal — ambil soal kuis
router.get("/:tugasId/soal", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  try {
    const { data, error } = await supabase
      .from("soal_kuis")
      .select("id_soal, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, urutan")
      .eq("id_tugas", tugasId)
      .order("urutan", { ascending: true });

    if (error) throw error;

    res.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    console.error("Error fetching soal:", error);
    res.status(500).json({ success: false, error: "Failed to fetch soal" });
  }
});

// POST /api/kuis/:tugasId/soal — tambah soal (superadmin)
router.post("/:tugasId/soal", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  const { pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, jawaban_benar, urutan } =
    req.body;

  if (!pertanyaan || !opsi_a || !opsi_b || !opsi_c || !opsi_d || !jawaban_benar)
    return res
      .status(400)
      .json({ success: false, error: "Semua field wajib diisi" });

  try {
    const { data, error } = await supabase
      .from("soal_kuis")
      .insert({
        id_tugas: tugasId,
        pertanyaan,
        opsi_a,
        opsi_b,
        opsi_c,
        opsi_d,
        jawaban_benar: jawaban_benar.toLowerCase(),
        urutan: urutan ?? 1,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("Error adding soal:", error);
    res.status(500).json({ success: false, error: "Failed to add soal" });
  }
});

// POST /api/kuis/:tugasId/submit — submit jawaban
router.post("/:tugasId/submit", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  const { id_user, jawaban } = req.body;

  if (!id_user || !jawaban)
    return res
      .status(400)
      .json({ success: false, error: "id_user dan jawaban wajib diisi" });

  try {
    // Ambil semua soal beserta jawaban benar
    const { data: soalList, error: soalError } = await supabase
      .from("soal_kuis")
      .select("id_soal, jawaban_benar")
      .eq("id_tugas", tugasId);

    if (soalError) throw soalError;
    if (!soalList || soalList.length === 0)
      return res
        .status(404)
        .json({ success: false, error: "Soal tidak ditemukan" });

    // Hitung skor
    let benar = 0;
    for (const soal of soalList) {
      if (jawaban[soal.id_soal]?.toLowerCase() === soal.jawaban_benar) {
        benar++;
      }
    }
    const total = soalList.length;
    const skor = Math.round((benar / total) * 100);

    // Simpan hasil (upsert)
    const { data: hasil, error: hasilError } = await supabase
      .from("hasil_kuis")
      .upsert(
        {
          id_user: Number(id_user),
          id_tugas: tugasId,
          jawaban,
          skor,
          benar, // ← fix: tambah benar
          total, // ← fix: tambah total
        },
        { onConflict: "id_user,id_tugas" },
      )
      .select()
      .single();

    if (hasilError) throw hasilError;

    res.json({ success: true, data: { skor, benar, total } });
  } catch (error: any) {
    console.error("Error submitting kuis:", error);
    res.status(500).json({ success: false, error: "Failed to submit kuis" });
  }
});

// GET /api/kuis/:tugasId/hasil/:userId — cek hasil user
router.get("/:tugasId/hasil/:userId", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  const userId = Number(req.params.userId);

  try {
    const { data, error } = await supabase
      .from("hasil_kuis")
      .select("id_hasil, skor, jawaban, created_at") // ← fix: selesai_at → created_at
      .eq("id_tugas", tugasId)
      .eq("id_user", userId)
      .maybeSingle();

    if (error) throw error;

    res.json({ success: true, data: data ?? null, sudahMengerjakan: !!data });
  } catch (error: any) {
    console.error("Error fetching hasil:", error);
    res.status(500).json({ success: false, error: "Failed to fetch hasil" });
  }
});

export default router;
