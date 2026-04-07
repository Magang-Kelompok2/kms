import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClassDetailPage } from "./pages/ClassDetailPage";
import { MaterialViewPage } from "./pages/MaterialViewPage";
import { AssignmentViewPage } from "./pages/AssignmentViewPage";
import { QuizViewPage } from "./pages/QuizViewPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { CreateUserPage } from "./pages/CreateUserPage";
import { UserProgressPage } from "./pages/UserProgressPage";
import { SubmissionListPage } from "./pages/SubmissionListPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/class/:classId",
    element: (
      <ProtectedRoute>
        <ClassDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/material/:materialId",
    element: (
      <ProtectedRoute>
        <MaterialViewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/assignment/:assignmentId",
    element: (
      <ProtectedRoute>
        <AssignmentViewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/quiz/:quizId",
    element: (
      <ProtectedRoute>
        <QuizViewPage />
      </ProtectedRoute>
    ),
  },
  // Semua pengumpulan (tugas & kuis) pakai id_tugas karena tidak ada tabel terpisah
  {
    path: "/submissions/tugas/:tugasId",
    element: (
      <ProtectedRoute requireAdmin>
        <SubmissionListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute requireAdmin>
        <UserManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users/create",
    element: (
      <ProtectedRoute requireAdmin>
        <CreateUserPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/users/:userId/progress",
    element: (
      <ProtectedRoute requireAdmin>
        <UserProgressPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
