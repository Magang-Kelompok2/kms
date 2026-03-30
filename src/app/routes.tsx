import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClassDetailPage } from "./pages/ClassDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
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
    path: "/class/:classId",
    element: (
      <ProtectedRoute>
        <ClassDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
