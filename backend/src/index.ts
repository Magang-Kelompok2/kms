import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { supabase } from "./lib/supabase";
import { minioClient, BUCKET } from "./lib/minio";

import kelasRoutes from "./routes/kelas";
import usersRoutes from "./routes/users";
import materialsRoutes from "./routes/materials";
import tugasRoutes from "./routes/tugas";
import uploadRoutes from "./routes/upload";
import pengumpulanRoutes from "./routes/pengumpulan"; 
import kuisRoutes from "./routes/kuis";
import authRoutes from "./routes/auth";
import filesRoutes from "./routes/files";
import notificationsRoutes from "./routes/notifications";

const PORT = Number(process.env.PORT ?? 4000);
const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true
}));
app.use(bodyParser.json());

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/kelas", kelasRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/tugas", tugasRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pengumpulan", pengumpulanRoutes);
app.use("/api/kuis", kuisRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/notifications", notificationsRoutes);

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
    } catch (err) {
      console.warn(
        "⚠️  MinIO tidak tersedia, upload file tidak akan berfungsi",
        err,
      );
    }

    app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start backend:", error);
    process.exit(1);
  }
}

start();
