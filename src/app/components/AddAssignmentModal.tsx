import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import { useAddTugas } from "../hooks/useAddTugas";
import jsPDF from "jspdf";

interface MateriOption {
  id_materi: number;
  title_materi: string;
}

interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  level: number;
  onAdd: (assignment: any) => void;
}

interface FileUpload {
  id: string;
  name: string;
  file?: File;
  converted?: boolean;
  originalFormat?: string;
}

// ── Format per metode konversi ────────────────────────────────────────────

// Browser (jsPDF) — cepat, tanpa server
const CLIENT_IMAGE_EXTS = new Set([
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg",
]);
const CLIENT_TEXT_EXTS = new Set(["txt"]);

// Backend (LibreOffice) — semua dokumen office
const SERVER_CONVERT_EXTS = new Set([
  "doc", "docx", "odt", "rtf",
  "xls", "xlsx", "ods", "csv",
  "ppt", "pptx", "odp",
  "html", "htm", "epub",
]);

const ALL_ACCEPTED = [
  ".pdf",
  // gambar
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg",
  // teks
  ".txt",
  // office
  ".doc", ".docx", ".odt", ".rtf",
  ".xls", ".xlsx", ".ods", ".csv",
  ".ppt", ".pptx", ".odp",
  ".html", ".htm", ".epub",
].join(",");

const getExt = (filename: string) =>
  filename.split(".").pop()?.toLowerCase() ?? "";

