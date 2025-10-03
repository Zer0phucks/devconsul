/**
 * Approval Queue System
 *
 * Manual review queue for content requiring approval before publishing
 */

import { prisma } from '@/lib/db';
import { publishToMultiplePlatforms } from './manual';
import type { ApprovalQueueItem } from '@/lib/validations/publishing';

// Use JSON storage in content metadata for approval queue
// This avoids creating a new table while maintaining functionality

// ============================================
// APPROVAL QUEUE MANAGEMENT
// ============================================

/**
 * Add content to approval queue
 */
export async function addToApprovalQueue(
  contentId: string,
  platformIds: string[]
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Auto-reject after 7 days

  const queueItem = {
    contentId,
    platformIds,
    addedAt: new Date(),
    expiresAt,
    status: 'pending' as const,
  };

  // Store in content metadata
  await prisma.content.update({
    where: { id: contentId },
    data: {
      aiMetadata: {
        approvalQueue: queueItem,
      },
    },
  });
}

/**
 * Get approval queue for user
 */
export async function getApprovalQueue(userId: string): Promise<ApprovalQueueItem[]> {
  // Get all content pending approval for user's projects
  const content = await prisma.content.findMany({
    where: {
      project: {
        userId,
      },
      status: 'DRAFT',
      aiMetadata: {
        path: ['approvalQueue', 'status'],
        equals: 'pending',
      },
    },
    include: {
      project: {
        include: {
          platforms: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return content
    .map((item) => {
      const queueData = (item.aiMetadata as any)?.approvalQueue;
      if (!queueData) return null;

      return {
        contentId: item.id,
        platformIds: queueData.platformIds || [],
        addedAt: new Date(queueData.addedAt),
        expiresAt: new Date(queueData.expiresAt),
        status: queueData.status,
        content: {
          title: item.title,
          excerpt: item.excerpt || undefined,
        },
      };
    })
    .filter((item): item is ApprovalQueueItem => item !== null);
}

/**
 * Approve content and publish
 */
export async function approveAndPublish(
  contentId: string,
  platformIds: string[],
  options?: {
    immediate?: boolean;
  }
): Promise<{
  approved: boolean;
  published: boolean;
  result?: any;
}> {
  // Update approval status
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { aiMetadata: true },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  const queueData = (content.aiMetadata as any)?.approvalQueue || {};
  queueData.status = 'approved';
  queueData.approvedAt = new Date();

  await prisma.content.update({
    where: { id: contentId },
    data: {
      aiMetadata: {
        approvalQueue: queueData,
      },
    },
  });

  // Publish immediately if requested
  if (options?.immediate !== false) {
    const result = await publishToMultiplePlatforms(contentId, platformIds);

    return {
      approved: true,
      published: result.success,
      result,
    };
  }

  return {
    approved: true,
    published: false,
  };
}

/**
 * Reject content from approval queue
 */
export async function rejectContent(
  contentId: string,
  reason: string,
  options?: {
    notify?: boolean;
  }
): Promise<void> {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { aiMetadata: true },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  const queueData = (content.aiMetadata as any)?.approvalQueue || {};
  queueData.status = 'rejected';
  queueData.rejectedAt = new Date();
  queueData.rejectionReason = reason;

  await prisma.content.update({
    where: { id: contentId },
    data: {
      status: 'DRAFT',
      aiMetadata: {
        approvalQueue: queueData,
      },
    },
  });

  // Send notification if requested
  if (options?.notify) {
    // TODO: Implement notification
  }
}

/**
 * Remove content from approval queue
 */
export async function removeFromApprovalQueue(contentId: string): Promise<void> {
  await prisma.content.update({
    where: { id: contentId },
    data: {
      aiMetadata: {
        approvalQueue: null,
      },
    },
  });
}

/**
 * Clean up expired approval queue items
 */
export async function cleanupExpiredApprovals(): Promise<number> {
  const now = new Date();

  // Find expired items
  const expiredContent = await prisma.content.findMany({
    where: {
      aiMetadata: {
        path: ['approvalQueue', 'status'],
        equals: 'pending',
      },
    },
  });

  let cleaned = 0;

  for (const content of expiredContent) {
    const queueData = (content.aiMetadata as any)?.approvalQueue;
    if (!queueData) continue;

    const expiresAt = new Date(queueData.expiresAt);
    if (expiresAt < now) {
      await rejectContent(content.id, 'Approval expired after 7 days', {
        notify: true,
      });
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get approval queue statistics
 */
export async function getApprovalQueueStats(projectId?: string) {
  const where: any = {
    aiMetadata: {
      path: ['approvalQueue'],
      not: null,
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  const [pending, approved, rejected] = await Promise.all([
    prisma.content.count({
      where: {
        ...where,
        aiMetadata: {
          path: ['approvalQueue', 'status'],
          equals: 'pending',
        },
      },
    }),
    prisma.content.count({
      where: {
        ...where,
        aiMetadata: {
          path: ['approvalQueue', 'status'],
          equals: 'approved',
        },
      },
    }),
    prisma.content.count({
      where: {
        ...where,
        aiMetadata: {
          path: ['approvalQueue', 'status'],
          equals: 'rejected',
        },
      },
    }),
  ]);

  return {
    pending,
    approved,
    rejected,
    total: pending + approved + rejected,
  };
}
