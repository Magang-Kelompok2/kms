import { useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "kuis">(
    "materi",
  );
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

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

            {/* Tab Content */}
            <div>
              {/* Materi */}
              {activeTab === "materi" && (
                <div>
                  {meetings.length > 0 ? (
                    <div className="space-y-2">
                      {meetings.map((meeting) => (
                        <div key={meeting}>
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Pertemuan {meeting}
                          </div>
                          {materialsByMeeting[meeting].map((material) => (
                            <div
                              key={material.id}
                              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                            >
                              <h5 className="font-semibold mb-1">
                                {material.title}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {material.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {material.files?.length || 0} files
                                </Badge>
                                {material.isPublished ? (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-green-600"
                                  >
                                    Berhasil diunggah
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Draft
                                  </Badge>
                                )}
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
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <h5 className="font-semibold mb-1">
                            {assignment.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>Pertemuan {assignment.meetingNumber}</span>
                            {assignment.dueDate && (
                              <>
                                <span>•</span>
                                <span>
                                  Due:{" "}
                                  {new Date(
                                    assignment.dueDate,
                                  ).toLocaleDateString("id-ID")}
                                </span>
                              </>
                            )}
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
                    <div className="space-y-2">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <h5 className="font-semibold mb-1">{quiz.title}</h5>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>Pertemuan {quiz.meetingNumber}</span>
                            {quiz.duration && (
                              <>
                                <span>•</span>
                                <span>{quiz.duration} menit</span>
                              </>
                            )}
                            {quiz.questions && quiz.questions.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{quiz.questions.length} soal</span>
                              </>
                            )}
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
