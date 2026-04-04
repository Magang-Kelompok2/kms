import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  submissions,
  mockUsers,
  quizzes,
  assignments,
  classes,
} from "../data/mockData";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  User,
  Calendar,
} from "lucide-react";
import { useState } from "react";

export function SubmissionListPage() {
  const { type, itemId } = useParams<{ type: string; itemId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localSubmissions, setLocalSubmissions] = useState(submissions);

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  const isQuiz = type === "quiz";
  const item = isQuiz
    ? quizzes.find((q) => q.id === itemId)
    : assignments.find((a) => a.id === itemId);

  const itemSubmissions = localSubmissions.filter((s) =>
    isQuiz ? s.quizId === itemId : s.assignmentId === itemId
  );

  const cls = classes.find((c) => c.id === item?.classId);

  if (!item) {
    return <div>Item not found</div>;
  }

  const handleApprove = (submissionId: string) => {
    setLocalSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, status: "approved" as const } : s
      )
    );
    alert(
      "Submission approved! User can now advance to next level if all requirements are met."
    );
  };

  const handleReject = (submissionId: string) => {
    const feedback = prompt("Enter feedback for rejection:");
    if (feedback) {
      setLocalSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: "rejected" as const, feedback }
            : s
        )
      );
      alert("Submission rejected with feedback.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "rejected":
        return "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${item.classId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Class
        </Button>

        {/* Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{cls?.name}</Badge>
                <Badge variant="outline">Level {item.level}</Badge>
                <Badge variant="default">
                  {isQuiz ? "Quiz" : "Assignment"}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
              {!isQuiz && "description" in item && (
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Total Submissions</p>
              <p className="text-3xl font-bold">{itemSubmissions.length}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
              <Clock className="h-6 w-6 mx-auto text-yellow-600 dark:text-yellow-400 mb-2" />
              <p className="text-2xl font-bold">
                {
                  itemSubmissions.filter((s) => s.status === "pending")
                    .length
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
              <p className="text-2xl font-bold">
                {
                  itemSubmissions.filter((s) => s.status === "approved")
                    .length
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approved
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <XCircle className="h-6 w-6 mx-auto text-red-600 dark:text-red-400 mb-2" />
              <p className="text-2xl font-bold">
                {
                  itemSubmissions.filter((s) => s.status === "rejected")
                    .length
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rejected
              </p>
            </div>
          </div>
        </Card>

        {/* Submissions List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">All Submissions</h2>

          {itemSubmissions.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No submissions yet
              </p>
            </Card>
          ) : (
            itemSubmissions.map((submission) => {
              const student = mockUsers.find((u) => u.id === submission.userId);

              return (
                <Card
                  key={submission.id}
                  className={`p-6 ${getStatusColor(submission.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Student Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-bold">
                          {student?.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold">{student?.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {student?.email}
                          </p>
                        </div>
                      </div>

                      {/* Submission Info */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Submitted:{" "}
                            {new Date(
                              submission.submittedAt
                            ).toLocaleString()}
                          </span>
                        </div>
                        {submission.score !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">
                              Score: {submission.score}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mb-3">
                        <Badge
                          variant={
                            submission.status === "approved"
                              ? "default"
                              : submission.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {submission.status === "pending" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "approved" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status === "rejected" && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {submission.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Feedback */}
                      {submission.feedback && (
                        <div className="bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg">
                          <p className="text-sm">
                            <strong>Feedback:</strong> {submission.feedback}
                          </p>
                        </div>
                      )}

                      {/* Answer Preview */}
                      {isQuiz && submission.answers && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              alert(
                                `Answers: ${JSON.stringify(
                                  submission.answers,
                                  null,
                                  2
                                )}`
                              )
                            }
                          >
                            View Answers
                          </Button>
                        </div>
                      )}

                      {!isQuiz && submission.answers && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                submission.answers.fileUrl,
                                "_blank"
                              )
                            }
                          >
                            View Submitted File
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {submission.status === "pending" && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(submission.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(submission.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
