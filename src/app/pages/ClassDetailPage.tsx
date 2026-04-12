import { useParams, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import type { Material, Assignment, Quiz } from "../types";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  Layers,
  TrendingUp,
} from "lucide-react";
import { UserLevelCard } from "../components/UserLevelCard";
import { AdminLevelCard } from "../components/AdminLevelCard";
import { useState, useEffect } from "react";
import { useLevels } from "../hooks/useLevels";

interface KelasData {
  id: number;
  name: string;
  createdAt: string;
}

const classImageMap: Record<string, string> = {
  akuntansi: "/akuntansi.jpg",
  audit: "/audit.jpg",
  perpajakan: "/perpajakan.jpg",
};

const getClassImage = (className: string): string =>
  Object.entries(classImageMap).find(([key]) =>
    className.toLowerCase().includes(key),
  )?.[1] ?? "/akuntansi.jpg";

// ─── Gradient KPI Card ────────────────────────────────────────────────────────
interface GradientStatCardProps {
  title: string;
  value: number;
  footnote: string;
  icon: React.ElementType;
  from: string;
  to: string;
}

function GradientStatCard({
  title,
  value,
  footnote,
  icon: Icon,
  from,
  to,
}: GradientStatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-5 text-white shadow-md`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/75">{title}</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-white/55">{footnote}</p>
        </div>
        <div className="rounded-xl bg-white/20 p-2.5">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─── Donut Progress Card ──────────────────────────────────────────────────────
interface DonutProgressCardProps {
  progress: number;
  userLevel: number;
  totalLevels: number;
  totalMaterials: number;
  totalAssignments: number;
  totalQuizzes: number;
}

function DonutProgressCard({
  progress,
  userLevel,
  totalLevels,
  totalMaterials,
  totalAssignments,
  totalQuizzes,
}: DonutProgressCardProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 text-white shadow-md"
      style={{ background: "linear-gradient(135deg, #1e3a5f, #0f2540)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-white/75">Progres Kelas</p>
          <Badge
            variant="outline"
            className="border-white/20 text-xs text-white/60"
          >
            Lvl {userLevel}/{totalLevels}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Donut SVG */}
          <div className="relative h-24 w-24 shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full -rotate-90"
              aria-label={`Progress ${progress}%`}
            >
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="10"
              />
              {/* Progress arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="url(#donutGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ transition: "stroke-dasharray 0.7s ease" }}
              />
              <defs>
                <linearGradient
                  id="donutGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none">{progress}%</span>
              <span className="text-[9px] text-white/50 mt-0.5">selesai</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400 shrink-0" />
              <span className="text-white/70">{totalMaterials} Materi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-white/70">{totalAssignments} Tugas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400 shrink-0" />
              <span className="text-white/70">{totalQuizzes} Kuis</span>
            </div>
            <div className="mt-1 border-t border-white/10 pt-1">
              <span className="text-white/40">
                {totalMaterials + totalAssignments + totalQuizzes} total item
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ClassDetailPage() {
  const { classId } = useParams();
  const location = useLocation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const openLevel = Number(searchParams.get("openLevel") ?? "0");
  const activeMaterialId = searchParams.get("activeMaterial") ?? undefined;

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

  const {
    levels,
    loading: levelsLoading,
    error: levelsError,
  } = useLevels(classId);

  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [localAssignments, setLocalAssignments] = useState<Assignment[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>([]);
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    if (!user?.id || !classId || user.role === "superadmin") return;
    const fetchProgress = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress/${classId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const json = await res.json();
        setUserLevel(json.data.tingkatanSaatIni ?? 1);
      } catch {
        // default tetap 1
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
      <AppLayout>
        <div className="flex justify-center py-24">
          <p className="text-sm text-muted-foreground">Memuat data kelas...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentClass) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">Kelas tidak ditemukan</p>
        </Card>
      </AppLayout>
    );
  }

  if (levelsError) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="mb-2 text-destructive">Gagal memuat data tingkatan</p>
          <p className="text-sm text-muted-foreground">{levelsError}</p>
        </Card>
      </AppLayout>
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

  const totalItems = totalMaterials + totalAssignments + totalQuizzes;
  const completedItems = Math.floor(totalItems * 0.4);
  const userProgress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const classImage = getClassImage(currentClass.name);

  // ─── CLASS HEADER ───────────────────────────────────────────────────────────
  const ClassHeader = () => (
    <>
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Dashboard
      </Button>

      <Card className="mb-8 overflow-hidden shadow-sm">
        <div className="relative h-56 w-full overflow-hidden">
          <img
            src={classImage}
            alt={currentClass.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Gradient: biru solid di bawah → transparan di atas */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/90 via-blue-500/30 to-transparent" />
          {/* Nama kelas di bagian bawah */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-10">
            <h1
              className="text-center text-3xl font-semibold tracking-tight text-white drop-shadow-md md:text-4xl"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {currentClass.name}
            </h1>
          </div>
        </div>
      </Card>
    </>
  );

  // ─── SUPERADMIN VIEW ────────────────────────────────────────────────────────
  if (user?.role === "superadmin") {
    return (
      <AppLayout>
        <ClassHeader />

        {/* KPI Cards — superadmin */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GradientStatCard
            title="Jumlah Tingkatan"
            value={levels.length}
            footnote="Semua tingkatan dalam kelas"
            icon={Layers}
            from="#3b82f6"
            to="#0369a1"
          />
          <GradientStatCard
            title="Penugasan"
            value={totalAssignments}
            footnote="Tugas & pengumpulan"
            icon={FileText}
            from="#0891b2"
            to="#1d4ed8"
          />
          <GradientStatCard
            title="Kuis"
            value={totalQuizzes}
            footnote="Evaluasi"
            icon={ClipboardCheck}
            from="#4f46e5"
            to="#0e7490"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight">
              Kelola Konten per Tingkatan
            </h2>
            <p className="text-sm text-muted-foreground">
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
      </AppLayout>
    );
  }

  // ─── USER VIEW ──────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <ClassHeader />

      {/* KPI Cards + Donut Progress — sejajar dalam 1 grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GradientStatCard
          title="Total Tingkatan"
          value={levels.length}
          footnote="Struktur kelas"
          icon={Layers}
          from="#3b82f6"
          to="#0369a1"
        />
        <GradientStatCard
          title="Materi"
          value={totalMaterials}
          footnote="Materi pembelajaran"
          icon={FileText}
          from="#0891b2"
          to="#1d4ed8"
        />
        <GradientStatCard
          title="Penugasan & Kuis"
          value={totalAssignments + totalQuizzes}
          footnote="Tugas & evaluasi"
          icon={ClipboardCheck}
          from="#4f46e5"
          to="#0e7490"
        />
        {/* Donut Progress Card */}
        <DonutProgressCard
          progress={userProgress}
          userLevel={userLevel}
          totalLevels={levels.length}
          totalMaterials={totalMaterials}
          totalAssignments={totalAssignments}
          totalQuizzes={totalQuizzes}
        />
      </div>

      {/* Level list */}
      <div id="materials" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Progres Pembelajaran
        </h2>
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
    </AppLayout>
  );
}