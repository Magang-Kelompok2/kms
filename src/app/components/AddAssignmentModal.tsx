import { useState } from "react";
import { Button } from "./ui/button";
import { X, Upload, FileText, Trash2, Calendar } from "lucide-react";

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

  const handleSubmit = () => {
    if (!title || !description || !meetingNumber || !dueDate) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const newAssignment = {
      id: `assign-${Date.now()}`,
      title,
      description,
      dueDate,
      classId,
      meetingNumber: parseInt(meetingNumber),
      level,
      isPublished: true,
      attachments: files.map((f) => ({
        id: f.id,
        name: f.name,
        url: `https://example.com/${f.file?.name}`,
        type: "pdf" as const,
      })),
    };

    onAdd(newAssignment);
    
    // Reset form
    setTitle("");
    setDescription("");
    setMeetingNumber("");
    setDueDate("");
    setFiles([]);
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
              Deadline <span className="text-red-500">*</span>
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

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-semibold mb-3">
              File Tugas (PDF) - Opsional
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload file soal, template, atau referensi untuk mahasiswa
            </p>
            
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <Button onClick={handleSubmit} className="flex-1 text-base py-6">
            Simpan Tugas
          </Button>
          <Button variant="outline" onClick={onClose} className="text-base py-6">
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
