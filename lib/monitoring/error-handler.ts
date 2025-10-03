/**
 * Centralized Error Handler
 *
 * Provides unified error handling across the application with:
 * - Automatic Sentry capture and database logging
 * - Audit trail integration for error-related actions
 * - Consistent error response formatting
 * - User-friendly error messages
 * - Error recovery suggestions
 */

import { NextResponse } from 'next/server';
import { ErrorLevel } from '@prisma/client';
import {
  captureError,
  APIError,
  ValidationError,
  ExternalAPIError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
} from './sentry';
import { createAuditLog } from './audit';

/**
 * Error response interface for API routes
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    suggestions?: string[];
  };
  status: number;
}

/**
 * User-friendly error messages for common error types
 */
const ERROR_MESSAGES: Record<string, { message: string; suggestions: string[] }> = {
  AUTHENTICATION_FAILED: {
    message: 'Authentication failed. Please log in again.',
    suggestions: [
      'Check your credentials',
      'Try logging out and logging back in',
      'Reset your password if you forgot it',
    ],
  },
  AUTHORIZATION_DENIED: {
    message: 'You do not have permission to perform this action.',
    suggestions: [
      'Contact your administrator for access',
      'Check if you are logged in with the correct account',
    ],
  },
  VALIDATION_ERROR: {
    message: 'The provided data is invalid.',
    suggestions: [
      'Check all required fields are filled',
      'Ensure data is in the correct format',
      'Review error details for specific field issues',
    ],
  },
  DATABASE_ERROR: {
    message: 'A database error occurred. Please try again.',
    suggestions: [
      'Try again in a few moments',
      'Contact support if the problem persists',
    ],
  },
  EXTERNAL_API_ERROR: {
    message: 'An external service is temporarily unavailable.',
    suggestions: [
      'Try again in a few minutes',
      'Check the service status page',
      'Contact support if urgent',
    ],
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests. Please slow down.',
    suggestions: [
      'Wait a few minutes before trying again',
      'Upgrade your plan for higher limits',
    ],
  },
  NOT_FOUND: {
    message: 'The requested resource was not found.',
    suggestions: [
      'Check the URL or ID is correct',
      'The resource may have been deleted',
      'Contact support if you believe this is an error',
    ],
  },
  INTERNAL_ERROR: {
    message: 'An unexpected error occurred. We have been notified.',
    suggestions: [
      'Try again in a few moments',
      'Contact support with error details if urgent',
    ],
  },
};

/**
 * Categorize error and determine appropriate level
 */
function categorizeError(error: Error): {
  level: ErrorLevel;
  code: string;
  statusCode: number;
} {
  if (error instanceof AuthenticationError) {
    return { level: ErrorLevel.WARNING, code: 'AUTHENTICATION_FAILED', statusCode: 401 };
  }
  if (error instanceof AuthorizationError) {
    return { level: ErrorLevel.WARNING, code: 'AUTHORIZATION_DENIED', statusCode: 403 };
  }
  if (error instanceof ValidationError) {
    return { level: ErrorLevel.INFO, code: 'VALIDATION_ERROR', statusCode: 400 };
  }
  if (error instanceof DatabaseError) {
    return { level: ErrorLevel.ERROR, code: 'DATABASE_ERROR', statusCode: 500 };
  }
  if (error instanceof ExternalAPIError) {
    return { level: ErrorLevel.WARNING, code: 'EXTERNAL_API_ERROR', statusCode: 503 };
  }
  if (error instanceof APIError) {
    return { level: ErrorLevel.ERROR, code: 'API_ERROR', statusCode: error.statusCode };
  }

  // Default for unknown errors
  return { level: ErrorLevel.ERROR, code: 'INTERNAL_ERROR', statusCode: 500 };
}

/**
 * Get user-friendly message and suggestions for error
 */
function getUserFriendlyMessage(code: string, error: Error): {
  message: string;
  suggestions: string[];
} {
  const template = ERROR_MESSAGES[code] || ERROR_MESSAGES.INTERNAL_ERROR;

  // For validation errors, include field-specific messages
  if (error instanceof ValidationError && error.field) {
    return {
      message: `Validation failed for field: ${error.field}. ${error.message}`,
      suggestions: template.suggestions,
    };
  }

  // For external API errors, include service name
  if (error instanceof ExternalAPIError) {
    return {
      message: `${template.message} Service: ${error.service}`,
      suggestions: template.suggestions,
    };
  }

  return template;
}

/**
 * Handle error and return formatted response
 */
