import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import type { Assignment, Quiz, Material } from "../types";

interface UserLevelCardProps {
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
  isLocked: boolean;
}

export function UserLevelCard({
  namaLevel,
  materials,
  assignments,
  quizzes,
  isLocked,
}: UserLevelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "kuis">(
    "materi",
  );
  const navigate = useNavigate();

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
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* Tabs */}
          <div className="flex justify-center p-6">
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

          {/* Tab Content */}
          <div className="p-6">
            {/* Materi */}
            {activeTab === "materi" && (
              <div>
                {meetings.length > 0 ? (
                  <div className="space-y-3">
                    {meetings.map((meeting) => (
                      <div key={meeting}>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Pertemuan {meeting}
                        </div>
                        {materialsByMeeting[meeting].map((material) => (
                          <div
                            key={material.id}
                            className="rounded-3xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => navigate(`/material/${material.id}`)}
                          >
                            <div className="p-4">
                              <h5 className="font-semibold mb-1">
                                {material.title}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {material.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {material.files?.length || 0} files
                                </Badge>
                                <Button size="sm" variant="outline">
                                  Lihat Materi
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Tidak ada materi di tingkatan ini
                  </p>
                )}
              </div>
            )}

            {/* Tugas */}
            {activeTab === "tugas" && (
              <div>
                {assignments.length > 0 ? (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-3xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => navigate(`/assignment/${assignment.id}`)}
                      >
                        <div className="p-4">
                          <h5 className="font-semibold mb-1">
                            {assignment.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {assignment.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Pertemuan {assignment.meetingNumber}
                            </Badge>
                            <Button size="sm" variant="outline">
                              Kerjakan
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Tidak ada tugas di tingkatan ini
                  </p>
                )}
              </div>
            )}

            {/* Kuis */}
            {activeTab === "kuis" && (
              <div>
                {quizzes.length > 0 ? (
                  <div className="space-y-3">
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="rounded-3xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                      >
                        <div className="p-4">
                          <h5 className="font-semibold mb-1">{quiz.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {quiz.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Durasi {quiz.duration ?? (quiz as any).durasi ?? 0}m
                            </Badge>
                            <Button size="sm" variant="outline">
                              Mulai Kuis
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    Tidak ada kuis di tingkatan ini
                  </p>
                )}
              </div>
            )}
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
