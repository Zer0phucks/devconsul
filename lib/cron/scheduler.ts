/**
 * Cron Job Scheduler
 *
 * Manages cron job creation, updates, and execution scheduling
 */

import { prisma } from "@/lib/db";
import { CronJobType, CronJobStatus } from "@prisma/client";
import {
  CronFrequency,
  TimeConfig,
  WeeklyConfig,
  MonthlyConfig,
  CustomConfig,
  generateCronExpression,
  calculateNextRun,
  validateCronExpression,
} from "./frequency";
import { inngest } from "@/lib/inngest/client";

/**
 * Cron job configuration
 */
export interface CronJobConfig {
  projectId: string;
  type: CronJobType;
  name: string;
  description?: string;
  frequency: CronFrequency;
  timeConfig: TimeConfig | WeeklyConfig | MonthlyConfig | CustomConfig;
  isEnabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  jobConfig?: Record<string, any>;
}

/**
 * Create a new cron job
 */
export async function createCronJob(config: CronJobConfig) {
  const {
    projectId,
    type,
    name,
    description,
    frequency,
    timeConfig,
    isEnabled = true,
    maxRetries = 3,
    retryDelay = 300,
    jobConfig,
  } = config;

  // Generate cron expression
  const schedule = generateCronExpression(frequency, timeConfig);

  // Validate cron expression
  if (!validateCronExpression(schedule)) {
    throw new Error(`Invalid cron expression: ${schedule}`);
  }

  // Calculate next run time
  const nextRunAt = calculateNextRun(
    frequency,
    timeConfig as TimeConfig | WeeklyConfig | MonthlyConfig
  );

  // Create job in database
  const job = await prisma.cronJob.create({
    data: {
      projectId,
      type,
      name,
      description,
      schedule,
      timezone: timeConfig.timezone,
      isEnabled,
      status: CronJobStatus.IDLE,
      nextRunAt,
      maxRetries,
      retryDelay,
      config: {
        frequency,
        timeConfig,
        ...jobConfig,
      },
    },
  });

  // If enabled, schedule with Inngest (via cron event)
  if (isEnabled) {
    await scheduleNextExecution(job.id);
  }

  return job;
}

/**
 * Update existing cron job
 */
export async function updateCronJob(
  jobId: string,
  updates: Partial<CronJobConfig>
) {
  const existingJob = await prisma.cronJob.findUnique({
    where: { id: jobId },
  });

  if (!existingJob) {
    throw new Error(`Cron job not found: ${jobId}`);
  }

  const config = existingJob.config as any;

  // Merge updates
  const frequency = updates.frequency || config.frequency;
  const timeConfig = updates.timeConfig || config.timeConfig;

  // Generate new cron expression if schedule changed
  let schedule = existingJob.schedule;
  let nextRunAt = existingJob.nextRunAt;

  if (updates.frequency || updates.timeConfig) {
    schedule = generateCronExpression(frequency, timeConfig);

    if (!validateCronExpression(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    nextRunAt = calculateNextRun(
      frequency,
      timeConfig as TimeConfig | WeeklyConfig | MonthlyConfig
    );
  }

  // Update job
  const updatedJob = await prisma.cronJob.update({
    where: { id: jobId },
    data: {
      name: updates.name,
      description: updates.description,
      schedule,
      timezone: timeConfig.timezone,
      isEnabled: updates.isEnabled,
      nextRunAt,
      maxRetries: updates.maxRetries,
      retryDelay: updates.retryDelay,
      config: {
        frequency,
        timeConfig,
        ...(updates.jobConfig || {}),
      },
    },
  });

  // Reschedule if enabled
  if (updatedJob.isEnabled) {
    await scheduleNextExecution(updatedJob.id);
  }

  return updatedJob;
}

/**
 * Delete cron job
 */
export async function deleteCronJob(jobId: string) {
  await prisma.cronJob.delete({
    where: { id: jobId },
  });
}

/**
 * Enable/disable cron job
 */
export async function toggleCronJob(jobId: string, isEnabled: boolean) {
  const job = await prisma.cronJob.update({
    where: { id: jobId },
    data: {
      isEnabled,
      status: isEnabled ? CronJobStatus.IDLE : CronJobStatus.DISABLED,
    },
  });

  if (isEnabled) {
    await scheduleNextExecution(jobId);
  }

  return job;
}

/**
 * Schedule next execution via Inngest
 *
 * Sends event to trigger job at next scheduled time
 */
async function scheduleNextExecution(jobId: string) {
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
    include: { project: true },
  });

  if (!job || !job.isEnabled) {
    return;
  }

  // Send event based on job type
  const eventName = getEventNameForJobType(job.type);

  await inngest.send({
    name: eventName as any,
    data: {
      projectId: job.projectId,
      userId: job.project.userId,
      triggeredBy: "scheduled",
    },
  });
}

