import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Calendar,
  CheckCircle,
  FileText,
  File,
  Edit3,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Assignment as AssignmentType } from "../types";

export function AssignmentViewPage() {
  const { assignmentId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignment, setAssignment] = useState<AssignmentType | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userLevel = 1;

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    dueDate: "",
    meetingNumber: "",
  });


  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;
      setAssignmentLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tugas/${assignmentId}`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data tugas");
        const json = await res.json();
        if (!json.success || !json.data)
          throw new Error("Tugas tidak ditemukan");
        setAssignment(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setAssignmentLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  // Initialize edit draft
  useEffect(() => {
    if (assignment && isEditing) {
      setEditDraft({
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.split("T")[0],
        meetingNumber: assignment.meetingNumber.toString(),
      });
    }
  }, [assignment, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!assignment) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tugas/${assignment.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editDraft.title,
            description: editDraft.description,
            dueDate: editDraft.dueDate,
            meetingNumber: parseInt(editDraft.meetingNumber) || assignment.meetingNumber,
          }),
        }
      );
      if (!res.ok) throw new Error("Gagal mengupdate tugas");
      const json = await res.json();
      setAssignment(json.data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;
    if (!confirm("Hapus tugas ini? Aksi ini tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tugas/${assignment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Gagal menghapus tugas");
      navigate(`/class/${assignment.classId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  if (assignmentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <p className="text-gray-500">Memuat tugas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">Tugas tidak ditemukan</p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Cek akses ──────────────────────────────────────────────────
  const assignmentLevel =
    typeof assignment.level === "number" && assignment.level >= 1
      ? assignment.level
      : 1;

  const hasAccess = user?.role === "superadmin" || assignmentLevel <= userLevel;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses
              tugas ini. (Level tugas: {assignmentLevel}, Level kamu:{" "}
              {userLevel})
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Kembali ke Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Submit handler ─────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && !submissionFile) return;
    setIsSubmitting(true);

    try {
      let id_file: number | null = null;

      // Upload file jika ada
      if (submissionFile) {
        const formData = new FormData();
        formData.append("file", submissionFile);

        const uploadRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/upload/tugas-file`,
          { method: "POST", body: formData },
        );
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) throw new Error("Gagal upload file");
        id_file = uploadJson.data.id_file;
      }

      // Submit pengumpulan
      const submitRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pengumpulan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_tugas: Number(assignmentId),
            id_user: Number(user?.id),
            answer: submissionText.trim() || null,
            id_file,
          }),
        },
      );
      const submitJson = await submitRes.json();
      if (!submitJson.success) throw new Error("Gagal mengumpulkan tugas");

      setIsSubmitted(true);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengumpulkan",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const dueDate = new Date(assignment.dueDate);
  const today = new Date();
  const isOverdue = today > dueDate;
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${assignment.classId}`)}
          className="mb-4 text-base"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali ke Kelas
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="p-6">
            {!isEditing ? (
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-sm">
                      Pertemuan {assignment.meetingNumber}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      Level {assignment.level}
                    </Badge>
                    {isSubmitted && (
                      <Badge variant="default" className="text-sm bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sudah Dikumpulkan
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/20">
                      <FileText className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold mb-1">
                        {assignment.title}
                      </h1>
                      <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Deadline:{" "}
                            {new Date(assignment.dueDate).toLocaleDateString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                        <div>
                          {isOverdue
                            ? "Status: Terlambat"
                            : `${daysUntilDue} hari tersisa`}
                        </div>
                      </div>
                    </div>
                  </div>
                  {user?.role === "superadmin" && (
                    <div className="flex gap-3 mt-4">
                      <Button size="sm" variant="outline" onClick={handleEdit}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Judul Tugas
                  </label>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, description: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 h-28 resize-none"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={editDraft.dueDate}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, dueDate: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pertemuan Ke-
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editDraft.meetingNumber}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, meetingNumber: e.target.value })
                      }
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Simpan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h2 className="text-lg font-bold mb-2">Deskripsi Tugas</h2>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                {assignment.description}
              </p>
            </div>
          </Card>

          {/* Attachments dari superadmin */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">
                📎 File Tugas dari Superadmin
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Silakan baca dan download file berikut sebelum mengerjakan
                tugas:
              </p>
              <div className="space-y-3">
                {assignment.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/20">
                        <File className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{file.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          PDF Document
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        Lihat
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = file.url;
                          link.download = file.name;
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Form Pengumpulan */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Pengumpulan Tugas</h2>

            {isSubmitted ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  Tugas Berhasil Dikumpulkan!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Tugas Anda sedang direview oleh superadmin.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmissionText("");
                      setSubmissionFile(null);
                    }}
                  >
                    Kirim Ulang
                  </Button>
                  <Button
                    onClick={() => navigate(`/class/${assignment.classId}`)}
                  >
                    Kembali ke Kelas
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Jawaban (Teks)
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Ketik jawaban Anda di sini..."
                    className="w-full h-48 px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 resize-none"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {submissionText.length} karakter
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Upload File (Opsional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      {submissionFile ? (
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {submissionFile.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {(submissionFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            Klik untuk upload file
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      (!submissionText.trim() && !submissionFile) ||
                      isSubmitting
                    }
                    className="flex-1 text-base py-6"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Mengumpulkan...
                      </span>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        Kumpulkan Tugas
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/class/${assignment.classId}`)}
                    className="text-base py-6"
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 mb-2">
              📋 Petunjuk Pengumpulan
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Pastikan jawaban Anda jelas dan mudah dipahami</li>
              <li>Periksa kembali jawaban sebelum dikumpulkan</li>
              <li>File yang diupload maksimal 10MB</li>
              <li>Tugas yang dikumpulkan tidak dapat diedit setelah submit</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
