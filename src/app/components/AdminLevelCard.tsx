import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  PlayCircle,
  ClipboardCheck,
  HelpCircle,
  FileText,
} from "lucide-react";
import type { Assignment, Quiz, Material } from "../types";
import { AddMaterialModal } from "./AddMaterialModal";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { AddQuizModal } from "./AddQuizModal";

interface AdminLevelCardProps {
  level: number;
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
  materials,
  assignments,
  quizzes,
  classId,
  onAddMaterial,
  onAddAssignment,
  onAddQuiz,
}: AdminLevelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  const totalItems = materials.length + assignments.length + quizzes.length;

  // Group materials by meeting
  const materialsByMeeting = materials.reduce((acc, material) => {
    const meeting = material.meetingNumber;
    if (!acc[meeting]) {
      acc[meeting] = [];
    }
    acc[meeting].push(material);
    return acc;
  }, {} as Record<number, Material[]>);

  const meetings = Object.keys(materialsByMeeting)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header - Clickable to expand/collapse */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4]">
              {level}
            </div>
            <div className="text-left">
              <h3 className="text-xl font-normal flex items-center gap-2">
                Tingkatan {level}
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalItems} items ({materials.length} materi, {assignments.length} tugas,{" "}
                {quizzes.length} kuis)
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

        {/* Content - Expanded */}
        {isOpen && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-6">
            {/* Add Buttons */}
            <div className="grid grid-cols-3 gap-3 ">
              <Button
                onClick={() => setShowMaterialModal(true)}
                variant="outline"
                className="w-full bg-[#0C81E4] hover:bg-[#0C4E8C] text-white cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Materi
              </Button>
              <Button
                onClick={() => setShowAssignmentModal(true)}
                variant="outline"
                className="w-full bg-[#0C81E4] hover:bg-[#0C4E8C] text-white cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tugas
              </Button>
              <Button
                onClick={() => setShowQuizModal(true)}
                variant="outline"
                className="w-full bg-[#0C81E4] hover:bg-[#0C4E8C] text-white cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kuis
              </Button>
            </div>

            {/* Materials Section */}
            {meetings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <PlayCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-normal">Materi ({materials.length})</h4>
                </div>
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
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold mb-1">{material.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {material.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {material.files?.length || 0} files
                                </Badge>
                                {material.isPublished ? (
                                  <Badge variant="default" className="text-xs bg-green-600">
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Draft
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments Section */}
            {assignments.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-normal">Tugas ({assignments.length})</h4>
                </div>
                <div className="space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{assignment.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {assignment.description}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>Pertemuan {assignment.meetingNumber}</span>
                            <span>•</span>
                            <span>
                              Due: {new Date(assignment.dueDate).toLocaleDateString("id-ID")}
                            </span>
                            {assignment.attachments && assignment.attachments.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {assignment.attachments.length} file
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quizzes Section */}
            {quizzes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-normal">Kuis ({quizzes.length})</h4>
                </div>
                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{quiz.title}</h5>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>Pertemuan {quiz.meetingNumber}</span>
                            <span>•</span>
                            <span>{quiz.duration} menit</span>
                            <span>•</span>
                            <span>{quiz.questions.length} soal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {materials.length === 0 &&
              assignments.length === 0 &&
              quizzes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">Belum ada konten di tingkatan ini</p>
                  <p className="text-sm">Klik tombol di atas untuk menambah konten</p>
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
