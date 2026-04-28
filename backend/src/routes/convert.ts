// backend/src/routes/convert.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import libre from "libreoffice-convert";
import { promisify } from "util";
import path from "path";

const router = Router();
const libreConvert = promisify(libre.convert);

// Semua format yang didukung LibreOffice
const SUPPORTED_EXTS = new Set([
  // Word
  "doc", "docx", "odt", "rtf",
  // Excel
  "xls", "xlsx", "ods", "csv",
  // PowerPoint
  "ppt", "pptx", "odp",
  // Lainnya
  "html", "htm", "txt", "epub",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // max 50MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    if (SUPPORTED_EXTS.has(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Format .${ext} tidak didukung. Format yang tersedia: ${[...SUPPORTED_EXTS].join(", ")}`,
        ),
      );
    }
  },
});

// ── POST /api/convert/to-pdf ──────────────────────────────────────────────
router.post(
  "/to-pdf",
  (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ success: false, error: "File tidak ditemukan" });
    }

    const ext  = path.extname(file.originalname).toLowerCase();
    const pdfName = file.originalname.replace(/\.[^.]+$/, ".pdf");

    try {
      // Convert buffer langsung ke PDF via LibreOffice
      const pdfBuffer: Buffer = await libreConvert(file.buffer, ".pdf", undefined);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(pdfName)}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error(`[convert] Error converting ${ext} → PDF:`, err);
      return res.status(500).json({
        success: false,
        error: `Gagal mengonversi file: ${err?.message ?? "Unknown error"}`,
      });
    }
  },
);

export default router;