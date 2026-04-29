import { Router } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";
import {
  buildErrorNotificationMessage,
  buildNotificationMessage,
  createNotificationSafe,
} from "../lib/notifications";

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

const isMissingRelationError = (error: any, relationName: string) => {
  const message = String(error?.message ?? error?.details ?? "").toLowerCase();
  const normalizedRelation = relationName.toLowerCase();
  return (
    error?.code === "42P01" ||
    message.includes(`relation "${normalizedRelation}"`) ||
    message.includes(`relation '${normalizedRelation}'`) ||
    message.includes(normalizedRelation)
  );
};

const extractProgressLevel = (row: any) => {
  const value = row?.id_tingkatan ?? row?.tingkatan_saat_ini ?? 1;
  return typeof value === "number" && value >= 1 ? value : 1;
};

const canAccessUserScopedData = (requestUser: any, targetUserId: number) =>
  requestUser?.role === "superadmin" ||
  Number(requestUser?.id_user) === targetUserId;

type ProgressSummaryItem = {
  id: number | null;
  classId: string;
  className: string;
  currentLevel: number;
  totalLevels: number;
  progressPercent: number;
  updatedAt: string | null;
  completedMaterials: string[];
  completedAssignments: string[];
  completedQuizzes: string[];
  completedMaterialFiles: string[];
  completedMaterialCount: number;
  totalMaterialCount: number;
  completedAssignmentCount: number;
  totalAssignmentCount: number;
  completedQuizCount: number;
  totalQuizCount: number;
};

const normalizeTaskType = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getLatestTimestamp = (...values: Array<string | null | undefined>) => {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
};

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

