import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import type { Assignment, Quiz, Material } from "../types";

interface UserLevelCardProps {
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
  isLocked: boolean;
  defaultOpen?: boolean;
  activeMaterialId?: string;
}

export function UserLevelCard({
  namaLevel,
  materials,
  assignments,
  quizzes,
  isLocked,
  defaultOpen = false,
  activeMaterialId,
}: UserLevelCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "kuis">(
    "materi",
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (defaultOpen) {
      setIsOpen(true);
    }
  }, [defaultOpen]);

  useEffect(() => {
    if (!activeMaterialId) return;
    const found = materials.some(
      (material) => material.id === activeMaterialId,
    );
    if (found) {
      setIsOpen(true);
    }
  }, [activeMaterialId, materials]);

  useEffect(() => {
    if (!isOpen || !activeMaterialId) return;
    const target = document.getElementById(activeMaterialId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeMaterialId, isOpen]);

  const totalItems = materials.length + assignments.length + quizzes.length;

  const materialsByMeeting = materials.reduce(
    (acc, material) => {
      const meeting = material.meetingNumber;
      if (!acc[meeting]) {
        acc[meeting] = [];
      }
      acc[meeting].push(material);
      return acc;
    },
    {} as Record<number, Material[]>,
  );

  const meetings = Object.keys(materialsByMeeting)
    .map(Number)
    .sort((a, b) => a - b);

  // Format items untuk display (sama seperti AdminLevelCard)
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
      badge: `${material.files?.length || 0} files`,
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
    <Card className={`overflow-hidden ${isLocked ? "opacity-60" : ""}`}>
      {/* Header */}
      <button
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        className={`cursor-pointer w-full p-6 flex items-center justify-between transition-colors ${
          !isLocked && "hover:bg-gray-50 dark:hover:bg-gray-900"
        }`}
        disabled={isLocked}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-lg ${
              isLocked
                ? "bg-gray-400 dark:bg-gray-600"
                : "bg-linear-to-br from-[#0C4E8C] to-[#11C4D4]"
            }`}
          >
            {namaLevel.length <= 4
              ? namaLevel
              : namaLevel
                  .split(" ")
                  .map((segment) => segment[0]?.toUpperCase())
                  .join("")}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold flex items-center gap-2">
              {namaLevel}
              {isLocked && <Lock className="h-5 w-5 text-gray-400" />}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalItems} items ({materials.length} materi,{" "}
              {assignments.length} tugas, {quizzes.length} kuis)
            </p>
          </div>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-4">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        )}
      </button>

      {/* Content */}
      {isOpen && !isLocked && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Tabs - At top */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-full border cursor-pointer border-gray-200 bg-gray-200 dark:border-gray-800 dark:bg-gray-950 shadow-sm">
              <button
                onClick={() => setActiveTab("materi")}
                className={`px-5 py-2 text-sm font-medium cursor-pointer rounded-full transition-colors focus:outline-none ${
                  activeTab === "materi"
                    ? "bg-primary text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Materi ({materials.length})
              </button>
              <button
                onClick={() => setActiveTab("tugas")}
                className={`px-5 py-2 text-sm font-medium cursor-pointer rounded-full transition-colors focus:outline-none ${
                  activeTab === "tugas"
                    ? "bg-primary text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Tugas ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab("kuis")}
                className={`px-5 py-2 text-sm font-medium cursor-pointer rounded-full transition-colors focus:outline-none ${
                  activeTab === "kuis"
                    ? "bg-primary text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Kuis ({quizzes.length})
              </button>
            </div>
          </div>

          {/* Content Area - Scrollable */}
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {itemsByTab[activeTab].length > 0 ? (
                itemsByTab[activeTab].map((item) => (
                  <div
                    id={item.id}
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
          </div>
        </div>
      )}

      {/* Locked */}
      {isLocked && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 text-center">
          <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            Complete previous level to unlock this content
          </p>
        </div>
      )}
    </Card>
  );
}
