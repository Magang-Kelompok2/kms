import { Router, Request, Response } from "express";
import { minioClient, BUCKET } from "../lib/minio";
import { supabase } from "../lib/supabase";

const router = Router();

function normalizeObjectName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/\b(dan|and)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

async function resolveObjectKey(rawPath: string): Promise<string | null> {
  if (!rawPath) return null;

  const minioEndpoint = process.env.MINIO_ENDPOINT ?? "76.13.222.194";
  const minioPort = process.env.MINIO_PORT ?? "9012";
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
    if (objectKey.startsWith(`${BUCKET}/`)) {
      objectKey = objectKey.slice(BUCKET.length + 1);
    }
    if (objectKey.startsWith("/")) {
      objectKey = objectKey.slice(1);
    }
  }

  try {
    await minioClient.statObject(BUCKET, objectKey);
    return objectKey;
  } catch {}

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

    if (found) return found;
  } catch {}

  const fileName = objectKey.split("/").pop() ?? "";
  const target = normalizeObjectName(fileName);
  const parentPrefix = objectKey.includes("/")
    ? objectKey.slice(0, objectKey.lastIndexOf("/"))
    : "";

  if (!target || !parentPrefix) return null;

  try {
    const stream = minioClient.listObjects(BUCKET, parentPrefix, true);

    const found = await new Promise<string | null>((resolve) => {
      let resolved = false;

      const finish = (value: string | null) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      stream.on("data", (obj) => {
        if (resolved || !obj.name) return;

        const candidateName = obj.name.split("/").pop() ?? obj.name;

        if (normalizeObjectName(candidateName) === target) {
          stream.destroy();
          finish(obj.name);
        }
      });

      stream.on("end", () => finish(null));
      stream.on("error", () => finish(null));
    });

    return found;
  } catch {
    return null;
  }
}

function getContentType(objectKey: string, metaContentType?: string) {
  if (metaContentType) return metaContentType;

  const lower = objectKey.toLowerCase();

  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".pdf")) return "application/pdf";

  return "application/octet-stream";
}

// ── GET /api/files/proxy?path=<stored-path> ────────────────────────────────
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
    const fileSize = Number(stat.size);
    const range = req.headers.range;
    const contentType = getContentType(
      objectKey,
      stat.metaData?.["content-type"],
    );
    const filename = objectKey.split("/").pop() ?? "file";

    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start >= fileSize ||
        end >= fileSize ||
        start > end
      ) {
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        return res.status(416).end();
      }

      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", String(chunkSize));

      const stream = await minioClient.getPartialObject(
        BUCKET,
        objectKey,
        start,
        chunkSize,
      );

      stream.pipe(res);
      stream.on("error", () => {
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      });

      return;
    }

    res.status(200);
    res.setHeader("Content-Length", String(fileSize));

    const stream = await minioClient.getObject(BUCKET, objectKey);

    stream.pipe(res);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });
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

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");

    stream.pipe(res);
    stream.on("error", () => res.status(500).end());
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Gagal mengambil file" });
  }
});

// ── GET /api/files/signed-url?path=<stored-path> ──────────────────────────
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
    return res.status(500).json({ error: err?.message ?? "Gagal membuat URL" });
  }
});

// ── GET /api/files/debug/list?prefix= ──────────────────────────────────────
router.get("/debug/list", async (req: Request, res: Response) => {
  const prefix = (req.query.prefix as string) ?? "";
  const objects: any[] = [];

  try {
    const stream = minioClient.listObjects(BUCKET, prefix, true);

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj) =>
        objects.push({
          key: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
        }),
      );
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    res.json({
      success: true,
      bucket: BUCKET,
      prefix,
      count: objects.length,
      objects,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// ── GET /api/files/debug/db-paths ──────────────────────────────────────────
router.get("/debug/db-paths", async (_req: Request, res: Response) => {
  try {
    const [pdfs, videos, tugasList] = await Promise.all([
      supabase.from("pdf").select("id_pdf, title_pdf, pdf_path").limit(20),
      supabase
        .from("video")
        .select("id_video, title_video, video_path")
        .limit(20),
      supabase
        .from("tugas")
        .select("id_tugas, nama_tugas, file_path")
        .not("file_path", "is", null)
        .limit(20),
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
