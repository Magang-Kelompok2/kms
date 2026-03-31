import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { classes, materials, assignments, quizzes, userAccess, mockUsers, submissions } from "../data/mockData";
import { Card } from "../components/ui/card";
import { BookOpen, FileText, ClipboardCheck, Calendar, Users, Trash2, Plus, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localUsers, setLocalUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getAccessibleMaterials = () => {
    if (user?.role === "superadmin") {
      return materials;
    }
    return materials.filter(
      (m) => m.isPublished && userAccess.materialIds.includes(m.id)
    );
  };

  const getAccessibleQuizzes = () => {
    if (user?.role === "superadmin") {
      return quizzes;
    }
    return quizzes.filter(
      (q) => q.isPublished && userAccess.quizIds.includes(q.id)
    );
  };

  const getAccessibleAssignments = () => {
    if (user?.role === "superadmin") {
      return assignments;
    }
    return assignments.filter(
      (a) => a.isPublished && userAccess.assignmentIds.includes(a.id)
    );
  };

  const accessibleMaterials = getAccessibleMaterials();
  const accessibleQuizzes = getAccessibleQuizzes();
  const accessibleAssignments = getAccessibleAssignments();

  const handleDeleteUser = (userId: string) => {
    if (userId === "1") {
      alert("Cannot delete superadmin account!");
      return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
      setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("User deleted successfully!");
    }
  };

  const getPendingSubmissionsCount = (userId: string) => {
    return submissions.filter((s) => s.userId === userId && s.status === "pending").length;
  };

  const filteredUsers = localUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-2">
            Selamat datang kembali, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "superadmin"
              ? "Kelola kelas, materi, dan akses siswa Anda"
              : "Lanjutkan perjalanan pembelajaran Anda"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Kelas
                </p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
              <BookOpen className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Materi
                </p>
                <p className="text-2xl font-bold">{accessibleMaterials.length}</p>
              </div>
              <FileText className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Penugasan
                </p>
                <p className="text-2xl font-bold">{accessibleAssignments.length}</p>
              </div>
              <ClipboardCheck className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Kuis
                </p>
                <p className="text-2xl font-semibold">{accessibleQuizzes.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-normal">Kelas Anda</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const classMaterials = materials.filter((m) => m.classId === cls.id);
              const classQuizzes = quizzes.filter((q) => q.classId === cls.id);
              
              return (
                <Card
                  key={cls.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                  onClick={() => navigate(`/class/${cls.id}`)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <ImageWithFallback
                      src={cls.icon}
                      alt={cls.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${cls.color} opacity-75`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-2xl font-normal text-white" style={{ fontFamily: 'Coolvetica, sans-serif' }}>
                        {cls.name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {cls.description}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">
                        {classMaterials.length} materi
                      </span>
                      <span className="text-gray-500">
                        {classQuizzes.length} kuis
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User Management for Superadmin */}
        {user?.role === "superadmin" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-normal">Manajemen Pengguna</h2>
              <Button onClick={() => navigate("/users/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Pengguna Baru
              </Button>
            </div>

            {/* Search Bar */}
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
                      <th className="px-6 py-4 text-left text-sm font-semibold">Nama</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Dibuat Pada</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Tertunda</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {currentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-normal">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                        <td className="px-6 py-4">
                          <Badge variant={u.role === "superadmin" ? "default" : "secondary"}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          {u.role === "user" && (
                            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
                              {getPendingSubmissionsCount(u.id)} Tertunda
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/users/${u.id}/progress`)}
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
                                  handleDeleteUser(u.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Selanjutnya
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Recent Materials for Regular Users */}
        {user?.role !== "superadmin" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-normal">Materi Terbaru</h2>
              {/* <button className="text-blue-600 dark:text-blue-400 hover:underline">
                Lihat semua →
              </button> */}
            </div>

            <div className="grid gap-4">
              {accessibleMaterials.slice(0, 5).map((material) => {
                const cls = classes.find((c) => c.id === material.classId);
                return (
                  <Card
                    key={material.id}
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/class/${material.classId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {cls?.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Pertemuan {material.meetingNumber}
                          </Badge>
                        </div>
                        <h3 className="font-normal mb-1">{material.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {material.description}
                        </p>
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