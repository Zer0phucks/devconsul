/**
 * Publishing Error Handling & Message Mapping
 *
 * User-friendly error messages with actionable suggestions
 */

import { PlatformType } from '@prisma/client';

export interface ErrorMapping {
  pattern: string | RegExp;
  userMessage: string;
  suggestion: string;
  recoverable: boolean;
}

// ============================================
// PLATFORM-SPECIFIC ERROR MAPPINGS
// ============================================

const commonErrorMappings: ErrorMapping[] = [
  // Authentication errors
  {
    pattern: /invalid\s+(credentials|token|api\s*key)/i,
    userMessage: 'Connection expired or invalid credentials',
    suggestion: 'Please reconnect your account in platform settings.',
    recoverable: false,
  },
  {
    pattern: /unauthorized|403|forbidden/i,
    userMessage: 'Permission denied',
    suggestion: 'Check that your account has publishing permissions.',
    recoverable: false,
  },
  {
    pattern: /authentication\s+failed/i,
    userMessage: 'Authentication failed',
    suggestion: 'Reconnect your account with valid credentials.',
    recoverable: false,
  },

  // Rate limiting
  {
    pattern: /rate\s+limit|too\s+many\s+requests|429/i,
    userMessage: 'Rate limit exceeded',
    suggestion: 'You\'ve posted too frequently. Try again in 1-2 hours.',
    recoverable: true,
  },
  {
    pattern: /quota\s+exceeded/i,
    userMessage: 'Daily quota exceeded',
    suggestion: 'You\'ve reached your daily posting limit. Try again tomorrow.',
    recoverable: true,
  },

  // Content validation
  {
    pattern: /content\s+(too\s+long|exceeds|limit)/i,
    userMessage: 'Content exceeds platform limit',
    suggestion: 'Shorten your content to meet platform requirements.',
    recoverable: false,
  },
  {
    pattern: /spam|abuse|violation/i,
    userMessage: 'Content flagged as spam or policy violation',
    suggestion: 'Review platform content guidelines and modify your post.',
    recoverable: false,
  },
  {
    pattern: /duplicate|already\s+published/i,
    userMessage: 'Content already published',
    suggestion: 'This content has already been posted to this platform.',
    recoverable: false,
  },

  // Network errors
  {
    pattern: /network\s+(error|timeout)|ECONNREFUSED|ETIMEDOUT/i,
    userMessage: 'Connection timed out',
    suggestion: 'Check your internet connection and try again.',
    recoverable: true,
  },
  {
    pattern: /dns|ENOTFOUND/i,
    userMessage: 'Network connection failed',
    suggestion: 'Check your internet connection or try again later.',
    recoverable: true,
  },

  // API errors
  {
    pattern: /internal\s+server\s+error|500/i,
    userMessage: 'Platform server error',
    suggestion: 'The platform is experiencing issues. Try again in a few minutes.',
    recoverable: true,
  },
  {
    pattern: /service\s+unavailable|503/i,
    userMessage: 'Service temporarily unavailable',
    suggestion: 'The platform is down for maintenance. Try again later.',
    recoverable: true,
  },
  {
    pattern: /gateway\s+timeout|504/i,
    userMessage: 'Request timed out',
    suggestion: 'The platform is slow to respond. Try again in a few minutes.',
    recoverable: true,
  },

  // Resource errors
  {
    pattern: /not\s+found|404/i,
    userMessage: 'Resource not found',
    suggestion: 'The target resource no longer exists. Reconnect your platform.',
    recoverable: false,
  },
  {
    pattern: /insufficient\s+(credit|balance|quota)/i,
    userMessage: 'Insufficient account balance',
    suggestion: 'Your platform account needs additional credits or quota.',
    recoverable: false,
  },
];

