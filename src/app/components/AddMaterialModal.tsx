import { useState } from "react";
import { Button } from "./ui/button";
import { X, Upload, Video, FileText, Trash2 } from "lucide-react";

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

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "video") => {
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
      setFiles([
        ...files,
        {
          id: `file-${Date.now()}-${Math.random()}`,
          name: prompt("Nama video:") || "Video",
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

  const handleSubmit = () => {
    if (!title || !description || !meetingNumber) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const newMaterial = {
      id: `mat-${Date.now()}`,
      title,
      description,
      content: description,
      classId,
      meetingNumber: parseInt(meetingNumber),
      level,
      createdAt: new Date().toISOString().split("T")[0],
      isPublished: true,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        url: f.url || `https://example.com/${f.file?.name}`,
        duration: f.duration,
      })),
    };

    onAdd(newMaterial);
    
    // Reset form
    setTitle("");
    setDescription("");
    setMeetingNumber("");
    setFiles([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
              {/* PDF Upload */}
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

              {/* Video URL */}
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

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">{files.length} file ditambahkan:</p>
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
                          <p className="text-xs text-gray-500">{file.duration}</p>
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
          <Button onClick={handleSubmit} className="flex-1 text-base py-6">
            Simpan Materi
          </Button>
          <Button variant="outline" onClick={onClose} className="text-base py-6">
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
