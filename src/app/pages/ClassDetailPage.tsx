import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { classes, materials, assignments, quizzes, userProgress, submissions } from "../data/mockData";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import type { Material, Assignment, Quiz } from "../types";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  Calendar,
  Lock,
  Plus,
  Eye,
  Edit,
  Layers,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LevelCard } from "../components/LevelCard";
import { UserLevelCard } from "../components/UserLevelCard";
import { AdminLevelCard } from "../components/AdminLevelCard";
import { useState } from "react";

export function ClassDetailPage() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for managing content
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [localAssignments, setLocalAssignments] = useState<Assignment[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>([]);

  const currentClass = classes.find((c) => c.id === classId);
  
  // Initialize local state from mockData
  const classMaterials = [...materials.filter((m) => m.classId === classId), ...localMaterials];
  const classAssignments = [...assignments.filter((a) => a.classId === classId), ...localAssignments];
  const classQuizzes = [...quizzes.filter((q) => q.classId === classId), ...localQuizzes];

  // Get user progress for this class
  const progress = userProgress.find(
    (p) => p.userId === user?.id && p.classId === classId
  );
  const userLevel = progress?.currentLevel || 1;

  if (!currentClass) {
    return <div>Class not found</div>;
  }

  const canAccessLevel = (level: number) => {
    if (user?.role === "superadmin") return true;
    return level <= userLevel;
  };

  // Group by level for superadmin view
  const assignmentsByLevel = classAssignments.reduce((acc, assignment) => {
    const level = assignment.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(assignment);
    return acc;
  }, {} as Record<number, Assignment[]>);

  const quizzesByLevel = classQuizzes.reduce((acc, quiz) => {
    const level = quiz.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(quiz);
    return acc;
  }, {} as Record<number, Quiz[]>);

  const allLevels = Array.from(
    new Set([
      ...Object.keys(assignmentsByLevel).map(Number),
      ...Object.keys(quizzesByLevel).map(Number),
    ])
  ).sort((a, b) => a - b);

  // Group materials by level and meeting number for user view
  const materialsByLevel = classMaterials.reduce((acc, material) => {
    const level = material.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(material);
    return acc;
  }, {} as Record<number, Material[]>);

  const materialLevels = Object.keys(materialsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  // Get all levels for user view (1-3)
  const allUserLevels = Array.from(
    new Set([
      ...materialLevels,
      ...Object.keys(assignmentsByLevel).map(Number),
      ...Object.keys(quizzesByLevel).map(Number),
    ])
  ).sort((a, b) => a - b);

  // Superadmin View
  if (user?.role === "superadmin") {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />

        <div className="container mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Class Header */}
          <Card className="overflow-hidden mb-8">
            <div className="relative h-48">
              <ImageWithFallback
                src={currentClass.icon}
                alt={currentClass.name}
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${currentClass.color} opacity-90`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <h1
                  className="text-4xl font-normal text-white"
                  style={{ fontFamily: "Coolvetica, sans-serif" }}
                >
                  {currentClass.name}
                </h1>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                {currentClass.description}
              </p>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Layers className="h-8 w-8 text-[#0C4E8C]" />
                <div>
                  <p className="text-2xl font-bold">{currentClass.totalLevels}</p>
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
                  <p className="text-2xl font-bold">{classAssignments.length}</p>
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
                  <p className="text-2xl font-bold">{classQuizzes.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Jumlah Kuis
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Levels */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-normal mb-2">Kelola Konten per Tingkatan</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tambah dan kelola materi, tugas, dan kuis untuk setiap tingkatan
              </p>
            </div>
            
            {Array.from({ length: currentClass.totalLevels }, (_, i) => i + 1).map(
              (level) => (
                <AdminLevelCard
                  key={level}
                  level={level}
                  materials={materialsByLevel[level] || []}
                  assignments={assignmentsByLevel[level] || []}
                  quizzes={quizzesByLevel[level] || []}
                  classId={classId!}
                  onAddMaterial={(material) => setLocalMaterials([...localMaterials, material])}
                  onAddAssignment={(assignment) =>
                    setLocalAssignments([...localAssignments, assignment])
                  }
                  onAddQuiz={(quiz) => setLocalQuizzes([...localQuizzes, quiz])}
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // User View (existing code for students)
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>

        {/* Class Header */}
        <Card className="overflow-hidden mb-8">
          <div className="relative h-48">
            <ImageWithFallback
              src={currentClass.icon}
              alt={currentClass.name}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentClass.color} opacity-90`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <h1
                className="text-4xl font-normal text-white"
                style={{ fontFamily: "Coolvetica, sans-serif" }}
              >
                {currentClass.name}
              </h1>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400">
              {currentClass.description}
            </p>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-[#0C4E8C]" />
              <div>
                <p className="text-2xl font-bold">{currentClass.totalLevels}</p>
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
                <p className="text-2xl font-bold">{classMaterials.length}</p>
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
                  {classAssignments.length + classQuizzes.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Penugasan & Kuis
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Badge */}
        <div className="mb-6">
          <Badge variant="default" className="text-sm py-2 px-4">
            Tingkatan Saat Ini: {userLevel} / {currentClass.totalLevels}
          </Badge>
        </div>

        {/* Levels */}
        <div className="space-y-4">
          <h2 className="text-2xl font-normal">Progres Pembelajaran</h2>
          {Array.from({ length: currentClass.totalLevels }, (_, i) => i + 1).map(
            (level) => (
              <UserLevelCard
                key={level}
                level={level}
                materials={materialsByLevel[level] || []}
                assignments={assignmentsByLevel[level] || []}
                quizzes={quizzesByLevel[level] || []}
                classId={classId!}
                isLocked={!canAccessLevel(level)}
                userLevel={userLevel}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}