// Platform-specific error mappings
const platformErrorMappings: Record<PlatformType, ErrorMapping[]> = {
  TWITTER: [
    {
      pattern: /status is a duplicate/i,
      userMessage: 'Duplicate tweet',
      suggestion: 'You\'ve posted this exact content recently. Try modifying the text.',
      recoverable: false,
    },
    {
      pattern: /user is over daily status update limit/i,
      userMessage: 'Daily tweet limit reached',
      suggestion: 'Twitter limits tweets per day. Try again tomorrow.',
      recoverable: true,
    },
  ],

  LINKEDIN: [
    {
      pattern: /access token expired/i,
      userMessage: 'LinkedIn connection expired',
      suggestion: 'Reconnect your LinkedIn account. Tokens expire after 60 days.',
      recoverable: false,
    },
  ],

  WORDPRESS: [
    {
      pattern: /post already exists/i,
      userMessage: 'Post with this title already exists',
      suggestion: 'Change the post title or update the existing post instead.',
      recoverable: false,
    },
    {
      pattern: /invalid post status/i,
      userMessage: 'Invalid post status',
      suggestion: 'Check your WordPress settings for allowed post statuses.',
      recoverable: false,
    },
  ],

  MEDIUM: [
    {
      pattern: /token is invalid/i,
      userMessage: 'Medium integration token expired',
      suggestion: 'Generate a new integration token in Medium settings.',
      recoverable: false,
    },
  ],

  HASHNODE: [
    {
      pattern: /publication not found/i,
      userMessage: 'Hashnode publication not found',
      suggestion: 'Verify your publication ID in platform settings.',
      recoverable: false,
    },
  ],

  DEVTO: [
    {
      pattern: /article already exists/i,
      userMessage: 'Article already published on DEV',
      suggestion: 'This article is already on your DEV profile.',
      recoverable: false,
    },
  ],

  REDDIT: [
    {
      pattern: /subreddit not found/i,
      userMessage: 'Subreddit does not exist',
      suggestion: 'Check the subreddit name in your platform configuration.',
      recoverable: false,
    },
    {
      pattern: /you are doing that too much/i,
      userMessage: 'Reddit posting frequency limit',
      suggestion: 'Wait 10-15 minutes before posting again.',
      recoverable: true,
    },
  ],

  FACEBOOK: [
    {
      pattern: /permissions error/i,
      userMessage: 'Facebook permissions insufficient',
      suggestion: 'Reauthorize the app with "publish_pages" permission.',
      recoverable: false,
    },
  ],

  RESEND: [
    {
      pattern: /invalid\s+from\s+email/i,
      userMessage: 'Invalid sender email',
      suggestion: 'Verify your domain with Resend or use a verified sender email.',
      recoverable: false,
    },
  ],

  SENDGRID: [
    {
      pattern: /sender\s+verification\s+required/i,
      userMessage: 'Sender email not verified',
      suggestion: 'Verify your sender email address in SendGrid settings.',
      recoverable: false,
    },
  ],

  MAILCHIMP: [
    {
      pattern: /list\s+does\s+not\s+exist/i,
      userMessage: 'Mailchimp audience not found',
      suggestion: 'Check your audience ID in Mailchimp settings.',
      recoverable: false,
    },
  ],

  // Default empty arrays for other platforms
  GHOST: [],
  NEWSLETTER: [],
  RSS_FEED: [],
  WEBHOOK: [],
};

// ============================================
// ERROR MAPPING FUNCTIONS
// ============================================

/**
 * Map raw error to user-friendly message with actionable suggestion
 */
export function mapErrorToUserMessage(
  error: string | Error,
  platformType?: PlatformType
): {
  userMessage: string;
  suggestion: string;
  recoverable: boolean;
  originalError: string;
} {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Try platform-specific mappings first
  if (platformType) {
    const platformMappings = platformErrorMappings[platformType] || [];
    for (const mapping of platformMappings) {
      const pattern = typeof mapping.pattern === 'string'
        ? new RegExp(mapping.pattern, 'i')
        : mapping.pattern;

      if (pattern.test(errorMessage)) {
        return {
          userMessage: mapping.userMessage,
          suggestion: mapping.suggestion,
          recoverable: mapping.recoverable,
          originalError: errorMessage,
        };
      }
    }
  }

  // Fall back to common error mappings
  for (const mapping of commonErrorMappings) {
    const pattern = typeof mapping.pattern === 'string'
      ? new RegExp(mapping.pattern, 'i')
      : mapping.pattern;

    if (pattern.test(errorMessage)) {
      return {
        userMessage: mapping.userMessage,
        suggestion: mapping.suggestion,
        recoverable: mapping.recoverable,
        originalError: errorMessage,
      };
    }
  }

  // Default error message for unrecognized errors
  return {
    userMessage: 'Publishing failed',
    suggestion: 'An unexpected error occurred. Please try again or contact support.',
    recoverable: true,
    originalError: errorMessage,
  };
}

