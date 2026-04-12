import type { ReactNode } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { Sidebar } from "./Sidebar";
import { cn } from "./ui/utils";

type AppLayoutProps = {
  children: ReactNode;
  /** Classes on the inner container (max-width, padding overrides, flex, etc.) */
  className?: string;
  /** Extra classes on the main content region */
  mainClassName?: string;
};

/**
 * Authenticated shell: header, sidebar, and a main column aligned with shadcn-style spacing.
 */
export function AppLayout({ children, className, mainClassName }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main
          className={cn(
            "min-h-[calc(100vh-4rem)] flex-1 border-t border-border/60",
            mainClassName,
          )}
        >
          <div
            className={cn(
              "container mx-auto max-w-6xl px-4 py-8 md:px-6",
              className,
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
