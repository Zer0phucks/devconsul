/**
 * Publishing Status Tracking
 *
 * Track publication status across platforms with comprehensive metadata
 */

import { prisma } from '@/lib/db';
import { PublicationStatus, ContentStatus, PlatformType } from '@prisma/client';
import type { StatusResponse } from '@/lib/validations/publishing';

// ============================================
// STATUS MANAGEMENT
// ============================================

/**
 * Get comprehensive publication status for content
 */
export async function getPublicationStatus(contentId: string): Promise<StatusResponse> {
  // Fetch content with all publications
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      publications: {
        include: {
          platform: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Calculate overall content status
  const overallStatus = calculateOverallStatus(content.publications);

  // Map publications to response format
  const publications = content.publications.map((pub) => ({
    id: pub.id,
    platformId: pub.platformId,
    platformType: pub.platform.type,
    platformName: pub.platform.name,
    status: pub.status,
    publishedAt: pub.publishedAt,
    platformUrl: pub.platformUrl,
    error: pub.error,
    retryCount: pub.retryCount,
  }));

  // Calculate summary
  const summary = {
    totalPlatforms: publications.length,
    published: publications.filter((p) => p.status === 'PUBLISHED').length,
    pending: publications.filter((p) => p.status === 'PENDING').length,
    failed: publications.filter((p) => p.status === 'FAILED').length,
    retrying: publications.filter((p) => p.status === 'RETRYING').length,
  };

  return {
    contentId: content.id,
    status: overallStatus,
    publications,
    summary,
  };
}

/**
 * Update publication status with metadata
 */
export async function updatePublicationStatus(
  publicationId: string,
  data: {
    status: PublicationStatus;
    platformPostId?: string;
    platformUrl?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }
) {
  const updateData: {
    status: PublicationStatus;
    platformPostId?: string;
    platformUrl?: string;
    error?: string;
    platformMetadata?: Record<string, unknown>;
    publishedAt?: Date;
    lastAttemptAt: Date;
  } = {
    status: data.status,
    lastAttemptAt: new Date(),
  };

  if (data.platformPostId !== undefined) {
    updateData.platformPostId = data.platformPostId;
  }

  if (data.platformUrl !== undefined) {
    updateData.platformUrl = data.platformUrl;
  }

  if (data.error !== undefined) {
    updateData.error = data.error;
  }

  if (data.metadata !== undefined) {
    updateData.platformMetadata = data.metadata;
  }

  // Set publishedAt timestamp when status is PUBLISHED
  if (data.status === 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  const publication = await prisma.contentPublication.update({
    where: { id: publicationId },
    data: updateData,
    include: {
      platform: true,
      content: true,
    },
  });

  // Update content status based on all publications
  await updateContentStatus(publication.contentId);

  // Update platform statistics
  await updatePlatformStats(publication.platformId);

  return publication;
}

/**
 * Get publication history for content
 */
export async function getPublicationHistory(contentId: string) {
  return prisma.contentPublication.findMany({
    where: { contentId },
    include: {
      platform: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get failed publications for retry
 */
export async function getFailedPublications(options?: {
  contentId?: string;
  platformId?: string;
  maxRetryCount?: number;
}) {
  return prisma.contentPublication.findMany({
    where: {
      status: 'FAILED',
      contentId: options?.contentId,
      platformId: options?.platformId,
      retryCount: options?.maxRetryCount ? { lt: options.maxRetryCount } : undefined,
    },
    include: {
      platform: true,
      content: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

/**
 * Get publications pending approval
 */
export async function getPendingPublications(projectId?: string) {
  return prisma.contentPublication.findMany({
    where: {
      status: 'PENDING',
      content: projectId ? { projectId } : undefined,
    },
    include: {
      platform: true,
      content: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// ============================================
// STATUS CALCULATION
// ============================================

/**
 * Calculate overall content status from publication statuses
 */
function calculateOverallStatus(
  publications: Array<{ status: PublicationStatus }>
): 'draft' | 'scheduled' | 'publishing' | 'published' | 'partial' | 'failed' {
  if (publications.length === 0) {
    return 'draft';
  }

  const statusCounts = {
    published: publications.filter((p) => p.status === 'PUBLISHED').length,
    publishing: publications.filter((p) => p.status === 'PUBLISHING').length,
    pending: publications.filter((p) => p.status === 'PENDING').length,
    retrying: publications.filter((p) => p.status === 'RETRYING').length,
    failed: publications.filter((p) => p.status === 'FAILED').length,
  };

  // All published
  if (statusCounts.published === publications.length) {
    return 'published';
  }

  // Any currently publishing
  if (statusCounts.publishing > 0) {
    return 'publishing';
  }

  // Some published, some failed
  if (statusCounts.published > 0 && statusCounts.failed > 0) {
    return 'partial';
  }

  // All failed
  if (statusCounts.failed === publications.length) {
    return 'failed';
  }

  // Some published, rest pending/retrying
  if (statusCounts.published > 0) {
    return 'partial';
  }

  // All pending or retrying
  if (statusCounts.pending > 0 || statusCounts.retrying > 0) {
    return 'scheduled';
  }

  return 'draft';
}

/**
 * Update content status based on publication statuses
 */
async function updateContentStatus(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { publications: true },
  });

  if (!content) return;

  const overallStatus = calculateOverallStatus(content.publications);

  let newContentStatus: ContentStatus;
  let publishedAt: Date | null = content.publishedAt;

  switch (overallStatus) {
    case 'published':
      newContentStatus = 'PUBLISHED';
      publishedAt = publishedAt || new Date();
      break;
    case 'scheduled':
      newContentStatus = 'SCHEDULED';
      break;
    case 'failed':
      newContentStatus = 'FAILED';
      break;
    case 'publishing':
    case 'partial':
      newContentStatus = 'PUBLISHED'; // Partial success still counts as published
      publishedAt = publishedAt || new Date();
      break;
    default:
      newContentStatus = 'DRAFT';
  }

  await prisma.content.update({
    where: { id: contentId },
    data: {
      status: newContentStatus,
      publishedAt,
    },
  });
}

/**
 * Update platform publishing statistics
 */
async function updatePlatformStats(platformId: string) {
  const publishedCount = await prisma.contentPublication.count({
    where: {
      platformId,
      status: 'PUBLISHED',
    },
  });

  const lastPublished = await prisma.contentPublication.findFirst({
    where: {
      platformId,
      status: 'PUBLISHED',
    },
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      publishedAt: true,
    },
  });

  await prisma.platform.update({
    where: { id: platformId },
    data: {
      totalPublished: publishedCount,
      lastPublishedAt: lastPublished?.publishedAt || undefined,
    },
  });
}

// ============================================
// PUBLICATION CREATION
// ============================================

/**
 * Create publication record for content-platform pair
 */
export async function createPublication(
  contentId: string,
  platformId: string,
  metadata?: Record<string, unknown>
) {
  // Check if publication already exists
  const existing = await prisma.contentPublication.findUnique({
    where: {
      contentId_platformId: {
        contentId,
        platformId,
      },
    },
  });

  if (existing) {
    // Update existing publication
    return prisma.contentPublication.update({
      where: { id: existing.id },
      data: {
        status: 'PENDING',
        error: null,
        retryCount: 0,
        lastAttemptAt: new Date(),
        platformMetadata: metadata,
      },
    });
  }

  // Create new publication
  return prisma.contentPublication.create({
    data: {
      contentId,
      platformId,
      status: 'PENDING',
      retryCount: 0,
      platformMetadata: metadata,
    },
  });
}

/**
 * Create publications for multiple platforms
 */
export async function createPublications(
  contentId: string,
  platformIds: string[],
  metadata?: Record<string, unknown>
) {
  return Promise.all(
    platformIds.map((platformId) => createPublication(contentId, platformId, metadata))
  );
}

// ============================================
// STATUS QUERIES
// ============================================

/**
 * Check if content is published to specific platform
 */
export async function isPublishedToPlatform(
  contentId: string,
  platformId: string
): Promise<boolean> {
  const publication = await prisma.contentPublication.findUnique({
    where: {
      contentId_platformId: {
        contentId,
        platformId,
      },
    },
  });

  return publication?.status === 'PUBLISHED';
}

/**
 * Get published platforms for content
 */
export async function getPublishedPlatforms(contentId: string) {
  const publications = await prisma.contentPublication.findMany({
    where: {
      contentId,
      status: 'PUBLISHED',
    },
    include: {
      platform: true,
    },
  });

  return publications.map((pub) => pub.platform);
}

/**
 * Get pending platforms for content
 */
export async function getPendingPlatforms(contentId: string) {
  const publications = await prisma.contentPublication.findMany({
    where: {
      contentId,
      status: { in: ['PENDING', 'RETRYING'] },
    },
    include: {
      platform: true,
    },
  });

  return publications.map((pub) => pub.platform);
}

/**
 * Get publication by content and platform
 */
export async function getPublicationByContentAndPlatform(
  contentId: string,
  platformId: string
) {
  return prisma.contentPublication.findUnique({
    where: {
      contentId_platformId: {
        contentId,
        platformId,
      },
    },
    include: {
      platform: true,
      content: true,
    },
  });
}
