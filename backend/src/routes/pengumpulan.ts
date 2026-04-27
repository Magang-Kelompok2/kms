import { Router } from "express";
import { supabase } from "../lib/supabase";
const API_BASE =
  process.env.VITE_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
import { verifySupabaseToken, AuthenticatedRequest } from "../middleware/auth";
import {
  buildErrorNotificationMessage,
  buildNotificationMessage,
  createNotificationSafe,
} from "../lib/notifications";

const router = Router();

// POST /api/pengumpulan
// Body: { id_tugas, id_user, answer?, id_file? }
router.post("/", verifySupabaseToken, async (req: any, res) => {
  const { id_tugas, id_user, answer, id_file } = req.body;
  const actingUserId = Number(req.user?.id_user ?? id_user);

  if (!id_tugas || !actingUserId) {
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
        id_user: actingUserId,
        id_pengumpulan: pengumpulan.id_pengumpulan,
      });

    if (userPengumpulanError) throw userPengumpulanError;

    const { data: tugas } = await supabase
      .from("tugas")
      .select("nama_tugas")
      .eq("id_tugas", Number(id_tugas))
      .maybeSingle();

    await createNotificationSafe({
      userId: actingUserId,
      type: "SUCCESS",
      status: 200,
      category: "TUGAS",
      message: buildNotificationMessage(
        200,
        "Berhasil",
        `Pengumpulan tugas ${tugas?.nama_tugas ?? id_tugas} telah dikirim`,
      ),
    });

    res.status(201).json({ success: true, data: pengumpulan });
  } catch (error: any) {
    console.error("Error creating pengumpulan:", error);
    if (Number.isFinite(actingUserId)) {
      await createNotificationSafe({
        userId: actingUserId,
        type: "FAILED",
        status: 400,
        category: "TUGAS",
        message: buildErrorNotificationMessage(
          "Gagal",
          error,
          `Pengumpulan tugas ${id_tugas ?? ""} gagal`,
        ),
      });
    }
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
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const { data, error, count } = await supabase
      .from("pengumpulan")
      .select(
        `id_pengumpulan, answer, created_at,
         id_file,
         file_pengumpulan(original_filename, ukuran_file, object_key),
         user_pengumpulan(id_user, user(username, email))`,
        { count: "exact" },
      )
      .eq("id_tugas", tugasId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const enriched = (data ?? []).map((row: any) => {
      const filePengumpulan = row.file_pengumpulan;
      const enrichedFile = filePengumpulan
        ? {
            ...filePengumpulan,
            url: `${API_BASE}/api/files/proxy?path=${encodeURIComponent(filePengumpulan.object_key)}`,
          }
        : null;
      const userRelation = Array.isArray(row.user_pengumpulan)
        ? row.user_pengumpulan[0]
        : row.user_pengumpulan;
      return {
        ...row,
        user: userRelation?.user ?? null,
        file: enrichedFile,
        file_pengumpulan: enrichedFile,
      };
    });

    res.json({
      success: true,
      data: enriched,
      total: count ?? 0,
      limit,
      offset,
    });
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

  if (
    req.user.role !== "superadmin" &&
    Number(req.user.id_user) !== userId
  ) {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const limit = Math.min(Number(req.query.limit ?? 12), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const { data, error, count } = await supabase
      .from("user_pengumpulan")
      .select(
        `id_pengumpulan, created_at,
         pengumpulan(id_pengumpulan, answer, created_at, id_file, id_tugas,
           tugas(id_tugas, nama_tugas, id_kelas, type),
           file_pengumpulan(original_filename, ukuran_file, object_key)
         )`,
        { count: "exact" },
      )
      .eq("id_user", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const submissions = await Promise.all(
      (data ?? []).map(async (item: any) => {
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
                url: `${API_BASE}/api/files/proxy?path=${encodeURIComponent(file.object_key)}`,
                size: file.ukuran_file,
              }
            : null,
          status: "pending",
        };
      }),
    );

    res.json({
      success: true,
      data: submissions,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching user pengumpulan:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user pengumpulan" });
  }
});

export default router;
