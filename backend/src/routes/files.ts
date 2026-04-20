import { Router, Request, Response } from "express";
import { minioClient, BUCKET, getPresignedUrl } from "../lib/minio";
import { supabase } from "../lib/supabase";

const router = Router();

// ── Resolve object key (handles folder prefix → find actual file) ──────────
async function resolveObjectKey(rawPath: string): Promise<string | null> {
  if (!rawPath) return null;

  const minioEndpoint = process.env.MINIO_ENDPOINT ?? "192.168.101.143";
  const minioPort = process.env.MINIO_PORT ?? "9000";
  const minioBase = `http://${minioEndpoint}:${minioPort}/`;

  let objectKey: string;

  if (rawPath.startsWith(minioBase)) {
    const withoutBase = rawPath.slice(minioBase.length);
    const pathPart = withoutBase.split("?")[0];
    const bucketPrefix = `${BUCKET}/`;
    objectKey = pathPart.startsWith(bucketPrefix)
      ? pathPart.slice(bucketPrefix.length)
      : pathPart;
  } else if (/^https?:\/\//i.test(rawPath)) {
    return null;
  } else {
    objectKey = rawPath;
    if (objectKey.startsWith(`${BUCKET}/`))
      objectKey = objectKey.slice(BUCKET.length + 1);
    if (objectKey.startsWith("/")) objectKey = objectKey.slice(1);
  }

  // Try exact key first
  try {
    await minioClient.statObject(BUCKET, objectKey);
    return objectKey;
  } catch {
    // Object not found at exact key — try listing with key as prefix
  }

  // Try listing with this path as prefix (handles folder-path stored as key)
  try {
    const stream = minioClient.listObjects(BUCKET, objectKey, true);
    const found = await new Promise<string | null>((resolve) => {
      stream.on("data", (obj) => {
        if (obj.name) {
          stream.destroy();
          resolve(obj.name);
        }
      });
      stream.on("end", () => resolve(null));
      stream.on("error", () => resolve(null));
    });
    return found;
  } catch {
    return null;
  }
}

// ── GET /api/files/proxy?path=<stored-path> ────────────────────────────────
// Streams a MinIO file through the backend (handles expired or wrong paths)
router.get("/proxy", async (req: Request, res: Response) => {
  const rawPath = req.query.path as string;
  if (!rawPath) {
    return res.status(400).json({ error: "path wajib diisi" });
  }

  const objectKey = await resolveObjectKey(rawPath);
  if (!objectKey) {
    return res.status(404).json({ error: "File tidak ditemukan di MinIO" });
  }

  try {
    const stat = await minioClient.statObject(BUCKET, objectKey);
    const stream = await minioClient.getObject(BUCKET, objectKey);

    res.setHeader(
      "Content-Type",
      stat.metaData?.["content-type"] ?? "application/octet-stream",
    );
    res.setHeader("Content-Length", String(stat.size));
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${objectKey.split("/").pop()}"`,
    );
    res.setHeader("Cache-Control", "private, max-age=3600");

    stream.pipe(res);
    stream.on("error", () => res.status(500).end());
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Gagal mengambil file" });
  }
});

// ── GET /api/files/download?path=<stored-path> ─────────────────────────────
router.get("/download", async (req: Request, res: Response) => {
  const rawPath = req.query.path as string;
  if (!rawPath) {
    return res.status(400).json({ error: "path wajib diisi" });
  }

  const objectKey = await resolveObjectKey(rawPath);
  if (!objectKey) {
    return res.status(404).json({ error: "File tidak ditemukan di MinIO" });
  }

  try {
    const stream = await minioClient.getObject(BUCKET, objectKey);
    const filename = objectKey.split("/").pop() ?? "file";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );
    res.setHeader("Cache-Control", "private, max-age=3600");

    stream.pipe(res);
    stream.on("error", () => res.status(500).end());
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Gagal mengambil file" });
  }
});

// ── GET /api/files/signed-url?path=<stored-path> ──────────────────────────
// Resolves the real objectKey (even if stored as folder) and returns fresh URL
router.get("/signed-url", async (req: Request, res: Response) => {
  const rawPath = req.query.path as string;
  if (!rawPath) {
    return res.status(400).json({ error: "path wajib diisi" });
  }

  const objectKey = await resolveObjectKey(rawPath);
  if (!objectKey) {
    return res
      .status(404)
      .json({ error: "File tidak ditemukan di MinIO", rawPath });
  }

  try {
    const url = await minioClient.presignedGetObject(
      BUCKET,
      objectKey,
      7 * 24 * 60 * 60,
    );
    return res.json({ success: true, url, objectKey });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err?.message ?? "Gagal membuat URL" });
  }
});

// ── GET /api/files/debug/list?prefix= ──────────────────────────────────────
// List objects in MinIO bucket (for debugging)
router.get("/debug/list", async (req: Request, res: Response) => {
  const prefix = (req.query.prefix as string) ?? "";
  const objects: any[] = [];

  try {
    const stream = minioClient.listObjects(BUCKET, prefix, true);
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj) => objects.push({ key: obj.name, size: obj.size, lastModified: obj.lastModified }));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    res.json({ success: true, bucket: BUCKET, prefix, count: objects.length, objects });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// ── GET /api/files/debug/db-paths ──────────────────────────────────────────
// Show raw stored paths in pdf, video, and tugas tables
router.get("/debug/db-paths", async (_req: Request, res: Response) => {
  try {
    const [pdfs, videos, tugasList] = await Promise.all([
      supabase.from("pdf").select("id_pdf, title_pdf, pdf_path").limit(20),
      supabase.from("video").select("id_video, title_video, video_path").limit(20),
      supabase.from("tugas").select("id_tugas, nama_tugas, file_path").not("file_path", "is", null).limit(20),
    ]);

    res.json({
      success: true,
      pdf: pdfs.data ?? [],
      video: videos.data ?? [],
      tugas: tugasList.data ?? [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

export default router;
