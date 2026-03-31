import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Lock,
  ClipboardCheck,
  PlayCircle,
} from "lucide-react";
import type { Assignment, Quiz, Material } from "../types";

interface UserLevelCardProps {
  level: number;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
  classId: string;
  isLocked: boolean;
  userLevel: number;
}

export function UserLevelCard({
  level,
  materials,
  assignments,
  quizzes,
  classId,
  isLocked,
  userLevel,
}: UserLevelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

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
    <Card className={`overflow-hidden ${isLocked ? "opacity-60" : ""}`}>
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        className={`cursor-pointer w-full p-6 flex items-center justify-between transition-colors ${
          !isLocked && "hover:bg-gray-50 dark:hover:bg-gray-900"
        }`}
        disabled={isLocked}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl ${
              isLocked
                ? "bg-gray-400 dark:bg-gray-600"
                : "bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4]"
            }`}
          >
            {level}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-normal flex items-center gap-2">
              Tingkatan {level}
              {isLocked && <Lock className="h-5 w-5 text-gray-400" />}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalItems} items
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

      {/* Content - Expanded */}
      {isOpen && !isLocked && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Materials Section */}
          {meetings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PlayCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xl font-normal">Materi</h4>
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
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-2 cursor-pointer"
                        onClick={() => navigate(`/material/${material.id}`)}
                      >
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">
                            {material.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {material.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {material.files?.length || 0} files
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/material/${material.id}`);
                          }}
                        >
                          Lihat Materi
                        </Button>
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
                <h4 className="text-xl font-normal">Penugasan</h4>
              </div>
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => navigate(`/assignment/${assignment.id}`)}
                  >
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">{assignment.title}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>Pertemuan {assignment.meetingNumber}</span>
                        <span>•</span>
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assignment/${assignment.id}`);
                      }}
                    >
                      Kerjakan
                    </Button>
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
                <h4 className="text-xl font-normal">Kuis</h4>
              </div>
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
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
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quiz/${quiz.id}`);
                      }}
                    >
                      Mulai Kuis
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {materials.length === 0 &&
            assignments.length === 0 &&
            quizzes.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No content available in this level yet
              </p>
            )}
        </div>
      )}

      {/* Locked Message */}
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