import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  LogOut,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } z-40 overflow-y-auto`}
    >
      <div className="flex flex-col h-full p-4 gap-6">
        {/* Profile Section */}
        <div
          className={`border-b border-gray-200 pb-6 ${
            isCollapsed ? "text-center" : ""
          }`}
        >
          <button
            onClick={() => navigate("/profile")}
            className="w-full group"
          >
            <div
              className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === "superadmin" ? "Admin" : "Student"}
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 flex flex-col gap-2">
          <div className={!isCollapsed ? "mb-4" : ""}>
            {!isCollapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                Konten
              </p>
            )}

            {/* Dashboard */}
            <button
              onClick={() => navigate("/dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Dashboard" : ""}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </button>

            {/* Classes */}
            <button
              onClick={() => navigate("/dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive("/class")
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? "Kelas" : ""}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Kelas</span>}
            </button>
          </div>

          {/* Admin Section - Only for superadmin */}
          {user?.role === "superadmin" && (
            <div className={!isCollapsed ? "border-t border-gray-200 pt-2" : ""}>
              {!isCollapsed && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                  Admin
                </p>
              )}

              {/* User Management */}
              <button
                onClick={() => navigate("/dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive("/users")
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? "Manajemen Pengguna" : ""}
              >
                <Users className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Manajemen Pengguna</span>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => navigate("/settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? "Pengaturan" : ""}
              >
                <Settings className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">Pengaturan</span>}
              </button>
            </div>
          )}
        </nav>

        {/* Additional Section */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full justify-start text-gray-600 hover:text-gray-900"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Collapse
            </Button>
          )}

          <Button
            onClick={handleLogout}
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={`w-full text-red-600 hover:bg-red-50 hover:text-red-700 ${
              isCollapsed ? "" : "justify-start"
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
