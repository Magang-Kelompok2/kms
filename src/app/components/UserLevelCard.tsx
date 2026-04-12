import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { ChevronDown, ChevronUp, Lock, BookOpen, ClipboardCheck, HelpCircle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "kuis">("materi");
  const navigate = useNavigate();

  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  useEffect(() => {
    if (!activeMaterialId) return;
    const found = materials.some((m) => m.id === activeMaterialId);
    if (found) setIsOpen(true);
  }, [activeMaterialId, materials]);

  useEffect(() => {
    if (!isOpen || !activeMaterialId) return;
    const target = document.getElementById(activeMaterialId);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMaterialId, isOpen]);

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

  const tabs: { key: "materi" | "tugas" | "kuis"; label: string; count: number }[] = [
    { key: "materi", label: "Materi", count: materials.length },
    { key: "tugas", label: "Tugas", count: assignments.length },
    { key: "kuis", label: "Kuis", count: quizzes.length },
  ];

  const typeIcon = {
    materi: BookOpen,
    tugas: ClipboardCheck,
    kuis: HelpCircle,
  };

  const typeGradient = {
    materi: "linear-gradient(135deg, #3b82f6, #0369a1)",
    tugas: "linear-gradient(135deg, #0891b2, #1d4ed8)",
    kuis: "linear-gradient(135deg, #4f46e5, #0e7490)",
  };

  return (
    <Card className={`overflow-hidden border-0 shadow-md transition-opacity ${isLocked ? "opacity-60" : ""}`}>
      {/* ── Header ── */}
      <button
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${
          !isLocked ? "hover:bg-muted/40 cursor-pointer" : "cursor-not-allowed"
        }`}
        disabled={isLocked}
      >
        <div className="flex items-center gap-4">
          {/* Level avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
            style={{
              background: isLocked
                ? "linear-gradient(135deg, #9ca3af, #6b7280)"
                : "linear-gradient(135deg, #3b82f6, #0369a1)",
            }}
          >
            {isLocked ? (
              <Lock className="h-5 w-5" />
            ) : namaLevel.length <= 4 ? (
              namaLevel
            ) : (
              namaLevel
                .split(" ")
                .map((s) => s[0]?.toUpperCase())
                .join("")
            )}
          </div>

          <div className="text-left">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
              {namaLevel}
              {isLocked && (
                <span className="text-xs font-semibold text-gray-400 border border-gray-300 dark:border-gray-600 rounded-full px-2.5 py-0.5">
                  Terkunci
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalItems} item &middot; {materials.length} materi &middot;{" "}
              {assignments.length} tugas &middot; {quizzes.length} kuis
            </p>
          </div>
        </div>

        {!isLocked && (
          isOpen
            ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
            : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* ── Locked State ── */}
      {isLocked && (
        <div className="border-t border-border px-6 py-8 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "linear-gradient(135deg, #9ca3af, #6b7280)" }}
          >
            <Lock className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Selesaikan tingkatan sebelumnya untuk membuka konten ini
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {isOpen && !isLocked && (
        <div className="border-t border-border">
          {/* ── Underline Tabs ── */}
          <div className="flex border-b border-border bg-muted/20">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 py-3.5 text-sm font-semibold transition-colors focus:outline-none ${
                  activeTab === tab.key
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #3b82f6, #0891b2)" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Item List ── */}
          <div className="p-6">
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {itemsByTab[activeTab].length > 0 ? (
                itemsByTab[activeTab].map((item) => {
                  const Icon = typeIcon[item.type];
                  return (
                    <div
                      id={item.id}
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-200 dark:hover:border-blue-900"
                      onClick={() => {
                        if (item.type === "materi") navigate(`/material/${item.id}`);
                        if (item.type === "tugas") navigate(`/assignment/${item.id}`);
                        if (item.type === "kuis") navigate(`/quiz/${item.id}`);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Number badge */}
                        <div
                          className="w-10 h-10 rounded-xl text-white grid place-items-center font-bold text-sm shrink-0 shadow-sm"
                          style={{ background: typeGradient[item.type] }}
                        >
                          {item.number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground leading-snug">
                            {item.title}
                          </h4>
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="shrink-0">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-full px-3 py-1 whitespace-nowrap">
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                (() => {
                  const Icon = typeIcon[activeTab];
                  return (
                    <div className="py-10 text-center text-muted-foreground rounded-xl border border-dashed border-border bg-muted/30">
                      <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Tidak ada konten di tab ini.</p>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}