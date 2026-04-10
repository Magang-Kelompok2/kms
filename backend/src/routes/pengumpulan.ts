import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// POST /api/pengumpulan
// Body: { id_tugas, id_user, answer?, id_file? }
router.post("/", async (req, res) => {
  const { id_tugas, id_user, answer, id_file } = req.body;

  if (!id_tugas || !id_user) {
    return res.status(400).json({
      success: false,
      error: "id_tugas dan id_user wajib diisi",
    });
  }

  try {
    // 1. Insert pengumpulan
    const { data: pengumpulan, error: pengumpulanError } = await supabase
      .from("pengumpulan")
      .insert({
        id_tugas: Number(id_tugas),
        answer: answer ?? null,
        id_file: id_file ? Number(id_file) : null,
      })
      .select()
      .single();

    if (pengumpulanError) throw pengumpulanError;

    // 2. Insert relasi user_pengumpulan
    const { error: userPengumpulanError } = await supabase
      .from("user_pengumpulan")
      .insert({
        id_user: Number(id_user),
        id_pengumpulan: pengumpulan.id_pengumpulan,
      });

    if (userPengumpulanError) throw userPengumpulanError;

    res.status(201).json({ success: true, data: pengumpulan });
  } catch (error: any) {
    console.error("Error creating pengumpulan:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit pengumpulan",
      detail: error?.message ?? error,
    });
  }
});

// GET /api/pengumpulan/tugas/:tugasId
// Ambil semua pengumpulan untuk satu tugas (untuk superadmin review)
router.get("/tugas/:tugasId", verifySupabaseToken, async (req: any, res) => {
  const tugasId = Number(req.params.tugasId);
  if (isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "tugasId tidak valid" });

  // Check if user is superadmin
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const { data, error } = await supabase
      .from("pengumpulan")
      .select(
        `id_pengumpulan, answer, created_at,
         id_file,
         file_pengumpulan(original_filename, ukuran_file, object_key),
         user_pengumpulan(id_user, user(username, email))`,
      )
      .eq("id_tugas", tugasId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    console.error("Error fetching pengumpulan:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch pengumpulan" });
  }
});

// GET /api/pengumpulan/user/:userId/tugas/:tugasId
// Cek apakah user sudah mengumpulkan tugas tertentu
router.get("/user/:userId/tugas/:tugasId", async (req, res) => {
  const userId = Number(req.params.userId);
  const tugasId = Number(req.params.tugasId);

  if (isNaN(userId) || isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "Parameter tidak valid" });

  try {
    const { data, error } = await supabase
      .from("user_pengumpulan")
      .select(
        `id_pengumpulan,
         pengumpulan(id_pengumpulan, answer, created_at, id_file)`,
      )
      .eq("id_user", userId)
      .eq("pengumpulan.id_tugas", tugasId)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      data: data ?? null,
      sudahMengumpulkan: !!data,
    });
  } catch (error: any) {
    console.error("Error checking pengumpulan:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to check pengumpulan" });
  }
});

export default router;
