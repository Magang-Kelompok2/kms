import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";

const router = Router();
const SALT_ROUNDS = 10;

const isMissingColumnError = (error: any, columnName: string) => {
  const message = String(error?.message ?? error?.details ?? "").toLowerCase();
  const normalizedColumn = columnName.toLowerCase();
  return (
    error?.code === "42703" ||
    message.includes(`column '${normalizedColumn}'`) ||
    message.includes(`column "${normalizedColumn}"`) ||
    message.includes(normalizedColumn)
  );
};

const extractProgressLevel = (row: any) => {
  const value = row?.id_tingkatan ?? row?.tingkatan_saat_ini ?? 1;
  return typeof value === "number" && value >= 1 ? value : 1;
};

const canAccessUserScopedData = (requestUser: any, targetUserId: number) =>
  requestUser?.role === "superadmin" ||
  Number(requestUser?.id_user) === targetUserId;

async function insertUserProgressRows(
  userId: number,
  rows: Array<{ id_kelas: number; id_tingkatan: number }>,
  updatedAt: string,
) {
  if (rows.length === 0) return;

  const nextRows = rows.map((item) => ({
    id_user: userId,
    id_kelas: item.id_kelas,
    id_tingkatan: item.id_tingkatan,
    updated_at: updatedAt,
  }));

  const { error } = await supabase.from("user_progress").insert(nextRows);
  if (!error) return;
  if (!isMissingColumnError(error, "id_tingkatan")) throw error;

  const legacyRows = rows.map((item) => ({
    id_user: userId,
    id_kelas: item.id_kelas,
    tingkatan_saat_ini: item.id_tingkatan,
    updated_at: updatedAt,
  }));

  const { error: legacyError } = await supabase
    .from("user_progress")
    .insert(legacyRows);

  if (legacyError) throw legacyError;
}

async function getUserProgressRows(userId: number) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("id_progress, id_kelas, id_tingkatan, updated_at")
    .eq("id_user", userId)
    .order("updated_at", { ascending: false });

  if (!error) return data ?? [];
  if (!isMissingColumnError(error, "id_tingkatan")) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("user_progress")
    .select("id_progress, id_kelas, tingkatan_saat_ini, updated_at")
    .eq("id_user", userId)
    .order("updated_at", { ascending: false });

  if (legacyError) throw legacyError;
  return legacyData ?? [];
}

async function getUserProgressByClass(userId: number, classId: number) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("id_progress, id_tingkatan")
    .eq("id_user", userId)
    .eq("id_kelas", classId)
    .maybeSingle();

  if (!error || error?.code === "PGRST116") return data;
  if (!isMissingColumnError(error, "id_tingkatan")) throw error;

  const { data: legacyData, error: legacyError } = await supabase
    .from("user_progress")
    .select("id_progress, tingkatan_saat_ini")
    .eq("id_user", userId)
    .eq("id_kelas", classId)
    .maybeSingle();

  if (legacyError && legacyError.code !== "PGRST116") throw legacyError;
  return legacyData;
}

async function saveUserProgress(
  userId: number,
  classId: number,
  level: number,
  updatedAt: string,
) {
  const existingRow = await getUserProgressByClass(userId, classId);

  if (existingRow?.id_progress) {
    const { error } = await supabase
      .from("user_progress")
      .update({ id_tingkatan: level, updated_at: updatedAt })
      .eq("id_progress", existingRow.id_progress);

    if (!error) return;
    if (!isMissingColumnError(error, "id_tingkatan")) throw error;

    const { error: legacyError } = await supabase
      .from("user_progress")
      .update({ tingkatan_saat_ini: level, updated_at: updatedAt })
      .eq("id_progress", existingRow.id_progress);

    if (legacyError) throw legacyError;
    return;
  }

  await insertUserProgressRows(
    userId,
    [{ id_kelas: classId, id_tingkatan: level }],
    updatedAt,
  );
}

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

    const hashedPassword = await bcrypt.hash(normalizedPassword, SALT_ROUNDS);

    const { data: createdUser, error: createUserError } = await supabase
      .from("user")
      .insert({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role,
      })
      .select("id_user, username, email, role, created_at")
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

        await insertUserProgressRows(createdUser.id_user, progressRows, now);
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
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = Number(req.query.offset ?? 0);

    const { data, error, count } = await supabase
      .from("user")
      .select("id_user, username, email, role, created_at", { count: "exact" })
      .order("id_user", { ascending: true })
      .range(offset, offset + limit - 1);

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
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal mengambil data users" });
  }
});

// GET /api/users/:userId
router.get("/:userId", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ success: false, error: "userId harus berupa angka" });
  }

  try {
    if (!canAccessUserScopedData(req.user, userId)) {
      return res.status(403).json({ success: false, error: "Akses ditolak" });
    }

    const { data, error } = await supabase
      .from("user")
      .select("id_user, username, email, role, created_at")
      .eq("id_user", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: "User tidak ditemukan" });
    }

    res.json({
      success: true,
      data: {
        id: data.id_user,
        username: data.username,
        email: data.email,
        role: data.role ?? "user",
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal mengambil data user" });
  }
});

