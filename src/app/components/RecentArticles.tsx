import { ArticleCard } from "./ArticleCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function RecentArticles() {
  const articles = [
    {
      image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbm93bGVkZ2UlMjBsaWJyYXJ5JTIwYm9va3MlMjBtb2Rlcm58ZW58MXx8fHwxNzc0ODQwMjE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Development",
      title: "Building Scalable APIs with Node.js and Express",
      excerpt:
        "Learn how to create robust and scalable REST APIs using modern Node.js practices and Express framework.",
      author: "Sarah Chen",
      readTime: "8 min",
      date: "Mar 28",
    },
    {
      image: "https://images.unsplash.com/photo-1625645262499-c2a1e2eb09a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlJTIwbWluaW1hbHxlbnwxfHx8fDE3NzQ4NDAyMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Design",
      title: "Modern UI Design Principles for 2026",
      excerpt:
        "Explore the latest design trends and principles that are shaping user interfaces in the modern era.",
      author: "Alex Rivera",
      readTime: "6 min",
      date: "Mar 27",
    },
    {
      image: "https://images.unsplash.com/photo-1601509876296-aba16d4c10a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc3NDc2NTM0N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Team & Culture",
      title: "Fostering Remote Team Collaboration",
      excerpt:
        "Best practices and tools for building strong remote teams that communicate effectively and stay productive.",
      author: "Marcus Johnson",
      readTime: "10 min",
      date: "Mar 26",
    },
    {
      image: "https://images.unsplash.com/photo-1556792189-55769c8dfbac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RlJTIwcHJvZ3JhbW1pbmclMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NzQ4NDAyMTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Development",
      title: "Introduction to TypeScript for JavaScript Developers",
      excerpt:
        "Make the transition from JavaScript to TypeScript with this comprehensive guide covering all the essentials.",
      author: "Emily Zhang",
      readTime: "12 min",
      date: "Mar 25",
    },
  ];

  const trending = [
    {
      image: "https://images.unsplash.com/photo-1556792189-55769c8dfbac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RlJTIwcHJvZ3JhbW1pbmclMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NzQ4NDAyMTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Product",
      title: "Product-Led Growth Strategies That Actually Work",
      excerpt:
        "Discover proven PLG strategies from successful companies and how to implement them in your organization.",
      author: "David Kim",
      readTime: "9 min",
      date: "Mar 24",
    },
    {
      image: "https://images.unsplash.com/photo-1625645262499-c2a1e2eb09a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwd29ya3NwYWNlJTIwbWluaW1hbHxlbnwxfHx8fDE3NzQ4NDAyMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Security",
      title: "Essential Cybersecurity Practices for Startups",
      excerpt:
        "Protect your startup with these essential security measures that won't break the bank.",
      author: "Lisa Anderson",
      readTime: "7 min",
      date: "Mar 23",
    },
    {
      image: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrbm93bGVkZ2UlMjBsaWJyYXJ5JTIwYm9va3MlMjBtb2Rlcm58ZW58MXx8fHwxNzc0ODQwMjE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Data & Analytics",
      title: "Data Visualization Best Practices",
      excerpt:
        "Create compelling data stories with these proven visualization techniques and principles.",
      author: "Michael Torres",
      readTime: "11 min",
      date: "Mar 22",
    },
    {
      image: "https://images.unsplash.com/photo-1601509876296-aba16d4c10a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlYW0lMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc3NDc2NTM0N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Innovation",
      title: "AI Integration in Modern Workflows",
      excerpt:
        "How AI is transforming everyday workflows and what it means for the future of work.",
      author: "Nina Patel",
      readTime: "8 min",
      date: "Mar 21",
    },
  ];

  return (
    <section className="w-full py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 md:px-6">
        <Tabs defaultValue="recent" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Latest Articles</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Fresh insights and knowledge from our community
              </p>
            </div>
            <TabsList className="mt-4 md:mt-0">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.map((article, index) => (
                <ArticleCard key={index} {...article} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending.map((article, index) => (
                <ArticleCard key={index} {...article} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.slice().reverse().map((article, index) => (
                <ArticleCard key={index} {...article} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-10">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Load More Articles
          </button>
        </div>
      </div>
    </section>
  );
}
