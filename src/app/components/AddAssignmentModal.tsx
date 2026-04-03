import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Upload, FileText, Trash2, Calendar } from "lucide-react";
import { useAddTugas } from "../hooks/useAddTugas";

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
}

export function AddAssignmentModal({
  isOpen,
  onClose,
  classId,
  level,
  onAdd,
}: AddAssignmentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingNumber, setMeetingNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [selectedMateriId, setSelectedMateriId] = useState<number | "">("");
  const [materiOptions, setMateriOptions] = useState<MateriOption[]>([]);
  const [materiLoading, setMateriLoading] = useState(false);

  const { addTugas, loading, error } = useAddTugas();

  // Fetch daftar materi berdasarkan classId & level (id_tingkatan)
  useEffect(() => {
    if (!isOpen || !classId) return;
    const fetchMateri = async () => {
      setMateriLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials?classId=${classId}`,
        );
        const json = await res.json();
        if (json.success) {
          const filtered = (json.data as any[])
            .filter((m) => m.id_tingkatan === level)
            .map((m) => ({
              id_materi: m.id_materi,
              title_materi: m.title_materi,
            }));
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        file,
      }));
      setFiles([...files, ...newFiles]);
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
    if (!selectedMateriId) {
      alert("Mohon pilih materi yang terkait");
      return;
    }

    await addTugas({
      nama_tugas: title,
      deskripsi: description,
      type: "Tugas",
      id_materi: Number(selectedMateriId),
      id_kelas: Number(classId),
      pertemuan: parseInt(meetingNumber),
      deadline: dueDate ? new Date(dueDate).toISOString() : undefined,
    });

    onAdd({
      id: `assign-${Date.now()}`,
      title,
      description,
      dueDate,
      classId,
      meetingNumber: parseInt(meetingNumber),
      level,
      isPublished: true,
      attachments: [],
    });

    setTitle("");
    setDescription("");
    setMeetingNumber("");
    setDueDate("");
    setFiles([]);
    setSelectedMateriId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tambah Tugas - Level {level}</h2>
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

          {/* Pilih Materi */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Materi Terkait <span className="text-red-500">*</span>
            </label>
            {materiLoading ? (
              <p className="text-sm text-gray-500">Memuat daftar materi...</p>
            ) : materiOptions.length === 0 ? (
              <p className="text-sm text-red-500">
                Belum ada materi di tingkatan ini. Tambahkan materi terlebih
                dahulu.
              </p>
            ) : (
              <select
                value={selectedMateriId}
                onChange={(e) => setSelectedMateriId(Number(e.target.value))}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
              >
                <option value="">-- Pilih Materi --</option>
                {materiOptions.map((m) => (
                  <option key={m.id_materi} value={m.id_materi}>
                    {m.title_materi}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Judul Tugas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Tugas: Analisis Jenis Pajak"
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
              placeholder="Deskripsi tugas dan instruksi pengerjaan..."
              className="w-full h-32 px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 resize-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Deadline{" "}
              <span className="text-gray-400 text-xs font-normal">
                (opsional)
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              File Tugas (PDF) - Opsional
            </label>
            <div className="mb-4">
              <input
                type="file"
                id="assignment-pdf-upload"
                accept=".pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="assignment-pdf-upload"
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Upload File PDF</span>
              </label>
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-red-600" />
                      <p className="text-sm font-medium">{file.name}</p>
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
            className="flex-1 text-base py-6"
          >
            {loading ? "Menyimpan..." : "Simpan Tugas"}
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
