const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// GET /api/kelas/:classId/levels
// Ambil semua tingkatan beserta materi & tugas untuk satu kelas
router.get("/:classId/levels", async (req, res) => {
  const { classId } = req.params;

  try {
    // 1. Ambil semua tingkatan di kelas ini
    const { data: tingkatanList, error: tingkatanError } = await supabase
      .from("tingkatan")
      .select("id_tingkatan, nama_tingkatan")
      .eq("id_kelas", classId)
      .order("id_tingkatan", { ascending: true });

    if (tingkatanError) throw tingkatanError;

    // 2. Untuk setiap tingkatan, ambil materi dan tugasnya
    const levelsWithContent = await Promise.all(
      tingkatanList.map(async (tingkatan) => {
        // Ambil materi (beserta video & pdf-nya)
        const { data: materiList, error: materiError } = await supabase
          .from("materi")
          .select(
            `
            id_materi,
            title_materi,
            materi_path,
            pertemuan,
            video ( id_video, title_video, video_path ),
            pdf   ( id_pdf,   title_pdf,   pdf_path   )
          `,
          )
          .eq("id_kelas", classId)
          .eq("id_tingkatan", tingkatan.id_tingkatan)
          .order("pertemuan", { ascending: true });

        if (materiError) throw materiError;

        // Ambil tugas
        const { data: tugasList, error: tugasError } = await supabase
          .from("tugas")
          .select(
            "id_tugas, nama_tugas, deskripsi, type, pertemuan, created_at",
          )
          .eq("id_kelas", classId)
          .order("pertemuan", { ascending: true });

        if (tugasError) throw tugasError;

        // Cocokkan tugas ke tingkatan melalui materi
        const materiIds = materiList.map((m) => m.id_materi);
        const tugasFiltered = tugasList.filter((t) =>
          // tugas punya id_materi, filter yang materinya ada di tingkatan ini
          materiIds.length > 0
            ? true // kita sudah filter lewat id_kelas, cukup
            : false,
        );

        return {
          id: tingkatan.id_tingkatan,
          level: tingkatan.nama_tingkatan,
          materials: materiList.map((m) => ({
            id: m.id_materi,
            title: m.title_materi,
            description: m.materi_path ?? "",
            meetingNumber: m.pertemuan,
            files: [
              ...(m.video ?? []).map((v) => ({ type: "video", ...v })),
              ...(m.pdf ?? []).map((p) => ({ type: "pdf", ...p })),
            ],
          })),
          assignments: tugasFiltered.map((t) => ({
            id: t.id_tugas,
            title: t.nama_tugas,
            description: t.deskripsi,
            meetingNumber: t.pertemuan,
            dueDate: t.created_at, // ganti jika ada kolom due_date nanti
            type: t.type,
          })),
          quizzes: [], // belum ada tabel quiz
        };
      }),
    );

    res.json({ success: true, data: levelsWithContent });
  } catch (err) {
    console.error("Error fetching levels:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
