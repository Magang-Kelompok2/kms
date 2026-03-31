import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, ChevronUp, FileText, HelpCircle, Users } from "lucide-react";
import type { Assignment, Quiz, Submission } from "../types";

interface LevelCardProps {
  level: number;
  assignments: Assignment[];
  quizzes: Quiz[];
  submissions: Submission[];
  classId: string;
}

export function LevelCard({
  level,
  assignments,
  quizzes,
  submissions,
  classId,
}: LevelCardProps) {
  const [isOpen, setIsOpen] = useState(level === 1); // Level 1 open by default
  const navigate = useNavigate();

  const getSubmissionCount = (itemId: string, type: "quiz" | "assignment") => {
    return submissions.filter((s) =>
      type === "quiz" ? s.quizId === itemId : s.assignmentId === itemId
    ).length;
  };

  const getPendingCount = (itemId: string, type: "quiz" | "assignment") => {
    return submissions.filter(
      (s) =>
        (type === "quiz" ? s.quizId === itemId : s.assignmentId === itemId) &&
        s.status === "pending"
    ).length;
  };

  const totalItems = assignments.length + quizzes.length;
  const totalSubmissions = submissions.filter((s) => s.classId === classId && s.level === level).length;
  const pendingSubmissions = submissions.filter(
    (s) => s.classId === classId && s.level === level && s.status === "pending"
  ).length;

  return (
    <Card className="overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-lg flex items-center justify-center text-white font-bold text-xl">
            {level}
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Tingkatan {level}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalItems} items • {totalSubmissions} submissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {pendingSubmissions > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/20">
              {pendingSubmissions} Pending
            </Badge>
          )}
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
          {/* Assignments Section */}
          {assignments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold">Tugas / Assignments</h4>
              </div>
              <div className="space-y-2">
                {assignments.map((assignment) => {
                  const submissionCount = getSubmissionCount(
                    assignment.id,
                    "assignment"
                  );
                  const pendingCount = getPendingCount(
                    assignment.id,
                    "assignment"
                  );

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <h5 className="font-semibold mb-1">
                          {assignment.title}
                        </h5>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>Pertemuan {assignment.meetingNumber}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {submissionCount} submissions
                          </span>
                          {pendingCount > 0 && (
                            <>
                              <span>•</span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-yellow-100 dark:bg-yellow-900/20"
                              >
                                {pendingCount} pending
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/submissions/assignment/${assignment.id}`)
                        }
                      >
                        View Submissions
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quizzes Section */}
          {quizzes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-bold">Kuis / Quizzes</h4>
              </div>
              <div className="space-y-2">
                {quizzes.map((quiz) => {
                  const submissionCount = getSubmissionCount(quiz.id, "quiz");
                  const pendingCount = getPendingCount(quiz.id, "quiz");

                  return (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <h5 className="font-semibold mb-1">{quiz.title}</h5>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>Pertemuan {quiz.meetingNumber}</span>
                          <span>•</span>
                          <span>{quiz.duration} minutes</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {submissionCount} submissions
                          </span>
                          {pendingCount > 0 && (
                            <>
                              <span>•</span>
                              <Badge
                                variant="secondary"
                                className="text-xs bg-yellow-100 dark:bg-yellow-900/20"
                              >
                                {pendingCount} pending
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/submissions/quiz/${quiz.id}`)
                        }
                      >
                        View Submissions
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {assignments.length === 0 && quizzes.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No assignments or quizzes in this level yet
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
