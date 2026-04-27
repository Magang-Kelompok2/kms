import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";

const router = Router();

router.get("/", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.user?.id_user);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const unreadOnly = String(req.query.unreadOnly ?? "false") === "true";

  if (!Number.isFinite(userId)) {
    return res.status(401).json({
      success: false,
      error: "User tidak valid",
    });
  }

  try {
    let query = supabase
      .from("notifications")
      .select(
        "id_notification, id_user, type, status, category, message, is_read, created_at",
      )
      .eq("id_user", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const [{ data, error }, unreadResult] = await Promise.all([
      query,
      supabase
        .from("notifications")
        .select("id_notification", { count: "exact", head: true })
        .eq("id_user", userId)
        .eq("is_read", false),
    ]);

    if (error) throw error;
    if (unreadResult.error) throw unreadResult.error;

    res.json({
      success: true,
      data: data ?? [],
      unreadCount: unreadResult.count ?? 0,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil notifikasi",
    });
  }
});

router.patch("/read-all", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.user?.id_user);

  if (!Number.isFinite(userId)) {
    return res.status(401).json({
      success: false,
      error: "User tidak valid",
    });
  }

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id_user", userId)
      .eq("is_read", false);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      error: "Gagal menandai notifikasi sebagai dibaca",
    });
  }
});

export default router;
