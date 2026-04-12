import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Users,
  Calculator,      // Cocok untuk Akuntansi
  FileSearch,      // Cocok untuk Audit
  Landmark,        // Cocok untuk Perpajakan/Gedung Pajak
  Menu,
  X,
  BookOpenCheck,   // Icon tambahan untuk header section
} from "lucide-react";
import { cn } from "./ui/utils";

// Data Kelas (Dinamis)
const CLASS_DATA = [
  { id: 1, name: "Akuntansi", icon: Calculator },
  { id: 2, name: "Audit", icon: FileSearch },
  { id: 3, name: "Perpajakan", icon: Landmark },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Navigasi Admin
  const adminItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      show: true,
    },
    {
      label: "User Management",
      icon: Users,
      path: "/users",
      show: user?.role === "superadmin",
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-[4.5rem] z-40 shadow-sm md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out",
          "md:sticky md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-6 p-4">
            
            {/* SECTION 1: ADMIN/GENERAL */}
            <div>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Menu Utama
              </p>
              <div className="space-y-1">
                {adminItems.filter(i => i.show).map((item) => {
                  const Icon = item.icon;
                  const isItemActive = isActive(item.path);
                  return (
                    <Button
                      key={item.label}
                      variant={isItemActive ? "secondary" : "ghost"}
                      className={cn(
                        "h-10 w-full justify-start gap-3 px-3 font-medium",
                        isItemActive && "bg-secondary text-secondary-foreground"
                      )}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: KELAS (Dinamis) */}
            <div>
              <div className="mb-2 flex items-center gap-2 px-2">
                <BookOpenCheck className="size-3 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Program Kelas
                </p>
              </div>
              <div className="space-y-1">
                {CLASS_DATA.map((cls) => {
                  const Icon = cls.icon;
                  const itemPath = `/class/${cls.id}`;
                  const isItemActive = isActive(itemPath);

                  return (
                    <Button
                      key={cls.id}
                      variant={isItemActive ? "secondary" : "ghost"}
                      className={cn(
                        "h-10 w-full justify-start gap-3 px-3 font-medium",
                        isItemActive && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                      onClick={() => {
                        navigate(itemPath);
                        setIsOpen(false);
                      }}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{cls.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* SECTION 3: USER PROFILE */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[11px] font-medium text-muted-foreground uppercase">
                  {user?.role === "superadmin" ? "Super Admin" : "Student"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}