// ─────────────────────────────────────────────────────────────────────────
export function AddAssignmentModal({
  isOpen,
  onClose,
  classId,
  level,
  onAdd,
}: AddAssignmentModalProps) {
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [meetingNumber, setMeetingNumber] = useState("");
  const [dueDate, setDueDate]           = useState("");
  const [files, setFiles]               = useState<FileUpload[]>([]);
  const [converting, setConverting]     = useState(false);
  const [selectedMateriId, setSelectedMateriId] = useState<number | "">("");
  const [materiOptions, setMateriOptions]       = useState<MateriOption[]>([]);
  const [materiLoading, setMateriLoading]       = useState(false);

  const { addTugas, loading, error } = useAddTugas();

  useEffect(() => {
    if (!isOpen || !classId) return;
    const fetchMateri = async () => {
      setMateriLoading(true);
      try {
        const res  = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials?classId=${classId}`,
        );
        const json = await res.json();
        if (json.success) {
          const filtered = (json.data as any[])
            .filter((m) => m.id_tingkatan === level)
            .map((m) => ({ id_materi: m.id_materi, title_materi: m.title_materi }));
          setMateriOptions(filtered);
        }
      } catch {
        setMateriOptions([]);
      } finally {
        setMateriLoading(false);
      }
    };
    fetchMateri();
  }, [isOpen, classId, level]);

  if (!isOpen) return null;

  // ── 1. Gambar → PDF (browser, Canvas + jsPDF) ────────────────────────────
  const convertImageToPdf = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_PX = 2480;
          const scale  = img.width > MAX_PX ? MAX_PX / img.width : 1;
          const w = Math.round(img.width  * scale);
          const h = Math.round(img.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width  = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const imgData = canvas.toDataURL("image/jpeg", 0.92);
          const pdf = new jsPDF({
            orientation: w > h ? "landscape" : "portrait",
            unit: "px",
            format: [w, h],
          });
          pdf.addImage(imgData, "JPEG", 0, 0, w, h);
          const blob = pdf.output("blob");
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".pdf"), {
              type: "application/pdf",
            }),
          );
        };
        img.onerror = () => reject(new Error("Gagal memuat gambar."));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });

  // ── 2. TXT → PDF (browser, jsPDF text) ───────────────────────────────────
  const convertTextToPdf = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text  = (e.target?.result as string) ?? "";
          const pdf   = new jsPDF({ unit: "mm", format: "a4" });
          const margin = 15;
          const maxW   = pdf.internal.pageSize.getWidth() - margin * 2;
          const pageH  = pdf.internal.pageSize.getHeight();
          const lineH  = 6;
          pdf.setFontSize(11);
          const lines = pdf.splitTextToSize(text, maxW);
          let y = margin;
          lines.forEach((line: string) => {
            if (y + lineH > pageH - margin) { pdf.addPage(); y = margin; }
            pdf.text(line, margin, y);
            y += lineH;
          });
          const blob = pdf.output("blob");
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".pdf"), {
              type: "application/pdf",
            }),
          );
        } catch {
          reject(new Error("Gagal mengonversi teks ke PDF."));
        }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsText(file);
    });

  // ── 3. Office/dll → PDF (backend LibreOffice) ────────────────────────────
  const convertViaServer = async (file: File): Promise<File> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/convert/to-pdf`,
      { method: "POST", body: formData },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? `Konversi gagal (${res.status})`);
    }

    const blob = await res.blob();
    return new File(
      [blob],
      file.name.replace(/\.[^.]+$/, ".pdf"),
      { type: "application/pdf" },
    );
  };

  // ── Router konversi ───────────────────────────────────────────────────────
  const convertToPdf = async (
    file: File,
  ): Promise<{ pdfFile: File; converted: boolean }> => {
    const ext = getExt(file.name);
    if (ext === "pdf")                return { pdfFile: file,                           converted: false };
    if (CLIENT_IMAGE_EXTS.has(ext))   return { pdfFile: await convertImageToPdf(file),  converted: true  };
    if (CLIENT_TEXT_EXTS.has(ext))    return { pdfFile: await convertTextToPdf(file),   converted: true  };
    if (SERVER_CONVERT_EXTS.has(ext)) return { pdfFile: await convertViaServer(file),   converted: true  };
    throw new Error(`Format .${ext} tidak didukung.`);
  };

  // ── Handle file input ─────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    e.target.value = "";
    setConverting(true);
    try {
      const results = await Promise.all(
        selected.map(async (file) => {
          const ext = getExt(file.name);
          const { pdfFile, converted } = await convertToPdf(file);
          return {
            id: `file-${Date.now()}-${Math.random()}`,
            name: pdfFile.name,
            file: pdfFile,
            converted,
            originalFormat: ext.toUpperCase(),
          };
        }),
      );
      setFiles((prev) => [...prev, ...results]);
    } catch (err: any) {
      alert(err.message ?? "Gagal mengonversi file.");
    } finally {
      setConverting(false);
    }
  };

  const removeFile = (id: string) => setFiles(files.filter((f) => f.id !== id));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title || !description || !meetingNumber) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    if (!selectedMateriId) {
      alert("Mohon pilih materi yang terkait");
      return;
    }
    const id_tugas = await addTugas({
      nama_tugas: title,
      deskripsi:  description,
      type:       "Tugas",
      id_materi:  Number(selectedMateriId),
      id_kelas:   Number(classId),
      pertemuan:  parseInt(meetingNumber),
      deadline:   dueDate ? new Date(dueDate).toISOString() : undefined,
      file:       files[0]?.file,
    });
    if (!id_tugas) return;
    onAdd({
      id: String(id_tugas), title, description, dueDate, classId,
      meetingNumber: parseInt(meetingNumber), level, isPublished: true, attachments: [],
    });
    setTitle(""); setDescription(""); setMeetingNumber("");
    setDueDate(""); setFiles([]); setSelectedMateriId("");
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-normal">Tambah Tugas</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Pilih Materi */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Materi Terkait <span className="text-red-500">*</span>
            </label>
            {materiLoading ? (
              <p className="text-sm text-gray-500">Memuat daftar materi...</p>
            ) : materiOptions.length === 0 ? (
              <p className="text-sm text-red-500">
                Belum ada materi di tingkatan ini. Tambahkan materi terlebih dahulu.
              </p>
            ) : (
              <select
                value={selectedMateriId}
                onChange={(e) => setSelectedMateriId(Number(e.target.value))}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
              >
                <option value="">-- Pilih Materi --</option>
                {materiOptions.map((m) => (
                  <option key={m.id_materi} value={m.id_materi}>{m.title_materi}</option>
                ))}
              </select>
            )}
          </div>

          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Judul Tugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Tugas: Analisis Jenis Pajak"
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
            />
          </div>

          {/* Pertemuan */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Pertemuan Ke- <span className="text-red-500">*</span>
            </label>
            <input
              type="number" value={meetingNumber} onChange={(e) => setMeetingNumber(e.target.value)}
              placeholder="1" min="1"
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi tugas dan instruksi pengerjaan..."
              className="w-full h-32 px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 resize-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Deadline <span className="text-gray-400 text-xs font-normal">(opsional)</span>
            </label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              File Tugas <span className="text-gray-400 text-xs font-normal">(opsional)</span>
            </label>

            {/* Info format */}
            <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
              Semua format (PDF, Word, Excel, PPT, gambar, dll) otomatis dikonversi ke PDF.
            </p>

            {/* Drop zone */}
            <div className="mb-4">
              <input
                type="file"
                id="assignment-file-upload"
                accept={ALL_ACCEPTED}
                onChange={handleFileSelect}
                className="hidden"
                disabled={converting}
              />
              <label
                htmlFor="assignment-file-upload"
                className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                  converting
                    ? "border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-60"
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer"
                }`}
              >
                {converting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span className="text-sm font-medium text-blue-500">
                      Mengonversi ke PDF...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium">
                      {files.length > 0 ? "Tambah / Ganti File" : "Upload File (semua format didukung)"}
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-red-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        {file.converted ? (
                          <p className="text-xs text-green-500 mt-0.5">
                            ✓ Dikonversi dari {file.originalFormat} ke PDF
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">
                            File PDF langsung digunakan
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || converting}
            className="flex-1 text-base py-6 bg-secondary hover:bg-primary text-white font-semibold"
          >
            {loading ? "Menyimpan..." : "Simpan Tugas"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || converting}
            className="text-base py-6"
          >
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
