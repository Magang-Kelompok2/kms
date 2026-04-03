import * as Minio from "minio";
import dotenv from "dotenv";
dotenv.config();

export const BUCKET = process.env.MINIO_BUCKET ?? "alpha";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "alpha",
  secretKey: process.env.MINIO_SECRET_KEY ?? "alpha123",
});