/**
 * Map job type to Inngest event name
 */
function getEventNameForJobType(type: CronJobType): string {
  switch (type) {
    case "GENERATE_CONTENT":
      return "cron/content.generation";
    case "SYNC_GITHUB":
      return "cron/github.sync";
    case "PUBLISH_CONTENT":
      return "cron/content.publish";
    default:
      throw new Error(`Unsupported job type: ${type}`);
  }
}

/**
 * Get all cron jobs for a project
 */
export async function getProjectCronJobs(projectId: string) {
  return await prisma.cronJob.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get all cron jobs for a user
 */
export async function getUserCronJobs(userId: string) {
  return await prisma.cronJob.findMany({
    where: {
      project: {
        userId,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get cron job execution history
 */
export async function getJobExecutionHistory(
  jobId: string,
  limit: number = 50
) {
  return await prisma.cronExecution.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get recent execution statistics
 */
export async function getJobStatistics(jobId: string) {
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
    include: {
      executions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!job) {
    throw new Error(`Cron job not found: ${jobId}`);
  }

  const recentExecutions = job.executions;
  const avgDuration =
    recentExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) /
    Math.max(recentExecutions.length, 1);

  const successRate =
    job.runCount > 0
      ? (job.successCount / job.runCount) * 100
      : 0;

  return {
    totalRuns: job.runCount,
    totalSuccess: job.successCount,
    totalFailures: job.failureCount,
    successRate: successRate.toFixed(2),
    avgDuration: Math.round(avgDuration),
    lastRun: job.lastRunAt,
    lastSuccess: job.lastSuccess,
    lastFailure: job.lastFailure,
    nextRun: job.nextRunAt,
    recentExecutions: recentExecutions.map((exec) => ({
      id: exec.id,
      status: exec.status,
      startedAt: exec.startedAt,
      duration: exec.duration,
      error: exec.error,
    })),
  };
}

/**
 * Manually trigger cron job execution
 */
export async function triggerJobManually(jobId: string, userId: string) {
  const job = await prisma.cronJob.findUnique({
    where: { id: jobId },
    include: { project: true },
  });

  if (!job) {
    throw new Error(`Cron job not found: ${jobId}`);
  }

  // Verify user owns this project
  if (job.project.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Send immediate execution event
  const eventName = getEventNameForJobType(job.type);

  await inngest.send({
    name: eventName as any,
    data: {
      projectId: job.projectId,
      userId: job.project.userId,
      triggeredBy: "manual",
    },
  });

  return { success: true, message: "Job triggered successfully" };
}

/**
 * Update job execution statistics after run
 */
export async function updateJobStatistics(
  jobId: string,
  success: boolean,
  nextRun?: Date
) {
  const now = new Date();

  await prisma.cronJob.update({
    where: { id: jobId },
    data: {
      lastRunAt: now,
      lastSuccess: success ? now : undefined,
      lastFailure: success ? undefined : now,
      runCount: { increment: 1 },
      successCount: success ? { increment: 1 } : undefined,
      failureCount: success ? undefined : { increment: 1 },
      nextRunAt: nextRun,
      status: CronJobStatus.IDLE,
    },
  });
}