async function buildUserProgressSummary(
  userId: number,
): Promise<ProgressSummaryItem[]> {
  const [progressRows, enrollmentResult] = await Promise.all([
    getUserProgressRows(userId),
    supabase
      .from("user_enrollment")
      .select("id_kelas")
      .eq("id_user", userId)
      .eq("status", "approved"),
  ]);

  if (enrollmentResult.error) throw enrollmentResult.error;

  const classIds = [
    ...new Set(
      [...(progressRows ?? []), ...(enrollmentResult.data ?? [])]
        .map((row: any) => Number(row.id_kelas))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  ];

  if (classIds.length === 0) return [];

  const [
    kelasResult,
    tingkatanResult,
    materiResult,
    tugasResult,
    userMateriResult,
    userMateriFileResult,
    submissionResult,
    quizResult,
  ] = await Promise.all([
    supabase.from("kelas").select("id_kelas, nama_kelas").in("id_kelas", classIds),
    supabase
      .from("tingkatan")
      .select("id_tingkatan, id_kelas, level_urutan")
      .in("id_kelas", classIds),
    supabase
      .from("materi")
      .select("id_materi, id_kelas, title_materi")
      .in("id_kelas", classIds),
    supabase
      .from("tugas")
      .select("id_tugas, id_kelas, type")
      .in("id_kelas", classIds),
    supabase.from("user_materi").select("id_materi").eq("id_user", userId),
    supabase
      .from("user_materi_file")
      .select("id_materi, file_type, file_id, completed_at")
      .eq("id_user", userId),
    supabase
      .from("user_pengumpulan")
      .select("created_at, pengumpulan(id_tugas, created_at)")
      .eq("id_user", userId),
    supabase
      .from("hasil_kuis")
      .select("id_tugas, created_at")
      .eq("id_user", userId),
  ]);

  if (kelasResult.error) throw kelasResult.error;
  if (tingkatanResult.error) throw tingkatanResult.error;
  if (materiResult.error) throw materiResult.error;
  if (tugasResult.error) throw tugasResult.error;
  const userMateriRows =
    userMateriResult.error && isMissingRelationError(userMateriResult.error, "user_materi")
      ? []
      : ((() => {
          if (userMateriResult.error) throw userMateriResult.error;
          return userMateriResult.data ?? [];
        })());

  const userMateriFileRows =
    userMateriFileResult.error &&
    isMissingRelationError(userMateriFileResult.error, "user_materi_file")
      ? []
      : ((() => {
          if (userMateriFileResult.error) throw userMateriFileResult.error;
          return userMateriFileResult.data ?? [];
        })());

  if (submissionResult.error) throw submissionResult.error;
  if (quizResult.error) throw quizResult.error;

  const materiRows = materiResult.data ?? [];
  const materiIds = materiRows.map((item: any) => item.id_materi);

  const [videoResult, pdfResult] = await Promise.all([
    materiIds.length > 0
      ? supabase.from("video").select("id_video, id_materi").in("id_materi", materiIds)
      : Promise.resolve({ data: [], error: null }),
    materiIds.length > 0
      ? supabase.from("pdf").select("id_pdf, id_materi").in("id_materi", materiIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (videoResult.error) throw videoResult.error;
  if (pdfResult.error) throw pdfResult.error;

  const classNameMap = Object.fromEntries(
    ((kelasResult.data as any[]) ?? []).map((item: any) => [
      item.id_kelas,
      item.nama_kelas,
    ]),
  );

  const tingkatanLevelMap: Record<number, number> = {};
  const totalLevelsByClass: Record<number, number> = {};
  for (const item of (tingkatanResult.data as any[]) ?? []) {
    tingkatanLevelMap[item.id_tingkatan] = item.level_urutan ?? item.id_tingkatan;
    totalLevelsByClass[item.id_kelas] = (totalLevelsByClass[item.id_kelas] ?? 0) + 1;
  }

  const materialIdsByClass: Record<number, Set<number>> = {};
  const materialTitleMap: Record<number, string> = {};
  const materialClassMap: Record<number, number> = {};
  const materialFileTotals: Record<number, number> = {};

  for (const item of materiRows as any[]) {
    if (!materialIdsByClass[item.id_kelas]) {
      materialIdsByClass[item.id_kelas] = new Set<number>();
    }
    materialIdsByClass[item.id_kelas].add(item.id_materi);
    materialTitleMap[item.id_materi] = item.title_materi ?? "Materi";
    materialClassMap[item.id_materi] = item.id_kelas;
    materialFileTotals[item.id_materi] = materialFileTotals[item.id_materi] ?? 0;
  }

  for (const item of (videoResult.data as any[]) ?? []) {
    materialFileTotals[item.id_materi] = (materialFileTotals[item.id_materi] ?? 0) + 1;
  }

  for (const item of (pdfResult.data as any[]) ?? []) {
    materialFileTotals[item.id_materi] = (materialFileTotals[item.id_materi] ?? 0) + 1;
  }

  const completedFileKeysByClass: Record<number, Set<string>> = {};
  const completedFileCountsByMaterial: Record<number, number> = {};
  const latestMaterialUpdateByClass: Record<number, string | null> = {};

  for (const item of (userMateriFileRows as any[]) ?? []) {
    const classId = materialClassMap[item.id_materi];
    if (!classId) continue;

    if (!completedFileKeysByClass[classId]) {
      completedFileKeysByClass[classId] = new Set<string>();
    }

    const fileKey = `${item.file_type}:${item.file_id}`;
    if (!completedFileKeysByClass[classId].has(fileKey)) {
      completedFileKeysByClass[classId].add(fileKey);
      completedFileCountsByMaterial[item.id_materi] =
        (completedFileCountsByMaterial[item.id_materi] ?? 0) + 1;
    }

    latestMaterialUpdateByClass[classId] = getLatestTimestamp(
      latestMaterialUpdateByClass[classId],
      item.completed_at,
    );
  }

  const completedMaterialIdsByClass: Record<number, Set<number>> = {};
  for (const item of (userMateriRows as any[]) ?? []) {
    const materialId = Number(item.id_materi);
    const classId = materialClassMap[materialId];
    if (!classId) continue;

    if (!completedMaterialIdsByClass[classId]) {
      completedMaterialIdsByClass[classId] = new Set<number>();
    }
    completedMaterialIdsByClass[classId].add(materialId);
  }

  for (const [materialIdValue, totalFiles] of Object.entries(materialFileTotals)) {
    const materialId = Number(materialIdValue);
    const classId = materialClassMap[materialId];
    if (!classId || totalFiles <= 0) continue;

    const completedFiles = completedFileCountsByMaterial[materialId] ?? 0;
    if (completedFiles >= totalFiles) {
      if (!completedMaterialIdsByClass[classId]) {
        completedMaterialIdsByClass[classId] = new Set<number>();
      }
      completedMaterialIdsByClass[classId].add(materialId);
    }
  }

  const assignmentIdsByClass: Record<number, Set<number>> = {};
  const quizIdsByClass: Record<number, Set<number>> = {};

  for (const item of (tugasResult.data as any[]) ?? []) {
    const normalizedType = normalizeTaskType(item.type);
    const target =
      normalizedType === "kuis" ? quizIdsByClass : assignmentIdsByClass;

    if (!target[item.id_kelas]) {
      target[item.id_kelas] = new Set<number>();
    }
    target[item.id_kelas].add(item.id_tugas);
  }

  const completedAssignmentIdsByClass: Record<number, Set<number>> = {};
  const latestSubmissionByClass: Record<number, string | null> = {};

  for (const row of (submissionResult.data as any[]) ?? []) {
    const pengumpulan = Array.isArray(row.pengumpulan)
      ? row.pengumpulan[0]
      : row.pengumpulan;
    const tugasId = Number(pengumpulan?.id_tugas);
    if (!Number.isFinite(tugasId)) continue;

    const classId = classIds.find((item) => assignmentIdsByClass[item]?.has(tugasId));
    if (!classId) continue;

    if (!completedAssignmentIdsByClass[classId]) {
      completedAssignmentIdsByClass[classId] = new Set<number>();
    }
    completedAssignmentIdsByClass[classId].add(tugasId);
    latestSubmissionByClass[classId] = getLatestTimestamp(
      latestSubmissionByClass[classId],
      pengumpulan?.created_at,
      row.created_at,
    );
  }

  const completedQuizIdsByClass: Record<number, Set<number>> = {};
  const latestQuizByClass: Record<number, string | null> = {};

  for (const row of (quizResult.data as any[]) ?? []) {
    const tugasId = Number(row.id_tugas);
    if (!Number.isFinite(tugasId)) continue;

    const classId = classIds.find((item) => quizIdsByClass[item]?.has(tugasId));
    if (!classId) continue;

    if (!completedQuizIdsByClass[classId]) {
      completedQuizIdsByClass[classId] = new Set<number>();
    }
    completedQuizIdsByClass[classId].add(tugasId);
    latestQuizByClass[classId] = getLatestTimestamp(
      latestQuizByClass[classId],
      row.created_at,
    );
  }

  return classIds.map((classId) => {
    const progressRow =
      (progressRows ?? []).find((row: any) => Number(row.id_kelas) === classId) ?? null;
    const rawLevel = extractProgressLevel(progressRow);
    const currentLevel = tingkatanLevelMap[rawLevel] ?? rawLevel;

    const totalMaterialCount = materialIdsByClass[classId]?.size ?? 0;
    const totalAssignmentCount = assignmentIdsByClass[classId]?.size ?? 0;
    const totalQuizCount = quizIdsByClass[classId]?.size ?? 0;

    const completedMaterials = [
      ...(completedMaterialIdsByClass[classId] ?? new Set<number>()),
    ].map((item) => String(item));
    const completedAssignments = [
      ...(completedAssignmentIdsByClass[classId] ?? new Set<number>()),
    ].map((item) => String(item));
    const completedQuizzes = [
      ...(completedQuizIdsByClass[classId] ?? new Set<number>()),
    ].map((item) => String(item));
    const completedMaterialFiles = [
      ...(completedFileKeysByClass[classId] ?? new Set<string>()),
    ];

    const completedCount =
      completedMaterials.length +
      completedAssignments.length +
      completedQuizzes.length;
    const totalCount =
      totalMaterialCount + totalAssignmentCount + totalQuizCount;

    return {
      id: progressRow?.id_progress ?? null,
      classId: String(classId),
      className: classNameMap[classId] ?? "Tidak diketahui",
      currentLevel,
      totalLevels: totalLevelsByClass[classId] ?? 1,
      progressPercent:
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      updatedAt: getLatestTimestamp(
        progressRow?.updated_at,
        latestMaterialUpdateByClass[classId],
        latestSubmissionByClass[classId],
        latestQuizByClass[classId],
      ),
      completedMaterials,
      completedAssignments,
      completedQuizzes,
      completedMaterialFiles,
      completedMaterialCount: completedMaterials.length,
      totalMaterialCount,
      completedAssignmentCount: completedAssignments.length,
      totalAssignmentCount,
      completedQuizCount: completedQuizzes.length,
      totalQuizCount,
    };
  });
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
    const accessSummary: Array<{
      className: string;
      levelName: string;
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
      accessSummary.push({
        className: kelas.nama_kelas ?? `Kelas ${access.id_kelas}`,
        levelName:
          levels[selectedIndex]?.nama_tingkatan ??
          `Tingkatan ${access.id_tingkatan}`,
      });
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

    await createNotificationSafe({
      userId: Number(req.user?.id_user),
      type: "SUCCESS",
      status: 200,
      category: "USER",
      message: buildNotificationMessage(
        200,
        "Berhasil",
        `User ${createdUser.username} telah dibuat`,
      ),
    });

    await Promise.all(
      accessSummary.map((access) =>
        createNotificationSafe({
          userId: createdUser.id_user,
          type: "INFO",
          status: 200,
          category: "USER",
          message: buildNotificationMessage(
            200,
            "Info",
            `Anda telah didaftarkan ke kelas ${access.className} sampai ${access.levelName}`,
          ),
        }),
      ),
    );

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
    if (Number.isFinite(Number(req.user?.id_user))) {
      await createNotificationSafe({
        userId: Number(req.user.id_user),
        type: "FAILED",
        status: 400,
        category: "USER",
        message: buildErrorNotificationMessage(
          "Gagal",
          error,
          `Pembuatan user ${normalizedUsername || normalizedEmail || "baru"} gagal`,
        ),
      });
    }
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
    const progressSummary = await buildUserProgressSummary(userId);

    res.json({
      success: true,
      data: progressSummary,
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
    return res.status(400).json({ success: false, error: "userId harus berupa angka" });

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  try {
    // Hapus data terkait dulu
    await supabase.from("user_enrollment").delete().eq("id_user", userId);
    await supabase.from("user_progress").delete().eq("id_user", userId);
    await supabase.from("user_pengumpulan").delete().eq("id_user", userId);
    await supabase.from("hasil_kuis").delete().eq("id_user", userId);
    await supabase.from("user_materi").delete().eq("id_user", userId);
    await supabase.from("user_materi_file").delete().eq("id_user", userId);

    // Baru hapus user
    const { error } = await supabase.from("user").delete().eq("id_user", userId);
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
      const [summaryRows, progressRow] = await Promise.all([
        buildUserProgressSummary(userId),
        getUserProgressByClass(userId, classId),
      ]);
      const summary = summaryRows.find(
        (item) => Number(item.classId) === classId,
      );

      res.json({
        success: true,
        data: {
          tingkatanSaatIni:
            summary?.currentLevel ?? extractProgressLevel(progressRow),
          progressPercent: summary?.progressPercent ?? 0,
          completedMaterials: summary?.completedMaterials ?? [],
          completedAssignments: summary?.completedAssignments ?? [],
          completedQuizzes: summary?.completedQuizzes ?? [],
          completedMaterialFiles: summary?.completedMaterialFiles ?? [],
          completedMaterialCount: summary?.completedMaterialCount ?? 0,
          totalMaterialCount: summary?.totalMaterialCount ?? 0,
          completedAssignmentCount: summary?.completedAssignmentCount ?? 0,
          totalAssignmentCount: summary?.totalAssignmentCount ?? 0,
          completedQuizCount: summary?.completedQuizCount ?? 0,
          totalQuizCount: summary?.totalQuizCount ?? 0,
          updatedAt: summary?.updatedAt ?? null,
        },
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
      const [submissionResult, quizResult, materialProgressResult, coarseMaterialProgressResult] = await Promise.all([
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
        supabase
          .from("user_materi_file")
          .select("id_materi, completed_at")
          .eq("id_user", userId)
          .order("completed_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_materi")
          .select("id_materi")
          .eq("id_user", userId)
          .limit(20),
      ]);

      if (submissionResult.error) throw submissionResult.error;
      if (quizResult.error) throw quizResult.error;
      const materialProgressRows =
        materialProgressResult.error &&
        isMissingRelationError(materialProgressResult.error, "user_materi_file")
          ? []
          : ((() => {
              if (materialProgressResult.error) throw materialProgressResult.error;
              return materialProgressResult.data ?? [];
            })());

      const coarseMaterialProgressRows =
        coarseMaterialProgressResult.error &&
        isMissingRelationError(coarseMaterialProgressResult.error, "user_materi")
          ? []
          : ((() => {
              if (coarseMaterialProgressResult.error) throw coarseMaterialProgressResult.error;
              return coarseMaterialProgressResult.data ?? [];
            })());

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

      const latestMaterialCompletionMap = new Map<number, string>();
      for (const row of materialProgressRows ?? []) {
        const materialId = Number(row.id_materi);
        if (!Number.isFinite(materialId) || latestMaterialCompletionMap.has(materialId)) {
          continue;
        }
        latestMaterialCompletionMap.set(materialId, row.completed_at);
      }

      for (const row of coarseMaterialProgressRows ?? []) {
        const materialId = Number(row.id_materi);
        if (!Number.isFinite(materialId) || latestMaterialCompletionMap.has(materialId)) {
          continue;
        }
        latestMaterialCompletionMap.set(materialId, new Date().toISOString());
      }

      let materialActivities: Array<{
        id: string;
        type: "materi";
        title: string;
        classId: string;
        createdAt: string;
        status: "completed";
        score: null;
      }> = [];

      const completedMaterialIds = [...latestMaterialCompletionMap.keys()];
      if (completedMaterialIds.length > 0) {
        const { data: materialRows, error: materialError } = await supabase
          .from("materi")
          .select("id_materi, title_materi, id_kelas")
          .in("id_materi", completedMaterialIds);

        if (materialError) throw materialError;

        materialActivities = (materialRows ?? []).map((item: any) => ({
          id: `materi-${item.id_materi}`,
          type: "materi",
          title: item.title_materi ?? "Materi",
          classId: item.id_kelas ? String(item.id_kelas) : "",
          createdAt:
            latestMaterialCompletionMap.get(item.id_materi) ??
            new Date().toISOString(),
          status: "completed",
          score: null,
        }));
      }

      const classIds = [
        ...new Set(
          [...submissionActivities, ...quizActivities, ...materialActivities]
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

      const data = [...submissionActivities, ...quizActivities, ...materialActivities]
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

// PUT /api/users/:userId/enrollments
router.put("/:userId/enrollments", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId))
    return res.status(400).json({ success: false, error: "userId harus berupa angka" });

  if (req.user.role !== "superadmin")
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  const { id_kelas, id_tingkatan } = req.body ?? {};
  const classId = Number(id_kelas);
  const levelId = Number(id_tingkatan);

  if (!classId || !levelId)
    return res.status(400).json({ success: false, error: "id_kelas dan id_tingkatan wajib diisi" });

  try {
    // Ambil semua tingkatan di kelas ini, urut ascending
    const { data: tingkatanList, error: tingkatanError } = await supabase
      .from("tingkatan")
      .select("id_tingkatan, nama_tingkatan")
      .eq("id_kelas", classId)
      .order("id_tingkatan", { ascending: true });

    if (tingkatanError) throw tingkatanError;

    const levels = tingkatanList ?? [];
    const selectedIndex = levels.findIndex((l) => l.id_tingkatan === levelId);

    if (selectedIndex === -1)
      return res.status(400).json({ success: false, error: "Tingkatan tidak ditemukan di kelas ini" });

    // Tingkatan yang boleh diakses = dari index 0 sampai selectedIndex
    const accessibleLevels = levels.slice(0, selectedIndex + 1);

    // Hapus enrollment lama untuk kelas ini
    const { error: deleteError } = await supabase
      .from("user_enrollment")
      .delete()
      .eq("id_user", userId)
      .eq("id_kelas", classId);

    if (deleteError) throw deleteError;

    // Insert enrollment baru
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from("user_enrollment")
      .insert(
        accessibleLevels.map((level) => ({
          id_user: userId,
          id_kelas: classId,
          id_tingkatan: level.id_tingkatan,
          status: "approved",
          approved_by: req.user.id_user,
          approved_at: now,
          enrolled_at: now,
        }))
      );

    if (insertError) throw insertError;

    // Update user_progress untuk kelas ini
    await saveUserProgress(userId, classId, levelId, now);

    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating user enrollments:", error);
    return res.status(500).json({ success: false, error: "Gagal mengupdate tingkatan user" });
  }
});

// DELETE /api/users/:userId/enrollments/:classId
router.delete("/:userId/enrollments/:classId", verifySupabaseToken, async (req: any, res) => {
  const userId = Number(req.params.userId);
  const classId = Number(req.params.classId);

  if (isNaN(userId) || isNaN(classId))
    return res.status(400).json({ success: false, error: "Parameter tidak valid" });

  if (req.user.role !== "superadmin")
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  try {
    // Hapus semua enrollment user di kelas ini
    const { error: enrollError } = await supabase
      .from("user_enrollment")
      .delete()
      .eq("id_user", userId)
      .eq("id_kelas", classId);

    if (enrollError) throw enrollError;

    // Hapus progress user di kelas ini
    const { error: progressError } = await supabase
      .from("user_progress")
      .delete()
      .eq("id_user", userId)
      .eq("id_kelas", classId);

    if (progressError) throw progressError;

    return res.json({ success: true });
  } catch (error) {
    console.error("Error removing class enrollment:", error);
    return res.status(500).json({ success: false, error: "Gagal menghapus kelas user" });
  }
});

export default router;
