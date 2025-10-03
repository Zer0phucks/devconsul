/**
 * Queue Management System
 *
 * Priority queue implementation for scheduled content publishing
 * Handles queuing, dequeuing, status tracking, and analytics
 */

import { prisma } from "@/lib/db";
import {
  QueueStatus,
  ScheduleStatus,
  ScheduledContent,
  Prisma,
} from "@prisma/client";

/**
 * Queue item with full content and schedule details
 */
export interface QueueItem extends ScheduledContent {
  content?: {
    id: string;
    title: string;
    status: string;
  };
}

/**
 * Queue statistics
 */
export interface QueueStats {
  pending: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  paused: number;
  avgWaitTime: number | null;
  avgProcessingTime: number | null;
  successRate: number | null;
  peakQueueLength: number;
}

/**
 * Add content to queue
 */
export async function enqueue(
  contentId: string,
  projectId: string,
  scheduledFor: Date,
  options: {
    timezone?: string;
    platforms?: string[];
    priority?: number;
    isRecurring?: boolean;
    recurringPattern?: string;
    recurringConfig?: any;
    recurringUntil?: Date;
    publishDelay?: number;
    metadata?: any;
    notes?: string;
  } = {}
): Promise<ScheduledContent> {
  const {
    timezone = "UTC",
    platforms = [],
    priority = 5,
    isRecurring = false,
    recurringPattern,
    recurringConfig,
    recurringUntil,
    publishDelay = 0,
    metadata,
    notes,
  } = options;

  // Create scheduled content entry
  const scheduled = await prisma.scheduledContent.create({
    data: {
      contentId,
      projectId,
      scheduledFor,
      timezone,
      platforms,
      priority,
      isRecurring,
      recurringPattern,
      recurringConfig,
      recurringUntil,
      publishDelay,
      queueStatus: QueueStatus.PENDING,
      status: ScheduleStatus.SCHEDULED,
      metadata,
      notes,
      queuedAt: new Date(),
    },
  });

  // Update queue metrics
  await updateQueueMetrics(projectId);

  return scheduled;
}

/**
 * Get next items from queue (by priority and schedule time)
 */
export async function dequeue(
  projectId: string,
  limit: number = 10
): Promise<QueueItem[]> {
  const now = new Date();

  // Get items that are:
  // 1. Scheduled for now or earlier
  // 2. Not already processing, completed, or failed
  // 3. Ordered by priority (desc) then scheduled time (asc)
  const items = await prisma.scheduledContent.findMany({
    where: {
      projectId,
      scheduledFor: { lte: now },
      queueStatus: { in: [QueueStatus.PENDING, QueueStatus.QUEUED] },
      status: ScheduleStatus.SCHEDULED,
    },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
    take: limit,
  });

  // Mark as queued
  if (items.length > 0) {
    await prisma.scheduledContent.updateMany({
      where: {
        id: { in: items.map((item) => item.id) },
      },
      data: {
        queueStatus: QueueStatus.QUEUED,
      },
    });
  }

  return items as QueueItem[];
}

/**
 * Mark item as processing
 */
export async function markProcessing(scheduleId: string): Promise<void> {
  await prisma.scheduledContent.update({
    where: { id: scheduleId },
    data: {
      queueStatus: QueueStatus.PROCESSING,
      status: ScheduleStatus.ACTIVE,
      processingAt: new Date(),
    },
  });
}

/**
 * Mark item as completed
 */
