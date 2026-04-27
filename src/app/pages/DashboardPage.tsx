import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent } from "../components/ui/card";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  Calendar,
  Trash2,
  Plus,
  Eye,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useClasses } from "../hooks/useClasses";
import { useMateri } from "../hooks/useMateri";
import { useTugas } from "../hooks/useTugas";
import { useUsers } from "../hooks/useUsers";
import { DashboardSkeleton } from "../components/PageSkeletons";

// ─── Gradient KPI Card ─────────────────────────────────────────────────────────
interface GradientStatCardProps {
  title: string;
  value: number;
  footnote: string;
  icon: React.ElementType;
  from: string;
  to: string;
  loading?: boolean;
}

function GradientStatCard({
  title,
  value,
  footnote,
  icon: Icon,
  from,
  to,
  loading,
}: GradientStatCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 text-white shadow-md"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/75">{title}</p>
          {loading ? (
            <div className="mt-1 h-10 w-16 animate-pulse rounded-md bg-white/20" />
          ) : (
            <p className="mt-1 text-4xl font-bold tracking-tight">{value}</p>
          )}
          <p className="mt-1 text-xs text-white/55">{footnote}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-2.5">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Shared image map ──────────────────────────────────────────────────────────
const classImageMap: Record<string, string> = {
  akuntansi: "/akuntansi.jpg",
  audit: "/audit.jpg",
  perpajakan: "/perpajakan.jpg",
};

const getClassImage = (className: string): string =>
  Object.entries(classImageMap).find(([key]) =>
    className.toLowerCase().includes(key),
  )?.[1] ?? "/akuntansi.jpg";

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const { classes, loading: classesLoading } = useClasses();
  const { materi, loading: materiLoading } = useMateri();
  const { tugas, loading: tugasLoading } = useTugas();
  const { users, loading: usersLoading, deleteUser, total } = useUsers(10, 0);

  const penugasan = useMemo(
    () => tugas.filter((t) => t.type !== "Kuis"),
    [tugas],
  );
  const kuis = useMemo(() => tugas.filter((t) => t.type === "Kuis"), [tugas]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [progressByClass, setProgressByClass] = useState<
    Record<string, number>
  >({});

  const tugasByClass = useMemo(() => {
    const stats = new Map<number, { materi: number; tugas: number; kuis: number }>();

    for (const item of materi) {
      const current = stats.get(item.id_kelas) ?? { materi: 0, tugas: 0, kuis: 0 };
      current.materi += 1;
      stats.set(item.id_kelas, current);
    }

    for (const item of tugas) {
      const current = stats.get(item.id_kelas) ?? { materi: 0, tugas: 0, kuis: 0 };
      if (item.type === "Kuis") current.kuis += 1;
      else current.tugas += 1;
      stats.set(item.id_kelas, current);
    }

    return stats;
  }, [materi, tugas]);

  useEffect(() => {
    if (!user?.id || user.role === "superadmin" || !token) return;
    fetch(
      `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const map: Record<string, number> = {};
        for (const item of json.data ?? []) {
          map[item.classId] = item.progressPercent ?? 0;
        }
        setProgressByClass(map);
      })
      .catch(() => {});
  }, [user?.id, user?.role, token]);

  const handleDeleteUser = async (userId: number, role: string) => {
    if (role === "superadmin") {
      alert("Tidak bisa menghapus akun superadmin!");
      return;
    }
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      setDeletingUserId(userId);
      const success = await deleteUser(userId);
      setDeletingUserId(null);
      if (success) alert("Pengguna berhasil dihapus!");
      else alert("Gagal menghapus pengguna.");
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, users],
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [currentPage, filteredUsers],
  );
  const latestMateri = useMemo(() => materi.slice(0, 5), [materi]);
  const isInitialLoading =
    classesLoading ||
    materiLoading ||
    tugasLoading ||
    (user?.role === "superadmin" && usersLoading && users.length === 0);

  if (isInitialLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton showUserTable={user?.role === "superadmin"} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* ── Welcome ── */}
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Selamat datang kembali,
        </h1>
        <h1 className="text-primary font-bold text-5xl mb-4">{user?.name}!</h1>
        <p className="text-muted-foreground">
          {user?.role === "superadmin"
            ? "Kelola kelas, materi, dan akses siswa Anda"
            : "Lanjutkan perjalanan pembelajaran Anda"}
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="Total Kelas"
          value={classes.length}
          footnote="Semua kelas aktif"
          icon={BookOpen}
          from="#3b82f6"
          to="#0369a1"
          loading={classesLoading}
        />
        <GradientStatCard
          title="Materi"
          value={materi.length}
          footnote="Total materi tersedia"
          icon={FileText}
          from="#0891b2"
          to="#1d4ed8"
          loading={materiLoading}
        />
        <GradientStatCard
          title="Penugasan"
          value={penugasan.length}
          footnote="Tugas non-kuis"
          icon={ClipboardCheck}
          from="#4f46e5"
          to="#0e7490"
          loading={tugasLoading}
        />
        <GradientStatCard
          title="Kuis"
          value={kuis.length}
          footnote="Evaluasi & latihan"
          icon={Calendar}
          from="#1e3a5f"
          to="#0f2540"
          loading={tugasLoading}
        />
      </div>

      {/* ── Kelas Anda ── */}
      <div className="mb-8">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-black dark:text-white">
          Kelas Anda
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const classStats = tugasByClass.get(cls.id) ?? {
              materi: 0,
              tugas: 0,
              kuis: 0,
            };
            const userProgress =
              user?.role !== "superadmin"
                ? (progressByClass[String(cls.id)] ?? 0)
                : 0;

            const classImage = getClassImage(cls.name);

            return (
              <Card
                key={cls.id}
                className="cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:scale-105 border-0 shadow-lg"
                onClick={() => navigate(`/class/${cls.id}`)}
              >
                  {/* ── Area Gambar dengan Overlay Gradient ── */}
                  <div className="relative h-52 w-full overflow-hidden">
                    <img
                      src={classImage}
                      alt={cls.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-700/90 via-blue-500/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-8">
                      <h3
                        className="text-xl font-bold tracking-tight text-white drop-shadow-md"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                      >
                        {cls.name}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="pt-4">
                    <div className="mb-4 flex gap-3 text-sm flex-wrap">
                      <span className="text-sm font-semibold text-foreground border border-border rounded-full px-3 py-1">
                        {classStats.materi} Materi
                      </span>
                      <span className="text-sm font-semibold text-foreground border border-border rounded-full px-3 py-1">
                        {classStats.tugas} Tugas
                      </span>
                      <span className="text-sm font-semibold text-foreground border border-border rounded-full px-3 py-1">
                        {classStats.kuis} Kuis
                      </span>
                    </div>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Dibuat:{" "}
                      {new Date(cls.createdAt).toLocaleDateString("id-ID")}
                    </p>

                    {user?.role !== "superadmin" && (
                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-foreground">
                            Progress
                          </span>
                          <span className="text-xs font-bold text-blue-600">
                            {userProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${userProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
            );
          })}
        </div>
      </div>

      {/* ── Manajemen Pengguna (Superadmin) ── */}
      {user?.role === "superadmin" && (
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Manajemen Pengguna
            </h2>
            <Button onClick={() => navigate("/users/create")}>
              <Plus className="mr-2 size-4" />
              Buat Pengguna Baru
            </Button>
          </div>

          <div className="mb-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari pengguna..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Nama</th>
                    <th className="px-6 py-3 text-left font-medium">Email</th>
                    <th className="px-6 py-3 text-left font-medium">Role</th>
                    <th className="px-6 py-3 text-left font-medium">
                      Dibuat Pada
                    </th>
                    <th className="px-6 py-3 text-center font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        Memuat pengguna...
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              u.role === "superadmin" ? "default" : "secondary"
                            }
                          >
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/users/${u.id}/progress`)
                              }
                            >
                              <Eye className="mr-1 size-4" />
                              Lihat
                            </Button>
                            {u.role !== "superadmin" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(u.id, u.role);
                                }}
                                disabled={deletingUserId === u.id}
                              >
                                <Trash2 className="size-4" />
                                <span className="ml-1">
                                  {deletingUserId === u.id ? "Processing..." : ""}
                                </span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <div className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {Math.max(totalPages, 1)}
                {total > 0 ? ` • ${total} user` : ""}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Selanjutnya
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Materi Terbaru (User) ── */}
      {user?.role !== "superadmin" && (
        <div>
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Materi Terbaru
          </h2>

          <div className="grid gap-3">
            {latestMateri.map((m) => {
              const cls = classes.find((c) => c.id === m.id_kelas);
              const classImage = cls ? getClassImage(cls.name) : "/akuntansi.jpg";

              return (
                <Card
                  key={m.id_materi}
                  className="cursor-pointer overflow-hidden shadow-sm transition-all hover:shadow-md hover:scale-[1.01] border border-border"
                  onClick={() => navigate(`/class/${m.id_kelas}`)}
                >
                  <div className="flex items-stretch">
                    {/* ── Gambar kiri dengan gradient kiri→kanan ── */}
                    <div className="relative w-36 shrink-0 overflow-hidden sm:w-44">
                      <img
                        src={classImage}
                        alt={cls?.name ?? "Kelas"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      {/* Gradient: biru solid di kiri → transparan ke kanan */}
                      <div className="absolute inset-0 bg-linear-to-r from-blue-700/90 via-blue-500/40 to-transparent" />
                      {/* Nama kelas vertikal di atas gradient */}
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <span
                          className="text-sm font-bold leading-tight text-white drop-shadow-md"
                          style={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                          }}
                        >
                          {cls?.name ?? "—"}
                        </span>
                      </div>
                    </div>

                    {/* ── Konten kanan ── */}
                    <div className="flex flex-1 items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {cls?.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Pertemuan {m.pertemuan}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-foreground leading-snug">
                          {m.title_materi}
                        </h3>
                      </div>
                      <FileText className="size-8 shrink-0 text-muted-foreground/30" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
