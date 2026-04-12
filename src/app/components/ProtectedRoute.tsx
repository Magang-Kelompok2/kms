import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== "superadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
