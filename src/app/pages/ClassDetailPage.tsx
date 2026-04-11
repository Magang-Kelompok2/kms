import { useParams, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
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
  const location = useLocation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const openLevel = Number(searchParams.get("openLevel") ?? "0");
  const activeMaterialId = searchParams.get("activeMaterial") ?? undefined;

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
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) return;
        const json = await res.json();
        setUserLevel(json.data.tingkatanSaatIni ?? 1);
      } catch {
        // kalau gagal, default tetap 1
      }
    };

    fetchProgress();
  }, [user?.id, user?.role, classId, token]);

  const canAccessLevel = (level: number) => {
    if (user?.role === "superadmin") return true;
    return level <= userLevel;
  };

  useEffect(() => {
    if (location.hash !== "#materials") return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  const loading = classLoading || levelsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Memuat data kelas...</p>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950 p-4 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500">Kelas tidak ditemukan</p>
        </Card>
      </div>
    );
  }

  if (levelsError) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950 p-4 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500 mb-2">Gagal memuat data tingkatan</p>
          <p className="text-sm text-gray-500">{levelsError}</p>
        </Card>
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
          ? "Kembali ke Dashboard"
          : "Kembali ke Dashboard"}
      </Button>
      <Card className="overflow-hidden mb-8">
        <div className="relative h-48 bg-linear-to-br from-[#0C4E8C] to-[#11C4D4]">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="text-4xl font-bold text-white"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
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
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <ClassHeader />
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-indigo-600 to-sky-500">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                    Jumlah Tingkatan
                  </p>
                  <p className="text-4xl font-semibold">{levels.length}</p>
                </div>
                <div className="rounded-3xl bg-white/15 p-3">
                  <Layers className="h-10 w-10 text-white opacity-90" />
                </div>
              </div>
              <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
                <span>Semua tingkatan</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  Overview
                </span>
              </div>
            </Card>
            <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-purple-600 to-pink-500">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                    Jumlah Pengumpulan
                  </p>
                  <p className="text-4xl font-semibold">{totalAssignments}</p>
                </div>
                <div className="rounded-3xl bg-white/15 p-3">
                  <FileText className="h-10 w-10 text-white opacity-90" />
                </div>
              </div>
              <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
                <span>Tugas & pengumpulan</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  Assignments
                </span>
              </div>
            </Card>
            <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-emerald-600 to-teal-500">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                    Jumlah Kuis
                  </p>
                  <p className="text-4xl font-semibold">{totalQuizzes}</p>
                </div>
                <div className="rounded-3xl bg-white/15 p-3">
                  <ClipboardCheck className="h-10 w-10 text-white opacity-90" />
                </div>
              </div>
              <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
                <span>Kuis & evaluasi</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  Quizzes
                </span>
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
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
                namaLevel={lvl.namaLevel}
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
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        <ClassHeader />
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-indigo-600 to-sky-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Total Tingkatan
                </p>
                <p className="text-4xl font-semibold">{levels.length}</p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <Layers className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Semua tingkatan</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Overview
              </span>
            </div>
          </Card>
          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-purple-600 to-pink-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Materi
                </p>
                <p className="text-4xl font-semibold">{totalMaterials}</p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <FileText className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Materi pembelajaran</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Materials
              </span>
            </div>
          </Card>
          <Card className="relative overflow-hidden rounded-4xl p-6 text-white shadow-xl bg-linear-to-br from-slate-800 via-emerald-600 to-teal-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/80 mb-2">
                  Penugasan & Kuis
                </p>
                <p className="text-4xl font-semibold">
                  {totalAssignments + totalQuizzes}
                </p>
              </div>
              <div className="rounded-3xl bg-white/15 p-3">
                <ClipboardCheck className="h-10 w-10 text-white opacity-90" />
              </div>
            </div>
            <div className="relative mt-6 flex items-center justify-between text-sm text-white/80">
              <span>Tugas & evaluasi</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Tasks
              </span>
            </div>
          </Card>
        </div>
        <div className="mb-6">
          <Badge variant="default" className="text-sm py-2 px-4">
            Tingkatan Saat Ini: {userLevel} / {levels.length}
          </Badge>
        </div>
        <div id="materials" className="space-y-4">
          <h2 className="text-2xl font-bold">Progres Pembelajaran</h2>
          {levels.map((lvl) => (
            <UserLevelCard
              key={lvl.id}
              namaLevel={lvl.namaLevel}
              materials={lvl.materials}
              assignments={lvl.assignments}
              quizzes={lvl.quizzes}
              isLocked={!canAccessLevel(lvl.level)}
              defaultOpen={openLevel === lvl.level}
              activeMaterialId={activeMaterialId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
