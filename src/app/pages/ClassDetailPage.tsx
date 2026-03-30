import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { classes, materials, assignments, quizzes, userAccess } from "../data/mockData";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ArrowLeft,
  FileText,
  ClipboardCheck,
  Calendar,
  Lock,
  Plus,
  Eye,
  Edit,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function ClassDetailPage() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentClass = classes.find((c) => c.id === classId);
  const classMaterials = materials.filter((m) => m.classId === classId);
  const classAssignments = assignments.filter((a) => a.classId === classId);
  const classQuizzes = quizzes.filter((q) => q.classId === classId);

  if (!currentClass) {
    return <div>Class not found</div>;
  }

  const canAccess = (itemId: string, type: "material" | "quiz" | "assignment") => {
    if (user?.role === "superadmin") return true;
    
    switch (type) {
      case "material":
        return userAccess.materialIds.includes(itemId);
      case "quiz":
        return userAccess.quizIds.includes(itemId);
      case "assignment":
        return userAccess.assignmentIds.includes(itemId);
      default:
        return false;
    }
  };

  // Group materials by meeting number
  const materialsByMeeting = classMaterials.reduce((acc, material) => {
    const meeting = material.meetingNumber;
    if (!acc[meeting]) {
      acc[meeting] = [];
    }
    acc[meeting].push(material);
    return acc;
  }, {} as Record<number, typeof classMaterials>);

  const meetingNumbers = Object.keys(materialsByMeeting)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="relative h-48">
              <ImageWithFallback
                src={currentClass.icon}
                alt={currentClass.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${currentClass.color} opacity-90`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Coolvetica, sans-serif' }}>
                  {currentClass.name}
                </h1>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <p className="text-gray-600 dark:text-gray-400">
                  {currentClass.description}
                </p>
                {user?.role === "superadmin" && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="materials">
              <FileText className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <Calendar className="h-4 w-4 mr-2" />
              Quizzes
            </TabsTrigger>
          </TabsList>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <div className="space-y-6">
              {meetingNumbers.map((meetingNum) => (
                <div key={meetingNum}>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    📅 Pertemuan {meetingNum}
                  </h3>
                  <div className="grid gap-4">
                    {materialsByMeeting[meetingNum].map((material) => {
                      const hasAccess = canAccess(material.id, "material");
                      const isPublished = material.isPublished;

                      return (
                        <Card
                          key={material.id}
                          className={`p-6 ${
                            hasAccess && isPublished
                              ? "hover:shadow-md cursor-pointer"
                              : "opacity-60"
                          } transition-shadow`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  Pertemuan {material.meetingNumber}
                                </Badge>
                                {!isPublished && (
                                  <Badge variant="outline" className="text-xs">
                                    Draft
                                  </Badge>
                                )}
                                {!hasAccess && user?.role !== "superadmin" && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold mb-1 flex items-center gap-2">
                                {material.title}
                                {!hasAccess && user?.role !== "superadmin" && (
                                  <Lock className="h-4 w-4 text-gray-400" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {material.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {material.createdAt}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {user?.role === "superadmin" && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    Manage Access
                                  </Button>
                                </>
                              )}
                              {hasAccess && isPublished && (
                                <Button size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              {classMaterials.length === 0 && (
                <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No materials available yet
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <div className="grid gap-4">
              {classAssignments.map((assignment) => {
                const hasAccess = canAccess(assignment.id, "assignment");
                const isPublished = assignment.isPublished;

                return (
                  <Card
                    key={assignment.id}
                    className={`p-6 ${
                      hasAccess && isPublished
                        ? "hover:shadow-md cursor-pointer"
                        : "opacity-60"
                    } transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            Pertemuan {assignment.meetingNumber}
                          </Badge>
                          <Badge
                            variant={
                              new Date(assignment.dueDate) > new Date()
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            Due: {assignment.dueDate}
                          </Badge>
                          {!hasAccess && user?.role !== "superadmin" && (
                            <Badge variant="destructive" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {assignment.description}
                        </p>
                      </div>
                      {hasAccess && isPublished && (
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}

              {classAssignments.length === 0 && (
                <Card className="p-12 text-center">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No assignments available
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes">
            <div className="grid gap-4">
              {classQuizzes.map((quiz) => {
                const hasAccess = canAccess(quiz.id, "quiz");
                const isPublished = quiz.isPublished;

                return (
                  <Card
                    key={quiz.id}
                    className={`p-6 ${
                      hasAccess && isPublished
                        ? "hover:shadow-md cursor-pointer"
                        : "opacity-60"
                    } transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            Pertemuan {quiz.meetingNumber}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {quiz.duration} minutes
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {quiz.questions.length} questions
                          </Badge>
                          {!hasAccess && user?.role !== "superadmin" && (
                            <Badge variant="destructive" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{quiz.title}</h4>
                      </div>
                      {hasAccess && isPublished && (
                        <Button size="sm">
                          <Calendar className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}

              {classQuizzes.length === 0 && (
                <Card className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No quizzes available
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}