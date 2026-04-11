import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          } md:ml-64`}
        >
          <div className="min-h-[calc(100vh-64px)] p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
