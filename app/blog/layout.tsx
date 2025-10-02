import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Dev Blog',
    default: 'Dev Blog',
  },
  description: 'Automated development blog powered by AI and GitHub activity',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blog Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/blog" className="text-2xl font-bold text-gray-900">
                Dev Blog
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/blog"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Posts
              </Link>
              <Link
                href="/blog/archive"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Archive
              </Link>
              <Link
                href="/blog/tags"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Tags
              </Link>
              <Link
                href="/newsletter"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-md"
              >
                Subscribe
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Powered by GitHub Activity & AI
            </p>
            <div className="flex space-x-4">
              <Link
                href="/blog/rss"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                RSS Feed
              </Link>
              <Link
                href="/admin"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}