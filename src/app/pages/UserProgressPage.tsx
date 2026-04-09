import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
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
  const handleApprove = (submissionId: string) => {
    alert(`Approved submission ${submissionId}`);
  };

  const handleReject = (submissionId: string) => {
    const feedback = prompt("Masukkan feedback:");
    if (feedback) {
      alert(`Rejected submission ${submissionId} dengan feedback: ${feedback}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
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
          <h2 className="text-2xl font-normal mb-4">
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
          <h2 className="text-2xl font-normal mb-4">
            Pengumpulan
          </h2>

          <div className="grid gap-4">
            {userSubmissions.map((submission) => {
              const cls = classes.find((c) => c.id === submission.classId);
              const quiz = submission.quizId
                ? quizzes.find((q) => q.id === submission.quizId)
                : null;

              return (
                <Card key={submission.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3>
                          {quiz?.title || "Pengumpulan Tugas"}
                        </h3>

                        <Badge>
                          {submission.status === "pending" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "approved" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "rejected" && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-500 mb-2">
                        {cls?.name} • Tingkatan {submission.level}
                      </div>

                      {submission.score !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          Skor: {submission.score}
                        </div>
                      )}

                      {submission.feedback && (
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <strong>Feedback:</strong> {submission.feedback}
                        </p>
                      )}
                    </div>

                    {/* ACTION BUTTON */}
                    {submission.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleApprove(submission.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleReject(submission.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {userSubmissions.length === 0 && (
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Belum ada pengumpulan.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}