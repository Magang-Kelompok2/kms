import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /api/materials
router.get("/", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("materi").select(`
      id_materi, title_materi, deskripsi, materi_path,
      id_kelas, id_tingkatan, pertemuan,
      kelas(nama_kelas),
      tingkatan(nama_tingkatan),
      video(id_video, title_video, video_path),
      pdf(id_pdf, title_pdf, pdf_path)
    `);

    if (error) throw error;
    res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch materials" });
  }
});

// GET /api/materials/:materialId
router.get("/:materialId", async (req, res) => {
  const materialId = Number(req.params.materialId);
  if (isNaN(materialId))
    return res
      .status(400)
      .json({ success: false, error: "materialId harus berupa angka" });

  try {
    const { data, error } = await supabase
      .from("materi")
      .select(
        `id_materi, title_materi, deskripsi, materi_path,
         id_kelas, id_tingkatan, pertemuan,
         kelas(nama_kelas),
         tingkatan(id_tingkatan, nama_tingkatan),
         video(id_video, title_video, video_path),
         pdf(id_pdf, title_pdf, pdf_path)`,
      )
      .eq("id_materi", materialId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        id: String(data.id_materi),
        title: data.title_materi,
        description: data.deskripsi ?? "",
        classId: String(data.id_kelas),
        meetingNumber: data.pertemuan,
        isPublished: true,
        files: [
          ...(data.video ?? []).map((v: any) => ({
            id: String(v.id_video),
            title: v.title_video ?? "Video",
            url: v.video_path,
            type: "video",
          })),
          ...(data.pdf ?? []).map((p: any) => ({
            id: String(p.id_pdf),
            title: p.title_pdf ?? "PDF",
            url: p.pdf_path,
            type: "pdf",
          })),
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    res.status(500).json({ success: false, error: "Failed to fetch material" });
  }
});

export default router;