export async function markCompleted(
  scheduleId: string,
  publishedAt?: Date
): Promise<void> {
  const schedule = await prisma.scheduledContent.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`);
  }

  // Handle recurring schedules
  if (schedule.isRecurring && schedule.recurringPattern) {
    const { calculateNextOccurrence } = await import("@/lib/utils/timezone");

    const recurringConfig = schedule.recurringConfig as any;
    const nextOccurrence = calculateNextOccurrence(
      {
        pattern: schedule.recurringPattern as any,
        daysOfWeek: recurringConfig?.daysOfWeek,
        dayOfMonth: recurringConfig?.dayOfMonth,
        hour: recurringConfig?.hour || 0,
        minute: recurringConfig?.minute || 0,
        timezone: schedule.timezone,
      },
      schedule.scheduledFor
    );

    // Check if within recurrence window
    const shouldContinue =
      !schedule.recurringUntil || nextOccurrence <= schedule.recurringUntil;

    if (shouldContinue) {
      // Create next occurrence
      await prisma.scheduledContent.create({
        data: {
          contentId: schedule.contentId,
          projectId: schedule.projectId,
          scheduledFor: nextOccurrence,
          timezone: schedule.timezone,
          platforms: schedule.platforms,
          priority: schedule.priority,
          isRecurring: true,
          recurringPattern: schedule.recurringPattern,
          recurringConfig: schedule.recurringConfig,
          recurringUntil: schedule.recurringUntil,
          publishDelay: schedule.publishDelay,
          maxRetries: schedule.maxRetries,
          retryDelay: schedule.retryDelay,
          metadata: schedule.metadata,
          notes: schedule.notes,
          queueStatus: QueueStatus.PENDING,
          status: ScheduleStatus.SCHEDULED,
        },
      });
    }
  }

  // Mark current as completed
  await prisma.scheduledContent.update({
    where: { id: scheduleId },
    data: {
      queueStatus: QueueStatus.COMPLETED,
      status: ScheduleStatus.PUBLISHED,
      publishedAt: publishedAt || new Date(),
      lastOccurrence: schedule.isRecurring ? new Date() : undefined,
    },
  });

  // Update metrics
  await updateQueueMetrics(schedule.projectId);
}

/**
 * Mark item as failed
 */
export async function markFailed(
  scheduleId: string,
  error: string,
  errorDetails?: any
): Promise<boolean> {
  const schedule = await prisma.scheduledContent.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`);
  }

  const shouldRetry = schedule.retryCount < schedule.maxRetries;

  if (shouldRetry) {
    // Increment retry count and reschedule
    const nextRetry = new Date(
      Date.now() + schedule.retryDelay * 1000
    );

    await prisma.scheduledContent.update({
      where: { id: scheduleId },
      data: {
        queueStatus: QueueStatus.PENDING,
        status: ScheduleStatus.SCHEDULED,
        retryCount: { increment: 1 },
        scheduledFor: nextRetry,
        error,
        errorDetails,
        failedAt: new Date(),
      },
    });

    return true; // Will retry
  } else {
    // Max retries exceeded
    await prisma.scheduledContent.update({
      where: { id: scheduleId },
      data: {
        queueStatus: QueueStatus.FAILED,
        status: ScheduleStatus.FAILED,
        error,
        errorDetails,
        failedAt: new Date(),
      },
    });

    // Update metrics
    await updateQueueMetrics(schedule.projectId);

    return false; // Will not retry
  }
}

/**
 * Cancel scheduled item
 */
export async function cancelSchedule(scheduleId: string): Promise<void> {
  await prisma.scheduledContent.update({
    where: { id: scheduleId },
    data: {
      queueStatus: QueueStatus.CANCELLED,
      status: ScheduleStatus.CANCELLED,
    },
  });

  const schedule = await prisma.scheduledContent.findUnique({
    where: { id: scheduleId },
    select: { projectId: true },
  });

  if (schedule) {
    await updateQueueMetrics(schedule.projectId);
  }
}

/**
 * Pause scheduled item
 */
export async function pauseSchedule(scheduleId: string): Promise<void> {
  await prisma.scheduledContent.update({
    where: { id: scheduleId },
    data: {
      queueStatus: QueueStatus.PAUSED,
    },
  });
}

/**
 * Resume paused item
 */
export async function resumeSchedule(scheduleId: string): Promise<void> {
  await prisma.scheduledContent.update({
    where: { id: scheduleId },
    data: {
      queueStatus: QueueStatus.PENDING,
    },
  });
}

/**
 * Get queue statistics
 */
