import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useClasses } from "../hooks/useClasses";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ProgressEntry {
  id: number;
  classId: string;
  className: string;
  currentLevel: number;
  updatedAt: string;
}

interface SubmissionItem {
  id: number;
  classId: string;
  className: string;
  title: string;
  answer: string | null;
  file: { name: string; objectKey: string; size: number } | null;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export function UserProgressPage() {
  const { userId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { classes } = useClasses();
  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<Record<number, { status: "approved" | "rejected"; feedback?: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approved" | "rejected" | null>(null);
  const [modalTargetId, setModalTargetId] = useState<number | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");

  useEffect(() => {
    if (!token) return;
    if (user?.role !== "superadmin") {
      navigate("/dashboard");
      return;
    }
    if (!userId) return;

    const controller = new AbortController();

    const fetchUserData = async () => {
      setLoading(true);
      setSystemError(null);

      try {
        const [userRes, progressRes, submissionsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/progress`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/pengumpulan/user/${userId}`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userRes.ok) {
          const json = await userRes.json();
          throw new Error(json.error || "Gagal mengambil pengguna");
        }

        if (!progressRes.ok) {
          const json = await progressRes.json();
          throw new Error(json.error || "Gagal mengambil progress user");
        }

        if (!submissionsRes.ok) {
          const json = await submissionsRes.json();
          throw new Error(json.error || "Gagal mengambil pengumpulan user");
        }

        const userJson = await userRes.json();
        const progressJson = await progressRes.json();
        const submissionsJson = await submissionsRes.json();

        setTargetUser(userJson.data ?? null);
        setProgress(progressJson.data ?? []);
        setSubmissions(
          (submissionsJson.data ?? []).map((item: any) => ({
            ...item,
            className:
              classes.find((c) => String(c.id) === String(item.classId))?.name ??
              item.className ??
              "Kelas tidak diketahui",
          })),
        );
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setSystemError(error.message ?? "Terjadi kesalahan saat memuat data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    return () => controller.abort();
  }, [token, userId, user, classes, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <Card className="p-6 text-center">Memuat data pengguna...</Card>
      </AppLayout>
    );
  }

  if (systemError) {
    return (
      <AppLayout>
        <Card className="p-6 text-center text-red-600">{systemError}</Card>
      </AppLayout>
    );
  }

  if (!targetUser) {
    return (
      <AppLayout>
        <Card className="p-6 text-center">Pengguna tidak ditemukan.</Card>
      </AppLayout>
    );
  }

  const totalSubmissions = submissions.length;

  const openModal = (id: number, action: "approved" | "rejected") => {
    setModalTargetId(id);
    setModalAction(action);
    setFeedbackInput("");
    setModalOpen(true);
  };

  const handleConfirm = () => {
    if (!modalTargetId || !modalAction) return;
    setOverrides((prev) => ({
      ...prev,
      [modalTargetId]: { status: modalAction, feedback: feedbackInput || undefined },
    }));
    setModalOpen(false);
    setModalTargetId(null);
    setModalAction(null);
    setFeedbackInput("");
  };

  return (
    <AppLayout>
      <Button
        variant="ghost"
        onClick={() => navigate("/users")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Laman Pengguna
      </Button>

      <Card className="p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] flex items-center justify-center text-white text-xl font-semibold">
            {targetUser.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {targetUser.username}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {targetUser.email}
            </p>

            <div className="flex gap-6 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Bergabung: {new Date(targetUser.createdAt).toLocaleDateString()}</span>
              <span>Total Pengumpulan: {totalSubmissions}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Progress Kelas</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {progress.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.className}
                  </h3>
                  <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    Level {item.currentLevel}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progress terakhir diupdate {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
          {progress.length === 0 && (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Belum ada data progress untuk pengguna ini.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Pengumpulan</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((submission) => {
            const override = overrides[submission.id];
            const status = override?.status ?? submission.status;
            const feedback = override?.feedback;
            const statusConfig =
              status === "approved"
                ? {
                    label: "approved",
                    className:
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    icon: <CheckCircle className="h-3 w-3" />,
                  }
                : status === "rejected"
                ? {
                    label: "rejected",
                    className:
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    icon: <XCircle className="h-3 w-3" />,
                  }
                : {
                    label: "pending",
                    className:
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-600",
                    icon: <Clock className="h-3 w-3" />,
                  };

            return (
              <Card
                key={submission.id}
                className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-24 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
                      {submission.title ? "Pengumpulan" : "Tugas"}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.className}`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                    {submission.title || "Pengumpulan Tugas"}
                  </h3>
                </div>

                <div className="flex flex-col flex-1 p-4 gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {submission.className}
                  </p>

                  {submission.answer && (
                    <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>{submission.answer}</span>
                    </div>
                  )}

                  {submission.file && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      File: {submission.file.name}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dikirim: {new Date(submission.createdAt).toLocaleString()}
                  </p>

                  {feedback && (
                    <p className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg text-gray-600 dark:text-gray-300">
                      <strong>Feedback:</strong> {feedback}
                    </p>
                  )}

                  {status === "pending" && (
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs"
                        onClick={() => openModal(submission.id, "approved")}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs"
                        onClick={() => openModal(submission.id, "rejected")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {submissions.length === 0 && (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Belum ada pengumpulan.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {modalAction === "approved" ? "Approve Pengumpulan" : "Reject Pengumpulan"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {modalAction === "approved"
                ? "Tambahkan feedback untuk siswa (opsional)."
                : "Berikan alasan penolakan untuk siswa."}
            </p>
            <textarea
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tulis feedback di sini..."
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button
                size="sm"
                className={modalAction === "approved"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"}
                onClick={handleConfirm}
              >
                {modalAction === "approved" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

