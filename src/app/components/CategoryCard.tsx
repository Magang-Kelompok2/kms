import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  articleCount: number;
  color: string;
}

export function CategoryCard({
  icon: Icon,
  title,
  description,
  articleCount,
  color,
}: CategoryCardProps) {
  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="p-6">
        <div
          className={`inline-flex p-3 rounded-xl mb-4 ${color} transition-transform group-hover:scale-110`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-500">
            {articleCount} articles
          </span>
          <span className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Explore →
          </span>
        </div>
      </div>
    </Card>
  );
}
