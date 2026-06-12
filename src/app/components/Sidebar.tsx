import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  BookOpenCheck,
  Calculator,
  FileSearch,
  Landmark,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useClasses } from "../hooks/useClasses";
import { getKelasIcon } from "../utils/kelasIcons";

const CLASS_NAME_ICON_MAP: { key: string; icon: LucideIcon }[] = [
  { key: "akuntansi", icon: Calculator },
  { key: "audit", icon: FileSearch },
  { key: "perpajakan", icon: Landmark },
];

function getSidebarIcon(cls: { name: string; icon?: string | null }): LucideIcon {
  if (cls.icon) return getKelasIcon(cls.icon);
  const match = CLASS_NAME_ICON_MAP.find((m) => cls.name.toLowerCase().includes(m.key));
  return match?.icon ?? BookOpen;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { classes } = useClasses();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const adminItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", show: true },
    { label: "User Management", icon: Users, path: "/users", show: user?.role === "superadmin" },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-18 z-40 shadow-sm md:hidden"
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

            {/* SECTION 1: MENU UTAMA */}
            <div>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Menu Utama
              </p>
              <div className="space-y-1">
                {adminItems.filter((i) => i.show).map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Button
                      key={item.label}
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "h-10 w-full justify-start gap-3 px-3 font-medium",
                        active && "bg-secondary text-secondary-foreground",
                      )}
                      onClick={() => { navigate(item.path); setIsOpen(false); }}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: PROGRAM KELAS */}
            <div>
              <div className="mb-2 flex items-center gap-2 px-2">
                <BookOpenCheck className="size-3 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Program Kelas
                </p>
              </div>
              <div className="space-y-1">
                {classes.map((cls) => {
                  const itemPath = `/class/${cls.id}`;
                  const active = isActive(itemPath);
                  const ClsIcon = getSidebarIcon(cls);
                  return (
                    <Button
                      key={cls.id}
                      variant={active ? "secondary" : "ghost"}
                      className={cn(
                        "h-10 w-full justify-start gap-3 px-3 font-medium",
                        active && "bg-secondary text-secondary-foreground",
                      )}
                      onClick={() => { navigate(itemPath); setIsOpen(false); }}
                    >
                      <ClsIcon className="size-4 shrink-0" />
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
