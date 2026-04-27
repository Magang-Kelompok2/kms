import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Mail,
  Shield,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";

type EnrollmentSummary = {
  classId: string;
  className: string;
  level: number;
  status: string;
};

type ProgressSummary = {
  id: number;
  classId: string;
  className: string;
  currentLevel: number;
  totalLevels: number;
  progressPercent: number;
  completedMaterialCount: number;
  totalMaterialCount: number;
  completedAssignmentCount: number;
  totalAssignmentCount: number;
  completedQuizCount: number;
  totalQuizCount: number;
  updatedAt: string;
};

type RecentActivity = {
  id: string;
  type: "materi" | "tugas" | "kuis";
  title: string;
  classId: string;
  className: string;
  createdAt: string;
  status: "completed" | "passed" | "submitted";
  score: number | null;
};

export function ProfilePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressSummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [levelCountByClass, setLevelCountByClass] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [enrollmentRes, progressRes, activityRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/enrollments`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(
            `${import.meta.env.VITE_API_URL}/api/users/${user.id}/recent-activity`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            },
          ),
        ]);

        if (!enrollmentRes.ok) {
          const json = await enrollmentRes.json();
          throw new Error(json.error ?? "Gagal mengambil data kelas");
        }

        if (!progressRes.ok) {
          const json = await progressRes.json();
          throw new Error(json.error ?? "Gagal mengambil progress");
        }

        if (!activityRes.ok) {
          const json = await activityRes.json();
          throw new Error(json.error ?? "Gagal mengambil aktivitas terbaru");
        }

        const enrollmentJson = await enrollmentRes.json();
        const progressJson = await progressRes.json();
        const activityJson = await activityRes.json();

        const nextEnrollments = enrollmentJson.data ?? [];
        const nextProgress = progressJson.data ?? [];
        setEnrollments(nextEnrollments);
        setProgressRows(nextProgress);
        setRecentActivity(activityJson.data ?? []);

        const classIds = [
          ...new Set(
            [...nextEnrollments, ...nextProgress]
              .map((item: EnrollmentSummary | ProgressSummary) => item.classId)
              .filter(Boolean),
          ),
        ];

        const levelEntries = await Promise.all(
          classIds.map(async (classId: string) => {
            try {
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/kelas/${classId}/levels`,
                { signal: controller.signal },
              );
              if (!res.ok) return [classId, 0] as const;
              const json = await res.json();
              return [classId, Array.isArray(json.data) ? json.data.length : 0] as const;
            } catch {
              return [classId, 0] as const;
            }
          }),
        );

        setLevelCountByClass(Object.fromEntries(levelEntries));
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Terjadi kesalahan saat memuat profil",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
    return () => controller.abort();
  }, [token, user?.id]);

  const progressByClass = useMemo(
    () => Object.fromEntries(progressRows.map((item) => [item.classId, item])),
    [progressRows],
  );

  const enrollmentCards = useMemo(
    () =>
      enrollments.map((item) => {
        const progress = progressByClass[item.classId];
        const currentLevel = progress?.currentLevel ?? 1;
        const totalLevels =
          progress?.totalLevels ?? levelCountByClass[item.classId] ?? item.level ?? 0;
        const completedItems =
          (progress?.completedMaterialCount ?? 0) +
          (progress?.completedAssignmentCount ?? 0) +
          (progress?.completedQuizCount ?? 0);
        const totalItems =
          (progress?.totalMaterialCount ?? 0) +
          (progress?.totalAssignmentCount ?? 0) +
          (progress?.totalQuizCount ?? 0);
        const percent = progress?.progressPercent ?? 0;

        return {
          ...item,
          currentLevel,
          totalLevels,
          completedItems,
          totalItems,
          percent,
          updatedAt: progress?.updatedAt ?? null,
        };
      }),
    [enrollments, levelCountByClass, progressByClass],
  );

  const overallProgress = useMemo(() => {
    const totalItems = enrollmentCards.reduce(
      (sum, item) => sum + item.totalItems,
      0,
    );
    const completedItems = enrollmentCards.reduce(
      (sum, item) => sum + item.completedItems,
      0,
    );

    return {
      totalItems,
      completedItems,
      percent:
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  }, [enrollmentCards]);

  const handleSave = () => {
    alert("Profil berhasil diperbarui!");
    setIsEditing(false);
  };

  return (
    <AppLayout className="max-w-6xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 size-4" />
        Kembali ke Dashboard
      </Button>

      <Card className="mb-6 overflow-hidden shadow-sm">
        <CardHeader className="gap-6 bg-linear-to-br from-slate-900 via-sky-900 to-cyan-700 py-8 text-white sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
              <User className="size-12" />
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight">
                {user?.name}
              </h1>
              <div className="mb-2 flex items-center gap-2 text-sm text-white/80">
                <Mail className="size-4 shrink-0" />
                <span>{user?.email}</span>
              </div>
              <Badge
                variant="secondary"
                className="border-white/20 bg-white/15 text-white"
              >
                {user?.role === "superadmin" ? "Super Admin" : "Student"}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant="secondary"
            className="border-white/20 bg-white/15 text-white hover:bg-white/20"
          >
            {isEditing ? "Batal" : "Edit Profil"}
          </Button>
        </CardHeader>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kelas Diikuti</p>
              <p className="text-2xl font-semibold">{enrollmentCards.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Target className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress Keseluruhan</p>
              <p className="text-2xl font-semibold">{overallProgress.percent}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktivitas Selesai</p>
              <p className="text-2xl font-semibold">{recentActivity.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <h2 className="text-lg font-semibold tracking-tight">
                Informasi Profil
              </h2>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <div className="relative mt-2">
                  <Shield className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="role"
                    value={user?.role === "superadmin" ? "Super Admin" : "Student"}
                    disabled
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="created">Tanggal Bergabung</Label>
                <div className="relative mt-2">
                  <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="created"
                    value={new Date(
                      user?.createdAt ?? Date.now(),
                    ).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    disabled
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    Simpan Perubahan
                  </Button>
                  <Button
                    onClick={() => {
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                      });
                      setIsEditing(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Batal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <h2 className="text-lg font-semibold tracking-tight">
                Aktivitas Terbaru
              </h2>
              <p className="text-sm text-muted-foreground">
                Menampilkan materi, tugas, dan kuis yang baru diselesaikan.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Memuat aktivitas terbaru...
                </p>
              ) : recentActivity.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Belum ada aktivitas yang tercatat.
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {activity.className}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {activity.type === "kuis"
                          ? "Kuis"
                          : activity.type === "materi"
                            ? "Materi"
                            : "Tugas"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        {activity.status === "passed"
                          ? "Lulus"
                          : activity.status === "completed"
                            ? "Selesai"
                            : "Terkirim"}
                      </span>
                      {typeof activity.score === "number" && (
                        <span>Skor: {activity.score}</span>
                      )}
                      <span>
                        {new Date(activity.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <h2 className="text-lg font-semibold tracking-tight">
              Kelas dan Progress
            </h2>
            <p className="text-sm text-muted-foreground">
              Ringkasan kelas yang diikuti, tingkatan akses, dan capaian belajar
              saat ini.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Memuat data kelas dan progress...
              </p>
            ) : enrollmentCards.length === 0 ? (
              <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                Belum ada kelas yang terdaftar untuk akun ini.
              </div>
            ) : (
              enrollmentCards.map((item) => (
                <div
                  key={item.classId}
                  className="rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {item.className}
                      </p>
                      <p className="text-sm text-slate-500">
                        Akses hingga Level {item.level}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Progress
                      </p>
                      <p className="text-lg font-semibold text-slate-900">
                        {item.percent}%
                      </p>
                    </div>
                  </div>

                  <Progress value={item.percent} className="mb-3 h-2.5" />

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                        Tingkatan Saat Ini
                      </p>
                      <p className="font-medium text-slate-900">
                        Level {item.currentLevel}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                        Level Selesai
                      </p>
                      <p className="font-medium text-slate-900">
                        {item.completedItems}/{item.totalItems || "-"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                        Update Terakhir
                      </p>
                      <p className="font-medium text-slate-900">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString("id-ID")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                    <GraduationCap className="size-4" />
                    Persentase dihitung dari materi, tugas, dan kuis yang sudah
                    diselesaikan pada kelas ini.
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

