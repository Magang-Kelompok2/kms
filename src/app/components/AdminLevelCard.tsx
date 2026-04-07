import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import type { Assignment, Quiz, Material } from "../types";
import { AddMaterialModal } from "./AddMaterialModal";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { AddQuizModal } from "./AddQuizModal";

interface AdminLevelCardProps {
  level: number;
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
  classId: string;
  onAddMaterial: (material: Material) => void;
  onAddAssignment: (assignment: Assignment) => void;
  onAddQuiz: (quiz: Quiz) => void;
}

export function AdminLevelCard({
  level,
  namaLevel,
  materials,
  assignments,
  quizzes,
  classId,
  onAddMaterial,
  onAddAssignment,
  onAddQuiz,
}: AdminLevelCardProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "kuis">(
    "materi",
  );
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  const totalItems = materials.length + assignments.length + quizzes.length;

  type TabItem = {
    id: string;
    type: "materi" | "tugas" | "kuis";
    title: string;
    subtitle: string;
    badge: string;
    number: number;
    extra?: string;
  };

  const itemsByTab: Record<"materi" | "tugas" | "kuis", TabItem[]> = {
    materi: materials.map((material) => ({
      id: material.id,
      type: "materi",
      title: material.title,
      subtitle: material.description ?? "",
      badge: `Pertemuan ${material.meetingNumber}`,
      number: material.meetingNumber,
    })),
    tugas: assignments.map((assignment) => ({
      id: assignment.id,
      type: "tugas",
      title: assignment.title,
      subtitle: assignment.description ?? "",
      badge: `Pertemuan ${assignment.meetingNumber}`,
      number: assignment.meetingNumber,
    })),
    kuis: quizzes.map((quiz) => ({
      id: quiz.id,
      type: "kuis",
      title: quiz.title,
      subtitle: quiz.description ?? "",
      badge: `Durasi ${quiz.duration ?? (quiz as any).durasi ?? 0}m`,
      number: quiz.meetingNumber,
    })),
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-lg bg-linear-to-br from-[#0C4E8C] to-[#11C4D4]">
              {namaLevel.length <= 4
                ? namaLevel
                : namaLevel
                    .split(" ")
                    .map((segment) => segment[0]?.toUpperCase())
                    .join("")}
            </div>
            <div className="text-left">
              <h3 className="text-xl font-normal flex items-center gap-2">
                {namaLevel}
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalItems} items ({materials.length} materi,{" "}
                {assignments.length} tugas, {quizzes.length} kuis)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </button>

        {/* Content */}
        {isOpen && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-6">
            {/* Add Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => setShowMaterialModal(true)}
                variant="outline"
                className="w-full bg-secondary hover:bg-primary hover:text-white text-white cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Materi
              </Button>
              <Button
                onClick={() => setShowAssignmentModal(true)}
                variant="outline"
                className="w-full bg-secondary hover:bg-primary hover:text-white text-white cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tugas
              </Button>
              <Button
                onClick={() => setShowQuizModal(true)}
                variant="outline"
                className="w-full bg-secondary hover:bg-primary hover:text-white text-white cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kuis
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex justify-center p-6">
              <div className="inline-flex rounded-full border cursor-pointer border-gray-200 bg-gray-200 dark:border-gray-800 dark:bg-gray-950 shadow-sm">
                <button
                  onClick={() => setActiveTab("materi")}
                  className={`px-5 py-2 text-sm font-medium cursor-pointer rounded-full transition-colors focus:outline-none ${
                    activeTab === "materi"
                      ? "bg-secondary text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Materi ({materials.length})
                </button>
                <button
                  onClick={() => setActiveTab("tugas")}
                  className={`px-5 py-2 text-sm font-medium cursor-pointer rounded-full transition-colors focus:outline-none ${
                    activeTab === "tugas"
                      ? "bg-secondary text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Tugas ({assignments.length})
                </button>
                <button
                  onClick={() => setActiveTab("kuis")}
                  className={`px-5 py-2 text-sm font-medium cursor-pointer rounded-full transition-colors focus:outline-none ${
                    activeTab === "kuis"
                      ? "bg-secondary text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Kuis ({quizzes.length})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {itemsByTab[activeTab].length > 0 ? (
                itemsByTab[activeTab].map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      if (item.type === "materi") navigate(`/material/${item.id}`);
                      if (item.type === "tugas") navigate(`/assignment/${item.id}`);
                      if (item.type === "kuis") navigate(`/quiz/${item.id}`);
                    }}
                  >
                    <div className="w-full flex items-center justify-between gap-4 p-4 text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#0C4E8C] to-[#11C4D4] text-white grid place-items-center font-semibold">
                          {item.number}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{item.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <div>{item.badge}</div>
                        {item.extra ? <div>{item.extra}</div> : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950 rounded-3xl border border-gray-200 dark:border-gray-800">
                  Tidak ada konten di tab ini.
                </div>
              )}
            </div>

            {materials.length === 0 &&
              assignments.length === 0 &&
              quizzes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">Belum ada konten di tingkatan ini</p>
                  <p className="text-sm">
                    Klik tombol di atas untuk menambah konten
                  </p>
                </div>
              )}
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddMaterialModal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        classId={classId}
        level={level}
        onAdd={onAddMaterial}
      />
      <AddAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        classId={classId}
        level={level}
        onAdd={onAddAssignment}
      />
      <AddQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        classId={classId}
        level={level}
        onAdd={onAddQuiz}
      />
    </>
  );
}
