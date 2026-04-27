import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Users, Plus, TrendingUp, Loader } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { UserManagementSkeleton } from "../components/PageSkeletons";

const COLORS = ["#22C55E", "#E5E7EB"];

type EnrollmentSummary = {
  classId: string;
  className: string;
  level: number;
  namaTingkatan: string;
};

type ProgressSummary = {
  progressPercent: number;
  completedMaterialCount: number;
  totalMaterialCount: number;
  completedAssignmentCount: number;
  totalAssignmentCount: number;
  completedQuizCount: number;
  totalQuizCount: number;
};

type UserProfileData = {
  enrollments: EnrollmentSummary[];
  progress: ProgressSummary[];
};

export function UserManagementPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const offset = (currentPage - 1) * pageSize;
  const { users, loading, error, total } = useUsers(pageSize, offset);
  const [profiles, setProfiles] = useState<Record<number, UserProfileData>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);

  useEffect(() => {
    if (!token || users.length === 0) {
      setProfiles({});
      setProfilesLoading(false);
      return;
    }

    let canceled = false;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      const data: Record<number, UserProfileData> = {};

      await Promise.all(
        users.map(async (u) => {
          try {
            const [enrollRes, progressRes] = await Promise.all([
              fetch(
                `${import.meta.env.VITE_API_URL}/api/users/${u.id}/enrollments`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              ),
              fetch(
                `${import.meta.env.VITE_API_URL}/api/users/${u.id}/progress`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              ),
            ]);

            const enrollments = enrollRes.ok
              ? (await enrollRes.json()).data
              : [];
            const progress = progressRes.ok
              ? (await progressRes.json()).data
              : [];

            data[u.id] = { enrollments, progress };
          } catch (err) {
            console.error(`Error fetching profile for user ${u.id}:`, err);
            data[u.id] = { enrollments: [], progress: [] };
          }
        }),
      );

      if (!canceled) {
        setProfiles(data);
        setProfilesLoading(false);
      }
    };

    fetchProfiles();
    return () => {
      canceled = true;
    };
  }, [token, users]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const usersWithMetrics = useMemo(
    () =>
      users.map((u) => {
        const profile = profiles[u.id] ?? { enrollments: [], progress: [] };
        const completed = profile.progress.reduce(
          (sum, item) =>
            sum +
            item.completedMaterialCount +
            item.completedAssignmentCount +
            item.completedQuizCount,
          0,
        );
        const possible = profile.progress.reduce(
          (sum, item) =>
            sum +
            item.totalMaterialCount +
            item.totalAssignmentCount +
            item.totalQuizCount,
          0,
        );
        const remaining = Math.max(0, possible - completed);
        const percent = possible > 0 ? Math.round((completed / possible) * 100) : 0;
        const materialCompleted = profile.progress.reduce(
          (sum, item) => sum + item.completedMaterialCount,
          0,
        );
        const materialTotal = profile.progress.reduce(
          (sum, item) => sum + item.totalMaterialCount,
          0,
        );
        const assignmentCompleted = profile.progress.reduce(
          (sum, item) => sum + item.completedAssignmentCount,
          0,
        );
        const assignmentTotal = profile.progress.reduce(
          (sum, item) => sum + item.totalAssignmentCount,
          0,
        );
        const quizCompleted = profile.progress.reduce(
          (sum, item) => sum + item.completedQuizCount,
          0,
        );
        const quizTotal = profile.progress.reduce(
          (sum, item) => sum + item.totalQuizCount,
          0,
        );
        const chartData =
          possible <= 0
            ? [{ name: "Empty", value: 1, color: "#E5E7EB" }]
            : completed <= 0
              ? [{ name: "Remaining", value: possible, color: "#E5E7EB" }]
              : remaining <= 0
                ? [{ name: "Completed", value: completed, color: COLORS[0] }]
                : [
                    { name: "Completed", value: completed, color: COLORS[0] },
                    { name: "Remaining", value: remaining, color: COLORS[1] },
                  ];

        return {
          user: u,
          profile,
          possible,
          percent,
          materialCompleted,
          materialTotal,
          assignmentCompleted,
          assignmentTotal,
          quizCompleted,
          quizTotal,
          chartData,
        };
      }),
    [profiles, users],
  );

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  if (loading && users.length === 0) {
    return (
      <AppLayout>
        <UserManagementSkeleton />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="p-8 text-center bg-red-50 dark:bg-red-950">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-semibold tracking-tight">
            Kelola Pengguna
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ringkas, visual, dan fokus pada kelas yang diikuti serta progress.
          </p>
        </div>
        <Button onClick={() => navigate("/users/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Pengguna Baru
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span>
          Menampilkan {users.length} user pada halaman {currentPage} dari {totalPages}
        </span>
        {profilesLoading && (
          <span className="inline-flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Memproses ringkasan user...
          </span>
        )}
      </div>

      {/* Content */}
      {users.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-600 dark:text-slate-400">
            Belum ada pengguna. Tambahkan pengguna baru untuk mulai.
          </p>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {usersWithMetrics.map(({ user: u, profile, possible, percent, materialCompleted, materialTotal, assignmentCompleted, assignmentTotal, quizCompleted, quizTotal, chartData }) => {
            return (
              <Card
                key={u.id}
                className="p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4"
              >
                {/* Top row: avatar + info + join date + action */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-900 text-white text-lg font-semibold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {u.username}
                        </h3>
                        <Badge variant="outline">
                          {u.role === "superadmin" ? "Admin" : "User"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400">Bergabung</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {new Date(u.created_at).toLocaleDateString("id-ID")}
                    </span>
                    {u.role === "user" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => navigate(`/users/${u.id}/progress`)}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Lihat Progres
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bottom row: enrollments + pie chart with percent */}
                <div className="flex items-center gap-4">
                  {/* Left: enrollments + progress text */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Kelas yang Diikuti
                      </p>
                      <div className="mt-1.5 flex flex-col gap-2">
                        {!profiles[u.id] && profilesLoading ? (
                          <div className="space-y-2">
                            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                            <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                          </div>
                        ) : profile.enrollments.length > 0 ? (
                          (() => {
                            const CLASS_GRADIENTS = [
                              "from-blue-600 to-cyan-400",
                              "from-cyan-500 to-teal-400",
                              "from-indigo-600 to-purple-500",
                              "from-blue-700 to-indigo-500",
                            ];
                            const grouped = profile.enrollments.reduce(
                              (acc, e) => {
                                if (!acc[e.classId])
                                  acc[e.classId] = {
                                    className: e.className,
                                    tingkatans: [],
                                  };
                                acc[e.classId].tingkatans.push(
                                  e.namaTingkatan || `Lv ${e.level}`,
                                );
                                return acc;
                              },
                              {} as Record<
                                string,
                                { className: string; tingkatans: string[] }
                              >,
                            );
                            return Object.entries(grouped).map(
                              ([classId, { className, tingkatans }], idx) => (
                                <div
                                  key={classId}
                                  className={`rounded-xl bg-linear-to-r ${CLASS_GRADIENTS[idx % CLASS_GRADIENTS.length]} px-3 py-2 text-white`}
                                >
                                  <p className="text-xs font-bold mb-1.5 tracking-wide">
                                    {className}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {tingkatans.map((t) => (
                                      <span
                                        key={t}
                                        className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ),
                            );
                          })()
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">
                            Belum mengikuti kelas
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Progress
                      </p>
                      {!profiles[u.id] && profilesLoading ? (
                        <div className="mt-2 h-5 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      ) : possible > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          <p>Materi {materialCompleted}/{materialTotal} selesai</p>
                          <p>Tugas {assignmentCompleted}/{assignmentTotal} selesai</p>
                          <p>Kuis {quizCompleted}/{quizTotal} selesai</p>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          Belum ada progress
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Pie chart with percent overlay */}
                  <div className="relative shrink-0 h-24 w-24">
                    {!profiles[u.id] && profilesLoading ? (
                      <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              dataKey="value"
                              innerRadius={28}
                              outerRadius={40}
                              paddingAngle={chartData.length > 1 ? 2 : 0}
                              startAngle={90}
                              endAngle={-270}
                            >
                              {chartData.map((item) => (
                                <Cell key={item.name} fill={item.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {percent}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Total {total} user
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage >= totalPages || loading}
          >
            Selanjutnya
          </Button>
        </div>
        </>
      )}
    </AppLayout>
  );
}
