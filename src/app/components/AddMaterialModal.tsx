// src/app/components/AddMaterialModal.tsx
import { useState } from "react";
import { Button } from "./ui/button";
import {
  X,
  Video,
  FileText,
  Trash2,
  Loader2,
  Link,
  Upload,
} from "lucide-react";
import { useUpload } from "../hooks/useUpload";
import { useAuth } from "../context/AuthContext";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  level: number;
  onAdd: (material: any) => void;
}

interface FileUpload {
  id: string;
  name: string;
  type: "pdf" | "video";
  file?: File; // file lokal → upload ke MinIO
  url?: string; // YouTube URL → simpan langsung
}

type VideoInputMode = "file" | "url";

export function AddMaterialModal({
  isOpen,
  onClose,
  classId,
  level,
  onAdd,
}: AddMaterialModalProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingNumber, setMeetingNumber] = useState("");
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState("");

  // State untuk input video URL
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode>("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [showVideoForm, setShowVideoForm] = useState(false);

  const {
    uploadMateriFile,
    loading: uploadLoading,
    error: uploadError,
  } = useUpload();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const error = submitError ?? uploadError;

  if (!isOpen) return null;

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: "pdf" as const,
        file,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: "video" as const,
        file,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      setShowVideoForm(false);
    }
  };

  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      alert("URL video tidak boleh kosong");
      return;
    }
    setFiles((prev) => [
      ...prev,
      {
        id: `file-${Date.now()}-${Math.random()}`,
        name: videoName.trim() || "Video",
        type: "video",
        url: videoUrl.trim(),
      },
    ]);
    setVideoUrl("");
    setVideoName("");
    setShowVideoForm(false);
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    if (!title || !description || !meetingNumber) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      // ── 1. Pisahkan YouTube URL dan file lokal ──────────────
      const youtubeVideos = files
        .filter((f) => f.type === "video" && f.url)
        .map((f) => ({ title_video: f.name, video_path: f.url! }));

      // ── 2. Simpan materi dulu ke DB ────────────────────────
      setUploadProgress("Menyimpan materi...");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title_materi: title,
          deskripsi: description,
          id_kelas: Number(classId),
          id_tingkatan: level,
          pertemuan: parseInt(meetingNumber),
          videos: youtubeVideos,
          pdfs: [],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Gagal menyimpan materi");

      const idMateri: number = json.data.id_materi;

      // ── 3. Upload file lokal (PDF + video file) ke MinIO ───
      const localFiles = files.filter((f) => f.file);
      for (let i = 0; i < localFiles.length; i++) {
        const f = localFiles[i];
        setUploadProgress(
          `Mengupload ${i + 1}/${localFiles.length}: ${f.name}`,
        );
        await uploadMateriFile(f.file!, f.type, idMateri, f.name);
      }

      // ── 4. Update UI lokal ─────────────────────────────────
      onAdd({
        id: String(idMateri),
        title,
        description,
        classId,
        meetingNumber: parseInt(meetingNumber),
        level,
        isPublished: true,
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          url: f.url ?? "",
        })),
      });

      // Reset
      setTitle("");
      setDescription("");
      setMeetingNumber("");
      setFiles([]);
      setUploadProgress("");
      onClose();
    } catch (err: any) {
      setSubmitError(err?.message ?? "Terjadi kesalahan");
      setUploadProgress("");
    } finally {
      setLoading(false);
    }
  };

  const pdfFiles = files.filter((f) => f.type === "pdf");
  const videoFiles = files.filter((f) => f.type === "video");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tambah Materi - Level {level}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              {uploadProgress}
            </div>
          )}

          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengenalan Sistem Perpajakan Indonesia"
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
            />
          </div>

          {/* Pertemuan */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Pertemuan Ke- <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={meetingNumber}
              onChange={(e) => setMeetingNumber(e.target.value)}
              placeholder="1"
              min="1"
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi materi..."
              className="w-full h-32 px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 resize-none"
            />
          </div>

          {/* ── PDF Upload ── */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              <FileText className="inline h-4 w-4 mr-1 text-red-600" />
              File PDF
            </label>
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              multiple
              onChange={handlePdfSelect}
              className="hidden"
            />
            <label
              htmlFor="pdf-upload"
              className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-red-400 transition-colors cursor-pointer"
            >
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">Upload File PDF</span>
            </label>

            {pdfFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {pdfFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium">{f.name}</p>
                    </div>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Video Section ── */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              <Video className="inline h-4 w-4 mr-1 text-blue-600" />
              Video
            </label>

            {/* Tombol tambah video */}
            {!showVideoForm && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setVideoInputMode("file");
                    setShowVideoForm(true);
                  }}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium">Upload File Video</span>
                </button>
                <button
                  onClick={() => {
                    setVideoInputMode("url");
                    setShowVideoForm(true);
                  }}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <Link className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium">YouTube URL</span>
                </button>
              </div>
            )}

            {/* Form input video */}
            {showVideoForm && (
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/10 space-y-3">
                {/* Tab pilih mode */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setVideoInputMode("file")}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      videoInputMode === "file"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <Upload className="inline h-4 w-4 mr-1" />
                    Upload File
                  </button>
                  <button
                    onClick={() => setVideoInputMode("url")}
                    className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                      videoInputMode === "url"
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <Link className="inline h-4 w-4 mr-1" />
                    YouTube URL
                  </button>
                </div>

                {videoInputMode === "file" ? (
                  <div>
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="video-upload"
                      className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-white dark:bg-gray-900"
                    >
                      <Upload className="h-5 w-5 text-blue-400" />
                      <span className="text-sm">Pilih file video</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={videoName}
                      onChange={(e) => setVideoName(e.target.value)}
                      placeholder="Nama video (opsional)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
                    />
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddVideoUrl}
                        size="sm"
                        className="flex-1"
                      >
                        Tambahkan
                      </Button>
                      <Button
                        onClick={() => setShowVideoForm(false)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}

                {videoInputMode === "file" && (
                  <Button
                    onClick={() => setShowVideoForm(false)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Batal
                  </Button>
                )}
              </div>
            )}

            {/* Daftar video */}
            {videoFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {videoFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-gray-500">
                          {f.file ? "File lokal → MinIO" : "YouTube URL"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
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
            disabled={uploadLoading || loading}
            className="flex-1 text-base py-6"
          >
            {uploadLoading || loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Materi"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-base py-6"
          >
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