// GET /api/users/:userId/progress
router.get("/:userId/progress", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.params.userId);

  if (isNaN(userId))
    return res
      .status(400)
      .json({ success: false, error: "Parameter tidak valid" });

  if (!canAccessUserScopedData(req.user, userId)) {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    const progressRows = await getUserProgressRows(userId);

    const kelasIds = [
      ...new Set((progressRows ?? []).map((row: any) => row.id_kelas)),
    ];

    const idTingkatanList = [
      ...new Set(
        (progressRows ?? [])
          .map((row: any) => extractProgressLevel(row))
          .filter(Boolean),
      ),
    ];

    let kelasMap: Record<number, string> = {};
    let tingkatanMap: Record<number, number> = {};
    let classTingkatanCount: Record<number, number> = {};

    const [kelasResult, tingkatanResult] = await Promise.all([
      kelasIds.length > 0
        ? supabase
            .from("kelas")
            .select("id_kelas, nama_kelas")
            .in("id_kelas", kelasIds)
        : Promise.resolve({ data: [], error: null }),
      kelasIds.length > 0
        ? supabase
            .from("tingkatan")
            .select("id_tingkatan, id_kelas, level_urutan")
            .in("id_kelas", kelasIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (kelasResult.error) throw kelasResult.error;
    if (tingkatanResult.error) throw tingkatanResult.error;

    kelasMap = Object.fromEntries(
      ((kelasResult.data as any[]) ?? []).map((k: any) => [
        k.id_kelas,
        k.nama_kelas,
      ]),
    );

    for (const t of (tingkatanResult.data as any[]) ?? []) {
      tingkatanMap[t.id_tingkatan] = t.level_urutan ?? t.id_tingkatan;
      classTingkatanCount[t.id_kelas] =
        (classTingkatanCount[t.id_kelas] ?? 0) + 1;
    }

    res.json({
      success: true,
      data: (progressRows ?? []).map((row: any) => {
        const rawLevel = extractProgressLevel(row);
        const currentLevel = tingkatanMap[rawLevel] ?? rawLevel;
        const totalLevels = classTingkatanCount[row.id_kelas] ?? 1;
        return {
          id: row.id_progress,
          classId: String(row.id_kelas),
          className: kelasMap[row.id_kelas] ?? "Tidak diketahui",
          currentLevel,
          totalLevels,
          progressPercent: Math.min(
            Math.round((currentLevel / totalLevels) * 100),
            100,
          ),
          updatedAt: row.updated_at,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res
      .status(500)
      .json({ success: false, error: "Gagal mengambil progress user" });
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
      const data = await getUserProgressByClass(userId, classId);
      const rawLevel = extractProgressLevel(data);

      // Convert id_tingkatan to level_urutan for consistent display
      const { data: tingkatanData } = await supabase
        .from("tingkatan")
        .select("level_urutan")
        .eq("id_tingkatan", rawLevel)
        .maybeSingle();

      const levelUrutan = tingkatanData?.level_urutan ?? rawLevel;

      // PGRST116 = row not found, berarti user belum ada progress → default 1
      res.json({
        success: true,
        data: { tingkatanSaatIni: levelUrutan },
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch progress" });
    }
  },
);

// GET /api/users/:userId/enrollments
router.get(
  "/:userId/enrollments",
  verifySupabaseToken,
  async (req: any, res) => {
    const userId = Number(req.params.userId);

    if (isNaN(userId))
      return res
        .status(400)
        .json({ success: false, error: "Parameter tidak valid" });

    if (!canAccessUserScopedData(req.user, userId)) {
      return res.status(403).json({ success: false, error: "Akses ditolak" });
    }

    try {
      const { data: enrollmentRows, error } = await supabase
        .from("user_enrollment")
        .select("id_kelas, id_tingkatan, status")
        .eq("id_user", userId)
        .eq("status", "approved");

      if (error) throw error;

      const kelasIds = [
        ...new Set((enrollmentRows ?? []).map((row: any) => row.id_kelas)),
      ];
      const tingkatanIds = [
        ...new Set((enrollmentRows ?? []).map((row: any) => row.id_tingkatan)),
      ];

      let kelasMap: Record<number, string> = {};
      let tingkatanLevelMap: Record<number, number> = {};
      let tingkatanNamaMap: Record<number, string> = {};

      await Promise.all([
        kelasIds.length > 0
          ? supabase
              .from("kelas")
              .select("id_kelas, nama_kelas")
              .in("id_kelas", kelasIds)
              .then(({ data, error: e }) => {
                if (e) throw e;
                kelasMap = Object.fromEntries(
                  (data ?? []).map((k: any) => [k.id_kelas, k.nama_kelas]),
                );
              })
          : Promise.resolve(),
        tingkatanIds.length > 0
          ? supabase
              .from("tingkatan")
              .select("id_tingkatan, level_urutan, nama_tingkatan")
              .in("id_tingkatan", tingkatanIds)
              .then(({ data, error: e }) => {
                if (e) throw e;
                tingkatanLevelMap = Object.fromEntries(
                  (data ?? []).map((t: any) => [
                    t.id_tingkatan,
                    t.level_urutan ?? t.id_tingkatan,
                  ]),
                );
                tingkatanNamaMap = Object.fromEntries(
                  (data ?? []).map((t: any) => [
                    t.id_tingkatan,
                    t.nama_tingkatan ?? "",
                  ]),
                );
              })
          : Promise.resolve(),
      ]);

      res.json({
        success: true,
        data: (enrollmentRows ?? []).map((row: any) => ({
          classId: String(row.id_kelas),
          className: kelasMap[row.id_kelas] ?? "Tidak diketahui",
          level: tingkatanLevelMap[row.id_tingkatan] ?? row.id_tingkatan,
          namaTingkatan: tingkatanNamaMap[row.id_tingkatan] ?? "",
          status: row.status,
        })),
      });
    } catch (error) {
      console.error("Error fetching user enrollments:", error);
      res
        .status(500)
        .json({ success: false, error: "Gagal mengambil enrollments user" });
    }
  },
);

// GET /api/users/:userId/recent-activity
router.get(
  "/:userId/recent-activity",
  verifySupabaseToken,
  async (req: any, res) => {
    const userId = Number(req.params.userId);

    if (isNaN(userId))
      return res
        .status(400)
        .json({ success: false, error: "Parameter tidak valid" });

    if (!canAccessUserScopedData(req.user, userId)) {
      return res.status(403).json({ success: false, error: "Akses ditolak" });
    }

    try {
      const [submissionResult, quizResult] = await Promise.all([
        supabase
          .from("user_pengumpulan")
          .select(
            `created_at,
             pengumpulan(id_pengumpulan, created_at, id_tugas,
               tugas(id_tugas, nama_tugas, type, id_kelas)
             )`,
          )
          .eq("id_user", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("hasil_kuis")
          .select("id_hasil, id_tugas, skor, created_at")
          .eq("id_user", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (submissionResult.error) throw submissionResult.error;
      if (quizResult.error) throw quizResult.error;

      const submissionActivities = (submissionResult.data ?? []).map((item: any) => {
        const pengumpulan = item.pengumpulan ?? {};
        const tugas = pengumpulan.tugas ?? {};

        return {
          id: `submission-${pengumpulan.id_pengumpulan}`,
          type: "tugas",
          title: tugas.nama_tugas ?? "Tugas",
          classId: tugas.id_kelas ? String(tugas.id_kelas) : "",
          createdAt: pengumpulan.created_at ?? item.created_at,
          status: "completed",
          score: null,
        };
      });

      const quizRows = quizResult.data ?? [];
      const quizTaskIds = [
        ...new Set(
          quizRows
            .map((item: any) => Number(item.id_tugas))
            .filter((value) => Number.isFinite(value)),
        ),
      ];

      let quizTaskMap: Record<number, any> = {};
      if (quizTaskIds.length > 0) {
        const { data: taskRows, error: taskError } = await supabase
          .from("tugas")
          .select("id_tugas, nama_tugas, type, id_kelas")
          .in("id_tugas", quizTaskIds);

        if (taskError) throw taskError;
        quizTaskMap = Object.fromEntries(
          (taskRows ?? []).map((task: any) => [task.id_tugas, task]),
        );
      }

      const quizActivities = quizRows.map((item: any) => {
        const tugas = quizTaskMap[item.id_tugas] ?? {};

        return {
          id: `quiz-${item.id_hasil}`,
          type: "kuis",
          title: tugas.nama_tugas ?? "Kuis",
          classId: tugas.id_kelas ? String(tugas.id_kelas) : "",
          createdAt: item.created_at,
          status: item.skor >= 70 ? "passed" : "submitted",
          score: item.skor ?? null,
        };
      });

      const classIds = [
        ...new Set(
          [...submissionActivities, ...quizActivities]
            .map((item) => Number(item.classId))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      ];

      let classMap: Record<number, string> = {};
      if (classIds.length > 0) {
        const { data: classRows, error: classError } = await supabase
          .from("kelas")
          .select("id_kelas, nama_kelas")
          .in("id_kelas", classIds);

        if (classError) throw classError;
        classMap = Object.fromEntries(
          (classRows ?? []).map((kelas: any) => [kelas.id_kelas, kelas.nama_kelas]),
        );
      }

      const data = [...submissionActivities, ...quizActivities]
        .map((item) => ({
          ...item,
          className: classMap[Number(item.classId)] ?? "Kelas tidak diketahui",
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8);

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({
        success: false,
        error: "Gagal mengambil aktivitas terbaru",
      });
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
      // tingkatanSaatIni is level_urutan — look up the corresponding id_tingkatan
      const { data: nextTingkatan } = await supabase
        .from("tingkatan")
        .select("id_tingkatan")
        .eq("id_kelas", classId)
        .eq("level_urutan", Number(tingkatanSaatIni))
        .maybeSingle();

      if (!nextTingkatan?.id_tingkatan) {
        // level_urutan doesn't exist (e.g. user finished last level) — keep current progress
        return res.json({ success: true });
      }

      await saveUserProgress(
        userId,
        classId,
        nextTingkatan.id_tingkatan,
        new Date().toISOString(),
      );
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
