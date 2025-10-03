'use client';

/**
 * Global Error Component for Next.js App Router
 *
 * Catches errors at the route level and provides recovery UI
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (Sentry removed)
    console.error('Route error occurred:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500">
              We encountered an unexpected error
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            We're sorry for the inconvenience. The error has been logged and
            our team will investigate.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-gray-500">
              Error ID: <code className="rounded bg-gray-200 px-1 py-0.5">{error.digest}</code>
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="rounded-lg bg-yellow-50 p-4">
            <summary className="cursor-pointer font-medium text-yellow-900">
              Error Details (Development Only)
            </summary>
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-xs font-medium text-yellow-800">Message:</p>
                <p className="text-xs text-yellow-900">{error.message}</p>
              </div>
              {error.stack && (
                <div>
                  <p className="text-xs font-medium text-yellow-800">Stack Trace:</p>
                  <pre className="mt-1 max-h-40 overflow-auto rounded bg-yellow-100 p-2 text-xs text-yellow-900">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-center text-xs text-gray-500">
            Need help?{' '}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
