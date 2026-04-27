import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
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
  X,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Assignment as AssignmentType } from "../types";
import { PdfViewerModal } from "../components/PdfViewerModal";

export function AssignmentViewPage() {
  const { assignmentId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [assignment, setAssignment] = useState<AssignmentType | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState(1);

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
        setProgressLoading(false);
      } finally {
        setAssignmentLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  useEffect(() => {
    if (!assignment) return;

    if (user?.role === "superadmin") {
      setProgressLoading(false);
      return;
    }

    if (!user?.id || !assignment.classId || !token) {
      setProgressLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress/${assignment.classId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!res.ok) {
          setUserLevel(1);
          return;
        }

        const json = await res.json();
        const level = json.data?.tingkatanSaatIni;
        setUserLevel(typeof level === "number" && level >= 1 ? level : 1);
      } catch {
        setUserLevel(1);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();
  }, [assignment, user?.id, user?.role, token]);

  useEffect(() => {
    if (!user?.id || !assignmentId || user.role === "superadmin") return;

    const checkSubmission = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pengumpulan/user/${user.id}/tugas/${assignmentId}`,
        );
        if (res.ok) {
          const json = await res.json();
          if (json.sudahMengumpulkan) {
            setIsSubmitted(true);
            const info = json.submission || json.data?.pengumpulan || null;
            if (info) setSubmissionData(info);
          }
        }
      } catch {
        // silent
      }
    };

    checkSubmission();
  }, [user?.id, assignmentId, user?.role]);

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
            meetingNumber:
              parseInt(editDraft.meetingNumber) || assignment.meetingNumber,
          }),
        },
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
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Gagal menghapus tugas");
      navigate(`/class/${assignment.classId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  if (assignmentLoading || progressLoading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Memuat tugas...</p>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">{error}</p>
        </Card>
      </AppLayout>
    );
  }

  if (!assignment) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">Tugas tidak ditemukan</p>
        </Card>
      </AppLayout>
    );
  }

  const assignmentLevel =
    typeof assignment.level === "number" && assignment.level >= 1
      ? assignment.level
      : 1;
  const hasAccess = user?.role === "superadmin" || assignmentLevel <= userLevel;

  if (!hasAccess) {
    return (
      <AppLayout>
        <Card className="p-12 text-center shadow-sm">
          <h1 className="mb-4 text-xl font-semibold tracking-tight">
            Akses Ditolak
          </h1>
          <p className="text-muted-foreground">
            Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses tugas
            ini. (Level tugas: {assignmentLevel}, Level kamu: {userLevel})
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Kembali ke Dashboard
          </Button>
        </Card>
      </AppLayout>
    );
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setSubmissionFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const deduped = selected.filter((f) => !existingNames.has(f.name));
        return [...prev, ...deduped];
      });
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSubmissionFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (submissionFiles.length === 0) return;
    setIsSubmitting(true);

    try {
      for (const file of submissionFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/upload/tugas-file`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) throw new Error(`Gagal upload: ${file.name}`);
        const id_file = uploadJson.data.id_file;

        const submitRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pengumpulan`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id_tugas: Number(assignmentId),
              id_user: Number(user?.id),
              answer: null,
              id_file,
            }),
          },
        );
        const submitJson = await submitRes.json();
        if (!submitJson.success) throw new Error("Gagal mengumpulkan tugas");
      }

      setIsSubmitted(true);
      setSubmissionData({ created_at: new Date().toISOString() });
      setSubmissionFiles([]);
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

  const assignmentFileUrl = assignment.file_path
    ? assignment.file_path.startsWith("http")
      ? assignment.file_path
      : `${import.meta.env.VITE_API_URL}/${assignment.file_path}`
    : null;

  return (
    <AppLayout className="py-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/class/${assignment.classId}`)}
        className="mb-4 text-base"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Kembali ke Kelas
      </Button>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Kolom Kiri: Detail Penugasan ── */}
          <div className="space-y-6">
            <Card className="p-6">
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="secondary">
                      Pertemuan {assignment.meetingNumber}
                    </Badge>
                    <Badge variant="outline">Level {assignment.level}</Badge>
                    {isSubmitted && (
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sudah Dikumpulkan
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 shrink-0">
                      <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold leading-tight mb-1">
                        {assignment.title}
                      </h1>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Deadline:{" "}
                          {dueDate.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          className={`ml-1 font-medium ${isOverdue ? "text-red-500" : "text-green-600"}`}
                        >
                          (
                          {isOverdue
                            ? "Terlambat"
                            : `${daysUntilDue} hari lagi`}
                          )
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Deskripsi
                    </h2>
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {assignment.description}
                    </p>
                  </div>

                  {user?.role === "superadmin" && (
                    <div className="flex gap-2 mt-5 pt-4 border-t flex-wrap">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/submissions/tugas/${assignmentId}`)
                        }
                      >
                        Lihat Pengumpulan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Hapus
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Judul Tugas
                    </label>
                    <input
                      type="text"
                      value={editDraft.title}
                      onChange={(e) =>
                        setEditDraft({ ...editDraft, title: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Deskripsi
                    </label>
                    <textarea
                      value={editDraft.description}
                      onChange={(e) =>
                        setEditDraft({
                          ...editDraft,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 h-28 resize-none"
                    />
                  </div>
                  <div className="grid gap-3 grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={editDraft.dueDate}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            dueDate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Pertemuan Ke-
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editDraft.meetingNumber}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            meetingNumber: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
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
            </Card>

            {/* File Penugasan dari path_tugas */}
            <Card className="p-6">
              <h2 className="text-base font-semibold mb-3">File Penugasan</h2>
              {assignmentFileUrl ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/20">
                      <File className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {assignment.file_path!.split("/").pop()?.split("?")[0] || "File Tugas"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dokumen Penugasan
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const fileName = assignment.file_path!.split("/").pop()?.split("?")[0] || "File Tugas";
                        setPreviewFileName(fileName);
                        setPreviewUrl(assignmentFileUrl);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      Lihat
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <File className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada file penugasan yang diunggah
                  </p>
                </div>
              )}
            </Card>

            {/* Attachments section intentionally hidden — same file as path_tugas */}
          </div>

          {/* ── Kolom Kanan: Pengumpulan / Admin Info ── */}
          <div className="space-y-6">
            {user?.role === "superadmin" ? (
              <Card className="p-6">
                <h2 className="text-base font-semibold mb-3">
                  Panel Superadmin
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Anda masuk sebagai superadmin. Gunakan tombol di kolom kiri
                  untuk mengelola tugas ini.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/submissions/tugas/${assignmentId}`)}
                >
                  Lihat Semua Pengumpulan
                </Button>
              </Card>
            ) : isSubmitted ? (
              <Card className="p-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                    Tugas Berhasil Dikumpulkan
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pengumpulan tugas Anda sedang dalam proses review oleh
                    instruktur. Anda tidak dapat mengubah atau membatalkan
                    pengumpulan ini.
                  </p>
                  {submissionData?.created_at && (
                    <p className="text-xs text-muted-foreground mb-6">
                      Dikumpulkan pada:{" "}
                      {new Date(submissionData.created_at).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/class/${assignment.classId}`)}
                  >
                    Kembali ke Kelas
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <h2 className="text-base font-semibold mb-1">
                  Pengumpulan Tugas
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload satu atau lebih file sebagai jawaban tugas Anda.
                  Setelah dikumpulkan, tidak dapat dibatalkan.
                </p>

                {/* Drop zone */}
                <div className="mb-4">
                  <input
                    type="file"
                    id="submission-files"
                    multiple
                    onChange={handleFilesChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
                  />
                  <label
                    htmlFor="submission-files"
                    className="flex flex-col items-center justify-center gap-2 w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Klik untuk memilih file
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, JPG, PNG, ZIP (Maks 10MB per file)
                    </span>
                  </label>
                </div>

                {/* File list */}
                {submissionFiles.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {submissionFiles.length} file dipilih
                    </p>
                    {submissionFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={submissionFiles.length === 0 || isSubmitting}
                  className="w-full"
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
                      <Upload className="h-4 w-4 mr-2" />
                      Kumpulkan Tugas
                    </>
                  )}
                </Button>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-0.5 list-disc list-inside">
                    <li>Periksa kembali file sebelum mengumpulkan</li>
                    <li>Pengumpulan tidak dapat dibatalkan atau diedit</li>
                    <li>Pastikan semua file lengkap sebelum submit</li>
                  </ul>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      {/* ── PDF Preview Modal ── */}
      {previewUrl && (
        <PdfViewerModal
          url={previewUrl}
          fileName={previewFileName}
          onClose={() => {
            setPreviewUrl(null);
            setPreviewFileName("");
          }}
        />
      )}
    </AppLayout>
  );
}


