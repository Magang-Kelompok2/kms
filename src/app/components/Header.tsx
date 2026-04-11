import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function Header() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TK</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            TaxaCore
          </span>
        </div>

        {/* Theme Toggle */}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
