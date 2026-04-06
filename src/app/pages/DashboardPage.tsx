import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
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
import { useState } from "react";
import { useClasses } from "../hooks/useClasses";
import { useMateri } from "../hooks/useMateri";
import { useTugas } from "../hooks/useTugas";
import { useUsers } from "../hooks/useUsers";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { classes, loading: classesLoading } = useClasses();
  const { materi, loading: materiLoading } = useMateri();
  const { tugas, loading: tugasLoading } = useTugas();
  const { users, loading: usersLoading, deleteUser } = useUsers();

  const penugasan = tugas.filter((t) => t.type !== "Kuis");
  const kuis = tugas.filter((t) => t.type === "Kuis");

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDeleteUser = async (userId: number, role: string) => {
    if (role === "superadmin") {
      alert("Cannot delete superadmin account!");
      return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
      const success = await deleteUser(userId);
      if (success) alert("User deleted successfully!");
      else alert("Gagal menghapus pengguna.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Selamat datang kembali, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "superadmin"
              ? "Kelola kelas, materi, dan akses siswa Anda"
              : "Lanjutkan perjalanan pembelajaran Anda"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 max-w-6xl mx-auto">
          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-indigo-600 to-sky-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Total Kelas
                </p>
                <p className="text-4xl font-semibold">
                  {classesLoading ? "-" : classes.length}
                </p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <BookOpen className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Semua kelas aktif</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Overview
              </span>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-violet-600 via-fuchsia-500 to-sky-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Materi
                </p>
                <p className="text-4xl font-semibold">
                  {materiLoading ? "-" : materi.length}
                </p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <FileText className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Total materi</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Pelajari sekarang
              </span>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Penugasan
                </p>
                <p className="text-4xl font-semibold">
                  {tugasLoading ? "-" : penugasan.length}
                </p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <ClipboardCheck className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Task progress</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Fokus kerja
              </span>
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-orange-500 via-rose-500 to-pink-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Kuis
                </p>
                <p className="text-4xl font-semibold">
                  {tugasLoading ? "-" : kuis.length}
                </p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <Calendar className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Persiapan ujian</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Review
              </span>
            </div>
          </Card>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Kelas Anda</h2>
          </div>

          {classesLoading ? (
            <p className="text-gray-500">Memuat kelas...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classes.map((cls) => {
                const kelasMateri = materi.filter((m) => m.id_kelas === cls.id);
                const kelasTugas = tugas.filter(
                  (t) => t.id_kelas === cls.id && t.type === "Kuis",
                );

                return (
                  <Card
                    key={cls.id}
                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden rounded-4xl"
                    onClick={() => navigate(`/class/${cls.id}`)}
                  >
                    <div className="relative h-50 overflow-hidden bg-linear-to-br from-slate-800 via-indigo-600 to-sky-500">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />
                      <div className="absolute left-6 top-6 rounded-full bg-white/20 w-14 h-14 blur-2xl" />
                      <div className="absolute right-4 top-8 rounded-full bg-white/10 w-24 h-24" />
                      <div className="absolute inset-0 flex items-center justify-center px-4">
                        <h3
                          className="text-4xl font-bold text-white text-center"
                          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                        >
                          {cls.name}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex gap-4 text-sm text-gray-500 mb-2">
                        <span className="font-bold text-base">{kelasMateri.length} Materi</span>
                        <span className="font-bold text-base">{kelasTugas.length} Kuis</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Dibuat:{" "}
                        {new Date(cls.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* User Management for Superadmin */}
        {user?.role === "superadmin" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Manajemen Pengguna</h2>
              <Button className="bg-secondary cursor-pointer" onClick={() => navigate("/users/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Pengguna Baru
              </Button>
            </div>

            <div className="mb-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Nama
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Dibuat Pada
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {usersLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Memuat pengguna...
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-linear-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-bold">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {u.email}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                u.role === "superadmin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
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
                                <Eye className="h-4 w-4 mr-1" />
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
                                >
                                  <Trash2 className="h-4 w-4" />
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
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Halaman {currentPage} dari {Math.max(totalPages, 1)}
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

        {/* Materi Terbaru untuk user non-superadmin */}
        {user?.role !== "superadmin" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Materi Terbaru</h2>
            </div>

            <div className="grid gap-4">
              {materi.slice(0, 5).map((m) => {
                const cls = classes.find((c) => c.id === m.id_kelas);
                return (
                  <Card
                    key={m.id_materi}
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/class/${m.id_kelas}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {cls?.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Pertemuan {m.pertemuan}
                          </Badge>
                        </div>
                        <h3 className="font-bold mb-1">{m.title_materi}</h3>
                      </div>
                      <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700 ml-4" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
