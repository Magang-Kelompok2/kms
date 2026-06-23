import { useState } from "react";
import {
  X,
  FileText,
  Video,
  Trash2,
  Loader2,
  Upload,
  Link,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { useUpload, UPLOAD_CANCELLED } from "../hooks/useUpload";
import type { MaterialFile } from "../types";

interface ManageMaterialFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  materialTitle: string;
  initialFiles: MaterialFile[];
  onFilesChanged: (files: MaterialFile[]) => void;
}

type AddMode = "pdf" | "video-file" | "video-url" | null;

export function ManageMaterialFilesModal({
  isOpen,
  onClose,
  materialId,
  materialTitle,
  initialFiles,
  onFilesChanged,
}: ManageMaterialFilesModalProps) {
  const { token } = useAuth();
  const { uploadMateriFile, cancelUpload, loading: uploading } = useUpload();

  const [files, setFiles] = useState<MaterialFile[]>(initialFiles);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadLabel, setUploadLabel] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MaterialFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const apiUrl = import.meta.env.VITE_API_URL as string;

  const handleClose = () => {
    if (uploading) cancelUpload();
    onFilesChanged(files);
    setAddMode(null);
    setError(null);
    onClose();
  };

  // ── Upload PDF / Video file ──────────────────────────────────────────────
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "pdf" | "video",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploadLabel(`Mengupload ${file.name}…`);
    if (type === "video") setUploadPercent(0);

    try {
      const result = await uploadMateriFile(
        file,
        type,
        Number(materialId),
        file.name,
        type === "video" ? (pct) => setUploadPercent(pct) : undefined,
      );

      if (result) {
        const newFile: MaterialFile = {
          id: result.id,
          name: result.originalName,
          type,
          url: result.url,
        };
        const updated = [...files, newFile];
        setFiles(updated);
      }
    } catch (err: any) {
      if (err?.message !== UPLOAD_CANCELLED) {
        setError(err?.message ?? "Upload gagal");
      }
    } finally {
      setUploadPercent(null);
      setUploadLabel("");
      setAddMode(null);
    }
  };

  // ── Tambah YouTube URL ───────────────────────────────────────────────────
  const handleAddVideoUrl = async () => {
    if (!videoUrl.trim()) {
      setError("URL video tidak boleh kosong");
      return;
    }
    setError(null);
    setUploadLabel("Menyimpan URL video…");

    try {
      const res = await fetch(`${apiUrl}/api/materials/${materialId}/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title_video: videoName.trim() || null,
          video_path: videoUrl.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Gagal menyimpan URL");

      const newFile: MaterialFile = {
        id: json.data.id,
        name: json.data.name,
        type: "video",
        url: json.data.url,
      };
      setFiles((prev) => [...prev, newFile]);
      setVideoUrl("");
      setVideoName("");
      setAddMode(null);
    } catch (err: any) {
      setError(err?.message ?? "Gagal menambah URL");
    } finally {
      setUploadLabel("");
    }
  };

  // ── Delete file ──────────────────────────────────────────────────────────
  const handleDelete = async (file: MaterialFile) => {
    setDeletingId(file.id);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/api/materials/${materialId}/files/${file.id}?type=${file.type}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Gagal menghapus");

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setConfirmDelete(null);
    } catch (err: any) {
      setError(err?.message ?? "Gagal menghapus file");
    } finally {
      setDeletingId(null);
    }
  };

  const isYoutube = (url: string) => /(?:youtube\.com|youtu\.be)/i.test(url);
  const pdfFiles = files.filter((f) => f.type === "pdf");
  const videoFiles = files.filter((f) => f.type === "video");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Kelola File Materi
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {materialTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0 ml-3"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Upload progress */}
          {(uploading || uploadLabel) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span className="truncate">{uploadLabel}</span>
                </div>
                {uploadPercent !== null && (
                  <button
                    onClick={() => cancelUpload()}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 shrink-0"
                  >
                    <X className="h-3 w-3 inline mr-1" />
                    Batalkan
                  </button>
                )}
              </div>
              {uploadPercent !== null && (
                <>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-500 text-right font-semibold">
                    {uploadPercent}%
                  </p>
                </>
              )}
            </div>
          )}

          {/* ── PDF Section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                File PDF ({pdfFiles.length})
              </h3>
              {!uploading && (
                <>
                  <input
                    type="file"
                    id="add-pdf"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "pdf")}
                  />
                  <label
                    htmlFor="add-pdf"
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer px-2 py-1 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah PDF
                  </label>
                </>
              )}
            </div>

            {pdfFiles.length === 0 ? (
              <div className="py-6 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <FileText className="h-7 w-7 mx-auto mb-1.5 text-gray-300 dark:text-gray-600" />
                <p className="text-xs text-muted-foreground">
                  Belum ada file PDF
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pdfFiles.map((f) => (
                  <FileRow
                    key={f.id}
                    file={f}
                    deleting={deletingId === f.id}
                    onDelete={() => setConfirmDelete(f)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Video Section ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Video className="h-4 w-4 text-red-600" />
                Video ({videoFiles.length})
              </h3>
              {!uploading &&
                addMode !== "video-file" &&
                addMode !== "video-url" && (
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="add-video"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, "video")}
                    />
                    <label
                      htmlFor="add-video"
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer px-2 py-1 hover:bg-red-50 rounded-lg transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </label>
                    <button
                      onClick={() => {
                        setAddMode("video-url");
                        setError(null);
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded-lg transition"
                    >
                      <Link className="h-3.5 w-3.5" />
                      YouTube URL
                    </button>
                  </div>
                )}
            </div>

            {/* YouTube URL form */}
            {addMode === "video-url" && (
              <div className="mb-3 p-4 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/10 space-y-2">
                <input
                  type="text"
                  value={videoName}
                  onChange={(e) => setVideoName(e.target.value)}
                  placeholder="Nama video (opsional)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddVideoUrl}
                    className="flex-1"
                  >
                    Tambahkan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAddMode(null);
                      setVideoUrl("");
                      setVideoName("");
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {videoFiles.length === 0 ? (
              <div className="py-6 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <Video className="h-7 w-7 mx-auto mb-1.5 text-gray-300 dark:text-gray-600" />
                <p className="text-xs text-muted-foreground">Belum ada video</p>
              </div>
            ) : (
              <div className="space-y-2">
                {videoFiles.map((f) => (
                  <FileRow
                    key={f.id}
                    file={f}
                    deleting={deletingId === f.id}
                    onDelete={() => setConfirmDelete(f)}
                    isYoutube={isYoutube(f.url)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-5">
          <Button onClick={handleClose} className="w-full">
            Selesai
          </Button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Hapus File</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {confirmDelete.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              File yang dihapus tidak bisa dikembalikan. Yakin ingin menghapus?
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deletingId === confirmDelete.id}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deletingId === confirmDelete.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menghapus…
                  </>
                ) : (
                  "Hapus"
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── File Row ────────────────────────────────────────────────────────────────
function FileRow({
  file,
  deleting,
  onDelete,
  isYoutube,
}: {
  file: MaterialFile;
  deleting: boolean;
  onDelete: () => void;
  isYoutube?: boolean;
}) {
  const Icon = file.type === "pdf" ? FileText : Video;
  const iconColor = file.type === "pdf" ? "text-blue-600" : "text-red-600";
  const bgColor =
    file.type === "pdf"
      ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800";

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-xl border ${bgColor}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-foreground">
            {file.name}
          </p>
          {isYoutube && (
            <p className="text-xs text-muted-foreground">YouTube URL</p>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50 shrink-0 ml-2"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-red-600" />
        )}
      </button>
    </div>
  );
}