export async function getQueueStats(projectId: string): Promise<QueueStats> {
  const counts = await prisma.scheduledContent.groupBy({
    by: ["queueStatus"],
    where: { projectId },
    _count: true,
  });

  const stats: QueueStats = {
    pending: 0,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    paused: 0,
    avgWaitTime: null,
    avgProcessingTime: null,
    successRate: null,
    peakQueueLength: 0,
  };

  counts.forEach((count) => {
    const status = count.queueStatus.toLowerCase() as keyof QueueStats;
    if (status in stats) {
      stats[status] = count._count;
    }
  });

  // Calculate metrics from recent completed items
  const completed = await prisma.scheduledContent.findMany({
    where: {
      projectId,
      queueStatus: QueueStatus.COMPLETED,
      queuedAt: { not: null },
      processingAt: { not: null },
      publishedAt: { not: null },
    },
    select: {
      queuedAt: true,
      processingAt: true,
      publishedAt: true,
    },
    take: 100,
    orderBy: { publishedAt: "desc" },
  });

  if (completed.length > 0) {
    const waitTimes: number[] = [];
    const processingTimes: number[] = [];

    completed.forEach((item) => {
      if (item.queuedAt && item.processingAt) {
        waitTimes.push(
          item.processingAt.getTime() - item.queuedAt.getTime()
        );
      }
      if (item.processingAt && item.publishedAt) {
        processingTimes.push(
          item.publishedAt.getTime() - item.processingAt.getTime()
        );
      }
    });

    if (waitTimes.length > 0) {
      stats.avgWaitTime = Math.round(
        waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length / 1000
      );
    }

    if (processingTimes.length > 0) {
      stats.avgProcessingTime = Math.round(
        processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length / 1000
      );
    }
  }

  // Calculate success rate
  const total = stats.completed + stats.failed;
  if (total > 0) {
    stats.successRate = (stats.completed / total) * 100;
  }

  // Get peak queue length from metrics
  const latestMetric = await prisma.queueMetrics.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { peakQueueLength: true },
  });

  stats.peakQueueLength = latestMetric?.peakQueueLength || 0;

  return stats;
}

/**
 * Update queue metrics
 */
async function updateQueueMetrics(projectId: string): Promise<void> {
  const now = new Date();
  const stats = await getQueueStats(projectId);

  // Find or create today's metrics
  const periodStart = new Date(now.setHours(0, 0, 0, 0));
  const periodEnd = new Date(now.setHours(23, 59, 59, 999));

  const currentQueueLength =
    stats.pending + stats.queued + stats.processing + stats.paused;

  await prisma.queueMetrics.upsert({
    where: {
      projectId_periodStart: {
        projectId,
        periodStart,
      },
    },
    create: {
      projectId,
      periodStart,
      periodEnd,
      totalQueued: stats.pending + stats.queued,
      totalProcessed: stats.processing + stats.completed + stats.failed,
      totalCompleted: stats.completed,
      totalFailed: stats.failed,
      totalCancelled: stats.cancelled,
      avgWaitTime: stats.avgWaitTime,
      avgProcessingTime: stats.avgProcessingTime,
      peakQueueLength: currentQueueLength,
      successRate: stats.successRate,
    },
    update: {
      totalQueued: stats.pending + stats.queued,
      totalProcessed: stats.processing + stats.completed + stats.failed,
      totalCompleted: stats.completed,
      totalFailed: stats.failed,
      totalCancelled: stats.cancelled,
      avgWaitTime: stats.avgWaitTime,
      avgProcessingTime: stats.avgProcessingTime,
      peakQueueLength: {
        set: Math.max(currentQueueLength, stats.peakQueueLength),
      },
      successRate: stats.successRate,
    },
  });
}

/**
 * Get all queue items for a project
 */
export async function getQueueItems(
  projectId: string,
  filters?: {
    status?: QueueStatus[];
    limit?: number;
    offset?: number;
  }
): Promise<QueueItem[]> {
  const { status, limit = 50, offset = 0 } = filters || {};

  const items = await prisma.scheduledContent.findMany({
    where: {
      projectId,
      ...(status && { queueStatus: { in: status } }),
    },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
    take: limit,
    skip: offset,
  });

  return items as QueueItem[];
}

/**
 * Batch operations
 */
export async function batchPause(scheduleIds: string[]): Promise<number> {
  const result = await prisma.scheduledContent.updateMany({
    where: {
      id: { in: scheduleIds },
      queueStatus: { notIn: [QueueStatus.COMPLETED, QueueStatus.CANCELLED] },
    },
    data: {
      queueStatus: QueueStatus.PAUSED,
    },
  });

  return result.count;
}

export async function batchResume(scheduleIds: string[]): Promise<number> {
  const result = await prisma.scheduledContent.updateMany({
    where: {
      id: { in: scheduleIds },
      queueStatus: QueueStatus.PAUSED,
    },
    data: {
      queueStatus: QueueStatus.PENDING,
    },
  });

  return result.count;
}

export async function batchCancel(scheduleIds: string[]): Promise<number> {
  const result = await prisma.scheduledContent.updateMany({
    where: {
      id: { in: scheduleIds },
      queueStatus: { notIn: [QueueStatus.COMPLETED, QueueStatus.CANCELLED] },
    },
    data: {
      queueStatus: QueueStatus.CANCELLED,
      status: ScheduleStatus.CANCELLED,
    },
  });

  return result.count;
}
