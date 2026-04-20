import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/tugas
router.get("/", async (_req, res) => {
  try {
    const limit = Math.min(Number(_req.query.limit ?? 50), 100); // Default 50, max 100
    const offset = Number(_req.query.offset ?? 0);
    const classId = _req.query.classId;
    const type = _req.query.type;

    let query = supabase
      .from("tugas")
      .select(
        "id_tugas, nama_tugas, deskripsi, type, id_materi, id_kelas, pertemuan, deadline, durasi, created_at",
        { count: "exact" },
      );

    if (classId) query = query.eq("id_kelas", Number(classId));
    if (type) query = query.eq("type", type);

    const { data, error, count } = await query
      .order("id_tugas", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      success: true,
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
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
         pertemuan, deadline, durasi, path_tugas, created_at,
         materi(id_tingkatan, pertemuan)`,
      )
      .eq("id_tugas", tugasId)
      .single();

    if (error) throw error;

    const level = (data.materi as any)?.id_tingkatan ?? 1;
    const apiBase =
      process.env.VITE_API_URL ??
      `http://localhost:${process.env.PORT ?? 4000}`;

    // Convert path_tugas to file attachment (similar to materials)
    const attachments = (data as any).path_tugas
      ? [
          {
            id: String(data.id_tugas),
            name:
              ((data as any).path_tugas as string).split("/").pop() ||
              "File Tugas",
            url: `${apiBase}/api/files/proxy?path=${encodeURIComponent((data as any).path_tugas)}`,
            type: "pdf" as const,
          },
        ]
      : [];

    res.json({
      success: true,
      data: {
        id: String(data.id_tugas),
        title: data.nama_tugas ?? "",
        description: data.deskripsi ?? "",
        dueDate: data.deadline ?? data.created_at,
        classId: String(data.id_kelas),
        meetingNumber: data.pertemuan,
        type: data.type ?? "",
        level,
        durasi: (data as any).durasi ?? 60,
        materialId: String(data.id_materi),
        isPublished: true,
        file_path:
          attachments.length > 0
            ? `${apiBase}/api/files/proxy?path=${encodeURIComponent((data as any).path_tugas)}`
            : null,
        attachments: attachments,
      },
    });
  } catch (error) {
    console.error("Error fetching tugas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tugas" });
  }
});

// POST /api/tugas
router.post("/", async (req, res) => {
  const {
    nama_tugas,
    deskripsi,
    type,
    id_materi,
    id_kelas,
    pertemuan,
    deadline,
    durasi, // ← tambah
  } = req.body;

  if (!nama_tugas || !id_materi || !id_kelas)
    return res.status(400).json({
      success: false,
      error: "nama_tugas, id_materi, id_kelas wajib diisi",
    });

  try {
    const validatedType = type?.toLowerCase() === "kuis" ? "Kuis" : type;

    const { data, error } = await supabase
      .from("tugas")
      .insert({
        nama_tugas,
        deskripsi: deskripsi ?? null,
        type: validatedType,
        id_materi: Number(id_materi),
        id_kelas: Number(id_kelas),
        pertemuan: pertemuan ? Number(pertemuan) : 1,
        deadline: deadline ?? null,
        durasi: durasi ? Number(durasi) : 60,
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
      detail: error.message,
    });
  }
});

// PUT /api/tugas/:tugasId
router.put("/:tugasId", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId)) {
    return res
      .status(400)
      .json({ success: false, error: "tugasId harus berupa angka" });
  }

  const { nama_tugas, deskripsi, pertemuan, deadline } = req.body;

  try {
    const updateData: any = {};
    if (nama_tugas) updateData.nama_tugas = nama_tugas;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (pertemuan) updateData.pertemuan = Number(pertemuan);
    if (deadline) updateData.deadline = deadline;

    const { data, error } = await supabase
      .from("tugas")
      .update(updateData)
      .eq("id_tugas", tugasId)
      .select(
        `id_tugas, nama_tugas, deskripsi, type, id_materi, id_kelas,
         pertemuan, deadline, durasi, path_tugas, created_at,
         materi!inner(id_tingkatan, pertemuan)`,
      )
      .single();

    if (error) throw error;

    const level = (data.materi as any)?.id_tingkatan ?? 1;
    const apiBase =
      process.env.VITE_API_URL ??
      `http://localhost:${process.env.PORT ?? 4000}`;

    // Convert path_tugas to file attachment (similar to materials)
    const attachments = (data as any).path_tugas
      ? [
          {
            id: String(data.id_tugas),
            name:
              ((data as any).path_tugas as string).split("/").pop() ||
              "File Tugas",
            url: `${apiBase}/api/files/proxy?path=${encodeURIComponent((data as any).path_tugas)}`,
            type: "pdf" as const,
          },
        ]
      : [];

    res.json({
      success: true,
      data: {
        id: String(data.id_tugas),
        title: data.nama_tugas ?? "",
        description: data.deskripsi ?? "",
        dueDate: data.deadline ?? data.created_at,
        classId: String(data.id_kelas),
        level,
        meetingNumber: data.pertemuan,
        type: data.type ?? "",
        materialId: String(data.id_materi),
        durasi: (data as any).durasi ?? 60,
        isPublished: true,
        file_path:
          attachments.length > 0
            ? `${apiBase}/api/files/proxy?path=${encodeURIComponent((data as any).path_tugas)}`
            : null,
        attachments: attachments,
      },
    });
  } catch (error) {
    console.error("Error updating tugas:", error);
    res.status(500).json({ success: false, error: "Failed to update tugas" });
  }
});

// DELETE /api/tugas/:tugasId
router.delete("/:tugasId", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId)) {
    return res
      .status(400)
      .json({ success: false, error: "tugasId harus berupa angka" });
  }

  try {
    const { error } = await supabase
      .from("tugas")
      .delete()
      .eq("id_tugas", tugasId);

    if (error) throw error;

    res.json({ success: true, message: "Tugas deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting tugas:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete tugas",
      detail: error.message,
    });
  }
});

export default router;
