/**
 * Retry Failed Publishes
 *
 * Automatic and manual retry logic with exponential backoff
 */

import { prisma } from '@/lib/db';
import { updatePublicationStatus, getPublicationByContentAndPlatform } from './status';
import { publishToSinglePlatform } from './manual';
import { getRetryRecommendation, categorizeError } from './errors';
import type { PlatformResult } from '@/lib/validations/publishing';

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Retry failed publication
 */
export async function retryFailedPublication(
  publicationId: string,
  options?: {
    resetRetryCount?: boolean;
  }
): Promise<PlatformResult> {
  // Get publication
  const publication = await prisma.contentPublication.findUnique({
    where: { id: publicationId },
    include: {
      platform: true,
      content: true,
    },
  });

  if (!publication) {
    throw new Error('Publication not found');
  }

  if (publication.status !== 'FAILED') {
    throw new Error('Can only retry failed publications');
  }

  // Check retry recommendation
  const retryRec = getRetryRecommendation(
    publication.error || 'Unknown error',
    publication.retryCount,
    publication.platform.type
  );

  if (!retryRec.shouldRetry) {
    throw new Error(
      `Maximum retries (${retryRec.maxRetries}) exceeded or error is not retriable`
    );
  }

  // Reset retry count if requested
  if (options?.resetRetryCount) {
    await prisma.contentPublication.update({
      where: { id: publicationId },
      data: { retryCount: 0 },
    });
  }

  // Increment retry count
  await prisma.contentPublication.update({
    where: { id: publicationId },
    data: {
      retryCount: { increment: 1 },
      status: 'RETRYING',
    },
  });

  // Attempt to publish again
  const result = await publishToSinglePlatform(
    publication.contentId,
    publication.platformId
  );

  return result;
}

/**
 * Retry all failed publications for content
 */
export async function retryAllFailed(
  contentId: string,
  options?: {
    resetRetryCount?: boolean;
  }
): Promise<{
  total: number;
  retried: number;
  succeeded: number;
  failed: number;
  results: PlatformResult[];
}> {
  // Get all failed publications
  const failedPublications = await prisma.contentPublication.findMany({
    where: {
      contentId,
      status: 'FAILED',
    },
    include: {
      platform: true,
    },
  });

  const results: PlatformResult[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const pub of failedPublications) {
    try {
      const result = await retryFailedPublication(pub.id, options);
      results.push(result);

      if (result.status === 'success') {
        succeeded++;
      } else {
        failed++;
      }
    } catch (error) {
      // Log retry failure but continue
      console.error(`Failed to retry publication ${pub.id}:`, error);
      failed++;

      results.push({
        platformId: pub.platformId,
        platformType: pub.platform.type,
        platformName: pub.platform.name,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    total: failedPublications.length,
    retried: results.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Schedule retry for later
 */
export async function scheduleRetry(
  publicationId: string,
  delay: number // seconds
): Promise<void> {
  const publication = await prisma.contentPublication.findUnique({
    where: { id: publicationId },
  });

  if (!publication) {
    throw new Error('Publication not found');
  }

  // Calculate next retry time
  const nextRetryAt = new Date();
  nextRetryAt.setSeconds(nextRetryAt.getSeconds() + delay);

  // Store retry schedule in metadata
  await prisma.contentPublication.update({
    where: { id: publicationId },
    data: {
      status: 'RETRYING',
      platformMetadata: {
        ...(publication.platformMetadata as any),
        scheduledRetryAt: nextRetryAt,
        retryDelay: delay,
      },
    },
  });
}

/**
 * Process scheduled retries (called by cron)
 */
export async function processScheduledRetries(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();

  // Find publications ready for retry
  const publications = await prisma.contentPublication.findMany({
    where: {
      status: 'RETRYING',
    },
    include: {
      platform: true,
      content: true,
    },
  });

  const readyForRetry = publications.filter((pub) => {
    const metadata = pub.platformMetadata as any;
    if (!metadata?.scheduledRetryAt) return false;

    const scheduledTime = new Date(metadata.scheduledRetryAt);
    return scheduledTime <= now;
  });

  let succeeded = 0;
  let failed = 0;

  for (const pub of readyForRetry) {
    try {
      const result = await retryFailedPublication(pub.id);
      if (result.status === 'success') {
        succeeded++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      console.error(`Failed to retry publication ${pub.id}:`, error);
    }
  }

  return {
    processed: readyForRetry.length,
    succeeded,
    failed,
  };
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelay: number = 60, // seconds
  maxDelay: number = 3600 // 1 hour max
): number {
  const delay = baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, maxDelay);
}

/**
 * Auto-retry failed publications with exponential backoff
 */
export async function autoRetryFailed(
  publicationId: string
): Promise<void> {
  const publication = await prisma.contentPublication.findUnique({
    where: { id: publicationId },
    include: { platform: true },
  });

  if (!publication) {
    throw new Error('Publication not found');
  }

  const errorType = categorizeError(publication.error || 'Unknown error');

  // Don't retry non-retriable errors
  if (errorType === 'non-retriable') {
    return;
  }

  const retryRec = getRetryRecommendation(
    publication.error || 'Unknown error',
    publication.retryCount,
    publication.platform.type
  );

  if (!retryRec.shouldRetry) {
    return;
  }

  // Schedule retry with exponential backoff
  const delay = calculateBackoffDelay(
    publication.retryCount,
    retryRec.delay
  );

  await scheduleRetry(publicationId, delay);
}

/**
 * Get retry status for publication
 */
export async function getRetryStatus(publicationId: string): Promise<{
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  reason?: string;
}> {
  const publication = await prisma.contentPublication.findUnique({
    where: { id: publicationId },
    include: { platform: true },
  });

  if (!publication) {
    throw new Error('Publication not found');
  }

  const retryRec = getRetryRecommendation(
    publication.error || 'Unknown error',
    publication.retryCount,
    publication.platform.type
  );

  const metadata = publication.platformMetadata as any;
  const nextRetryAt = metadata?.scheduledRetryAt
    ? new Date(metadata.scheduledRetryAt)
    : undefined;

  return {
    canRetry: retryRec.shouldRetry,
    retryCount: publication.retryCount,
    maxRetries: retryRec.maxRetries,
    nextRetryAt,
    reason: !retryRec.shouldRetry
      ? publication.retryCount >= retryRec.maxRetries
        ? 'Maximum retries exceeded'
        : 'Error is not retriable'
      : undefined,
  };
}
