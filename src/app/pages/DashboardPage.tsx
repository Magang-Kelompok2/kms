import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { classes, materials, assignments, quizzes, userAccess } from "../data/mockData";
import { Card } from "../components/ui/card";
import { BookOpen, FileText, ClipboardCheck, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getAccessibleMaterials = () => {
    if (user?.role === "superadmin") {
      return materials;
    }
    return materials.filter(
      (m) => m.isPublished && userAccess.materialIds.includes(m.id)
    );
  };

  const getAccessibleQuizzes = () => {
    if (user?.role === "superadmin") {
      return quizzes;
    }
    return quizzes.filter(
      (q) => q.isPublished && userAccess.quizIds.includes(q.id)
    );
  };

  const getAccessibleAssignments = () => {
    if (user?.role === "superadmin") {
      return assignments;
    }
    return assignments.filter(
      (a) => a.isPublished && userAccess.assignmentIds.includes(a.id)
    );
  };

  const accessibleMaterials = getAccessibleMaterials();
  const accessibleQuizzes = getAccessibleQuizzes();
  const accessibleAssignments = getAccessibleAssignments();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-2">
            Selamat Datang Kembali, {user?.name}! 
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === "superadmin"
              ? "Kelola kelas, materi, dan kuis dengan mudah"
              : "Lihat perkembangan kelas dan materi yang kamu ikuti"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Classes
                </p>
                <p className="text-2xl font-semibold">{classes.length}</p>
              </div>
              <BookOpen className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Materials
                </p>
                <p className="text-2xl font-semibold">{accessibleMaterials.length}</p>
              </div>
              <FileText className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Assignments
                </p>
                <p className="text-2xl font-semibold">{accessibleAssignments.length}</p>
              </div>
              <ClipboardCheck className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Quizzes
                </p>
                <p className="text-2xl font-semibold">{accessibleQuizzes.length}</p>
              </div>
              <Calendar className="h-10 w-10 text-orange-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-normal">Your Classes</h2>
            {user?.role === "superadmin" && (
              <button className="text-blue-600 dark:text-blue-400 hover:underline">
                + Add New Class
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const classMaterials = materials.filter((m) => m.classId === cls.id);
              const classQuizzes = quizzes.filter((q) => q.classId === cls.id);
              
              return (
                <Card
                  key={cls.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                  onClick={() => navigate(`/class/${cls.id}`)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <ImageWithFallback
                      src={cls.icon}
                      alt={cls.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${cls.color} opacity-75`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-2xl font-normal text-white" style={{ fontFamily: 'Coolvetica, sans-serif' }}>
                        {cls.name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {cls.description}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">
                        {classMaterials.length} materials
                      </span>
                      <span className="text-gray-500">
                        {classQuizzes.length} quizzes
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Materials */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-normal">Recent Materials</h2>
            <button className="text-blue-600 dark:text-blue-400 hover:underline">
              View all →
            </button>
          </div>

          <div className="grid gap-4">
            {accessibleMaterials.slice(0, 5).map((material) => {
              const cls = classes.find((c) => c.id === material.classId);
              return (
                <Card
                  key={material.id}
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/class/${material.classId}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {cls?.name}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Pertemuan {material.meetingNumber}
                        </Badge>
                        {!material.isPublished && user?.role === "superadmin" && (
                          <Badge variant="destructive" className="text-xs">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-seminormal mb-1">{material.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {material.description}
                      </p>
                    </div>
                    <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700 ml-4" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}