/**
 * Schedule Conflict Detection
 *
 * Detects and resolves scheduling conflicts including:
 * - Same time conflicts
 * - Platform rate limit conflicts
 * - Resource limit conflicts
 * - Custom business rules
 */

import { prisma } from "@/lib/db";
import {
  ConflictType,
  ConflictSeverity,
  ScheduledContent,
  ScheduleConflict,
} from "@prisma/client";

/**
 * Platform rate limits (posts per hour)
 */
const PLATFORM_RATE_LIMITS: Record<string, number> = {
  TWITTER: 300, // 300 tweets per 3 hours = 100 per hour
  LINKEDIN: 100,
  FACEBOOK: 200,
  REDDIT: 10, // Very conservative
  HASHNODE: 50,
  DEVTO: 50,
  MEDIUM: 20,
  WORDPRESS: 100,
  GHOST: 100,
};

/**
 * Conflict detection result
 */
export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    type: ConflictType;
    severity: ConflictSeverity;
    reason: string;
    conflictingScheduleId?: string;
    suggestion?: string;
  }>;
}

/**
 * Detect conflicts for a new or updated schedule
 */
export async function detectConflicts(
  projectId: string,
  scheduleId: string | null, // null for new schedules
  scheduledFor: Date,
  platforms: string[],
  options: {
    timezone?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
  } = {}
): Promise<ConflictResult> {
  const conflicts: ConflictResult["conflicts"] = [];

  // 1. Check for same-time conflicts
  const sameTimeConflicts = await checkSameTimeConflicts(
    projectId,
    scheduleId,
    scheduledFor
  );
  conflicts.push(...sameTimeConflicts);

  // 2. Check platform rate limits
  const rateLimitConflicts = await checkRateLimitConflicts(
    projectId,
    scheduleId,
    scheduledFor,
    platforms
  );
  conflicts.push(...rateLimitConflicts);

  // 3. Check resource limits (concurrent processing)
  const resourceConflicts = await checkResourceConflicts(
    projectId,
    scheduleId,
    scheduledFor
  );
  conflicts.push(...resourceConflicts);

  // 4. Check DST conflicts if timezone-aware
  if (options.timezone && options.timezone !== "UTC") {
    const dstConflicts = await checkDSTConflicts(scheduledFor, options.timezone);
    conflicts.push(...dstConflicts);
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Check for exact same-time conflicts
 */
async function checkSameTimeConflicts(
  projectId: string,
  scheduleId: string | null,
  scheduledFor: Date
): Promise<ConflictResult["conflicts"]> {
  const conflicts: ConflictResult["conflicts"] = [];

  // Find schedules within 1 minute window
  const oneMinuteBefore = new Date(scheduledFor.getTime() - 60 * 1000);
  const oneMinuteAfter = new Date(scheduledFor.getTime() + 60 * 1000);

  const existing = await prisma.scheduledContent.findMany({
    where: {
      projectId,
      ...(scheduleId && { id: { not: scheduleId } }),
      scheduledFor: {
        gte: oneMinuteBefore,
        lte: oneMinuteAfter,
      },
      queueStatus: { notIn: ["CANCELLED", "FAILED", "COMPLETED"] },
    },
    include: {
      content: {
        select: {
          title: true,
        },
      },
    },
  });

  existing.forEach((schedule) => {
    const timeDiff = Math.abs(
      scheduledFor.getTime() - schedule.scheduledFor.getTime()
    );

    if (timeDiff < 60 * 1000) {
      // Within 1 minute
      conflicts.push({
        type: ConflictType.SAME_TIME,
        severity: ConflictSeverity.WARNING,
        reason: `Another schedule "${schedule.content?.title || "Untitled"}" is scheduled at the same time`,
        conflictingScheduleId: schedule.id,
        suggestion: `Consider spacing schedules at least 5 minutes apart`,
      });
    }
  });

  return conflicts;
}

/**
 * Check platform rate limit conflicts
 */
async function checkRateLimitConflicts(
  projectId: string,
  scheduleId: string | null,
  scheduledFor: Date,
  platforms: string[]
): Promise<ConflictResult["conflicts"]> {
  const conflicts: ConflictResult["conflicts"] = [];

  // Check each platform
  for (const platformId of platforms) {
    // Get platform type and rate limit
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
      select: { type: true },
    });

    if (!platform) continue;

    const rateLimit = PLATFORM_RATE_LIMITS[platform.type];
    if (!rateLimit) continue;

    // Count scheduled posts to this platform in surrounding hour
    const hourBefore = new Date(scheduledFor.getTime() - 60 * 60 * 1000);
    const hourAfter = new Date(scheduledFor.getTime() + 60 * 60 * 1000);

    const scheduledCount = await prisma.scheduledContent.count({
      where: {
        projectId,
        ...(scheduleId && { id: { not: scheduleId } }),
        scheduledFor: {
          gte: hourBefore,
          lte: hourAfter,
        },
        platforms: { has: platformId },
        queueStatus: { notIn: ["CANCELLED", "FAILED", "COMPLETED"] },
      },
    });

    if (scheduledCount >= rateLimit) {
      conflicts.push({
        type: ConflictType.RATE_LIMIT,
        severity: ConflictSeverity.ERROR,
        reason: `${platform.type} rate limit (${rateLimit}/hour) would be exceeded. ${scheduledCount} posts already scheduled in this hour.`,
        suggestion: `Schedule for a different time or reduce posts to ${platform.type}`,
      });
    } else if (scheduledCount >= rateLimit * 0.8) {
      // Warning at 80% capacity
      conflicts.push({
        type: ConflictType.RATE_LIMIT,
        severity: ConflictSeverity.WARNING,
        reason: `${platform.type} approaching rate limit. ${scheduledCount}/${rateLimit} posts scheduled in this hour.`,
        suggestion: `Consider spacing out posts to avoid rate limits`,
      });
    }
  }

  return conflicts;
}

