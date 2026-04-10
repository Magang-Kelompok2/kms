import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";

const router = Router();
const SALT_ROUNDS = 10;

type RequestedAccess = {
  id_kelas: number;
  id_tingkatan: number;
};

// POST /api/users
router.post("/", verifySupabaseToken, async (req: any, res) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  const { username, email, password, role = "user", accesses } = req.body ?? {};

  const normalizedUsername = String(username ?? "").trim();
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  const normalizedPassword = String(password ?? "");
  const requestedAccesses: RequestedAccess[] = Array.isArray(accesses)
    ? accesses
        .map((access) => ({
          id_kelas: Number(access?.id_kelas),
          id_tingkatan: Number(access?.id_tingkatan),
        }))
        .filter(
          (access) =>
            Number.isInteger(access.id_kelas) &&
            Number.isInteger(access.id_tingkatan) &&
            access.id_kelas > 0 &&
            access.id_tingkatan > 0,
        )
    : [];

  if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      error: "username, email, dan password wajib diisi",
    });
  }

  if (normalizedPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password minimal 6 karakter",
    });
  }

  if (role === "user" && requestedAccesses.length === 0) {
    return res.status(400).json({
      success: false,
      error: "User wajib memiliki minimal 1 akses kelas dan tingkatan",
    });
  }

  const uniqueByClass = requestedAccesses.filter(
    (access, index, arr) =>
      arr.findIndex((item) => item.id_kelas === access.id_kelas) === index,
  );

  if (uniqueByClass.length !== requestedAccesses.length) {
    return res.status(400).json({
      success: false,
      error: "Setiap kelas hanya boleh dipilih satu kali",
    });
  }

  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("user")
      .select("id_user")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) throw existingUserError;

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email sudah terdaftar",
      });
    }

    const expandedEnrollments: Array<{
      id_kelas: number;
      id_tingkatan: number;
    }> = [];
    const progressRows: Array<{
      id_kelas: number;
      id_tingkatan: number;
    }> = [];

    for (const access of uniqueByClass) {
      const { data: kelas, error: kelasError } = await supabase
        .from("kelas")
        .select("id_kelas, nama_kelas")
        .eq("id_kelas", access.id_kelas)
        .maybeSingle();

      if (kelasError) throw kelasError;

      if (!kelas) {
        return res.status(400).json({
          success: false,
          error: `Kelas ${access.id_kelas} tidak ditemukan`,
        });
      }

      const { data: tingkatanList, error: tingkatanError } = await supabase
        .from("tingkatan")
        .select("id_tingkatan, nama_tingkatan")
        .eq("id_kelas", access.id_kelas)
        .order("id_tingkatan", { ascending: true });

      if (tingkatanError) throw tingkatanError;

      const levels = tingkatanList ?? [];
      const selectedIndex = levels.findIndex(
        (level) => level.id_tingkatan === access.id_tingkatan,
      );

      if (selectedIndex === -1) {
        return res.status(400).json({
          success: false,
          error: `Tingkatan ${access.id_tingkatan} tidak sesuai dengan kelas ${access.id_kelas}`,
        });
      }

      const accessibleLevels = levels.slice(0, selectedIndex + 1);
      expandedEnrollments.push(
        ...accessibleLevels.map((level) => ({
          id_kelas: access.id_kelas,
          id_tingkatan: level.id_tingkatan,
        })),
      );

      progressRows.push({
        id_kelas: access.id_kelas,
        id_tingkatan: access.id_tingkatan,
      });
    }

    const primaryAccess = uniqueByClass[0] ?? null;
    const hashedPassword = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);

    const { data: createdUser, error: createUserError } = await supabase
      .from("user")
      .insert({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        id_kelas: primaryAccess?.id_kelas ?? null,
      })
      .select("id_user, username, email, role, id_kelas, created_at")
      .single();

    if (createUserError || !createdUser) throw createUserError;

    try {
      if (expandedEnrollments.length > 0) {
        const now = new Date().toISOString();

        const { error: enrollmentError } = await supabase
          .from("user_enrollment")
          .insert(
            expandedEnrollments.map((item) => ({
              id_user: createdUser.id_user,
              id_kelas: item.id_kelas,
              id_tingkatan: item.id_tingkatan,
              status: "approved",
              approved_by: req.user.id_user,
              approved_at: now,
              enrolled_at: now,
            })),
          );

        if (enrollmentError) throw enrollmentError;

        const { error: progressError } = await supabase
          .from("user_progress")
          .insert(
            progressRows.map((item) => ({
              id_user: createdUser.id_user,
              id_kelas: item.id_kelas,
              id_tingkatan: item.id_tingkatan,
              updated_at: now,
            })),
          );

        if (progressError) throw progressError;
      }
    } catch (nestedError) {
      await supabase.from("user").delete().eq("id_user", createdUser.id_user);
      throw nestedError;
    }

    return res.status(201).json({
      success: true,
      data: {
        id: createdUser.id_user,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role ?? "user",
        id_kelas: createdUser.id_kelas,
        accesses: uniqueByClass,
        created_at: createdUser.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ success: false, error: "Gagal membuat user" });
  }
});

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
        .select("id_tingkatan")
        .eq("id_user", userId)
        .eq("id_kelas", classId)
        .single();

      // PGRST116 = row not found, berarti user belum ada progress → default 1
      if (error && error.code !== "PGRST116") throw error;

      res.json({
        success: true,
        data: { tingkatanSaatIni: data?.id_tingkatan ?? 1 },
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
          id_tingkatan: tingkatanSaatIni,
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
