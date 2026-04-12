import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  mockUsers,
  userProgress,
  classes,
  submissions,
  materials,
  quizzes,
  assignments,
} from "../data/mockData";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
} from "lucide-react";
import { useState } from "react";

// ================= DONUT =================
function DonutChart({
  materi,
  kuis,
  tugas,
  total,
}: {
  materi: number;
  kuis: number;
  tugas: number;
  total: number;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const size = 100;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { value: materi, color: "#0C81E4", key: "materi" },
    { value: kuis, color: "#11C4D4", key: "kuis" },
    { value: tugas, color: "#4FE7AF", key: "tugas" },
  ].filter((s) => s.value > 0);

  let offset = circumference * 0.25;
  const totalDone = materi + kuis + tugas;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          className="dark:stroke-gray-700"
        />

        {segments.map((seg, i) => {
          const fraction = seg.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;

          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              onMouseEnter={() => setHover(seg.key)}
              onMouseLeave={() => setHover(null)}
              style={{
                opacity: hover === null || hover === seg.key ? 1 : 0.3,
                transition: "0.3s",
                cursor: "pointer",
              }}
            />
          );

          offset -= dash;
          return el;
        })}

        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-900 dark:fill-white text-sm font-semibold rotate-90 origin-center"
        >
          {Math.round(total > 0 ? (totalDone / total) * 100 : 0)}%
        </text>
      </svg>

      {hover && (
        <div className="absolute -top-2 translate-y-[-100%] px-3 py-2 text-xs bg-gray-900 text-white dark:bg-white dark:text-black rounded shadow-lg whitespace-nowrap">
          {hover === "materi" && (
            <div>Materi: {materi} telah diselesaikan</div>
          )}
          {hover === "kuis" && (
            <div>Kuis: {kuis} telah diselesaikan</div>
          )}
          {hover === "tugas" && (
            <div>Tugas: {tugas} telah diselesaikan</div>
          )}
        </div>
      )}
    </div>
  );
}

// ================= PAGE =================
export function UserProgressPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState<Record<string, { status: string; feedback?: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"approved" | "rejected" | null>(null);
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  const targetUser = mockUsers.find((u) => u.id === userId);
  const progress = userProgress.filter((p) => p.userId === userId);
  const userSubmissions = submissions.filter((s) => s.userId === userId);

  if (!targetUser) {
    return <div>Pengguna tidak ditemukan.</div>;
  }

  // 🔥 APPROVE & REJECT
  const openModal = (id: string, action: "approved" | "rejected") => {
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

        {/* USER HEADER */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] flex items-center justify-center text-white text-xl font-semibold">
              {targetUser.name.charAt(0)}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {targetUser.name}
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {targetUser.email}
              </p>

              <div className="flex gap-6 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Bergabung: {targetUser.createdAt}</span>
                <span>Total Pengumpulan: {userSubmissions.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* PROGRESS */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Progres Kelas
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {progress.map((p) => {
              const cls = classes.find((c) => c.id === p.classId);
              if (!cls) return null;

              const totalMaterials = materials.filter(
                (m) => m.classId === p.classId && m.isPublished
              ).length;

              const totalQuizzes = quizzes.filter(
                (q) => q.classId === p.classId && q.isPublished
              ).length;

              const totalAssignments = assignments.filter(
                (a) => a.classId === p.classId && a.isPublished
              ).length;

              const doneMaterials = p.completedMaterials.length;
              const doneQuizzes = p.completedQuizzes.length;

              const doneAssignments = userSubmissions.filter(
                (s) =>
                  s.classId === p.classId &&
                  s.assignmentId &&
                  s.status === "approved"
              ).length;

              const totalItems =
                totalMaterials + totalQuizzes + totalAssignments;

              return (
                <Card key={p.classId} className="p-6 text-center">
                  <DonutChart
                    materi={doneMaterials}
                    kuis={doneQuizzes}
                    tugas={doneAssignments}
                    total={totalItems}
                  />

                  <h3 className="mt-4">{cls.name}</h3>

                  <Badge className="mt-2">
                    Tingkatan {p.currentLevel} / {cls.totalLevels}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>

        {/* PENGUMPULAN */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pengumpulan</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSubmissions.map((submission) => {
              const override = overrides[submission.id];
              const status = (override?.status ?? submission.status) as "approved" | "rejected" | "pending";
              const feedback = override?.feedback ?? submission.feedback;

              const cls = classes.find((c) => c.id === submission.classId);
              const quiz = submission.quizId
                ? quizzes.find((q) => q.id === submission.quizId)
                : null;

              const statusConfig =
                status === "approved"
                  ? { label: "approved", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="h-3 w-3" /> }
                  : status === "rejected"
                  ? { label: "rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="h-3 w-3" /> }
                  : { label: "pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-600", icon: <Clock className="h-3 w-3" /> };

              return (
                <Card
                  key={submission.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="h-24 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
                        {quiz ? "Kuis" : "Tugas"}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.className}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                      {quiz?.title || "Pengumpulan Tugas"}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cls?.name} • Tingkatan {submission.level}
                    </p>

                    {submission.score !== undefined && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                        <Award className="h-4 w-4 text-yellow-500" />
                        Skor: <span className="font-semibold">{submission.score}</span>
                      </div>
                    )}

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

            {userSubmissions.length === 0 && (
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

        {/* MODAL FEEDBACK */}
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