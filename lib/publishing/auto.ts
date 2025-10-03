/**
 * Auto-Publish Logic
 *
 * Automatic publishing workflow after content generation
 */

import { prisma } from '@/lib/db';
import { publishToMultiplePlatforms } from './manual';
import { addToApprovalQueue } from './approval';
import type { PublishResponse } from '@/lib/validations/publishing';

// ============================================
// AUTO-PUBLISH WORKFLOW
// ============================================

/**
 * Auto-publish content based on project settings
 */
export async function autoPublishContent(
  contentId: string,
  options?: {
    dryRun?: boolean;
    skipApproval?: boolean;
  }
): Promise<{
  published: boolean;
  requiresApproval: boolean;
  result?: PublishResponse;
  queuedForApproval?: boolean;
}> {
  // Get content with project and platforms
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      project: {
        include: {
          platforms: {
            where: { isConnected: true },
          },
          settings: {
            where: { scope: 'PROJECT' },
          },
        },
      },
    },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Step 1: Check if auto-publish is enabled
  const projectSettings = content.project.settings[0];
  if (!projectSettings?.autoPublish) {
    return {
      published: false,
      requiresApproval: false,
    };
  }

  // Step 2: Get enabled platforms from settings
  const platformConfig = (projectSettings.customSettings as any)?.platforms || {};
  const enabledPlatforms = content.project.platforms.filter((platform) => {
    const config = platformConfig[platform.id];
    return config?.enabled !== false; // Default to enabled if not specified
  });

  if (enabledPlatforms.length === 0) {
    return {
      published: false,
      requiresApproval: false,
    };
  }

  // Step 3: Check if approval is required
  const requiresApproval = projectSettings.customSettings &&
    typeof projectSettings.customSettings === 'object' &&
    'requireApproval' in projectSettings.customSettings
    ? (projectSettings.customSettings as any).requireApproval
    : false;

  if (requiresApproval && !options?.skipApproval) {
    // Add to approval queue
    await addToApprovalQueue(
      contentId,
      enabledPlatforms.map((p) => p.id)
    );

    // Send notification (TODO: implement notification)
    return {
      published: false,
      requiresApproval: true,
      queuedForApproval: true,
    };
  }

  // Step 4: Publish immediately
  const platformIds = enabledPlatforms.map((p) => p.id);
  const result = await publishToMultiplePlatforms(
    contentId,
    platformIds,
    { dryRun: options?.dryRun }
  );

  // Step 5: Send notification (TODO: implement notification)

  return {
    published: result.success,
    requiresApproval: false,
    result,
  };
}

/**
 * Auto-publish multiple content items (e.g., from cron job)
 */
export async function autoPublishBatch(
  projectId: string,
  options?: {
    limit?: number;
    dryRun?: boolean;
  }
): Promise<{
  processed: number;
  published: number;
  queued: number;
  failed: number;
  results: Array<{
    contentId: string;
    published: boolean;
    requiresApproval: boolean;
  }>;
}> {
  // Get unpublished content for project
  const content = await prisma.content.findMany({
    where: {
      projectId,
      status: 'DRAFT',
      isAIGenerated: true, // Only auto-publish AI-generated content
    },
    take: options?.limit || 10,
    orderBy: {
      createdAt: 'asc',
    },
  });

  const results: Array<{
    contentId: string;
    published: boolean;
    requiresApproval: boolean;
  }> = [];

  let published = 0;
  let queued = 0;
  let failed = 0;

  for (const item of content) {
    try {
      const result = await autoPublishContent(item.id, {
        dryRun: options?.dryRun,
      });

      results.push({
        contentId: item.id,
        published: result.published,
        requiresApproval: result.requiresApproval,
      });

      if (result.published) {
        published++;
      } else if (result.queuedForApproval) {
        queued++;
      }
    } catch (error) {
      failed++;
      console.error(`Failed to auto-publish content ${item.id}:`, error);
    }
  }

  return {
    processed: results.length,
    published,
    queued,
    failed,
    results,
  };
}

/**
 * Check if content should be auto-published
 */
export async function shouldAutoPublish(contentId: string): Promise<boolean> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      project: {
        include: {
          settings: {
            where: { scope: 'PROJECT' },
          },
        },
      },
    },
  });

  if (!content) return false;

  const settings = content.project.settings[0];
  return settings?.autoPublish === true;
}
