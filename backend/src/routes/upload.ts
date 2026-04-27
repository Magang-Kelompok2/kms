// backend/src/routes/upload.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import { minioClient, BUCKET } from "../lib/minio";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { verifySupabaseToken } from "../middleware/auth";
import {
  buildErrorNotificationMessage,
  buildNotificationMessage,
  createNotificationSafe,
} from "../lib/notifications";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

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

  const url = await minioClient.presignedGetObject(
    BUCKET,
    objectKey,
    7 * 24 * 60 * 60,
  );

  return { objectKey, url };
}

// ── POST /api/upload/materi-file ──────────────────────────────────────────
router.post(
  "/materi-file",
  verifySupabaseToken,
  upload.single("file"),
  async (req: any, res: Response) => {
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
      const { data: materiData, error: materiError } = await supabase
        .from("materi")
        .select(
          `
          title_materi,
          kelas ( nama_kelas ),
          tingkatan ( nama_tingkatan )
        `,
        )
        .eq("id_materi", Number(id_materi))
        .single();

      if (materiError) throw materiError;

      const namaKelas = ((materiData.kelas as any)?.nama_kelas ?? "unknown").replace(/\s+/g, "_");
      const namaTingkatan = ((materiData.tingkatan as any)?.nama_tingkatan ?? "unknown").replace(/\s+/g, "_");
      const safeMateri = materiData.title_materi ?? "materi";
      const folder = `${namaKelas}/${namaTingkatan}/${safeMateri}/pdf`;

      const { objectKey, url } = await uploadToMinio(
        file.buffer,
        file.originalname,
        folder,
        file.mimetype,
      );

      if (type === "pdf") {
        const { data, error } = await supabase
          .from("pdf")
          .insert({
            id_materi: Number(id_materi),
            title_pdf: title ?? file.originalname,
            pdf_path: objectKey,
          })
          .select()
          .single();

        if (error) throw error;
        await createNotificationSafe({
          userId: Number(req.user?.id_user),
          type: "SUCCESS",
          status: 200,
          category: "MATERI",
          message: buildNotificationMessage(
            200,
            "Berhasil",
            `PDF ${data.title_pdf ?? file.originalname} telah ditambahkan ke materi ${materiData.title_materi ?? "materi"}`,
          ),
        });
        return res.json({ success: true, data: { ...data, url, objectKey } });
      } else {
        const { data, error } = await supabase
          .from("video")
          .insert({
            id_materi: Number(id_materi),
            title_video: title ?? file.originalname,
            video_path: objectKey,
          })
          .select()
          .single();

        if (error) throw error;
        await createNotificationSafe({
          userId: Number(req.user?.id_user),
          type: "SUCCESS",
          status: 200,
          category: "MATERI",
          message: buildNotificationMessage(
            200,
            "Berhasil",
            `Video ${data.title_video ?? file.originalname} telah ditambahkan ke materi ${materiData.title_materi ?? "materi"}`,
          ),
        });
        return res.json({ success: true, data: { ...data, url, objectKey } });
      }
    } catch (err: any) {
      console.error("Error uploading materi file:", err);
      if (Number.isFinite(Number(req.user?.id_user))) {
        await createNotificationSafe({
          userId: Number(req.user.id_user),
          type: "FAILED",
          status: 400,
          category: "MATERI",
          message: buildErrorNotificationMessage(
            "Gagal",
            err,
            `Upload file materi ${file?.originalname ?? ""} gagal`,
          ),
        });
      }
      return res
        .status(500)
        .json({ success: false, error: err?.message ?? "Upload gagal" });
    }
  },
);

// ── POST /api/upload/tugas-file ───────────────────────────────────────────
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

// ── POST /api/upload/assignment-file ─────────────────────────────────────
router.post(
  "/assignment-file",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file)
      return res
        .status(400)
        .json({ success: false, error: "File tidak ditemukan" });

    const { id_tugas } = req.body;
    if (!id_tugas) {
      return res
        .status(400)
        .json({ success: false, error: "id_tugas wajib diisi" });
    }

    try {
      // Ambil nama tugas untuk folder yang rapi
      const { data: tugasData, error: tugasError } = await supabase
        .from("tugas")
        .select(`
          nama_tugas,
          materi (
            title_materi,
            kelas ( nama_kelas ),
            tingkatan ( nama_tingkatan )
          )
        `)
        .eq("id_tugas", Number(id_tugas))
        .single();

      if (tugasError) throw tugasError;

      const namaKelas = ((tugasData.materi as any)?.kelas?.nama_kelas ?? "unknown").replace(/\s+/g, "_");
      const namaTingkatan = ((tugasData.materi as any)?.tingkatan?.nama_tingkatan ?? "unknown").replace(/\s+/g, "_");
      const namaMateri = (tugasData.materi as any)?.title_materi ?? "materi";
      const folder = `${namaKelas}/${namaTingkatan}/${namaMateri}/Assignment`;

      const { objectKey, url } = await uploadToMinio(
        file.buffer,
        file.originalname,
        folder,
        file.mimetype,
      );

      // Fix: pakai path_tugas bukan file_path
      const { error } = await supabase
        .from("tugas")
        .update({ path_tugas: objectKey })
        .eq("id_tugas", Number(id_tugas));

      if (error) throw error;

      return res.json({ success: true, data: { objectKey, url } });
    } catch (err: any) {
      console.error("Error uploading assignment file:", err);
      return res
        .status(500)
        .json({ success: false, error: err?.message ?? "Upload gagal" });
    }
  },
);

// ── GET /api/upload/tugas-files/:tugasId ──────────────────────────────────
router.get("/tugas-files/:tugasId", async (req: Request, res: Response) => {
  const tugasId = Number(req.params.tugasId);

  if (isNaN(tugasId)) {
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });
  }

  try {
    const { data, error } = await supabase
      .from("tugas")
      .select("id_tugas, path_tugas")
      .eq("id_tugas", tugasId)
      .maybeSingle();

    if (error) throw error;

    if (!data?.path_tugas) {
      return res.json({ success: true, data: { files: [] } });
    }

    const objectKey = String(data.path_tugas);
    const fileName = objectKey.split("/").pop() || "File Tugas";
    const url = await minioClient.presignedGetObject(
      BUCKET,
      objectKey,
      7 * 24 * 60 * 60,
    );

    return res.json({
      success: true,
      data: {
        files: [
          {
            id: String(data.id_tugas),
            name: fileName,
            type: path.extname(fileName).replace(".", "") || "file",
            size: 0,
            url,
          },
        ],
      },
    });
  } catch (err: any) {
    console.error("Error fetching tugas files:", err);
    return res.status(500).json({
      success: false,
      error: err?.message ?? "Gagal mengambil file tugas",
    });
  }
});

// ── GET /api/upload/signed-url ────────────────────────────────────────────
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
