import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";
import { BUCKET, minioClient } from "../lib/minio";
import {
  buildErrorNotificationMessage,
  buildNotificationMessage,
  createNotificationSafe,
} from "../lib/notifications";

const router = Router();

// GET /api/kelas
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("kelas")
      .select("id_kelas, nama_kelas, icon, created_at")
      .order("id_kelas", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: (data ?? []).map((k) => ({
        id: k.id_kelas,
        name: k.nama_kelas,
        icon: (k as any).icon ?? null,
        createdAt: k.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching kelas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch kelas" });
  }
});

// POST /api/kelas — superadmin only
router.post("/", verifySupabaseToken, async (req: any, res) => {
  if (req.user.role !== "superadmin")
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  const { nama_kelas, icon } = req.body;
  if (!nama_kelas?.trim())
    return res.status(400).json({ success: false, error: "Nama kelas wajib diisi" });

  try {
    const { data, error } = await supabase
      .from("kelas")
      .insert({ nama_kelas: nama_kelas.trim(), icon: icon ?? null })
      .select("id_kelas, nama_kelas, icon, created_at")
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        id: (data as any).id_kelas,
        name: (data as any).nama_kelas,
        icon: (data as any).icon ?? null,
        createdAt: (data as any).created_at,
      },
    });
  } catch (error: any) {
    console.error("Error creating kelas:", error);
    res.status(500).json({ success: false, error: "Gagal membuat kelas", detail: error?.message });
  }
});

