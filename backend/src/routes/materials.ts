import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/materials
router.get("/", async (_req, res) => {
  try {
    const classIdFilter = _req.query.classId;

    let query = supabase.from("materi").select(`
      id_materi, title_materi, deskripsi, materi_path,
      id_kelas, id_tingkatan, pertemuan,
      kelas(nama_kelas),
      tingkatan(nama_tingkatan),
      video(id_video, title_video, video_path),
      pdf(id_pdf, title_pdf, pdf_path)
    `);

    if (classIdFilter) {
      query = query.eq("id_kelas", Number(classIdFilter));
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch materials" });
  }
});

// GET /api/materials/:materialId
router.get("/:materialId", async (req, res) => {
  const materialId = Number(req.params.materialId);
  if (isNaN(materialId))
    return res
      .status(400)
      .json({ success: false, error: "materialId harus berupa angka" });

  try {
    const { data, error } = await supabase
      .from("materi")
      .select(
        `id_materi, title_materi, deskripsi, materi_path,
         id_kelas, id_tingkatan, pertemuan,
         kelas(nama_kelas),
         tingkatan(id_tingkatan, nama_tingkatan),
         video(id_video, title_video, video_path),
         pdf(id_pdf, title_pdf, pdf_path)`,
      )
      .eq("id_materi", materialId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: String(data.id_materi),
        title: data.title_materi,
        description: data.deskripsi ?? "",
        classId: String(data.id_kelas),
        meetingNumber: data.pertemuan,
        // FIX: sertakan level dari id_tingkatan agar cek akses di frontend bisa jalan
        level: data.id_tingkatan,
        isPublished: true,
        files: [
          ...(data.video ?? []).map((v: any) => ({
            id: String(v.id_video),
            name: v.title_video ?? "Video",
            url: v.video_path,
            type: "video",
          })),
          ...(data.pdf ?? []).map((p: any) => ({
            id: String(p.id_pdf),
            name: p.title_pdf ?? "PDF",
            url: p.pdf_path,
            type: "pdf",
          })),
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    res.status(500).json({ success: false, error: "Failed to fetch material" });
  }
});

// POST /api/materials
router.post("/", async (req, res) => {
  const {
    title_materi,
    deskripsi,
    id_kelas,
    id_tingkatan,
    pertemuan,
    videos,
    pdfs,
  } = req.body;

  if (!title_materi || !id_kelas || !id_tingkatan) {
    return res.status(400).json({
      success: false,
      error: "title_materi, id_kelas, id_tingkatan wajib diisi",
    });
  }

  try {
    const { data: materi, error: materiError } = await supabase
      .from("materi")
      .insert({
        title_materi,
        deskripsi: deskripsi ?? null,
        id_kelas: Number(id_kelas),
        id_tingkatan: Number(id_tingkatan),
        pertemuan: pertemuan ? Number(pertemuan) : 1,
      })
      .select()
      .single();

    if (materiError) throw materiError;

    const id_materi = materi.id_materi;

    if (Array.isArray(videos) && videos.length > 0) {
      const videoRows = videos.map(
        (v: { title_video?: string; video_path: string }) => ({
          id_materi,
          title_video: v.title_video ?? null,
          video_path: v.video_path,
        }),
      );
      const { error: videoError } = await supabase
        .from("video")
        .insert(videoRows);
      if (videoError) throw videoError;
    }

    if (Array.isArray(pdfs) && pdfs.length > 0) {
      const pdfRows = pdfs.map(
        (p: { title_pdf?: string; pdf_path: string }) => ({
          id_materi,
          title_pdf: p.title_pdf ?? null,
          pdf_path: p.pdf_path,
        }),
      );
      const { error: pdfError } = await supabase.from("pdf").insert(pdfRows);
      if (pdfError) throw pdfError;
    }

    res.status(201).json({ success: true, data: { id_materi, ...materi } });
  } catch (error: any) {
    console.error("Error creating materi:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create materi",
      detail: error?.message ?? error,
    });
  }
});

export default router;