export async function handleError(
  error: Error,
  context?: {
    userId?: string;
    projectId?: string;
    requestId?: string;
    url?: string;
    method?: string;
    ipAddress?: string;
    userAgent?: string;
    additionalContext?: Record<string, any>;
  }
): Promise<ErrorResponse> {
  try {
    // Categorize error
    const { level, code, statusCode } = categorizeError(error);

    // Get user-friendly message
    const { message, suggestions } = getUserFriendlyMessage(code, error);

    // Capture to Sentry and database
    await captureError(error, {
      level,
      userId: context?.userId,
      projectId: context?.projectId,
      context: context?.additionalContext,
      tags: {
        errorCode: code,
        ...(context?.requestId && { requestId: context.requestId }),
      },
      request: {
        url: context?.url,
        method: context?.method,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
        requestId: context?.requestId,
      },
    });

    // Create audit log for error occurrence (for critical/fatal errors)
    if (level === ErrorLevel.CRITICAL || level === ErrorLevel.FATAL) {
      await createAuditLog({
        userId: context?.userId,
        action: 'error_occurred',
        resource: 'SYSTEM' as any,
        resourceId: 'system',
        metadata: {
          errorCode: code,
          errorMessage: error.message,
          level,
          url: context?.url,
          method: context?.method,
        },
      });
    }

    // Return formatted error response
    return {
      error: {
        message,
        code,
        suggestions,
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            originalMessage: error.message,
            stack: error.stack,
          },
        }),
      },
      status: statusCode,
    };
  } catch (handlerError) {
    // Fallback error handling if the handler itself fails
    console.error('Error handler failed:', handlerError);
    console.error('Original error:', error);

    return {
      error: {
        message: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        suggestions: ['Try again in a few moments', 'Contact support if the problem persists'],
      },
      status: 500,
    };
  }
}

/**
 * API route error handler wrapper
 */
export async function apiErrorHandler(
  error: Error,
  request?: Request,
  context?: {
    userId?: string;
    projectId?: string;
  }
): Promise<NextResponse> {
  const errorResponse = await handleError(error, {
    userId: context?.userId,
    projectId: context?.projectId,
    url: request?.url,
    method: request?.method,
    requestId: request?.headers.get('x-request-id') || undefined,
    ipAddress: request?.headers.get('x-forwarded-for') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });

  return NextResponse.json(
    { error: errorResponse.error },
    { status: errorResponse.status }
  );
}

/**
 * Async function error wrapper
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: {
    userId?: string;
    projectId?: string;
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorResponse = await handleError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw new APIError(errorResponse.error.message, errorResponse.status);
    }
  }) as T;
}

/**
 * Check if error should trigger recovery attempt
 */
export function shouldAttemptRecovery(error: Error): boolean {
  // Don't attempt recovery for user errors
  if (
    error instanceof ValidationError ||
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError
  ) {
    return false;
  }

  // Attempt recovery for transient errors
  if (error instanceof ExternalAPIError || error instanceof DatabaseError) {
    return true;
  }

  return false;
}

/**
 * Attempt automatic error recovery
 */
export async function attemptRecovery<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    exponentialBackoff?: boolean;
  }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3;
  const baseDelay = options?.retryDelay || 1000;
  const useExponentialBackoff = options?.exponentialBackoff !== false;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if recovery shouldn't be attempted
      if (!shouldAttemptRecovery(lastError)) {
        throw lastError;
      }

      // Calculate delay with optional exponential backoff
      const delay = useExponentialBackoff
        ? baseDelay * Math.pow(2, attempt)
        : baseDelay;

      // Wait before retrying
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Error boundary helper for server components
 */
export function createServerErrorBoundary<T>(
  component: () => Promise<T>,
  fallback: (error: Error) => T
): () => Promise<T> {
  return async () => {
    try {
      return await component();
    } catch (error) {
      const handledError = error instanceof Error ? error : new Error(String(error));
      await handleError(handledError);
      return fallback(handledError);
    }
  };
}

/**
 * Format validation errors for API responses
 */
export function formatValidationErrors(errors: Record<string, string[]>): ValidationError {
  const firstField = Object.keys(errors)[0];
  const firstError = errors[firstField]?.[0] || 'Validation failed';

  const error = new ValidationError(firstError, firstField);

  // Attach all validation errors as context
  (error as any).validationErrors = errors;

  return error;
}

/**
 * Create rate limit error
 */
export function createRateLimitError(
  limit: number,
  windowMs: number,
  retryAfter?: number
): APIError {
  const error = new APIError(
    `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds.`,
    429
  );

  (error as any).retryAfter = retryAfter || Math.ceil(windowMs / 1000);

  return error;
}

/**
 * Create not found error
 */
export function createNotFoundError(resource: string, id?: string): APIError {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;

  return new APIError(message, 404);
}

/**
 * Log error without throwing (for non-critical errors)
 */
export async function logError(
  error: Error,
  level: ErrorLevel = ErrorLevel.WARNING,
  context?: {
    userId?: string;
    projectId?: string;
    additionalContext?: Record<string, any>;
  }
): Promise<void> {
  try {
    await captureError(error, {
      level,
      userId: context?.userId,
      projectId: context?.projectId,
      context: context?.additionalContext,
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
    console.error('Original error:', error);
  }
}
