import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Your Central Hub for
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Knowledge & Resources
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Access curated articles, documentation, and guides all in one place.
            Search, discover, and learn efficiently.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mt-8">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="What do you want to learn today?"
                  className="pl-12 h-14 text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 shadow-lg"
                />
              </div>
              <Button size="lg" className="h-14 px-8">
                Search
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 w-full">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                1,247
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Articles
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                156
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Categories
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                2,849
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Contributors
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
