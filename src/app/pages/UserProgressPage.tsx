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
} from "../data/mockData";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Award,
} from "lucide-react";

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

  const handleApprove = (submissionId: string) => {
    alert(`Approved submission ${submissionId}. User can now advance to next level.`);
    // In real app, this would update the database
  };

  const handleReject = (submissionId: string) => {
    const feedback = prompt("Enter feedback for rejection:");
    if (feedback) {
      alert(`Rejected submission ${submissionId} with feedback: ${feedback}`);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
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

        {/* User Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {targetUser.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{targetUser.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {targetUser.email}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-500">
                  Bergabung: {targetUser.createdAt}
                </span>
                <span className="text-gray-500">
                  Total Pengumpulan: {userSubmissions.length}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Class Progress */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Progres Kelas</h2>
          <div className="grid gap-6">
            {progress.map((p) => {
              const cls = classes.find((c) => c.id === p.classId);
              if (!cls) return null;

              return (
                <Card key={p.classId} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{cls.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">
                          Tingkatan {p.currentLevel} / {cls.totalLevels}
                        </Badge>
                        <Badge variant="outline">
                          {p.completedMaterials.length} Materi Selesai
                        </Badge>
                        <Badge variant="outline">
                          {p.completedQuizzes.length} Kuis Selesai
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-2 text-base">
                        Materi diselesaikan:
                      </h4>
                      {p.completedMaterials.length > 0 ? (
                        <ul className="space-y-1">
                          {p.completedMaterials.map((matId) => {
                            const mat = materials.find((m) => m.id === matId);
                            return (
                              <li
                                key={matId}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {mat?.title}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Belum ada materi yang diselesaikan.
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2 text-base">
                        Kuis diselesaikan:
                      </h4>
                      {p.completedQuizzes.length > 0 ? (
                        <ul className="space-y-1">
                          {p.completedQuizzes.map((quizId) => {
                            const quiz = quizzes.find((q) => q.id === quizId);
                            return (
                              <li
                                key={quizId}
                                className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {quiz?.title}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Belum ada kuis yang diselesaikan.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Submissions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Pengumpulan</h2>
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
                        <h3 className="font-bold">
                          {quiz?.title || "Pengumpulan Tugas"}
                        </h3>
                        <Badge
                          className={
                            submission.status === "approved"
                              ? "bg:green-500 dark:bg-green-900/20"
                              : submission.status === "rejected"
                              ? "bg:red-500 dark:bg-red-900/20"
                              : "bg:gray-500 dark:bg-gray-900/20"
                          }
                        >
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

                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>{cls?.name}</span>
                        <span>Tingkatan {submission.level}</span>
                        <span>
                          {new Date(submission.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      {submission.score !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold">
                            Skor: {submission.score}
                          </span>
                        </div>
                      )}

                      {submission.feedback && (
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <strong>Feedback:</strong> {submission.feedback}
                        </p>
                      )}
                    </div>

                    {submission.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-700 cursor-pointer"
                          onClick={() => handleApprove(submission.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-700 cursor-pointer"
                          onClick={() => handleReject(submission.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
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
