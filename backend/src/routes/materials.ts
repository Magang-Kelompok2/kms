import { Router } from "express";
import { supabase } from "../lib/supabase";
import { verifySupabaseToken } from "../middleware/auth";
import {
  buildErrorNotificationMessage,
  buildNotificationMessage,
  createNotificationSafe,
} from "../lib/notifications";

const router = Router();

// Helper untuk mendeteksi error duplicate key pada database
const isDuplicateKeyError = (error: any) => {
  const message = String(error?.message ?? error?.details ?? "").toLowerCase();
  return error?.code === "23505" || message.includes("duplicate key");
};

// Helper untuk memotong URL utuh menjadi relative path yang dipahami oleh Supabase Storage
const getRelativePath = (fullPathOrUrl: string, bucketName: string): string => {
  if (!fullPathOrUrl) return "";
  const signMarker = `/storage/v1/object/sign/${bucketName}/`;
  const publicMarker = `/storage/v1/object/public/${bucketName}/`;

  if (fullPathOrUrl.includes(signMarker)) {
    return decodeURIComponent(fullPathOrUrl.split(signMarker)[1].split("?")[0]);
  }
  if (fullPathOrUrl.includes(publicMarker)) {
    return decodeURIComponent(fullPathOrUrl.split(publicMarker)[1]);
  }
  return fullPathOrUrl;
};

