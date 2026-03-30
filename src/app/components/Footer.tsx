import { BookOpen, ExternalLink, Link, Mail, Share2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-semibold">KnowledgeHub</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your central hub for knowledge and resources. Learn, discover, and grow.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Link className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Browse Articles
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Categories
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contributors
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contribute
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© 2026 KnowledgeHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
