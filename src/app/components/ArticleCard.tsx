import { Clock, User, Bookmark } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ArticleCardProps {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  date: string;
}

export function ArticleCard({
  image,
  category,
  title,
  excerpt,
  author,
  readTime,
  date,
}: ArticleCardProps) {
  return (
    <Card className="group overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
      <div className="relative overflow-hidden aspect-video">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-900">
            {category}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {excerpt}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{readTime}</span>
            </div>
          </div>
          <span>{date}</span>
        </div>
      </div>
    </Card>
  );
}
