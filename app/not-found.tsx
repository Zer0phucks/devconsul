/**
 * Not Found (404) Page
 *
 * Custom 404 error page with helpful navigation
 */

import { FileQuestion, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-6">
            <FileQuestion className="h-16 w-16 text-blue-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard">
              <Search className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        </div>

        <div className="pt-6">
          <p className="text-sm text-gray-500">
            Common pages you might be looking for:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href="/dashboard/projects"
              className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
            >
              Projects
            </Link>
            <Link
              href="/dashboard/content"
              className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
            >
              Content
            </Link>
            <Link
              href="/dashboard/platforms"
              className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
            >
              Platforms
            </Link>
            <Link
              href="/settings"
              className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-300"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
