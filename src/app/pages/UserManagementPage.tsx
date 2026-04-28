import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Users, Plus, TrendingUp, Loader, ChevronDown } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useClasses } from "../hooks/useClasses";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
  const { users, loading, error } = useUsers(100);
  const { classes } = useClasses();
  const [profiles, setProfiles] = useState<Record<number, UserProfileData>>({});
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  useEffect(() => {
    if (!token || users.length === 0) return;

    let canceled = false;

    const fetchProfiles = async () => {
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

      if (!canceled) setProfiles(data);
    };

    fetchProfiles();
    return () => {
      canceled = true;
    };
  }, [token, users]);

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600 dark:text-gray-400">
              Memuat data pengguna...
            </p>
          </div>
        </div>
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

  const filteredUsers = selectedClass
    ? users.filter((u) => {
        const profile = profiles[u.id];
        if (!profile) return false;
        return profile.enrollments.some(
          (e) => String(e.classId) === selectedClass,
        );
      })
    : users;

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

      {/* Class Filter */}
      <div className="mb-6 relative">
        <div className="inline-block relative">
          <button
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm"
          >
            Filter Kelas:{" "}
            {selectedClass
              ? (classes.find((c) => String(c.id) === selectedClass)?.name ??
                "Semua")
              : "Semua"}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showClassDropdown && (
            <div className="absolute top-full mt-1 left-0 z-20 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setShowClassDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 first:rounded-t-lg"
              >
                Semua Kelas
              </button>
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(String(cls.id));
                    setShowClassDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                >
                  {cls.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Cards */}
      {filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-600 dark:text-slate-400">
            {selectedClass
              ? "Tidak ada pengguna di kelas ini."
              : "Belum ada pengguna. Tambahkan pengguna baru untuk mulai."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredUsers.map((u) => {
            const profile = profiles[u.id] ?? {
              enrollments: [],
              progress: [],
            };
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
            const percent =
              possible > 0 ? Math.round((completed / possible) * 100) : 0;
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
                    ? [
                        {
                          name: "Completed",
                          value: completed,
                          color: COLORS[0],
                        },
                      ]
                    : [
                        {
                          name: "Completed",
                          value: completed,
                          color: COLORS[0],
                        },
                        {
                          name: "Remaining",
                          value: remaining,
                          color: COLORS[1],
                        },
                      ];

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
                        {profile.enrollments.length > 0 ? (
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
                      {possible > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          <p>
                            Materi {materialCompleted}/{materialTotal} selesai
                          </p>
                          <p>
                            Tugas {assignmentCompleted}/{assignmentTotal} selesai
                          </p>
                          <p>
                            Kuis {quizCompleted}/{quizTotal} selesai
                          </p>
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
                    {/* Percent label in center */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {percent}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}