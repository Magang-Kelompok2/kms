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

app.get("/api/materi", async (req, res) => {
  const result = await pool.query(`
    SELECT m.*, mo.title_modul 
    FROM materi m 
    JOIN modul mo ON m.id_modul = mo.id_modul
  `);
  res.json(result.rows);
});

app.post("/api/materi/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { title, id_modul } = req.body;
    const filename = `materi/${Date.now()}-${req.file.originalname}`;

    // 1. Upload ke MinIO
    await minioClient.putObject(BUCKET, filename, req.file.buffer);

    // 2. Simpan Path ke Database sesuai kolom 'materi_path' di ERD
    const result = await pool.query(
      `INSERT INTO materi (title_materi, id_modul, materi_path)
       VALUES ($1, $2, $3) RETURNING *`,
      [title, id_modul, filename]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Upload materi failed" });
  }
});

async function start() {
  try {
    // Urutan pembuatan tabel sangat penting karena adanya Foreign Key
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id_user SERIAL PRIMARY KEY,
        username VARCHAR(256) NOT NULL,
        password VARCHAR(256) NOT NULL,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tingkatan (
        id_tingkatan SERIAL PRIMARY KEY,
        title_tingkatan VARCHAR(256) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS course (
        id_course SERIAL PRIMARY KEY,
        title_course VARCHAR(256) NOT NULL,
        id_tingkatan INT REFERENCES tingkatan(id_tingkatan),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS assignment (
        id_assignment SERIAL PRIMARY KEY,
        id_course INT REFERENCES course(id_course),
        title_assign VARCHAR(256),
        description TEXT,
        type VARCHAR(256),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS submission (
        id_submission SERIAL PRIMARY KEY,
        id_assign INT REFERENCES assignment(id_assignment),
        id_user INT REFERENCES "user"(id_user),
        answer TEXT,
        sub_path VARCHAR(256),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS modul (
        id_modul SERIAL PRIMARY KEY,
        id_tingkatan INT REFERENCES tingkatan(id_tingkatan),
        title_modul VARCHAR(256),
        modul_path VARCHAR(256)
      );

      CREATE TABLE IF NOT EXISTS video (
        id_video SERIAL PRIMARY KEY,
        id_modul INT REFERENCES modul(id_modul),
        title_video VARCHAR(256),
        video_path VARCHAR(256)
      );

      CREATE TABLE IF NOT EXISTS materi (
        id_materi SERIAL PRIMARY KEY,
        id_modul INT REFERENCES modul(id_modul),
        title_materi VARCHAR(256),
        materi_path VARCHAR(256)
      );
    `);

    // Setup MinIO seperti biasa
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) await minioClient.makeBucket(BUCKET);

    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
}

start();
