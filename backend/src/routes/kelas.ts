import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";

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
