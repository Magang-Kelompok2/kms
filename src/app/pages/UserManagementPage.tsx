import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { mockUsers, userProgress, classes } from "../data/mockData";
import { Users, Plus, ArrowLeft, TrendingUp } from "lucide-react";

export function UserManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users] = useState(mockUsers);

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  const getUserProgress = (userId: string) => {
    return userProgress.filter((p) => p.userId === userId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users and monitor their progress
            </p>
          </div>
          <Button onClick={() => navigate("/users/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New User
          </Button>
        </div>

        <div className="grid gap-6">
          {users.map((u) => {
            const progress = getUserProgress(u.id);
            const totalProgress = progress.reduce(
              (acc, p) => acc + p.completedMaterials.length,
              0
            );

            return (
              <Card key={u.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{u.name}</h3>
                        <Badge
                          variant={
                            u.role === "superadmin" ? "default" : "secondary"
                          }
                        >
                          {u.role === "superadmin" ? "Admin" : "Student"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          Joined: {u.createdAt}
                        </span>
                        <span className="text-gray-500">
                          Total Materials: {totalProgress}
                        </span>
                      </div>

                      {progress.length > 0 && u.role === "user" && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-semibold">
                            Class Progress:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {progress.map((p) => {
                              const cls = classes.find(
                                (c) => c.id === p.classId
                              );
                              return (
                                <Badge
                                  key={p.classId}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {cls?.name}: Level {p.currentLevel}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {u.role === "user" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/users/${u.id}/progress`)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Progress
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {users.length === 0 && (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No users found
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
