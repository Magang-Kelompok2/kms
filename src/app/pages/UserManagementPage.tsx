import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Users, Plus, TrendingUp, Loader } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const TOTAL_LEVELS = 5;
const COLORS = ["#22C55E", "#E5E7EB"];

type EnrollmentSummary = {
  classId: string;
  className: string;
  level: number;
};

type ProgressSummary = {
  currentLevel: number;
};

type UserProfileData = {
  enrollments: EnrollmentSummary[];
  progress: ProgressSummary[];
};

export function UserManagementPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { users, loading, error } = useUsers(100);
  const [profiles, setProfiles] = useState<Record<number, UserProfileData>>({});

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

      {/* Content */}
      {users.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-600 dark:text-slate-400">
            Belum ada pengguna. Tambahkan pengguna baru untuk mulai.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {users.map((u) => {
            const profile = profiles[u.id] ?? { enrollments: [], progress: [] };
            const completed = profile.progress.reduce(
              (sum, item) => sum + item.currentLevel,
              0,
            );
            const possible = profile.enrollments.length * TOTAL_LEVELS;
            const remaining = Math.max(0, possible - completed);
            const percent =
              possible > 0 ? Math.round((completed / possible) * 100) : 0;

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
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {profile.enrollments.length > 0 ? (
                          profile.enrollments.map((enrollment) => (
                            <Badge key={enrollment.classId} variant="secondary">
                              {enrollment.className} • Lv {enrollment.level}
                            </Badge>
                          ))
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
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {possible > 0
                          ? `${completed} dari ${possible} level selesai`
                          : "Belum ada progress"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Pie chart with percent overlay */}
                  <div className="relative shrink-0 h-24 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={
                            possible > 0
                              ? [
                                  { name: "Completed", value: completed },
                                  { name: "Remaining", value: remaining },
                                ]
                              : [{ name: "Empty", value: 1 }]
                          }
                          dataKey="value"
                          innerRadius={28}
                          outerRadius={40}
                          paddingAngle={possible > 0 ? 2 : 0}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {(possible > 0 ? [completed, remaining] : [1]).map(
                            (_, index) => (
                              <Cell
                                key={index}
                                fill={COLORS[index] ?? COLORS[1]}
                              />
                            ),
                          )}
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
