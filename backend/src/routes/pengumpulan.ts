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
// Cek apakah user sudah mengumpulkan tugas tertentu (ambil submission terbaru)
router.get("/user/:userId/tugas/:tugasId", async (req: any, res) => {
  const userId = Number(req.params.userId);
  const tugasId = Number(req.params.tugasId);

  if (isNaN(userId) || isNaN(tugasId))
    return res
      .status(400)
      .json({ success: false, error: "Parameter tidak valid" });

  try {
    // Query user_pengumpulan untuk user ini, join dengan pengumpulan, filter task
    // Ambil yang latest
    const { data: result, error: checkError } = await supabase
      .from("user_pengumpulan")
      .select(
        `id_pengumpulan,
         pengumpulan(id_pengumpulan, answer, created_at, id_file)`,
      )
      .eq("id_user", userId)
      .eq("pengumpulan.id_tugas", tugasId)
      .limit(5); // Ambil max 5, nanti pilih yang latest di code

    if (checkError) throw checkError;

    // Cari yang latest dari array
    let submission = null;
    if (result && result.length > 0) {
      // Sort by created_at DESC, ambil [0]
      const sorted = result.sort((a: any, b: any) => {
        const dateA = new Date(a.pengumpulan?.created_at || 0).getTime();
        const dateB = new Date(b.pengumpulan?.created_at || 0).getTime();
        return dateB - dateA; // DESC
      });
      submission = sorted[0]?.pengumpulan || null;
    }

    res.json({
      success: true,
      data: submission ?? null,
      sudahMengumpulkan: !!submission,
      submission: submission ?? null,
    });
  } catch (error: any) {
    console.error("Error checking pengumpulan:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to check pengumpulan" });
  }
});

// GET /api/pengumpulan/user/:userId
router.get("/user/:userId", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId))
    return res
      .status(400)
      .json({ success: false, error: "userId tidak valid" });

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const { data, error } = await supabase
      .from("user_pengumpulan")
      .select(
        `id_pengumpulan, created_at,
         pengumpulan(id_pengumpulan, answer, created_at, id_file, id_tugas,
           tugas(id_tugas, nama_tugas, id_kelas, type),
           file_pengumpulan(original_filename, ukuran_file, object_key)
         )`,
      )
      .eq("id_user", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const submissions = (data ?? []).map((item: any) => {
      const pengumpulan = item.pengumpulan || {};
      const tugas = pengumpulan.tugas || {};
      const file = pengumpulan.file_pengumpulan || null;

      return {
        id: pengumpulan.id_pengumpulan,
        classId: tugas.id_kelas ? String(tugas.id_kelas) : "",
        title: tugas.nama_tugas ?? "Pengumpulan Tugas",
        answer: pengumpulan.answer ?? null,
        createdAt: pengumpulan.created_at,
        file: file
          ? {
              name: file.original_filename,
              objectKey: file.object_key,
              size: file.ukuran_file,
            }
          : null,
        status: "pending",
      };
    });

    res.json({ success: true, data: submissions });
  } catch (error: any) {
    console.error("Error fetching user pengumpulan:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user pengumpulan" });
  }
});

export default router;
