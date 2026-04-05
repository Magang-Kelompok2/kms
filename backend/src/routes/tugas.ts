import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/tugas
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("tugas")
      .select(
        "id_tugas, nama_tugas, deskripsi, type, id_materi, id_kelas, pertemuan, deadline, created_at",
      )
      .order("id_tugas", { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error fetching tugas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tugas" });
  }
});

// GET /api/tugas/:tugasId
router.get("/:tugasId", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId harus berupa angka" });

  try {
    const { data, error } = await supabase
      .from("tugas")
      .select(
        `id_tugas, nama_tugas, deskripsi, type, id_materi, id_kelas,
         pertemuan, deadline, created_at,
         materi!inner(id_tingkatan, pertemuan)`,
      )
      .eq("id_tugas", tugasId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: String(data.id_tugas),
        title: data.nama_tugas ?? "",
        description: data.deskripsi ?? "",
        dueDate: data.deadline ?? data.created_at,
        classId: String(data.id_kelas),
        level: (data.materi as any)?.id_tingkatan ?? 1,
        meetingNumber: data.pertemuan,
        type: data.type ?? "",
        materialId: String(data.id_materi),
        isPublished: true,
        attachments: [],
      },
    });
  } catch (error) {
    console.error("Error fetching tugas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tugas" });
  }
});

// POST /api/tugas
// Tambah tugas baru
router.post("/", async (req, res) => {
  const {
    nama_tugas,
    deskripsi,
    type, // Ini yang dikirim dari frontend ("kuis")
    id_materi,
    id_kelas,
    pertemuan,
    deadline,
  } = req.body;

  if (!nama_tugas || !id_materi || !id_kelas)
    return res.status(400).json({
      success: false,
      error: "nama_tugas, id_materi, id_kelas wajib diisi",
    });

  try {
    // TAMBAHKAN LOGIKA PROTEKSI DI SINI
    // Jika type yang masuk adalah "kuis", paksa jadi "Kuis"
    const validatedType = type?.toLowerCase() === "kuis" ? "Kuis" : type;

    const { data, error } = await supabase
      .from("tugas")
      .insert({
        nama_tugas,
        deskripsi: deskripsi ?? null,
        type: validatedType, // Gunakan variabel yang sudah divalidasi
        id_materi: Number(id_materi),
        id_kelas: Number(id_kelas),
        pertemuan: pertemuan ? Number(pertemuan) : 1,
        deadline: deadline ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error creating tugas:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create tugas",
      detail: error.message, // Ini biar kamu bisa lihat pesan error aslinya di response
    });
  }
});

export default router;
