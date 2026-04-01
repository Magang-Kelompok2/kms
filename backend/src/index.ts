import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import multer from "multer";
import * as Minio from "minio";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const BUCKET = process.env.MINIO_BUCKET ?? "alpha";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── MINIO CLIENT ─────────────────────────────────────────────────────────────
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
app.use(bodyParser.json());

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── GET ALL KELAS ───────────────────────────────────────────────────────────

app.get("/api/kelas", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("kelas")
      .select("id_kelas, nama_kelas, created_at")
      .order("id_kelas", { ascending: true });

    if (error) throw error;

    const mapped = (data ?? []).map((k) => ({
      id: k.id_kelas,
      name: k.nama_kelas,
      createdAt: k.created_at,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error("Error fetching kelas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch kelas" });
  }
});

// ─── GET SINGLE KELAS ─────────────────────────────────────────────────────────

app.get("/api/kelas/:classId", async (req, res) => {
  const classId = Number(req.params.classId);

  if (isNaN(classId)) {
    return res
      .status(400)
      .json({ success: false, error: "classId harus berupa angka" });
  }

  try {
    const { data, error } = await supabase
      .from("kelas")
      .select("id_kelas, nama_kelas, created_at")
      .eq("id_kelas", classId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: data.id_kelas,
        name: data.nama_kelas,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching kelas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch kelas" });
  }
});

// ─── GET ALL MATERIALS ───────────────────────────────────────────────────────

app.get("/api/materials", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("materi").select(`
        id_materi,
        title_materi,
        materi_path,
        id_kelas,
        id_tingkatan,
        pertemuan,
        kelas ( nama_kelas ),
        tingkatan ( nama_tingkatan ),
        video ( id_video, title_video, video_path ),
        pdf ( id_pdf, title_pdf, pdf_path )
      `);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// ─── GET SINGLE MATERIAL BY ID ───────────────────────────────────────────────

app.get("/api/materials/:materialId", async (req, res) => {
  const materialId = Number(req.params.materialId);
  if (isNaN(materialId)) {
    return res
      .status(400)
      .json({ success: false, error: "materialId harus berupa angka" });
  }

  try {
    const { data, error } = await supabase
      .from("materi")
      .select(
        `id_materi, title_materi, materi_path, id_kelas, id_tingkatan, pertemuan, kelas (nama_kelas), tingkatan (nama_tingkatan), video (id_video, title_video, video_path), pdf (id_pdf, title_pdf, pdf_path)`,
      )
      .eq("id_materi", materialId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: String(data.id_materi),
        title: data.title_materi,
        description: data.materi_path || "",
        content: "",
        classId: String(data.id_kelas),
        meetingNumber: data.pertemuan,
        level: data.tingkatan?.id_tingkatan ?? data.id_tingkatan,
        isPublished: true,
        files: [
          ...(data.video ?? []).map((v: any) => ({
            id: String(v.id_video),
            name: v.title_video ?? "Video Materi",
            type: "video",
            url: v.video_path,
          })),
          ...(data.pdf ?? []).map((p: any) => ({
            id: String(p.id_pdf),
            name: p.title_pdf ?? "PDF Materi",
            type: "pdf",
            url: p.pdf_path,
          })),
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching material by id:", error);
    res.status(500).json({ success: false, error: "Failed to fetch material" });
  }
});

// ─── GET ALL TUGAS ────────────────────────────────────────────────────────────

app.get("/api/tugas", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("tugas")
      .select(
        "id_tugas, nama_tugas, deskripsi, type, id_materi, id_kelas, pertemuan, created_at",
      )
      .order("id_tugas", { ascending: true });

    if (error) throw error;

    res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error fetching tugas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tugas" });
  }
});

// ─── GET SINGLE ASSIGNMENT BY ID ─────────────────────────────────────────────

app.get("/api/tugas/:tugasId", async (req, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId)) {
    return res
      .status(400)
      .json({ success: false, error: "tugasId harus berupa angka" });
  }

  try {
    const { data, error } = await supabase
      .from("tugas")
      .select(
        `id_tugas, nama_tugas, deskripsi, type, id_materi, id_kelas, pertemuan, created_at, materi (id_tingkatan, pertemuan)`,
      )
      .eq("id_tugas", tugasId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: String(data.id_tugas),
        title: data.nama_tugas ?? "",
        description: data.deskripsi ?? "",
        dueDate: data.created_at,
        classId: String(data.id_kelas),
        meetingNumber: data.pertemuan ?? data.materi?.pertemuan ?? 0,
        level: data.materi?.id_tingkatan ?? 0,
        materialId: String(data.id_materi),
        isPublished: true,
        attachments: [],
      },
    });
  } catch (error) {
    console.error("Error fetching assignment by id:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch assignment" });
  }
});

