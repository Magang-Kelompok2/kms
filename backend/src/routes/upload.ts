import { Router } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";
import { minioClient, BUCKET } from "../lib/minio";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });

    const { title, deskripsi, type, id_kelas, id_tingkatan, pertemuan } =
      req.body;
    const filename = `materi/${Date.now()}-${req.file.originalname}`;
    const kelasId = id_kelas ? Number(id_kelas) : null;
    const tingkatanId = id_tingkatan ? Number(id_tingkatan) : null;
    const pertemuanNum = pertemuan ? Number(pertemuan) : 1;

    // Upload ke MinIO
    await minioClient.putObject(BUCKET, filename, req.file.buffer);

    // Simpan materi ke Supabase
    const { data: materi, error: materiError } = await supabase
      .from("materi")
      .insert({
        title_materi: title,
        deskripsi: deskripsi ?? null,
        materi_path: filename,
        id_kelas: kelasId,
        id_tingkatan: tingkatanId,
        pertemuan: pertemuanNum,
      })
      .select()
      .single();

    if (materiError) throw materiError;

    if (type === "video") {
      const { data: video, error: videoError } = await supabase
        .from("video")
        .insert({
          id_materi: materi.id_materi,
          title_video: title,
          video_path: filename,
        })
        .select()
        .single();

      if (videoError) throw videoError;
      return res.json({ success: true, materi, video });
    }

    if (type === "pdf") {
      const { data: pdf, error: pdfError } = await supabase
        .from("pdf")
        .insert({
          title_pdf: title,
          pdf_path: filename,
          id_materi: materi.id_materi,
        })
        .select()
        .single();

      if (pdfError) throw pdfError;
      return res.json({ success: true, materi, pdf });
    }

    res.json({ success: true, materi });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

export default router;
