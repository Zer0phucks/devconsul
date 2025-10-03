/**
 * Publishing Validation Schemas
 *
 * Zod validation schemas for all publishing operations
 */

import { z } from 'zod';
import { PlatformType, PublicationStatus } from '@prisma/client';

// ============================================
// REQUEST SCHEMAS
// ============================================

export const publishToSinglePlatformSchema = z.object({
  contentId: z.string().cuid('Invalid content ID'),
  platformId: z.string().cuid('Invalid platform ID'),
  schedule: z.date().optional(),
  dryRun: z.boolean().optional().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export const publishToMultiplePlatformsSchema = z.object({
  contentId: z.string().cuid('Invalid content ID'),
  platformIds: z.array(z.string().cuid()).min(1, 'At least one platform required').max(20, 'Max 20 platforms'),
  schedule: z.date().optional(),
  dryRun: z.boolean().optional().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export const batchPublishSchema = z.object({
  contentIds: z.array(z.string().cuid()).min(1, 'At least one content required').max(50, 'Max 50 content items'),
  platformIds: z.array(z.string().cuid()).min(1, 'At least one platform required').max(20, 'Max 20 platforms'),
  schedule: z.date().optional(),
  dryRun: z.boolean().optional().default(false),
});

export const approveAndPublishSchema = z.object({
  contentId: z.string().cuid('Invalid content ID'),
  platformIds: z.array(z.string().cuid()).min(1, 'At least one platform required'),
  immediate: z.boolean().optional().default(true),
});

export const rejectContentSchema = z.object({
  contentId: z.string().cuid('Invalid content ID'),
  reason: z.string().min(1, 'Rejection reason required').max(500),
  notify: z.boolean().optional().default(true),
});

export const retryPublicationSchema = z.object({
  publicationId: z.string().cuid('Invalid publication ID'),
  resetRetryCount: z.boolean().optional().default(false),
});

export const scheduleRetrySchema = z.object({
  publicationId: z.string().cuid('Invalid publication ID'),
  delay: z.number().int().min(60, 'Min 60 seconds').max(86400, 'Max 24 hours'),
});

export const dryRunPublishSchema = z.object({
  contentId: z.string().cuid('Invalid content ID'),
  platformIds: z.array(z.string().cuid()).min(1, 'At least one platform required'),
});

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const platformResultSchema = z.object({
  platformId: z.string(),
  platformType: z.nativeEnum(PlatformType),
  platformName: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  publicationId: z.string().optional(),
  platformPostId: z.string().optional(),
  platformUrl: z.string().url().optional(),
  error: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export const publishResponseSchema = z.object({
  success: z.boolean(),
  contentId: z.string(),
  results: z.array(platformResultSchema),
  summary: z.object({
    total: z.number(),
    successful: z.number(),
    failed: z.number(),
    pending: z.number(),
  }),
  errors: z.array(z.string()).optional(),
});

export const statusResponseSchema = z.object({
  contentId: z.string(),
  status: z.enum(['draft', 'scheduled', 'publishing', 'published', 'partial', 'failed']),
  publications: z.array(z.object({
    id: z.string(),
    platformId: z.string(),
    platformType: z.nativeEnum(PlatformType),
    platformName: z.string(),
    status: z.nativeEnum(PublicationStatus),
    publishedAt: z.date().nullable(),
    platformUrl: z.string().nullable(),
    error: z.string().nullable(),
    retryCount: z.number(),
  })),
  summary: z.object({
    totalPlatforms: z.number(),
    published: z.number(),
    pending: z.number(),
    failed: z.number(),
    retrying: z.number(),
  }),
});

export const dryRunResultSchema = z.object({
  platformId: z.string(),
  platformType: z.nativeEnum(PlatformType),
  platformName: z.string(),
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  checks: z.object({
    connectionValid: z.boolean(),
    credentialsValid: z.boolean(),
    contentMeetsRequirements: z.boolean(),
    withinCharacterLimit: z.boolean(),
    requiredFieldsPresent: z.boolean(),
  }),
});

export const approvalQueueItemSchema = z.object({
  contentId: z.string(),
  platformIds: z.array(z.string()),
  addedAt: z.date(),
  expiresAt: z.date(),
  status: z.enum(['pending', 'approved', 'rejected']),
  content: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
  }),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type PublishToSinglePlatformInput = z.infer<typeof publishToSinglePlatformSchema>;
export type PublishToMultiplePlatformsInput = z.infer<typeof publishToMultiplePlatformsSchema>;
export type BatchPublishInput = z.infer<typeof batchPublishSchema>;
export type ApproveAndPublishInput = z.infer<typeof approveAndPublishSchema>;
export type RejectContentInput = z.infer<typeof rejectContentSchema>;
export type RetryPublicationInput = z.infer<typeof retryPublicationSchema>;
export type ScheduleRetryInput = z.infer<typeof scheduleRetrySchema>;
export type DryRunPublishInput = z.infer<typeof dryRunPublishSchema>;

export type PlatformResult = z.infer<typeof platformResultSchema>;
export type PublishResponse = z.infer<typeof publishResponseSchema>;
export type StatusResponse = z.infer<typeof statusResponseSchema>;
export type DryRunResult = z.infer<typeof dryRunResultSchema>;
export type ApprovalQueueItem = z.infer<typeof approvalQueueItemSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate content meets platform-specific requirements
 */
export function validateContentForPlatform(
  content: { title: string; body: string; excerpt?: string },
  platformType: PlatformType
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Character limits by platform
  const limits: Record<PlatformType, { title?: number; body?: number; excerpt?: number }> = {
    TWITTER: { body: 280 },
    LINKEDIN: { title: 200, body: 3000 },
    FACEBOOK: { body: 63206 },
    REDDIT: { title: 300, body: 40000 },
    HASHNODE: { title: 200, body: 1000000 },
    DEVTO: { title: 200, body: 1000000 },
    MEDIUM: { title: 200, body: 1000000 },
    WORDPRESS: { title: 200, body: 1000000 },
    GHOST: { title: 200, body: 1000000 },
    NEWSLETTER: { title: 200, body: 1000000 },
    RESEND: { title: 200, body: 1000000 },
    SENDGRID: { title: 200, body: 1000000 },
    MAILCHIMP: { title: 200, body: 1000000 },
    RSS_FEED: { title: 200, body: 1000000 },
    WEBHOOK: { title: 200, body: 1000000 },
  };

  const platformLimits = limits[platformType];

  // Check title length
  if (platformLimits.title && content.title.length > platformLimits.title) {
    errors.push(
      `Title exceeds ${platformLimits.title} characters (current: ${content.title.length}). Shorten by ${
        content.title.length - platformLimits.title
      } characters.`
    );
  }

  // Check body length
  if (platformLimits.body && content.body.length > platformLimits.body) {
    errors.push(
      `Content exceeds ${platformLimits.body} characters (current: ${content.body.length}). Shorten by ${
        content.body.length - platformLimits.body
      } characters.`
    );
  }

  // Platform-specific validations
  switch (platformType) {
    case 'TWITTER':
      // Warn if no hashtags
      if (!content.body.includes('#')) {
        warnings.push('No hashtags included. Consider adding relevant hashtags for better reach.');
      }
      break;

    case 'LINKEDIN':
    case 'FACEBOOK':
      // Warn if title is missing
      if (!content.title || content.title.trim().length === 0) {
        warnings.push('Title is recommended for better engagement on this platform.');
      }
      break;

    case 'REDDIT':
      // Reddit requires title
      if (!content.title || content.title.trim().length === 0) {
        errors.push('Title is required for Reddit posts.');
      }
      break;

    case 'NEWSLETTER':
    case 'RESEND':
    case 'SENDGRID':
    case 'MAILCHIMP':
      // Email platforms require title (subject)
      if (!content.title || content.title.trim().length === 0) {
        errors.push('Subject line (title) is required for email campaigns.');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Categorize errors for retry logic
 */
export function categorizeError(error: string | Error): 'retriable' | 'non-retriable' {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();

  // Non-retriable errors
  const nonRetriablePatterns = [
    'invalid credentials',
    'unauthorized',
    'authentication failed',
    'forbidden',
    'content violation',
    'spam detected',
    'invalid content',
    'permanently deleted',
    'account suspended',
    'quota exceeded permanently',
  ];

  if (nonRetriablePatterns.some((pattern) => lowerError.includes(pattern))) {
    return 'non-retriable';
  }

  // Retriable errors
  const retriablePatterns = [
    'rate limit',
    'too many requests',
    'network error',
    'timeout',
    'connection failed',
    'temporary error',
    'service unavailable',
    'internal server error',
    'gateway timeout',
  ];

  if (retriablePatterns.some((pattern) => lowerError.includes(pattern))) {
    return 'retriable';
  }

  // Default to retriable for unknown errors
  return 'retriable';
}