// ─── GET LEVELS BY CLASS (untuk UserLevelCard) ───────────────────────────────

app.get("/api/kelas/:classId/levels", async (req, res) => {
  const classId = Number(req.params.classId);

  try {
    const { data: tingkatanList, error: tingkatanError } = await supabase
      .from("tingkatan")
      .select("id_tingkatan, nama_tingkatan")
      .eq("id_kelas", classId)
      .order("id_tingkatan", { ascending: true });

    if (tingkatanError) throw tingkatanError;

    const { data: materiList, error: materiError } = await supabase
      .from("materi")
      .select(
        `
        id_materi,
        title_materi,
        materi_path,
        id_tingkatan,
        pertemuan,
        video ( id_video, title_video, video_path ),
        pdf ( id_pdf, title_pdf, pdf_path )
      `,
      )
      .eq("id_kelas", classId)
      .order("pertemuan", { ascending: true });

    if (materiError) throw materiError;

    const { data: tugasList, error: tugasError } = await supabase
      .from("tugas")
      .select(
        "id_tugas, nama_tugas, deskripsi, type, id_materi, pertemuan, created_at",
      )
      .eq("id_kelas", classId)
      .order("pertemuan", { ascending: true });

    if (tugasError) throw tugasError;

    const levels = (tingkatanList ?? []).map((tingkatan, index) => {
      const materiDiTingkatan = (materiList ?? []).filter(
        (m) => m.id_tingkatan === tingkatan.id_tingkatan,
      );

      const materials = materiDiTingkatan.map((m) => ({
        id: String(m.id_materi),
        title: m.title_materi,
        description: m.materi_path ?? "",
        meetingNumber: m.pertemuan,
        files: [
          ...(m.video ?? []).map((v: any) => ({ ...v, type: "video" })),
          ...(m.pdf ?? []).map((p: any) => ({ ...p, type: "pdf" })),
        ],
      }));

      const materiIds = new Set(materiDiTingkatan.map((m) => m.id_materi));

      const assignments = (tugasList ?? [])
        .filter((t) => materiIds.has(t.id_materi))
        .map((t) => ({
          id: String(t.id_tugas),
          title: t.nama_tugas,
          description: t.deskripsi,
          meetingNumber: t.pertemuan,
          dueDate: t.created_at,
          type: t.type,
        }));

      return {
        id: String(tingkatan.id_tingkatan),
        level: index + 1,
        namaLevel: tingkatan.nama_tingkatan,
        materials,
        assignments,
        quizzes: [],
      };
    });

    res.json({ success: true, data: levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ success: false, error: "Failed to fetch levels" });
  }
});

// ─── UPLOAD FILE ─────────────────────────────────────────────────────────────

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { title, type, id_kelas, id_tingkatan, pertemuan } = req.body;
    const filename = `materi/${Date.now()}-${req.file.originalname}`;
    const kelasId = id_kelas ? Number(id_kelas) : null;
    const tingkatanId = id_tingkatan ? Number(id_tingkatan) : null;
    const pertemuanNum = pertemuan ? Number(pertemuan) : 1;

    await minioClient.putObject(BUCKET, filename, req.file.buffer);

    const { data: materi, error: materiError } = await supabase
      .from("materi")
      .insert({
        title_materi: title,
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
      return res.json({ materi, video });
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
      return res.json({ materi, pdf });
    }

    res.json({ materi });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

async function start() {
  try {
    const { error } = await supabase.from("kelas").select("id_kelas").limit(1);
    if (error) throw error;

    console.log("✅ Supabase connected!");

    try {
      const exists = await minioClient.bucketExists(BUCKET);
      if (!exists) await minioClient.makeBucket(BUCKET);
      console.log("✅ MinIO bucket ready!");
    } catch (minioError) {
      console.warn(
        "⚠️  MinIO tidak tersedia, upload file tidak akan berfungsi:",
        minioError,
      );
    }

    app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
}

start();
