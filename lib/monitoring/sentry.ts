/**
 * Sentry Configuration and Initialization
 *
 * This module configures Sentry for error tracking and monitoring.
 * It provides utilities for:
 * - Error capture and reporting
 * - Performance monitoring
 * - User context tracking
 * - Custom error categorization
 */

import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/db';
import { ErrorLevel, ErrorStatus } from '@prisma/client';
import crypto from 'crypto';

// Sentry configuration
export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Capture errors in these environments
      enabled: process.env.NODE_ENV !== 'test',

      // Release tracking
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

      // Additional options
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }

        // Add custom context
        return event;
      },

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance monitoring
      profilesSampleRate: 0.1,
    });
  }
}

/**
 * Generate error hash for deduplication
 */
export function generateErrorHash(error: Error, context?: Record<string, any>): string {
  const errorString = `${error.name}:${error.message}:${error.stack?.split('\n')[0] || ''}`;
  const contextString = context ? JSON.stringify(context) : '';
  return crypto.createHash('sha256').update(errorString + contextString).digest('hex');
}

/**
 * Generate error fingerprint for grouping
 */
export function generateFingerprint(error: Error): string[] {
  const fingerprint: string[] = [error.name];

  // Extract function name from stack trace
  const stackLines = error.stack?.split('\n') || [];
  if (stackLines.length > 1) {
    const functionMatch = stackLines[1].match(/at\s+([^\s]+)/);
    if (functionMatch) {
      fingerprint.push(functionMatch[1]);
    }
  }

  return fingerprint;
}

/**
 * Map severity level from Sentry to our ErrorLevel enum
 */
export function mapSentryLevel(level?: Sentry.SeverityLevel): ErrorLevel {
  switch (level) {
    case 'debug':
      return ErrorLevel.DEBUG;
    case 'info':
      return ErrorLevel.INFO;
    case 'warning':
      return ErrorLevel.WARNING;
    case 'error':
      return ErrorLevel.ERROR;
    case 'fatal':
      return ErrorLevel.FATAL;
    default:
      return ErrorLevel.ERROR;
  }
}

/**
 * Capture error to Sentry and database
 */
export async function captureError(
  error: Error,
  options?: {
    level?: ErrorLevel;
    userId?: string;
    projectId?: string;
    context?: Record<string, any>;
    tags?: Record<string, string>;
    fingerprint?: string[];
    request?: {
      url?: string;
      method?: string;
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
    };
  }
) {
  try {
    // Capture to Sentry
    const sentryEventId = Sentry.captureException(error, {
      level: options?.level === ErrorLevel.CRITICAL || options?.level === ErrorLevel.FATAL
        ? 'fatal'
        : options?.level === ErrorLevel.WARNING
        ? 'warning'
        : 'error',
      tags: options?.tags,
      user: options?.userId ? { id: options.userId } : undefined,
      contexts: {
        project: options?.projectId ? { id: options.projectId } : undefined,
        custom: options?.context,
      },
      fingerprint: options?.fingerprint,
    });

    // Generate error hash for deduplication
    const errorHash = generateErrorHash(error, options?.context);
    const fingerprint = options?.fingerprint || generateFingerprint(error);

    // Check if error already exists
    const existingError = await prisma.errorLog.findFirst({
      where: { errorHash },
    });

    if (existingError) {
      // Update existing error
      await prisma.errorLog.update({
        where: { id: existingError.id },
        data: {
          occurrences: { increment: 1 },
          lastSeenAt: new Date(),
          sentryEventId: sentryEventId || existingError.sentryEventId,
        },
      });
    } else {
      // Create new error log
      await prisma.errorLog.create({
        data: {
          sentryEventId,
          errorHash,
          fingerprint,
          level: options?.level || ErrorLevel.ERROR,
          message: error.message,
          stackTrace: error.stack,
          errorType: error.name,
          userId: options?.userId,
          projectId: options?.projectId,
          environment: process.env.NODE_ENV || 'development',
          release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
          url: options?.request?.url,
          method: options?.request?.method,
          ipAddress: options?.request?.ipAddress,
          userAgent: options?.request?.userAgent,
          requestId: options?.request?.requestId,
          context: options?.context || {},
          tags: Object.keys(options?.tags || {}),
          status: ErrorStatus.NEW,
        },
      });
    }

    return sentryEventId;
  } catch (captureError) {
    // Fallback: log to console if error capture fails
    console.error('Failed to capture error:', captureError);
    console.error('Original error:', error);
  }
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  name?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: 'debug' | 'info' | 'warning' | 'error',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Create custom error classes for better categorization
 */
export class APIError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ExternalAPIError extends Error {
  constructor(message: string, public service: string) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
