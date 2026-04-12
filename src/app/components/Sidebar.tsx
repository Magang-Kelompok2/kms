import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "./ui/utils";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  const menuItems = [
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
    {
      label: "Akuntansi",
      icon: BookOpen,
      path: "#",
      show: true,
      disabled: true,
    },
    {
      label: "Audit",
      icon: Zap,
      path: "#",
      show: true,
      disabled: true,
    },
    {
      label: "Perpajakan",
      icon: BookOpen,
      path: "#",
      show: true,
      disabled: true,
    },
  ];

  const visibleItems = menuItems.filter((item) => item.show);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-[4.5rem] z-40 shadow-sm md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Tutup menu" : "Buka menu"}
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
          <nav className="flex-1 space-y-1 p-3">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = isActive(item.path);

              return (
                <Button
                  key={item.label}
                  type="button"
                  variant={isItemActive && !item.disabled ? "secondary" : "ghost"}
                  disabled={item.disabled}
                  className={cn(
                    "h-auto w-full justify-start gap-3 px-3 py-2.5 font-medium",
                    item.disabled && "opacity-50",
                  )}
                  onClick={() => {
                    if (!item.disabled) {
                      navigate(item.path);
                      setIsOpen(false);
                    }
                  }}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.role === "superadmin" ? "Super Admin" : "Student"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          aria-label="Tutup menu samping"
          onClick={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
