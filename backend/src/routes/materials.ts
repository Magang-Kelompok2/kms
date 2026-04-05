import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/materials
router.get("/", async (_req, res) => {
  try {
    // 1. Ambil query parameter classId dari URL
    const classIdFilter = _req.query.classId;

    // 2. Inisialisasi query Supabase
    let query = supabase.from("materi").select(`
      id_materi, title_materi, deskripsi, materi_path,
      id_kelas, id_tingkatan, pertemuan,
      kelas(nama_kelas),
      tingkatan(nama_tingkatan),
      video(id_video, title_video, video_path),
      pdf(id_pdf, title_pdf, pdf_path)
    `);

    // 3. Tambahkan filter jika classId diberikan di URL
    if (classIdFilter) {
      query = query.eq("id_kelas", Number(classIdFilter));
    }

    // 4. Eksekusi query
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
<<<<<<< HEAD
      success: true,
      data: {
        id: String(data.id_materi),
        title: data.title_materi,
        description: data.deskripsi ?? "",
        classId: String(data.id_kelas),
        level: data.id_tingkatan,
        meetingNumber: data.pertemuan,
        isPublished: true,
        files: [
          ...(data.video ?? []).map((v: any) => ({
            id: String(v.id_video),
            title: v.title_video ?? "Video",
            url: v.video_path,
            type: "video",
          })),
          ...(data.pdf ?? []).map((p: any) => ({
            id: String(p.id_pdf),
            title: p.title_pdf ?? "PDF",
            url: p.pdf_path,
            type: "pdf",
          })),
        ],
      },
    });
=======
  success: true,
  data: {
    id: String(data.id_materi),
    title: data.title_materi,
    description: data.deskripsi ?? "",
    content: data.deskripsi ?? "",
    classId: String(data.id_kelas),
    meetingNumber: data.pertemuan,
    level: data.id_tingkatan,   // ← TAMBAH INI
    isPublished: true,
    files: [
      ...(data.video ?? []).map((v: any) => ({
        id: String(v.id_video),
        name: v.title_video ?? "Video",  // ← 'name' bukan 'title'
        url: v.video_path,
        type: "video",
      })),
      ...(data.pdf ?? []).map((p: any) => ({
        id: String(p.id_pdf),
        name: p.title_pdf ?? "PDF",      // ← 'name' bukan 'title'
        url: p.pdf_path,
        type: "pdf",
      })),
    ],
  },
});
>>>>>>> sumber_auth/auth-system
  } catch (error) {
    console.error("Error fetching material:", error);
    res.status(500).json({ success: false, error: "Failed to fetch material" });
  }
});

// Tambahkan ke backend/src/routes/materials.ts
// (di bawah GET /:materialId, sebelum export default router)

// POST /api/materials
// Body: { title_materi, deskripsi?, id_kelas, id_tingkatan, pertemuan, videos?, pdfs? }
// videos: [{ title_video, video_path }]
// pdfs:   [{ title_pdf,   pdf_path   }]
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
    // 1. Insert materi
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

    // 2. Insert video (opsional)
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

    // 3. Insert pdf (opsional)
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
      detail: error?.message ?? error, // ← tambah ini
    });
  }
});

export default router;
