'use client';

/**
 * Global Error Component for Root Layout
 *
 * Catches errors in the root layout and provides a minimal fallback UI
 * This is used when the error occurs before the main layout can render
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (Sentry removed)
    console.error('Global error occurred:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem',
              }}>
                <svg
                  style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                }}>
                  Application Error
                </h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                }}>
                  A critical error occurred
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                margin: 0,
              }}>
                We're sorry, but the application encountered a critical error.
                The error has been logged and our team will investigate.
              </p>
              {error.digest && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.5rem',
                  marginBottom: 0,
                }}>
                  Error ID:{' '}
                  <code style={{
                    backgroundColor: '#e5e7eb',
                    padding: '0.125rem 0.25rem',
                    borderRadius: '0.25rem',
                  }}>
                    {error.digest}
                  </code>
                </p>
              )}
            </div>

            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <svg
                style={{ width: '1rem', height: '1rem' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>

            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb',
            }}>
              <p style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: 0,
              }}>
                If the problem persists, please{' '}
                <a
                  href="/support"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