/**
 * Check resource conflicts (concurrent processing limits)
 */
async function checkResourceConflicts(
  projectId: string,
  scheduleId: string | null,
  scheduledFor: Date
): Promise<ConflictResult["conflicts"]> {
  const conflicts: ConflictResult["conflicts"] = [];

  // Maximum concurrent publishes
  const MAX_CONCURRENT = 5;

  // Check concurrent schedules in 5-minute window
  const fiveMinutesBefore = new Date(scheduledFor.getTime() - 5 * 60 * 1000);
  const fiveMinutesAfter = new Date(scheduledFor.getTime() + 5 * 60 * 1000);

  const concurrent = await prisma.scheduledContent.count({
    where: {
      projectId,
      ...(scheduleId && { id: { not: scheduleId } }),
      scheduledFor: {
        gte: fiveMinutesBefore,
        lte: fiveMinutesAfter,
      },
      queueStatus: { notIn: ["CANCELLED", "FAILED", "COMPLETED"] },
    },
  });

  if (concurrent >= MAX_CONCURRENT) {
    conflicts.push({
      type: ConflictType.RESOURCE,
      severity: ConflictSeverity.ERROR,
      reason: `Too many concurrent schedules. ${concurrent} schedules within 5-minute window (max: ${MAX_CONCURRENT})`,
      suggestion: `Space schedules at least 1 minute apart`,
    });
  } else if (concurrent >= MAX_CONCURRENT * 0.8) {
    conflicts.push({
      type: ConflictType.RESOURCE,
      severity: ConflictSeverity.WARNING,
      reason: `High concurrent load. ${concurrent} schedules within 5-minute window`,
      suggestion: `Consider spreading schedules over a longer time period`,
    });
  }

  return conflicts;
}

/**
 * Check DST transition conflicts
 */
