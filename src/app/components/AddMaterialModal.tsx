import { useState } from "react";
import { Button } from "./ui/button";
import { X, Video, FileText, Trash2 } from "lucide-react";
import { useAddMateri } from "../hooks/useAddMateri";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  level: number; // ini = id_tingkatan
  onAdd: (material: any) => void;
}

interface FileUpload {
  id: string;
  name: string;
  type: "pdf" | "video";
  file?: File;
  url?: string;
  duration?: string;
}

export function AddMaterialModal({
  isOpen,
  onClose,
  classId,
  level,
  onAdd,
}: AddMaterialModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingNumber, setMeetingNumber] = useState("");
  const [files, setFiles] = useState<FileUpload[]>([]);

  const { addMateri, loading, error } = useAddMateri();

  if (!isOpen) return null;

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "pdf" | "video",
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type,
        file,
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleVideoUrl = () => {
    const url = prompt("Masukkan URL video YouTube:");
    if (url) {
      const duration = prompt("Masukkan durasi video (contoh: 15:30):");
      const name = prompt("Nama video:") || "Video";
      setFiles([
        ...files,
        {
          id: `file-${Date.now()}-${Math.random()}`,
          name,
          type: "video",
          url,
          duration: duration || undefined,
        },
      ]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!title || !description || !meetingNumber) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const videos = files
      .filter((f) => f.type === "video")
      .map((f) => ({
        title_video: f.name,
        video_path: f.url ?? "",
      }));

    const pdfs = files
      .filter((f) => f.type === "pdf")
      .map((f) => ({
        title_pdf: f.name,
        // Kalau belum ada upload ke storage, pakai nama file sementara
        pdf_path: f.url ?? f.file?.name ?? "",
      }));

    await addMateri({
      title_materi: title,
      deskripsi: description,
      id_kelas: Number(classId),
      id_tingkatan: level,
      pertemuan: parseInt(meetingNumber),
      videos,
      pdfs,
    });

    // Kalau sukses, panggil onAdd agar UI ikut update
    onAdd({
      id: `mat-${Date.now()}`,
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
        duration: f.duration,
      })),
    });

    // Reset
    setTitle("");
    setDescription("");
    setMeetingNumber("");
    setFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-normal">Tambah Materi</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
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

          {/* Meeting Number */}
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

          {/* Description */}
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

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              File Materi (PDF & Video)
            </label>

            <div className="space-y-3 mb-4">
              <div>
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf"
                  multiple
                  onChange={(e) => handleFileSelect(e, "pdf")}
                  className="hidden"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                >
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium">Upload File PDF</span>
                </label>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleVideoUrl}
                className="w-full"
              >
                <Video className="h-5 w-5 mr-2" />
                Tambah Video (YouTube URL)
              </Button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  {files.length} file ditambahkan:
                </p>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {file.type === "pdf" ? (
                        <FileText className="h-5 w-5 text-red-600" />
                      ) : (
                        <Video className="h-5 w-5 text-blue-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        {file.duration && (
                          <p className="text-xs text-gray-500">
                            {file.duration}
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

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 text-base py-6 bg-secondary hover:bg-primary text-white font-semibold"
          >
            {loading ? "Menyimpan..." : "Simpan Materi"}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-base py-6"
          >
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
