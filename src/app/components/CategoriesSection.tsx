import {
  Code,
  Briefcase,
  Lightbulb,
  Rocket,
  Users,
  Database,
  Palette,
  Shield,
} from "lucide-react";
import { CategoryCard } from "./CategoryCard";

export function CategoriesSection() {
  const categories = [
    {
      icon: Code,
      title: "Development",
      description: "Programming tutorials, best practices, and technical guides",
      articleCount: 324,
      color: "bg-blue-500",
    },
    {
      icon: Palette,
      title: "Design",
      description: "UI/UX principles, design systems, and creative resources",
      articleCount: 189,
      color: "bg-purple-500",
    },
    {
      icon: Briefcase,
      title: "Business",
      description: "Strategy, management, and professional development",
      articleCount: 256,
      color: "bg-green-500",
    },
    {
      icon: Rocket,
      title: "Product",
      description: "Product management, roadmaps, and user research",
      articleCount: 142,
      color: "bg-orange-500",
    },
    {
      icon: Users,
      title: "Team & Culture",
      description: "Collaboration, team building, and workplace culture",
      articleCount: 98,
      color: "bg-pink-500",
    },
    {
      icon: Database,
      title: "Data & Analytics",
      description: "Data science, analytics tools, and insights",
      articleCount: 167,
      color: "bg-cyan-500",
    },
    {
      icon: Shield,
      title: "Security",
      description: "Cybersecurity, privacy, and best practices",
      articleCount: 134,
      color: "bg-red-500",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Emerging trends, new technologies, and ideas",
      articleCount: 87,
      color: "bg-yellow-500",
    },
  ];

  return (
    <section className="w-full py-16 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Browse by Category</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Explore knowledge organized by topics
            </p>
          </div>
          <button className="text-blue-600 dark:text-blue-400 hover:underline mt-4 md:mt-0">
            View all categories →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <CategoryCard key={index} {...category} />
          ))}
        </div>
      </div>
    </section>
  );
}
