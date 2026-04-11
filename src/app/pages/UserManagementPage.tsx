import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { mockUsers, userProgress, classes } from "../data/mockData";
import { Users, Plus, TrendingUp } from "lucide-react";

export function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users] = useState(mockUsers);

  // Proteksi Route: Jika bukan superadmin, tendang ke dashboard
  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  // Fungsi pembantu untuk mengambil progres spesifik user
  const getUserProgress = (userId: string) => {
    return userProgress.filter((p) => p.userId === userId);
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Kelola Pengguna
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tambahkan, edit, atau hapus pengguna di platform
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6">
        <Button onClick={() => navigate("/users/create")} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Buat Pengguna Baru
        </Button>
      </div>

      {/* User List Grid */}
      <div className="grid gap-4">
        {users.map((u) => {
          const progress = getUserProgress(u.id);
          const totalProgress = progress.reduce(
            (acc, p) => acc + p.completedMaterials.length,
            0
          );

          return (
            <Card key={u.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Avatar Icon */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{u.name}</h3>
                      <Badge
                        variant={u.role === "superadmin" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {u.role === "superadmin" ? "Admin" : "Student"}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {u.email}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Bergabung: {u.createdAt}</span>
                      <span>Total Materi: {totalProgress}</span>
                    </div>

                    {/* Progress Detail (Hanya muncul jika user biasa dan punya progress) */}
                    {progress.length > 0 && u.role === "user" && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-bold">Progres Kelas:</p>
                        <div className="flex gap-2 flex-wrap">
                          {progress.map((p) => {
                            const cls = classes.find((c) => c.id === p.classId);
                            return (
                              <Badge
                                key={p.classId}
                                variant="outline"
                                className="text-xs"
                              >
                                {cls?.name}: Tingkatan {p.currentLevel}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {u.role === "user" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/users/${u.id}/progress`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Lihat Progres
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {/* Empty State */}
        {users.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tidak ada pengguna yang ditemukan. Klik "Buat Pengguna Baru" untuk menambahkan pengguna pertama Anda.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}