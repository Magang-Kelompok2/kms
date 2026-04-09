import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";

const router = Router();

// GET /api/users
router.get("/", verifySupabaseToken, async (req: any, res) => {
  // Only superadmin can access this
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const { data, error } = await supabase
      .from("user")
      .select("id_user, username, email, role, created_at")
      .order("id_user", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: (data ?? []).map((u) => ({
        id: u.id_user,
        username: u.username,
        email: u.email,
        role: u.role ?? "user",
        created_at: u.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal mengambil data users" });
  }
});

// DELETE /api/users/:userId
router.delete("/:userId", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId))
    return res
      .status(400)
      .json({ success: false, error: "userId harus berupa angka" });

  try {
    const { error } = await supabase
      .from("user")
      .delete()
      .eq("id_user", userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

// GET /api/users/:userId/progress/:classId
// Ambil tingkatan saat ini untuk user di kelas tertentu
router.get(
  "/:userId/progress/:classId",
  verifySupabaseToken,
  async (req: any, res) => {
    const userId = Number(req.params.userId);
    const classId = Number(req.params.classId);

    if (isNaN(userId) || isNaN(classId))
      return res
        .status(400)
        .json({ success: false, error: "Parameter tidak valid" });

    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("tingkatan_saat_ini")
        .eq("id_user", userId)
        .eq("id_kelas", classId)
        .single();

      // PGRST116 = row not found, berarti user belum ada progress → default 1
      if (error && error.code !== "PGRST116") throw error;

      res.json({
        success: true,
        data: { tingkatanSaatIni: data?.tingkatan_saat_ini ?? 1 },
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch progress" });
    }
  },
);

// PUT /api/users/:userId/progress/:classId
// Update atau buat progress user
router.put(
  "/:userId/progress/:classId",
  verifySupabaseToken,
  async (req: any, res) => {
    const userId = Number(req.params.userId);
    const classId = Number(req.params.classId);
    const { tingkatanSaatIni } = req.body;

    if (isNaN(userId) || isNaN(classId) || !tingkatanSaatIni)
      return res
        .status(400)
        .json({ success: false, error: "Parameter tidak valid" });

    try {
      const { error } = await supabase.from("user_progress").upsert(
        {
          id_user: userId,
          id_kelas: classId,
          tingkatan_saat_ini: tingkatanSaatIni,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id_user,id_kelas" },
      );

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating progress:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update progress" });
    }
  },
);

export default router;
