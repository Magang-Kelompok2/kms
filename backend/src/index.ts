import express from "express";
import cors from "cors";
import { json } from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import { Pool } from "pg";
import Minio from "minio";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const BUCKET = process.env.MINIO_BUCKET ?? "taxacore";

async function initMinio() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (exists) {
    console.log(`Bucket '${BUCKET}' sudah ada, siap digunakan.`);
  } else {
    // Jika ternyata belum ada di lokalmu, baru buat
    await minioClient.makeBucket(BUCKET);
    console.log(`Bucket '${BUCKET}' baru saja dibuat.`);
  }
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5434),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY ?? "alpha",
  secretKey: process.env.MINIO_SECRET_KEY ?? "alpha123",
});

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/materials", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id_materi,
        m.title_materi,
        m.materi_path,
        m.id_kelas,
        m.id_tingkatan,
        m.created_at,
        k.nama_kelas,
        t.nama_tingkatan,
        COALESCE(videos.videos, '[]') AS videos,
        COALESCE(pdfs.pdfs, '[]') AS pdfs
      FROM materi m
      LEFT JOIN kelas k ON m.id_kelas = k.id_kelas
      LEFT JOIN tingkatan t ON m.id_tingkatan = t.id_tingkatan
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'id', v.id_video,
          'title', v.title_video,
          'url', v.video_path,
          'type', 'video'
        )) AS videos
        FROM video v
        WHERE v.id_materi = m.id_materi
      ) videos ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'id', p.id_pdf,
          'title', p.title_pdf,
          'url', p.pdf_path,
          'type', 'pdf'
        )) AS pdfs
        FROM pdf p
        WHERE p.id_materi = m.id_materi
      ) pdfs ON true
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { title, type, id_kelas, id_tingkatan } = req.body;
    const filename = `materi/${Date.now()}-${req.file.originalname}`;
    const kelasId = id_kelas ? Number(id_kelas) : null;
    const tingkatanId = id_tingkatan ? Number(id_tingkatan) : null;

    await minioClient.putObject(BUCKET, filename, req.file.buffer);

    const materiResult = await pool.query(
      `INSERT INTO materi (title_materi, materi_path, id_kelas, id_tingkatan)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, filename, kelasId, tingkatanId]
    );

    const materi = materiResult.rows[0];

    if (type === "video") {
      const videoResult = await pool.query(
        `INSERT INTO video (id_materi, title_video, video_path)
         VALUES ($1, $2, $3) RETURNING *`,
        [materi.id_materi, title, filename]
      );
      return res.json({ materi, video: videoResult.rows[0] });
    }

    if (type === "pdf") {
      const pdfResult = await pool.query(
        `INSERT INTO pdf (title_pdf, pdf_path, id_materi)
         VALUES ($1, $2, $3) RETURNING *`,
        [title, filename, materi.id_materi]
      );
      return res.json({ materi, pdf: pdfResult.rows[0] });
    }

    res.json({ materi });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

async function start() {
  try {
    // Urutan pembuatan tabel sangat penting karena adanya Foreign Key
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kelas (
        id_kelas SERIAL PRIMARY KEY,
        nama_kelas VARCHAR(256) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "USER" (
        id_user SERIAL PRIMARY KEY,
        username VARCHAR(256) NOT NULL,
        email VARCHAR(256) NOT NULL UNIQUE,
        password VARCHAR(256) NOT NULL,
        role VARCHAR(50),
        id_kelas INT REFERENCES kelas(id_kelas),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tingkatan (
        id_tingkatan SERIAL PRIMARY KEY,
        nama_tingkatan VARCHAR(256) NOT NULL,
        id_kelas INT REFERENCES kelas(id_kelas)
      );

      CREATE TABLE IF NOT EXISTS materi (
        id_materi SERIAL PRIMARY KEY,
        title_materi VARCHAR(256) NOT NULL,
        materi_path VARCHAR(256),
        id_kelas INT REFERENCES kelas(id_kelas),
        id_tingkatan INT REFERENCES tingkatan(id_tingkatan)
      );

      CREATE TABLE IF NOT EXISTS video (
        id_video SERIAL PRIMARY KEY,
        id_materi INT REFERENCES materi(id_materi),
        title_video VARCHAR(256),
        video_path VARCHAR(256)
      );

      CREATE TABLE IF NOT EXISTS pdf (
        id_pdf SERIAL PRIMARY KEY,
        title_pdf VARCHAR(256),
        pdf_path VARCHAR(256),
        id_materi INT REFERENCES materi(id_materi)
      );

      CREATE TABLE IF NOT EXISTS tugas (
        id_tugas SERIAL PRIMARY KEY,
        nama_tugas VARCHAR(256),
        deskripsi TEXT,
        type VARCHAR(256),
        id_materi INT REFERENCES materi(id_materi),
        id_kelas INT REFERENCES kelas(id_kelas),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS file_pengumpulan (
        id_file SERIAL PRIMARY KEY,
        bucket_name VARCHAR(256),
        object_key VARCHAR(256),
        ukuran_file INT,
        original_filename VARCHAR(256),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pengumpulan (
        id_pengumpulan SERIAL PRIMARY KEY,
        answer TEXT,
        id_file INT REFERENCES file_pengumpulan(id_file),
        id_tugas INT REFERENCES tugas(id_tugas),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_pengumpulan (
        id_user INT REFERENCES "USER"(id_user),
        id_pengumpulan INT REFERENCES pengumpulan(id_pengumpulan),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_user, id_pengumpulan)
      );
    `);

    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) await minioClient.makeBucket(BUCKET);

    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
}

start();