async function checkDSTConflicts(
  scheduledFor: Date,
  timezone: string
): Promise<ConflictResult["conflicts"]> {
  const conflicts: ConflictResult["conflicts"] = [];

  try {
    const { validateDSTSafe } = await import("@/lib/utils/timezone");
    const dstCheck = validateDSTSafe(scheduledFor, timezone);

    if (!dstCheck.safe && dstCheck.warning) {
      conflicts.push({
        type: ConflictType.CUSTOM,
        severity: ConflictSeverity.WARNING,
        reason: dstCheck.warning,
        suggestion: dstCheck.suggestion
          ? `Consider scheduling for ${dstCheck.suggestion.toISOString()}`
          : undefined,
      });
    }
  } catch (error) {
    // Ignore DST check errors
    console.error("DST check failed:", error);
  }

  return conflicts;
}

/**
 * Create conflict records in database
 */
export async function recordConflicts(
  projectId: string,
  schedule1Id: string,
  conflicts: ConflictResult["conflicts"]
): Promise<void> {
  for (const conflict of conflicts) {
    if (!conflict.conflictingScheduleId) continue;

    await prisma.scheduleConflict.create({
      data: {
        projectId,
        schedule1Id,
        schedule2Id: conflict.conflictingScheduleId,
        conflictType: conflict.type,
        conflictTime: new Date(), // Will be updated with actual conflict time
        conflictReason: conflict.reason,
        severity: conflict.severity,
      },
    });
  }
}

/**
 * Resolve a conflict
 */
export async function resolveConflict(
  conflictId: string,
  resolution: string,
  resolvedBy: string
): Promise<void> {
  await prisma.scheduleConflict.update({
    where: { id: conflictId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolution,
      resolvedBy,
    },
  });
}

/**
 * Get unresolved conflicts for a project
 */
export async function getUnresolvedConflicts(
  projectId: string
): Promise<ScheduleConflict[]> {
  return await prisma.scheduleConflict.findMany({
    where: {
      projectId,
      resolved: false,
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Auto-resolve conflicts by adjusting schedule times
 */
export async function autoResolveConflicts(
  projectId: string,
  scheduleId: string
): Promise<{
  resolved: boolean;
  suggestedTime?: Date;
  reason?: string;
}> {
  const schedule = await prisma.scheduledContent.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) {
    return { resolved: false, reason: "Schedule not found" };
  }

  // Find a conflict-free time slot within next 24 hours
  const startTime = new Date(schedule.scheduledFor);
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

  // Try every 15 minutes
  let candidate = new Date(startTime);
  while (candidate <= endTime) {
    const result = await detectConflicts(
      projectId,
      scheduleId,
      candidate,
      schedule.platforms
    );

    // Check only for ERROR severity conflicts
    const hasErrors = result.conflicts.some(
      (c) => c.severity === ConflictSeverity.ERROR
    );

    if (!hasErrors) {
      return {
        resolved: true,
        suggestedTime: candidate,
      };
    }

    // Move forward 15 minutes
    candidate = new Date(candidate.getTime() + 15 * 60 * 1000);
  }

  return {
    resolved: false,
    reason: "Could not find conflict-free time slot within 24 hours",
  };
}

/**
 * Validate schedule before saving
 */
export async function validateSchedule(
  projectId: string,
  scheduleId: string | null,
  scheduledFor: Date,
  platforms: string[],
  options: {
    timezone?: string;
    autoResolve?: boolean;
  } = {}
): Promise<{
  valid: boolean;
  conflicts: ConflictResult["conflicts"];
  suggestedTime?: Date;
}> {
  const result = await detectConflicts(
    projectId,
    scheduleId,
    scheduledFor,
    platforms,
    options
  );

  // Check for blocking (ERROR severity) conflicts
  const blockingConflicts = result.conflicts.filter(
    (c) => c.severity === ConflictSeverity.ERROR || c.severity === ConflictSeverity.CRITICAL
  );

  if (blockingConflicts.length > 0 && options.autoResolve) {
    // Try to auto-resolve
    const resolution = scheduleId
      ? await autoResolveConflicts(projectId, scheduleId)
      : { resolved: false };

    if (resolution.resolved && resolution.suggestedTime) {
      return {
        valid: false,
        conflicts: result.conflicts,
        suggestedTime: resolution.suggestedTime,
      };
    }
  }

  return {
    valid: blockingConflicts.length === 0,
    conflicts: result.conflicts,
  };
}
