import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import type { Material, Assignment, Quiz } from "../types";
import { ArrowLeft, FileText, ClipboardCheck, Layers } from "lucide-react";
import { UserLevelCard } from "../components/UserLevelCard";
import { AdminLevelCard } from "../components/AdminLevelCard";
import { useState, useEffect } from "react";
import { useLevels } from "../hooks/useLevels";

interface KelasData {
  id: number;
  name: string;
  createdAt: string;
}

export function ClassDetailPage() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch data kelas dari API
  const [currentClass, setCurrentClass] = useState<KelasData | null>(null);
  const [classLoading, setClassLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    const fetchClass = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/kelas/${classId}`,
        );
        if (!res.ok) throw new Error("Kelas tidak ditemukan");
        const json = await res.json();
        setCurrentClass(json.data);
      } catch {
        setCurrentClass(null);
      } finally {
        setClassLoading(false);
      }
    };
    fetchClass();
  }, [classId]);

  // Fetch data levels dari API
  const {
    levels,
    loading: levelsLoading,
    error: levelsError,
  } = useLevels(classId);

  // State untuk admin — localState sebagai optimistic update
  // setelah tambah konten, useLevels akan di-refetch
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [localAssignments, setLocalAssignments] = useState<Assignment[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>([]);

  // Fetch userLevel dari API progress
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    if (!user?.id || !classId) return;

    // Superadmin tidak butuh progress, skip
    if (user.role === "superadmin") return;

    const fetchProgress = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress/${classId}`,
        );
        if (!res.ok) return;
        const json = await res.json();
        setUserLevel(json.data.tingkatanSaatIni ?? 1);
      } catch {
        // kalau gagal, default tetap 1
      }
    };

    fetchProgress();
  }, [user?.id, user?.role, classId]);

  const canAccessLevel = (level: number) => {
    if (user?.role === "superadmin") return true;
    return level <= userLevel;
  };

  const loading = classLoading || levelsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="flex items-center justify-center py-40">
          <p className="text-gray-500">Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">Kelas tidak ditemukan</p>
          </Card>
        </div>
      </div>
    );
  }

  if (levelsError) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500 mb-2">Gagal memuat data tingkatan</p>
            <p className="text-sm text-gray-500">{levelsError}</p>
          </Card>
        </div>
      </div>
    );
  }

  const totalMaterials = levels.reduce(
    (acc, lvl) => acc + lvl.materials.length,
    0,
  );
  const totalAssignments = levels.reduce(
    (acc, lvl) => acc + lvl.assignments.length,
    0,
  );
  const totalQuizzes = levels.reduce((acc, lvl) => acc + lvl.quizzes.length, 0);

  const ClassHeader = () => (
    <>
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {user?.role === "superadmin"
          ? "Back to Dashboard"
          : "Kembali ke Dashboard"}
      </Button>
      <Card className="overflow-hidden mb-8">
        <div className="relative h-48 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4]">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="text-4xl font-normal text-white"
              style={{ fontFamily: "Coolvetica, sans-serif" }}
            >
              {currentClass.name}
            </h1>
          </div>
        </div>
      </Card>
    </>
  );

  // ─── SUPERADMIN VIEW ──────────────────────────────────────────────────────
  if (user?.role === "superadmin") {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <ClassHeader />
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Layers className="h-8 w-8 text-[#0C4E8C]" />
                <div>
                  <p className="text-2xl font-bold">{levels.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Jumlah Tingkatan
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-[#0C81E4]" />
                <div>
                  <p className="text-2xl font-bold">{totalAssignments}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Jumlah Pengumpulan
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8 text-[#11C4D4]" />
                <div>
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Jumlah Kuis
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-normal mb-2">
                Kelola Konten per Tingkatan
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tambah dan kelola materi, tugas, dan kuis untuk setiap tingkatan
              </p>
            </div>
            {levels.map((lvl) => (
              <AdminLevelCard
                key={lvl.id}
                level={lvl.level}
                materials={[
                  ...lvl.materials,
                  ...localMaterials.filter(
                    (m) => (m as any).level === lvl.level,
                  ),
                ]}
                assignments={[
                  ...lvl.assignments,
                  ...localAssignments.filter(
                    (a) => (a as any).level === lvl.level,
                  ),
                ]}
                quizzes={[
                  ...lvl.quizzes,
                  ...localQuizzes.filter((q) => (q as any).level === lvl.level),
                ]}
                classId={classId!}
                onAddMaterial={(material) =>
                  setLocalMaterials([...localMaterials, material])
                }
                onAddAssignment={(assignment) =>
                  setLocalAssignments([...localAssignments, assignment])
                }
                onAddQuiz={(quiz) => setLocalQuizzes([...localQuizzes, quiz])}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── USER VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
      <DashboardHeader />
      <div className="container mx-auto px-4 md:px-6 py-8">
        <ClassHeader />
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-[#0C4E8C]" />
              <div>
                <p className="text-2xl font-bold">{levels.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tingkatan
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-[#0C81E4]" />
              <div>
                <p className="text-2xl font-bold">{totalMaterials}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Materi
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-[#11C4D4]" />
              <div>
                <p className="text-2xl font-bold">
                  {totalAssignments + totalQuizzes}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Penugasan & Kuis
                </p>
              </div>
            </div>
          </Card>
        </div>
        <div className="mb-6">
          <Badge variant="default" className="text-sm py-2 px-4">
            Tingkatan Saat Ini: {userLevel} / {levels.length}
          </Badge>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-normal">Progres Pembelajaran</h2>
          {levels.map((lvl) => (
            <UserLevelCard
              key={lvl.id}
              level={lvl.level}
              materials={lvl.materials}
              assignments={lvl.assignments}
              quizzes={lvl.quizzes}
              classId={classId!}
              isLocked={!canAccessLevel(lvl.level)}
              userLevel={userLevel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
