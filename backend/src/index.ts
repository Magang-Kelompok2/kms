import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { supabase } from "./lib/supabase";
import { minioClient, BUCKET } from "./lib/minio";

import authRoutes from "./routes/auth";       // ← TAMBAH INI
import kelasRoutes from "./routes/kelas";
import usersRoutes from "./routes/users";
import materialsRoutes from "./routes/materials";
import tugasRoutes from "./routes/tugas";
import uploadRoutes from "./routes/upload";

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const app = express();

app.use(cors());
app.use(express.json());

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);            // ← TAMBAH INI
app.use("/api/kelas", kelasRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/tugas", tugasRoutes);
app.use("/api/upload", uploadRoutes);

// ─── START SERVER ─────────────────────────────────────────────────────────────
async function start() {
  try {
    const { error } = await supabase.from("kelas").select("id_kelas").limit(1);
    if (error) throw error;
    console.log("✅ Supabase connected!");

    // try {
    //   const exists = await minioClient.bucketExists(BUCKET);
    //   if (!exists) await minioClient.makeBucket(BUCKET);
    //   console.log("✅ MinIO bucket ready!");
    // } catch {
    //   console.warn(
    //     "⚠️  MinIO tidak tersedia, upload file tidak akan berfungsi",
    //   );
    // }

    app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start backend:", error);
    process.exit(1);
  }
}

start();