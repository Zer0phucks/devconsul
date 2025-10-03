/**
 * Batch Publishing
 *
 * Publish multiple content items to multiple platforms efficiently
 */

import { publishToSinglePlatform, publishToMultiplePlatforms } from './manual';
import type { PublishResponse, PlatformResult } from '@/lib/validations/publishing';

// ============================================
// BATCH PUBLISHING
// ============================================

/**
 * Publish multiple content items to specified platforms
 */
export async function batchPublish(
  contentIds: string[],
  platformIds: string[],
  options?: {
    dryRun?: boolean;
    maxConcurrent?: number;
  }
): Promise<{
  success: boolean;
  results: Record<string, PublishResponse>;
  summary: {
    totalContent: number;
    totalPublications: number;
    successful: number;
    failed: number;
  };
}> {
  const maxConcurrent = options?.maxConcurrent || 3;
  const results: Record<string, PublishResponse> = {};

  // Process content items in batches
  for (let i = 0; i < contentIds.length; i += maxConcurrent) {
    const batch = contentIds.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(async (contentId) => {
        const result = await publishToMultiplePlatforms(
          contentId,
          platformIds,
          { dryRun: options?.dryRun }
        );
        return { contentId, result };
      })
    );

    batchResults.forEach(({ contentId, result }) => {
      results[contentId] = result;
    });
  }

  // Calculate overall summary
  const summary = {
    totalContent: contentIds.length,
    totalPublications: Object.values(results).reduce(
      (sum, r) => sum + r.summary.total,
      0
    ),
    successful: Object.values(results).reduce(
      (sum, r) => sum + r.summary.successful,
      0
    ),
    failed: Object.values(results).reduce(
      (sum, r) => sum + r.summary.failed,
      0
    ),
  };

  return {
    success: summary.failed === 0,
    results,
    summary,
  };
}

/**
 * Publish single content to all platforms
 */
export async function publishAllPlatforms(
  contentId: string,
  platformIds: string[],
  options?: {
    dryRun?: boolean;
  }
): Promise<PublishResponse> {
  return publishToMultiplePlatforms(contentId, platformIds, options);
}

/**
 * Get batch publishing progress
 */
export function calculateBatchProgress(
  results: Record<string, PublishResponse>
): {
  totalItems: number;
  completedItems: number;
  successfulItems: number;
  failedItems: number;
  percentComplete: number;
} {
  const totalItems = Object.keys(results).length;
  const completedItems = totalItems; // All are complete when in results
  const successfulItems = Object.values(results).filter((r) => r.success).length;
  const failedItems = totalItems - successfulItems;
  const percentComplete = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return {
    totalItems,
    completedItems,
    successfulItems,
    failedItems,
    percentComplete,
  };
}
