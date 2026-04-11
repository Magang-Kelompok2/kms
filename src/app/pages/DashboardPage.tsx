import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  Calendar,
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Selamat datang kembali, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Lanjutkan perjalanan pembelajaran Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Kelas</p>
              <p className="text-3xl font-bold mt-2">{classesLoading ? "-" : classes.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-100">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Materi</p>
              <p className="text-3xl font-bold mt-2">{materiLoading ? "-" : materi.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-100">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Penguasan</p>
              <p className="text-3xl font-bold mt-2">{tugasLoading ? "-" : penugasan.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-green-100">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kuis</p>
              <p className="text-3xl font-bold mt-2">{tugasLoading ? "-" : kuis.length}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-100">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Classes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight">• KELAS ANDA</h2>
            <Button variant="link" size="sm" className="text-blue-600">Lihat Semua</Button>
          </div>
          {classesLoading ? (
            <p className="text-gray-500">Memuat kelas...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.slice(0, 3).map((cls) => {
                const kelasMateri = materi.filter((m) => m.id_kelas === cls.id);
                const kelasTugas = tugas.filter((t) => t.id_kelas === cls.id && t.type === "Kuis");

                return (
                  <Card
                    key={cls.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                    onClick={() => navigate(`/class/${cls.id}`)}
                  >
                    <div className="relative h-40 overflow-hidden bg-linear-to-br from-blue-600 to-cyan-500">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_40%)]" />
                      <div className="absolute inset-0 flex items-center justify-center px-4">
                        <h3 className="text-2xl font-bold text-white text-center line-clamp-2">{cls.name}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium text-gray-700">{kelasMateri.length} Materi</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{kelasTugas.length} Kuis</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        Lanjutkan
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Sidebar with Alerts/Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Audit Section */}
          <Card className="p-4 border-l-4 border-l-purple-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">A</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-600 uppercase">Audit</p>
                <h4 className="font-semibold text-sm">Audit - Pertemuan 1</h4>
                <p className="text-xs text-gray-500 mt-1">Pengarsipan dan profesional...</p>
                <p className="text-xs text-gray-400 mt-2">2 jam lalu</p>
              </div>
            </div>
          </Card>

          {/* Alasan Section */}
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">A</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-600 uppercase">Alasan</p>
                <h4 className="font-semibold text-sm">Akuntansi - Pertemuan 0</h4>
                <p className="text-xs text-gray-500 mt-1">Keranjang konsep pelaporan...</p>
              </div>
            </div>
          </Card>

          {/* Perpajakan Section */}
          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">P</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-600 uppercase">Perpajakan</p>
                <h4 className="font-semibold text-sm">Hukum Pajak Materi I</h4>
                <p className="text-xs text-gray-500 mt-1">Asas dan dasar perhitungan pajak...</p>
                <p className="text-xs text-gray-400 mt-2">2 hari lalu</p>
              </div>
            </div>
          </Card>

          {/* Target Mingguan */}
          <Card className="p-4">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Target Mingguan</h4>
                <span className="text-sm font-bold text-green-600">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: "75%"}}></div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Anda telah menyelesaikan 12 dari 16 materi target mingguan.
            </p>
            <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto mt-2">
              Terus semangat!
            </Button>
          </Card>

          {/* "Buka Katalog Materi" Link */}
          <Button 
            variant="outline" 
            className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
            size="sm"
          >
            Buka Katalog Materi
          </Button>
        </div>
      </div>

      {/* Bottom Section - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Pencapaian Baru */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Pencapaian Baru</h4>
              <p className="text-xs text-gray-600 mt-1">Anda telah menyelesaikan 5 materi berturut-turut!</p>
            </div>
          </div>
        </Card>

        {/* Klain XP */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Klain XP</h4>
              <p className="text-xs text-gray-600 mt-1">Tersedia untuk diklaim</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              size="sm"
            >
              Klain XP
            </Button>
          </div>
        </Card>

        {/* Jadwal Mendatang */}
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-sm">Jadwal Mendatang</h4>
              <p className="text-xs text-gray-600 mt-1">Ujian Tengah Semester - Perpajakan</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Besok</p>
              <p className="text-xs text-gray-400">09:00 WIB</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}