import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/kelas
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("kelas")
      .select("id_kelas, nama_kelas, created_at")
      .order("id_kelas", { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: (data ?? []).map((k) => ({
        id: k.id_kelas,
        name: k.nama_kelas,
        createdAt: k.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching kelas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch kelas" });
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
      .select("id_kelas, nama_kelas, created_at")
      .eq("id_kelas", classId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: data.id_kelas,
        name: data.nama_kelas,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching kelas:", error);
    res.status(500).json({ success: false, error: "Failed to fetch kelas" });
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
        .select("id_tingkatan, nama_tingkatan")
        .eq("id_kelas", classId)
        .order("id_tingkatan", { ascending: true }),

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

    const levels = (tingkatanList ?? []).map((tingkatan, index) => {
      const materiDiTingkatan = (materiList ?? []).filter(
        (m) => m.id_tingkatan === tingkatan.id_tingkatan,
      );

      const materials = materiDiTingkatan.map((m) => ({
        id: String(m.id_materi),
        title: m.title_materi,
        description: m.deskripsi ?? "",
        meetingNumber: m.pertemuan,
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
        .filter((t) => materiIds.has(t.id_materi))
        .map((t) => ({
          id: String(t.id_tugas),
          title: t.nama_tugas ?? "",
          description: t.deskripsi ?? "",
          meetingNumber: t.pertemuan,
          dueDate: t.deadline ?? t.created_at,
          type: t.type ?? "",
        }));

      return {
        id: String(tingkatan.id_tingkatan),
        level: index + 1,
        namaLevel: tingkatan.nama_tingkatan,
        materials,
        assignments,
        quizzes: [],
      };
    });

    res.json({ success: true, data: levels });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ success: false, error: "Failed to fetch levels" });
  }
});

export default router;
