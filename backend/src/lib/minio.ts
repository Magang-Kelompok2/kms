import * as Minio from "minio";
import dotenv from "dotenv";
dotenv.config();

export const BUCKET = process.env.MINIO_BUCKET ?? "alpha";

console.log("MinIO config:", {
  endPoint: process.env.MINIO_ENDPOINT ?? "127.0.0.1",
  port: Number(process.env.MINIO_PORT ?? 9000),
  bucket: process.env.MINIO_BUCKET,
});

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "127.0.0.1",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "alpha",
  secretKey: process.env.MINIO_SECRET_KEY ?? "alpha123",
});

export async function getPresignedUrl(resourcePath: string) {
  if (!resourcePath) return resourcePath;
  const normalized = resourcePath.trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;

  let objectKey = normalized;
  if (objectKey.startsWith(`${BUCKET}/`)) {
    objectKey = objectKey.slice(BUCKET.length + 1);
  }
  if (objectKey.startsWith("/")) {
    objectKey = objectKey.slice(1);
  }

  try {
    return await minioClient.presignedGetObject(
      BUCKET,
      objectKey,
      7 * 24 * 60 * 60,
    );
  } catch (err) {
    console.error(
      "Failed to create presigned URL for MinIO object:",
      objectKey,
      err,
    );
    return resourcePath;
  }
}