// DELETE /api/kelas/:classId — superadmin only
router.delete("/:classId", verifySupabaseToken, async (req: any, res) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ success: false, error: "Akses ditolak" });
  }

  const classId = Number(req.params.classId);
  if (!Number.isInteger(classId) || classId <= 0) {
    return res.status(400).json({ success: false, error: "classId harus berupa angka" });
  }

  try {
    const { data: kelas, error: kelasError } = await supabase
      .from("kelas")
      .select("id_kelas, nama_kelas")
      .eq("id_kelas", classId)
      .maybeSingle();

    if (kelasError) throw kelasError;
    if (!kelas) {
      return res.status(404).json({ success: false, error: "Kelas tidak ditemukan" });
    }

    // Ambil ID dan path lebih dulu. Penghapusan dimulai dari tabel paling anak
    // agar tetap bekerja pada database yang foreign key-nya belum cascade.
    const [{ data: materiRows, error: materiError }, { data: tugasRows, error: tugasError }] =
      await Promise.all([
        supabase.from("materi").select("id_materi, materi_path").eq("id_kelas", classId),
        supabase.from("tugas").select("id_tugas, path_tugas").eq("id_kelas", classId),
      ]);

    if (materiError) throw materiError;
    if (tugasError) throw tugasError;

    const materiIds = (materiRows ?? []).map((row: any) => Number(row.id_materi));
    const tugasIds = (tugasRows ?? []).map((row: any) => Number(row.id_tugas));
    let submissionIds: number[] = [];
    let submissionFileIds: number[] = [];
    const storedPaths: string[] = [
      ...(materiRows ?? []).map((row: any) => row.materi_path),
      ...(tugasRows ?? []).map((row: any) => row.path_tugas),
    ].filter(Boolean);

    if (materiIds.length > 0) {
      const [{ data: pdfRows, error: pdfError }, { data: videoRows, error: videoError }] =
        await Promise.all([
          supabase.from("pdf").select("pdf_path").in("id_materi", materiIds),
          supabase.from("video").select("video_path").in("id_materi", materiIds),
        ]);
      if (pdfError) throw pdfError;
      if (videoError) throw videoError;
      storedPaths.push(
        ...(pdfRows ?? []).map((row: any) => row.pdf_path).filter(Boolean),
        ...(videoRows ?? []).map((row: any) => row.video_path).filter(Boolean),
      );
    }

    if (tugasIds.length > 0) {
      const { data: submissionRows, error: submissionError } = await supabase
        .from("pengumpulan")
        .select("id_pengumpulan, id_file")
        .in("id_tugas", tugasIds);
      if (submissionError) throw submissionError;

      submissionIds = (submissionRows ?? []).map((row: any) => Number(row.id_pengumpulan));
      submissionFileIds = (submissionRows ?? [])
        .map((row: any) => Number(row.id_file))
        .filter((id: number) => Number.isInteger(id) && id > 0);

      if (submissionFileIds.length > 0) {
        const { data: fileRows, error: fileError } = await supabase
          .from("file_pengumpulan")
          .select("object_key")
          .in("id_file", submissionFileIds);
        if (fileError) throw fileError;
        storedPaths.push(...(fileRows ?? []).map((row: any) => row.object_key).filter(Boolean));
      }
    }

    const ensureDeleted = (error: any) => {
      if (error) throw error;
    };
    const ensureDeletedIfTableExists = (error: any, tableName: string) => {
      if (!error) return;
      const message = String(error?.message ?? error?.details ?? "").toLowerCase();
      const isMissingTable =
        error?.code === "PGRST205" ||
        error?.code === "42P01" ||
        (message.includes(tableName.toLowerCase()) &&
          (message.includes("could not find the table") || message.includes("does not exist")));
      if (!isMissingTable) throw error;
    };
    const ensureUpdatedIfColumnExists = (error: any, columnName: string) => {
      if (!error) return;
      const message = String(error?.message ?? error?.details ?? "").toLowerCase();
      const isMissingColumn =
        error?.code === "42703" ||
        error?.code === "PGRST204" ||
        (message.includes(columnName.toLowerCase()) && message.includes("does not exist"));
      if (!isMissingColumn) throw error;
    };

    if (submissionIds.length > 0) {
      ensureDeleted(
        (await supabase.from("user_pengumpulan").delete().in("id_pengumpulan", submissionIds))
          .error,
      );
    }
    if (tugasIds.length > 0) {
      ensureDeleted((await supabase.from("hasil_kuis").delete().in("id_tugas", tugasIds)).error);
      ensureDeleted((await supabase.from("soal_kuis").delete().in("id_tugas", tugasIds)).error);
      ensureDeleted((await supabase.from("pengumpulan").delete().in("id_tugas", tugasIds)).error);
    }
    if (submissionFileIds.length > 0) {
      ensureDeleted(
        (await supabase.from("file_pengumpulan").delete().in("id_file", submissionFileIds)).error,
      );
    }
    if (materiIds.length > 0) {
      ensureDeletedIfTableExists(
        (await supabase.from("user_materi_file").delete().in("id_materi", materiIds)).error,
        "user_materi_file",
      );
      ensureDeletedIfTableExists(
        (await supabase.from("user_materi").delete().in("id_materi", materiIds)).error,
        "user_materi",
      );
      ensureDeleted((await supabase.from("pdf").delete().in("id_materi", materiIds)).error);
      ensureDeleted((await supabase.from("video").delete().in("id_materi", materiIds)).error);
    }

    ensureDeleted((await supabase.from("tugas").delete().eq("id_kelas", classId)).error);
    ensureDeleted((await supabase.from("materi").delete().eq("id_kelas", classId)).error);
    ensureDeleted((await supabase.from("user_enrollment").delete().eq("id_kelas", classId)).error);
    ensureDeleted((await supabase.from("user_progress").delete().eq("id_kelas", classId)).error);
    ensureDeleted((await supabase.from("tingkatan").delete().eq("id_kelas", classId)).error);
    ensureUpdatedIfColumnExists(
      (await supabase.from("user").update({ id_kelas: null }).eq("id_kelas", classId)).error,
      "id_kelas",
    );
    ensureDeleted((await supabase.from("kelas").delete().eq("id_kelas", classId)).error);

    // Storage cleanup bersifat best-effort; data kelas tetap dianggap terhapus
    // walaupun satu file lama sudah tidak ditemukan di MinIO.
    await Promise.allSettled(
      [...new Set(storedPaths.map(String).filter(Boolean))].map(async (filePath) => {
        if (/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)/i.test(filePath)) return;
        let objectKey = filePath;
        if (filePath.includes("/storage/v1/")) {
          objectKey = decodeURIComponent(
            filePath.split(/\/storage\/v1\/object\/(?:sign|public)\/[^/]+\//)[1]?.split("?")[0] ??
              filePath,
          );
        } else if (/^https?:\/\//i.test(filePath)) {
          const url = new URL(filePath);
          objectKey = decodeURIComponent(url.pathname.replace(/^\//, ""));
        }
        if (objectKey.startsWith(`${BUCKET}/`)) objectKey = objectKey.slice(BUCKET.length + 1);
        await minioClient.removeObject(BUCKET, objectKey.replace(/^\//, ""));
      }),
    );

    await createNotificationSafe({
      userId: Number(req.user?.id_user),
      type: "SUCCESS",
      status: 200,
      message: buildNotificationMessage(
        200,
        "Berhasil",
        `Kelas ${kelas.nama_kelas} berhasil dihapus`,
      ),
    });

    return res.json({
      success: true,
      message: `Kelas ${kelas.nama_kelas} berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("Error deleting kelas:", error);
    if (Number.isFinite(Number(req.user?.id_user))) {
      await createNotificationSafe({
        userId: Number(req.user.id_user),
        type: "FAILED",
        status: 500,
        message: buildErrorNotificationMessage(
          "Gagal",
          error,
          `Penghapusan kelas ${classId} gagal`,
        ),
      });
    }
    return res.status(500).json({
      success: false,
      error: "Gagal menghapus kelas beserta data terkait",
      detail: error?.message,
    });
  }
});

// GET /api/kelas/:classId
router.get("/:classId", async (req, res) => {
  const classId = Number(req.params.classId);
  if (isNaN(classId))
    return res
      .status(400)
      .json({ success: false, error: "classId harus berupa angka" });

  try {
    const { data, error } = await supabase
      .from("kelas")
      .select("id_kelas, nama_kelas, icon, created_at")
      .eq("id_kelas", classId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: data.id_kelas,
        name: data.nama_kelas,
        icon: (data as any).icon ?? null,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching kelas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch kelas" });
  }
});

// POST /api/kelas/:classId/levels — superadmin only
router.post("/:classId/levels", verifySupabaseToken, async (req: any, res) => {
  if (req.user.role !== "superadmin")
    return res.status(403).json({ success: false, error: "Akses ditolak" });

  const classId = Number(req.params.classId);
  if (isNaN(classId))
    return res.status(400).json({ success: false, error: "classId harus berupa angka" });

  const { nama_tingkatan } = req.body;
  if (!nama_tingkatan?.trim())
    return res.status(400).json({ success: false, error: "Nama tingkatan wajib diisi" });

  try {
    const { data: existing } = await supabase
      .from("tingkatan")
      .select("level_urutan")
      .eq("id_kelas", classId)
      .order("level_urutan", { ascending: false })
      .limit(1);

    const nextLevel = ((existing?.[0] as any)?.level_urutan ?? 0) + 1;

    const { data, error } = await supabase
      .from("tingkatan")
      .insert({ id_kelas: classId, nama_tingkatan: nama_tingkatan.trim(), level_urutan: nextLevel })
      .select("id_tingkatan, nama_tingkatan, level_urutan")
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        id: String((data as any).id_tingkatan),
        level: (data as any).level_urutan,
        namaLevel: (data as any).nama_tingkatan,
      },
    });
  } catch (error: any) {
    console.error("Error creating tingkatan:", error);
    res.status(500).json({ success: false, error: "Gagal membuat tingkatan", detail: error?.message });
  }
});

// GET /api/kelas/:classId/levels
router.get("/:classId/levels", async (req, res) => {
  const classId = Number(req.params.classId);
  if (isNaN(classId))
    return res
      .status(400)
      .json({ success: false, error: "classId harus berupa angka" });

  try {
    const [
      { data: tingkatanList, error: e1 },
      { data: materiList, error: e2 },
      { data: tugasList, error: e3 },
    ] = await Promise.all([
      supabase
        .from("tingkatan")
        .select("id_tingkatan, nama_tingkatan, level_urutan")
        .eq("id_kelas", classId)
        .order("level_urutan", { ascending: true }),

      supabase
        .from("materi")
        .select(
          `id_materi, title_materi, deskripsi, id_tingkatan, pertemuan,
           video(id_video, title_video, video_path),
           pdf(id_pdf, title_pdf, pdf_path)`,
        )
        .eq("id_kelas", classId)
        .order("pertemuan", { ascending: true }),

      supabase
        .from("tugas")
        .select(
          "id_tugas, nama_tugas, deskripsi, type, id_materi, pertemuan, deadline, created_at",
        )
        .eq("id_kelas", classId)
        .order("pertemuan", { ascending: true }),
    ]);

    if (e1) throw e1;
    if (e2) throw e2;
    if (e3) throw e3;

    const levels = (tingkatanList ?? []).map((tingkatan) => {
      const materiDiTingkatan = (materiList ?? []).filter(
        (m) => m.id_tingkatan === tingkatan.id_tingkatan,
      );

      const levelUrutan = tingkatan.level_urutan ?? tingkatan.id_tingkatan;

      const materials = materiDiTingkatan.map((m) => ({
        id: String(m.id_materi),
        title: m.title_materi,
        description: m.deskripsi ?? "",
        content: m.deskripsi ?? "",
        classId: String(classId),
        meetingNumber: m.pertemuan,
        level: levelUrutan,
        createdAt: new Date().toISOString(),
        isPublished: true,
        files: [
          ...(m.video ?? []).map((v: any) => ({
            id: String(v.id_video),
            title: v.title_video ?? "Video",
            url: v.video_path,
            type: "video",
          })),
          ...(m.pdf ?? []).map((p: any) => ({
            id: String(p.id_pdf),
            title: p.title_pdf ?? "PDF",
            url: p.pdf_path,
            type: "pdf",
          })),
        ],
      }));

      const materiIds = new Set(materiDiTingkatan.map((m) => m.id_materi));

      const assignments = (tugasList ?? [])
        .filter((t) => materiIds.has(t.id_materi) && t.type !== "Kuis")
        .map((t) => ({
          id: String(t.id_tugas),
          title: t.nama_tugas ?? "",
          description: t.deskripsi ?? "",
          dueDate: t.deadline ?? t.created_at,
          classId: String(classId),
          meetingNumber: t.pertemuan,
          level: levelUrutan,
          materialId: String(t.id_materi),
          isPublished: true,
          type: t.type ?? "",
        }));

      const quizzes = (tugasList ?? [])
        .filter((t) => materiIds.has(t.id_materi) && t.type === "Kuis")
        .map((t) => ({
          id: String(t.id_tugas),
          title: t.nama_tugas ?? "",
          description: t.deskripsi ?? "",
          dueDate: t.deadline ?? t.created_at,
          classId: String(classId),
          meetingNumber: t.pertemuan,
          level: levelUrutan,
          materialId: String(t.id_materi),
          isPublished: true,
          type: t.type ?? "",
        }));

      return {
        id: String(tingkatan.id_tingkatan),
        level: levelUrutan,
        namaLevel: tingkatan.nama_tingkatan,
        materials,
        assignments,
        quizzes,
      };
    });

    res.json({ success: true, data: levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ success: false, error: "Failed to fetch levels" });
  }
});

export default router;