/**
 * Format error for display to user
 */
export function formatErrorForDisplay(
  error: string | Error,
  platformType?: PlatformType,
  platformName?: string
): string {
  const mapped = mapErrorToUserMessage(error, platformType);

  const platformPrefix = platformName ? `${platformName}: ` : '';

  return `${platformPrefix}${mapped.userMessage}. ${mapped.suggestion}`;
}

/**
 * Get retry recommendation based on error
 */
export function getRetryRecommendation(
  error: string | Error,
  retryCount: number,
  platformType?: PlatformType
): {
  shouldRetry: boolean;
  delay: number; // seconds
  maxRetries: number;
} {
  const mapped = mapErrorToUserMessage(error, platformType);

  // Don't retry non-recoverable errors
  if (!mapped.recoverable) {
    return {
      shouldRetry: false,
      delay: 0,
      maxRetries: 0,
    };
  }

  // Rate limit errors: longer delay, fewer retries
  if (mapped.originalError.toLowerCase().includes('rate limit')) {
    return {
      shouldRetry: retryCount < 3,
      delay: 3600, // 1 hour
      maxRetries: 3,
    };
  }

  // Network errors: exponential backoff, more retries
  if (mapped.originalError.toLowerCase().includes('network') ||
      mapped.originalError.toLowerCase().includes('timeout')) {
    return {
      shouldRetry: retryCount < 5,
      delay: Math.min(60 * Math.pow(2, retryCount), 900), // 1min, 2min, 4min, 8min, 15min
      maxRetries: 5,
    };
  }

  // Server errors: moderate retry strategy
  if (mapped.originalError.toLowerCase().includes('server error') ||
      mapped.originalError.toLowerCase().includes('503')) {
    return {
      shouldRetry: retryCount < 3,
      delay: Math.min(300 * Math.pow(2, retryCount), 1800), // 5min, 10min, 30min
      maxRetries: 3,
    };
  }

  // Default retry strategy
  return {
    shouldRetry: retryCount < 3,
    delay: Math.min(60 * Math.pow(2, retryCount), 600), // 1min, 2min, 4min
    maxRetries: 3,
  };
}

/**
 * Categorize error severity
 */
export function categorizeErrorSeverity(
  error: string | Error,
  platformType?: PlatformType
): 'low' | 'medium' | 'high' | 'critical' {
  const mapped = mapErrorToUserMessage(error, platformType);
  const errorLower = mapped.originalError.toLowerCase();

  // Critical: data loss, security issues
  if (errorLower.includes('data loss') || errorLower.includes('security')) {
    return 'critical';
  }

  // High: permanent failures requiring user action
  if (!mapped.recoverable) {
    return 'high';
  }

  // Medium: rate limits, temporary server issues
  if (errorLower.includes('rate limit') || errorLower.includes('quota')) {
    return 'medium';
  }

  // Low: transient network issues
  if (errorLower.includes('network') || errorLower.includes('timeout')) {
    return 'low';
  }

  return 'medium';
}

/**
 * Generate error notification content
 */
export function generateErrorNotification(
  error: string | Error,
  contentTitle: string,
  platformType?: PlatformType,
  platformName?: string
): {
  subject: string;
  body: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const mapped = mapErrorToUserMessage(error, platformType);
  const severity = categorizeErrorSeverity(error, platformType);
  const platform = platformName || platformType || 'platform';

  return {
    subject: `Publishing failed: ${contentTitle}`,
    body: `
Failed to publish "${contentTitle}" to ${platform}.

Error: ${mapped.userMessage}

Suggestion: ${mapped.suggestion}

${mapped.recoverable ? 'This issue may be temporary. You can retry publishing from the dashboard.' : 'This requires your attention to fix before publishing can succeed.'}
    `.trim(),
    severity,
  };
}
