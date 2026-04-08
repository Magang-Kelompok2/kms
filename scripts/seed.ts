import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables dari .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("URL atau Key Supabase tidak ditemukan di .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("🚀 Memulai proses seeding data...");

  // 1. Seed Tabel Kelas
  const classes = [
    { id_kelas: 1, nama_kelas: "Akuntansi" },
    { id_kelas: 2, nama_kelas: "Audit" },
    { id_kelas: 3, nama_kelas: "Perpajakan" },
  ];
  const { error: errKelas } = await supabase.from("kelas").upsert(classes);
  if (errKelas) console.error("Error Kelas:", errKelas.message);
  else console.log("✅ Tabel Kelas berhasil diisi");

  // 2. Seed Tabel Tingkatan (Level)
  const levels = [
    { id_tingkatan: 1, nama_tingkatan: "Level 1", id_kelas: 1 },
    { id_tingkatan: 2, nama_tingkatan: "Level 2", id_kelas: 1 },
    { id_tingkatan: 3, nama_tingkatan: "Level 1", id_kelas: 2 },
    { id_tingkatan: 4, nama_tingkatan: "Level 1", id_kelas: 3 },
  ];
  await supabase.from("tingkatan").upsert(levels);
  console.log("✅ Tabel Tingkatan berhasil diisi");

  // 3. Seed Tabel Materi
  const materials = [
    {
      id_materi: 1,
      title_materi: "Pengenalan Sistem Perpajakan Indonesia",
      id_kelas: 1,
      id_tingkatan: 1,
    },
    {
      id_materi: 2,
      title_materi: "PPh Pasal 21 - Pajak Penghasilan Karyawan",
      id_kelas: 1,
      id_tingkatan: 1,
    },
    {
      id_materi: 3,
      title_materi: "PPN - Pajak Pertambahan Nilai",
      id_kelas: 1,
      id_tingkatan: 2,
    },
  ];
  await supabase.from("materi").upsert(materials);
  console.log("✅ Tabel Materi berhasil diisi");

  // 4. Seed Tabel Tugas
  const assignments = [
    {
      id_tugas: 1,
      nama_tugas: "Tugas: Analisis Jenis Pajak",
      id_materi: 2,
      id_kelas: 1,
      type: "Tugas",
    },
    {
      id_tugas: 2,
      nama_tugas: "Tugas: Studi Kasus Audit",
      id_materi: 1,
      id_kelas: 2,
      type: "Kuis",
    },
  ];
  await supabase.from("tugas").upsert(assignments);
  console.log("✅ Tabel Tugas berhasil diisi");

  // 5. Seed Tabel User (Mock)
  const users = [
    {
      id_user: 1,
      username: "admin",
      email: "admin@example.com",
      password: "hashedpassword",
      role: "superadmin",
    },
    {
      id_user: 2,
      username: "johndoe",
      email: "user@example.com",
      password: "hashedpassword",
      role: "user",
    },
  ];
  await supabase.from("user").upsert(users);
  console.log("✅ Tabel User berhasil diisi");

  console.log("🏁 Seeding selesai!");
}

seed();
