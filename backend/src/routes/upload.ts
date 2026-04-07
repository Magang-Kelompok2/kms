// backend/src/routes/upload.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import { minioClient, BUCKET } from "../lib/minio";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const router = Router();

// Multer — simpan di memory, bukan disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ── Helper: upload buffer ke MinIO ────────────────────────────────────────
async function uploadToMinio(
  buffer: Buffer,
  originalName: string,
  folder: string,
  mimetype: string,
): Promise<{ objectKey: string; url: string }> {
  const ext = path.extname(originalName);
  const objectKey = `${folder}/${uuidv4()}${ext}`;

  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    "Content-Type": mimetype,
  });

  // Buat presigned URL yang berlaku 7 hari (untuk akses user)
  const url = await minioClient.presignedGetObject(
    BUCKET,
    objectKey,
    7 * 24 * 60 * 60,
  );

  return { objectKey, url };
}

// ── POST /api/upload/materi-file ──────────────────────────────────────────
// Upload PDF atau video untuk materi, simpan metadata ke tabel pdf/video
// Body (multipart): file, type ("pdf"|"video"), id_materi, title
router.post(
  "/materi-file",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file)
      return res
        .status(400)
        .json({ success: false, error: "File tidak ditemukan" });

    const { type, id_materi, title } = req.body;
    if (!type || !id_materi) {
      return res
        .status(400)
        .json({ success: false, error: "type dan id_materi wajib diisi" });
    }

    try {
      const folder = type === "video" ? "videos" : "pdfs";
      const { objectKey, url } = await uploadToMinio(
        file.buffer,
        file.originalname,
        folder,
        file.mimetype,
      );

      // Simpan metadata ke DB
      if (type === "pdf") {
        const { data, error } = await supabase
          .from("pdf")
          .insert({
            id_materi: Number(id_materi),
            title_pdf: title ?? file.originalname,
            pdf_path: url,
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ success: true, data: { ...data, objectKey } });
      } else {
        const { data, error } = await supabase
          .from("video")
          .insert({
            id_materi: Number(id_materi),
            title_video: title ?? file.originalname,
            video_path: url,
          })
          .select()
          .single();
        if (error) throw error;
        return res.json({ success: true, data: { ...data, objectKey } });
      }
    } catch (err: any) {
      console.error("Error uploading materi file:", err);
      return res
        .status(500)
        .json({ success: false, error: err?.message ?? "Upload gagal" });
    }
  },
);

// ── POST /api/upload/tugas-file ───────────────────────────────────────────
// Upload file pengumpulan tugas oleh user
// Body (multipart): file
// Returns: id_file + url (untuk disimpan saat submit pengumpulan)
router.post(
  "/tugas-file",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file)
      return res
        .status(400)
        .json({ success: false, error: "File tidak ditemukan" });

    try {
      const { objectKey, url } = await uploadToMinio(
        file.buffer,
        file.originalname,
        "pengumpulan",
        file.mimetype,
      );

      // Simpan metadata ke tabel file_pengumpulan
      const { data, error } = await supabase
        .from("file_pengumpulan")
        .insert({
          bucket_name: BUCKET,
          object_key: objectKey,
          ukuran_file: file.size,
          original_filename: file.originalname,
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({ success: true, data: { ...data, url } });
    } catch (err: any) {
      console.error("Error uploading tugas file:", err);
      return res
        .status(500)
        .json({ success: false, error: err?.message ?? "Upload gagal" });
    }
  },
);

// ── GET /api/upload/signed-url ────────────────────────────────────────────
// Generate fresh presigned URL dari objectKey (untuk refresh URL yang expired)
// Query: ?key=pdfs/xxx.pdf
router.get("/signed-url", async (req: Request, res: Response) => {
  const { key } = req.query;
  if (!key || typeof key !== "string") {
    return res.status(400).json({ success: false, error: "key wajib diisi" });
  }

  try {
    const url = await minioClient.presignedGetObject(
      BUCKET,
      key,
      7 * 24 * 60 * 60,
    );
    return res.json({ success: true, url });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, error: err?.message ?? "Gagal generate URL" });
  }
});

export default router;