// GET /api/materials
router.get("/", async (_req, res) => {
  try {
    const classIdFilter = _req.query.classId;
    const limit = Math.min(Number(_req.query.limit ?? 30), 100);
    const offset = Number(_req.query.offset ?? 0);

    let query = supabase.from("materi").select(
      `
      id_materi, title_materi, deskripsi,
      id_kelas, id_tingkatan, pertemuan
    `,
      { count: "exact" },
    );

    if (classIdFilter) {
      query = query.eq("id_kelas", Number(classIdFilter));
    }

    const { data, error, count } = await query
      .order("pertemuan", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      success: true,
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
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
    // 1. Fetch materi
    const { data, error } = await supabase
      .from("materi")
      .select(
        `id_materi, title_materi, deskripsi, materi_path,
         id_kelas, id_tingkatan, pertemuan,
         tingkatan(level_urutan)`,
      )
      .eq("id_materi", materialId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // 2. Fetch videos dengan filter id_materi
    const { data: videos, error: videoError } = await supabase
      .from("video")
      .select("id_video, title_video, video_path")
      .eq("id_materi", materialId);

    if (videoError) {
      console.error("Video fetch error:", videoError);
    }

    // 3. Fetch pdfs dengan filter id_materi
    const { data: pdfs, error: pdfError } = await supabase
      .from("pdf")
      .select("id_pdf, title_pdf, pdf_path")
      .eq("id_materi", materialId);

    if (pdfError) {
      console.error("PDF fetch error:", pdfError);
    }

    console.log("Material data from DB:", {
      id_materi: data.id_materi,
      title_materi: data.title_materi,
      video_count: videos?.length ?? 0,
      pdf_count: pdfs?.length ?? 0,
      videos: videos,
      pdfs: pdfs,
    });

    // ── CONFIG SUPABASE STORAGE STREAMING ──
    const BUCKET_NAME = "alpha"; //
    const EXPIRE_IN_SECONDS = 60 * 60 * 3; // Signed URL aktif selama 3 jam

    // 4. Generate Signed URL untuk file Video (Bypass Proxy agar mendukung Range Requests)
    const videoFiles = await Promise.all(
      (videos ?? []).map(async (v: any) => {
        let finalUrl = "";
        const cleanPath = getRelativePath(v.video_path, BUCKET_NAME);

        try {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(cleanPath, EXPIRE_IN_SECONDS);

          if (signedError) throw signedError;
          finalUrl = signedData.signedUrl;
        } catch (err) {
          console.error(`Gagal membuat signed URL video ${v.id_video}:`, err);
          // Fallback ke proxy jika generate Signed URL gagal atau file 404
          const apiBase =
            process.env.VITE_API_URL ??
            `http://localhost:${process.env.PORT ?? 4000}`;
          finalUrl = `${apiBase}/api/files/proxy?path=${encodeURIComponent(v.video_path)}`;
        }

        return {
          id: String(v.id_video),
          name: v.title_video ?? "Untitled Video",
          url: finalUrl,
          type: "video" as const,
        };
      }),
    );

    // 5. Generate Signed URL untuk file PDF
    const pdfFiles = await Promise.all(
      (pdfs ?? []).map(async (p: any) => {
        let finalUrl = "";
        const cleanPath = getRelativePath(p.pdf_path, BUCKET_NAME);

        try {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(cleanPath, EXPIRE_IN_SECONDS);

          if (signedError) throw signedError;
          finalUrl = signedData.signedUrl;
        } catch (err) {
          console.error(`Gagal membuat signed URL pdf ${p.id_pdf}:`, err);
          // Fallback ke proxy jika generate Signed URL gagal atau file 404
          const apiBase =
            process.env.VITE_API_URL ??
            `http://localhost:${process.env.PORT ?? 4000}`;
          finalUrl = `${apiBase}/api/files/proxy?path=${encodeURIComponent(p.pdf_path)}`;
        }

        return {
          id: String(p.id_pdf),
          name: p.title_pdf ?? "Untitled PDF",
          url: finalUrl,
          type: "pdf" as const,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        id: String(data.id_materi),
        title: data.title_materi,
        description: data.deskripsi ?? "",
        classId: String(data.id_kelas),
        meetingNumber: data.pertemuan,
        level: (data as any).tingkatan?.level_urutan ?? 1,
        isPublished: true,
        files: [...videoFiles, ...pdfFiles],
      },
    });
  } catch (error) {
    console.error("Error fetching material:", error);
    res.status(500).json({ success: false, error: "Failed to fetch material" });
  }
});

// POST /api/materials
router.post("/", verifySupabaseToken, async (req: any, res) => {
  const {
    title_materi,
    deskripsi,
    id_kelas,
    id_tingkatan,
    pertemuan,
    videos,
    pdfs,
  } = req.body;

  if (!title_materi || !id_kelas || !id_tingkatan) {
    return res.status(400).json({
      success: false,
      error: "title_materi, id_kelas, id_tingkatan wajib diisi",
    });
  }

  try {
    const { data: materi, error: materiError } = await supabase
      .from("materi")
      .insert({
        title_materi,
        deskripsi: deskripsi ?? null,
        id_kelas: Number(id_kelas),
        id_tingkatan: Number(id_tingkatan),
        pertemuan: pertemuan ? Number(pertemuan) : 1,
      })
      .select()
      .single();

    if (materiError) throw materiError;

    const id_materi = materi.id_materi;

    if (Array.isArray(videos) && videos.length > 0) {
      const videoRows = videos.map(
        (v: { title_video?: string; video_path: string }) => ({
          id_materi,
          title_video: v.title_video ?? null,
          video_path: v.video_path,
        }),
      );
      const { error: videoError } = await supabase
        .from("video")
        .insert(videoRows);
      if (videoError) throw videoError;
    }

    if (Array.isArray(pdfs) && pdfs.length > 0) {
      const pdfRows = pdfs.map(
        (p: { title_pdf?: string; pdf_path: string }) => ({
          id_materi,
          title_pdf: p.title_pdf ?? null,
          pdf_path: p.pdf_path,
        }),
      );
      const { error: pdfError } = await supabase.from("pdf").insert(pdfRows);
      if (pdfError) throw pdfError;
    }

    await createNotificationSafe({
      userId: Number(req.user?.id_user),
      type: "SUCCESS",
      status: 200,
      category: "MATERI",
      message: buildNotificationMessage(
        200,
        "Berhasil",
        `Materi ${materi.title_materi} telah ditambahkan`,
      ),
    });

    res.status(201).json({ success: true, data: { id_materi, ...materi } });
  } catch (error: any) {
    console.error("Error creating materi:", error);
    if (Number.isFinite(Number(req.user?.id_user))) {
      await createNotificationSafe({
        userId: Number(req.user.id_user),
        type: "FAILED",
        status: 400,
        category: "MATERI",
        message: buildErrorNotificationMessage(
          "Gagal",
          error,
          `Penambahan materi ${String(title_materi ?? "").trim() || "baru"} gagal`,
        ),
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to create materi",
      detail: error?.message ?? error,
    });
  }
});

// PUT /api/materials/:materialId
router.put("/:materialId", verifySupabaseToken, async (req: any, res) => {
  const materialId = Number(req.params.materialId);
  if (isNaN(materialId)) {
    return res
      .status(400)
      .json({ success: false, error: "materialId harus berupa angka" });
  }

  const { title_materi, deskripsi, meetingNumber } = req.body;

  try {
    const updateData: any = {};
    if (title_materi) updateData.title_materi = title_materi;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (meetingNumber) updateData.pertemuan = Number(meetingNumber);

    const { data, error } = await supabase
      .from("materi")
      .update(updateData)
      .eq("id_materi", materialId)
      .select(
        `id_materi, title_materi, deskripsi, materi_path,
         id_kelas, id_tingkatan, pertemuan,
         kelas(nama_kelas),
         tingkatan(id_tingkatan, nama_tingkatan, level_urutan),
         video(id_video, title_video, video_path),
         pdf(id_pdf, title_pdf, pdf_path)`,
      )
      .single();

    if (error) throw error;

    await createNotificationSafe({
      userId: Number(req.user?.id_user),
      type: "SUCCESS",
      status: 200,
      category: "MATERI",
      message: buildNotificationMessage(
        200,
        "Berhasil",
        `Materi ${data.title_materi} telah diperbarui`,
      ),
    });

    res.json({
      success: true,
      data: {
        id: String(data.id_materi),
        title: data.title_materi,
        description: data.deskripsi ?? "",
        classId: String(data.id_kelas),
        level: (data as any).tingkatan?.level_urutan ?? 1,
        meetingNumber: data.pertemuan,
        isPublished: true,
        files: [
          ...(data.video ?? []).map((v: any) => ({
            id: String(v.id_video),
            name: v.title_video ?? "Video",
            url: v.video_path,
            type: "video",
            duration: v.video_duration,
          })),
          ...(data.pdf ?? []).map((p: any) => ({
            id: String(p.id_pdf),
            name: p.title_pdf ?? "PDF",
            url: p.pdf_path,
            type: "pdf",
          })),
        ],
      },
    });
  } catch (error: any) {
    console.error("Error updating material:", error);
    if (Number.isFinite(Number(req.user?.id_user))) {
      await createNotificationSafe({
        userId: Number(req.user.id_user),
        type: "FAILED",
        status: 400,
        category: "MATERI",
        message: buildErrorNotificationMessage(
          "Gagal",
          error,
          `Pembaruan materi ${materialId} gagal`,
        ),
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update material",
      detail: error?.message ?? error,
    });
  }
});

// POST /api/materials/:materialId/complete-file
router.post(
  "/:materialId/complete-file",
  verifySupabaseToken,
  async (req: any, res) => {
    const materialId = Number(req.params.materialId);
    const fileId = Number(req.body?.fileId);
    const fileType = String(req.body?.fileType ?? "")
      .trim()
      .toLowerCase();
    const userId = Number(req.user?.id_user);

    if (
      isNaN(materialId) ||
      isNaN(fileId) ||
      !["pdf", "video"].includes(fileType) ||
      !Number.isFinite(userId)
    ) {
      return res.status(400).json({
        success: false,
        error: "materialId, fileId, dan fileType wajib valid",
      });
    }

    try {
      const { data: material, error: materialError } = await supabase
        .from("materi")
        .select("id_materi")
        .eq("id_materi", materialId)
        .maybeSingle();

      if (materialError) throw materialError;
      if (!material) {
        return res
          .status(404)
          .json({ success: false, error: "Materi tidak ditemukan" });
      }

      const fileTable = fileType === "pdf" ? "pdf" : "video";
      const fileIdColumn = fileType === "pdf" ? "id_pdf" : "id_video";
      const { data: fileRow, error: fileError } = await supabase
        .from(fileTable)
        .select(`${fileIdColumn}, id_materi`)
        .eq(fileIdColumn, fileId)
        .eq("id_materi", materialId)
        .maybeSingle();

      if (fileError) throw fileError;
      if (!fileRow) {
        return res
          .status(404)
          .json({ success: false, error: "File materi tidak ditemukan" });
      }

      const completedAt = new Date().toISOString();
      const payload = {
        id_user: userId,
        id_materi: materialId,
        completed_at: completedAt,
      };

      const { error: upsertError } = await supabase
        .from("user_materi")
        .upsert(payload, {
          onConflict: "id_user,id_materi",
        });

      if (upsertError) {
        const { data: existingRow, error: existingError } = await supabase
          .from("user_materi")
          .select("id_user")
          .eq("id_user", userId)
          .eq("id_materi", materialId)
          .maybeSingle();

        if (existingError) throw existingError;

        if (!existingRow) {
          const { error: insertError } = await supabase
            .from("user_materi")
            .insert(payload);

          if (insertError && !isDuplicateKeyError(insertError)) {
            throw insertError;
          }
        }
      }

      res.json({
        success: true,
        data: {
          materialCompleted: true,
          completedFileKeys: [`${fileType}:${fileId}`],
        },
      });
    } catch (error: any) {
      console.error("Error marking material file complete:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save material progress",
        detail: error?.message ?? error,
      });
    }
  },
);

// DELETE /api/materials/:materialId
router.delete("/:materialId", async (req, res) => {
  const materialId = Number(req.params.materialId);
  if (isNaN(materialId)) {
    return res
      .status(400)
      .json({ success: false, error: "materialId harus berupa angka" });
  }

  try {
    const { error } = await supabase
      .from("materi")
      .delete()
      .eq("id_materi", materialId);

    if (error) throw error;

    res.json({ success: true, message: "Material deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete material",
      detail: error?.message ?? error,
    });
  }
});

export default router;
