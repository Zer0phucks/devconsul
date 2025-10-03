/**
 * Scheduled Content Publishing Job Function
 *
 * Processes queue and publishes content to configured platforms at scheduled times
 */

import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/db";
import { NonRetriableError } from "inngest";
import {
  dequeue,
  markProcessing,
  markCompleted,
  markFailed,
} from "@/lib/scheduling/queue";
import { QueueStatus, ScheduleStatus } from "@prisma/client";

/**
 * Platform publishing result
 */
interface PlatformPublishResult {
  platformId: string;
  platformType: string;
  success: boolean;
  publishedUrl?: string;
  error?: string;
}

/**
 * Scheduled Publish Cron Job
 *
 * Runs every minute to check and process scheduled content
 */
export const scheduledPublishCron = inngest.createFunction(
  {
    id: "scheduled-publish-cron",
    name: "Process Scheduled Content Queue",
    retries: 0, // Don't retry cron - it runs every minute
  },
  { cron: "* * * * *" }, // Every minute
  async ({ step }) => {
    // Get all projects with pending scheduled content
    const projects = await step.run("find-projects-with-pending", async () => {
      const projectsWithScheduled = await prisma.scheduledContent.findMany({
        where: {
          scheduledFor: { lte: new Date() },
          queueStatus: { in: [QueueStatus.PENDING, QueueStatus.QUEUED] },
          status: ScheduleStatus.SCHEDULED,
        },
        select: { projectId: true },
        distinct: ["projectId"],
      });

      return projectsWithScheduled.map((s) => s.projectId);
    });

    if (projects.length === 0) {
      return { processed: 0, message: "No projects with scheduled content" };
    }

    // Process each project
    const results = await step.run("process-projects", async () => {
      const projectResults = [];

      for (const projectId of projects) {
        try {
          // Trigger project-specific processing
          await inngest.send({
            name: "scheduled/publish.project",
            data: { projectId },
          });

          projectResults.push({ projectId, triggered: true });
        } catch (error: any) {
          projectResults.push({
            projectId,
            triggered: false,
            error: error.message,
          });
        }
      }

      return projectResults;
    });

    return {
      processed: projects.length,
      triggered: results.filter((r) => r.triggered).length,
      results,
    };
  }
);

/**
 * Project-Specific Publish Job
 *
 * Processes scheduled content for a single project
 */
export const projectPublishJob = inngest.createFunction(
  {
    id: "project-scheduled-publish",
    name: "Publish Scheduled Content for Project",
    retries: 0, // Individual items handle their own retries
    concurrency: {
      limit: 10, // Max 10 projects concurrently
      key: "event.data.projectId",
    },
  },
  { event: "scheduled/publish.project" },
  async ({ event, step }) => {
    const { projectId } = event.data;

    // Dequeue items for this project (max 10 per batch)
    const items = await step.run("dequeue-items", async () => {
      return await dequeue(projectId, 10);
    });

    if (items.length === 0) {
      return { projectId, processed: 0 };
    }

    // Process each item
    const results = await step.run("process-items", async () => {
      const itemResults = [];

      for (const item of items) {
        try {
          // Trigger individual item processing
          await inngest.send({
            name: "scheduled/publish.item",
            data: {
              scheduleId: item.id,
              contentId: item.contentId,
              projectId: item.projectId,
            },
          });

          itemResults.push({ scheduleId: item.id, triggered: true });
        } catch (error: any) {
          itemResults.push({
            scheduleId: item.id,
            triggered: false,
            error: error.message,
          });
        }
      }

      return itemResults;
    });

    return {
      projectId,
      processed: items.length,
      triggered: results.filter((r) => r.triggered).length,
      results,
    };
  }
);

/**
 * Individual Item Publish Job
 *
 * Publishes a single scheduled content item to all platforms
 */
export const itemPublishJob = inngest.createFunction(
  {
    id: "item-scheduled-publish",
    name: "Publish Scheduled Content Item",
    retries: 3,
    concurrency: {
      limit: 5, // Max 5 concurrent publishes
    },
  },
  { event: "scheduled/publish.item" },
  async ({ event, step, attempt }) => {
    const { scheduleId, contentId, projectId } = event.data;

    // Mark as processing
    await step.run("mark-processing", async () => {
      await markProcessing(scheduleId);
    });

    try {
      // Fetch schedule details
      const schedule = await step.run("fetch-schedule", async () => {
        const sched = await prisma.scheduledContent.findUnique({
          where: { id: scheduleId },
          include: {
            content: {
              include: {
                platforms: true,
              },
            },
          },
        });

        if (!sched) {
          throw new NonRetriableError(`Schedule not found: ${scheduleId}`);
        }

        if (!sched.content) {
          throw new NonRetriableError(`Content not found: ${contentId}`);
        }

        return sched;
      });

      // Fetch platforms to publish to
      const platforms = await step.run("fetch-platforms", async () => {
        return await prisma.platform.findMany({
          where: {
            id: { in: schedule.platforms },
            isConnected: true,
          },
        });
      });

      if (platforms.length === 0) {
        throw new NonRetriableError("No connected platforms to publish to");
      }

      // Apply publish delay if configured
      if (schedule.publishDelay > 0) {
        await step.sleep("publish-delay", `${schedule.publishDelay}s`);
      }

      // Publish to each platform
      const publishResults: PlatformPublishResult[] = [];

      for (const platform of platforms) {
        const result = await step.run(
          `publish-to-${platform.type}`,
          async () => {
            try {
              // Call platform-specific publishing logic
              const publishedUrl = await publishToPlatform(
                platform,
                schedule.content!,
                schedule
              );

              return {
                platformId: platform.id,
                platformType: platform.type,
                success: true,
                publishedUrl,
              };
            } catch (error: any) {
              return {
                platformId: platform.id,
                platformType: platform.type,
                success: false,
                error: error.message,
              };
            }
          }
        );

        publishResults.push(result);
      }

      // Check if all platforms succeeded
      const allSucceeded = publishResults.every((r) => r.success);
      const someSucceeded = publishResults.some((r) => r.success);

      if (allSucceeded) {
        // Mark as completed
        await step.run("mark-completed", async () => {
          await markCompleted(scheduleId, new Date());
        });

        // Update content status
        await step.run("update-content-status", async () => {
          await prisma.content.update({
            where: { id: contentId },
            data: {
              status: "PUBLISHED",
              publishedAt: new Date(),
            },
          });
        });

        return {
          success: true,
          scheduleId,
          contentId,
          platforms: publishResults.length,
          results: publishResults,
        };
      } else if (someSucceeded && attempt >= 3) {
        // Some platforms failed, but max retries reached - mark as completed with partial success
        await step.run("mark-partial-success", async () => {
          await markCompleted(scheduleId, new Date());

          // Update schedule metadata with failures
          await prisma.scheduledContent.update({
            where: { id: scheduleId },
            data: {
              metadata: {
                partialSuccess: true,
                failures: publishResults.filter((r) => !r.success),
              },
            },
          });
        });

        return {
          success: false,
          partialSuccess: true,
          scheduleId,
          contentId,
          platforms: publishResults.length,
          results: publishResults,
        };
      } else {
        // All failed or some failed with retries remaining - mark as failed
        const errorMessage = publishResults
          .filter((r) => !r.success)
          .map((r) => `${r.platformType}: ${r.error}`)
          .join("; ");

        const willRetry = await step.run("mark-failed", async () => {
          return await markFailed(scheduleId, errorMessage, {
            attempt,
            results: publishResults,
          });
        });

        // If no more retries, send failure notification
        if (!willRetry) {
          await step.run("send-failure-notification", async () => {
            // TODO: Send notification to user about failed publish
            console.error(
              `Publishing failed for schedule ${scheduleId}: ${errorMessage}`
            );
          });
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // Mark as failed with error
      await step.run("mark-failed-on-error", async () => {
        const willRetry = await markFailed(scheduleId, error.message, {
          attempt,
          stackTrace: error.stack,
        });

        if (!willRetry) {
          // Send notification about permanent failure
          console.error(`Permanent failure for schedule ${scheduleId}:`, error);
        }
      });

      throw error;
    }
  }
);

/**
 * Manual Publish Trigger
 *
 * Allows manual triggering of scheduled content publish
 */
export const manualPublishJob = inngest.createFunction(
  {
    id: "manual-scheduled-publish",
    name: "Manual Publish Scheduled Content",
    retries: 3,
  },
  { event: "scheduled/publish.manual" },
  async ({ event, step }) => {
    const { scheduleId, userId } = event.data;

    // Verify schedule exists and is not already published
    const schedule = await step.run("verify-schedule", async () => {
      const sched = await prisma.scheduledContent.findUnique({
        where: { id: scheduleId },
      });

      if (!sched) {
        throw new NonRetriableError(`Schedule not found: ${scheduleId}`);
      }

      if (sched.queueStatus === QueueStatus.COMPLETED) {
        throw new NonRetriableError("Schedule already completed");
      }

      if (sched.queueStatus === QueueStatus.PROCESSING) {
        throw new NonRetriableError("Schedule already processing");
      }

      return sched;
    });

    // Reset schedule to QUEUED status for immediate processing
    await step.run("queue-for-publish", async () => {
      await prisma.scheduledContent.update({
        where: { id: scheduleId },
        data: {
          queueStatus: QueueStatus.QUEUED,
          scheduledFor: new Date(), // Publish immediately
          metadata: {
            manualTrigger: true,
            triggeredBy: userId,
            triggeredAt: new Date(),
          },
        },
      });
    });

    // Trigger immediate publish
    await step.run("trigger-publish", async () => {
      await inngest.send({
        name: "scheduled/publish.item",
        data: {
          scheduleId: schedule.id,
          contentId: schedule.contentId,
          projectId: schedule.projectId,
        },
      });
    });

    return {
      success: true,
      scheduleId,
      message: "Manual publish triggered",
    };
  }
);

/**
 * Cancel Scheduled Publish
 *
 * Cancels a scheduled content item
 */
export const cancelPublishJob = inngest.createFunction(
  {
    id: "cancel-scheduled-publish",
    name: "Cancel Scheduled Content",
    retries: 0,
  },
  { event: "scheduled/publish.cancel" },
  async ({ event, step }) => {
    const { scheduleId, userId, reason } = event.data;

    await step.run("cancel-schedule", async () => {
      await prisma.scheduledContent.update({
        where: { id: scheduleId },
        data: {
          queueStatus: QueueStatus.CANCELLED,
          status: ScheduleStatus.CANCELLED,
          metadata: {
            cancelledBy: userId,
            cancelledAt: new Date(),
            reason,
          },
        },
      });

      // If there's an Inngest job ID, attempt to cancel it
      const schedule = await prisma.scheduledContent.findUnique({
        where: { id: scheduleId },
        select: { inngestJobId: true },
      });

      if (schedule?.inngestJobId) {
        // NOTE: Inngest doesn't support direct job cancellation
        // We rely on the job checking the queueStatus before processing
        console.log(
          `Schedule ${scheduleId} cancelled, Inngest job ${schedule.inngestJobId} will skip on next run`
        );
      }
    });

    return {
      success: true,
      scheduleId,
      message: "Schedule cancelled",
    };
  }
);

/**
 * Reschedule Content
 *
 * Updates schedule time for content
 */
export const rescheduleJob = inngest.createFunction(
  {
    id: "reschedule-content",
    name: "Reschedule Scheduled Content",
    retries: 0,
  },
  { event: "scheduled/publish.reschedule" },
  async ({ event, step }) => {
    const { scheduleId, newScheduleTime, userId } = event.data;

    await step.run("update-schedule", async () => {
      await prisma.scheduledContent.update({
        where: { id: scheduleId },
        data: {
          scheduledFor: new Date(newScheduleTime),
          queueStatus: QueueStatus.PENDING,
          metadata: {
            rescheduledBy: userId,
            rescheduledAt: new Date(),
            previousSchedule: new Date(),
          },
        },
      });
    });

    return {
      success: true,
      scheduleId,
      newScheduleTime,
      message: "Schedule updated",
    };
  }
);

/**
 * Platform-specific publishing logic
 *
 * NOTE: This is a stub - actual implementation would integrate with platform APIs
 */
async function publishToPlatform(
  platform: any,
  content: any,
  schedule: any
): Promise<string> {
  // TODO: Implement platform-specific publishing
  // This would call the respective platform API based on platform.type

  const platformType = platform.type;

  switch (platformType) {
    case "TWITTER":
      return await publishToTwitter(platform, content);
    case "LINKEDIN":
      return await publishToLinkedIn(platform, content);
    case "FACEBOOK":
      return await publishToFacebook(platform, content);
    case "REDDIT":
      return await publishToReddit(platform, content);
    case "HASHNODE":
      return await publishToHashnode(platform, content);
    case "DEVTO":
      return await publishToDevTo(platform, content);
    case "MEDIUM":
      return await publishToMedium(platform, content);
    case "WORDPRESS":
      return await publishToWordPress(platform, content);
    case "GHOST":
      return await publishToGhost(platform, content);
    default:
      throw new Error(`Unsupported platform: ${platformType}`);
  }
}

// Platform-specific stub implementations
// These would be replaced with actual API integrations

async function publishToTwitter(platform: any, content: any): Promise<string> {
  // TODO: Twitter API integration
  console.log("Publishing to Twitter...", { platform: platform.id, content: content.id });
  return `https://twitter.com/status/${Date.now()}`;
}

async function publishToLinkedIn(platform: any, content: any): Promise<string> {
  // TODO: LinkedIn API integration
  console.log("Publishing to LinkedIn...", { platform: platform.id, content: content.id });
  return `https://linkedin.com/feed/update/${Date.now()}`;
}

async function publishToFacebook(platform: any, content: any): Promise<string> {
  // TODO: Facebook API integration
  console.log("Publishing to Facebook...", { platform: platform.id, content: content.id });
  return `https://facebook.com/posts/${Date.now()}`;
}

async function publishToReddit(platform: any, content: any): Promise<string> {
  // TODO: Reddit API integration
  console.log("Publishing to Reddit...", { platform: platform.id, content: content.id });
  return `https://reddit.com/r/programming/comments/${Date.now()}`;
}

async function publishToHashnode(platform: any, content: any): Promise<string> {
  // TODO: Hashnode API integration
  console.log("Publishing to Hashnode...", { platform: platform.id, content: content.id });
  return `https://hashnode.com/post/${Date.now()}`;
}

async function publishToDevTo(platform: any, content: any): Promise<string> {
  // TODO: Dev.to API integration
  console.log("Publishing to Dev.to...", { platform: platform.id, content: content.id });
  return `https://dev.to/post/${Date.now()}`;
}

async function publishToMedium(platform: any, content: any): Promise<string> {
  // TODO: Medium API integration
  console.log("Publishing to Medium...", { platform: platform.id, content: content.id });
  return `https://medium.com/@user/${Date.now()}`;
}

async function publishToWordPress(platform: any, content: any): Promise<string> {
  // TODO: WordPress API integration
  console.log("Publishing to WordPress...", { platform: platform.id, content: content.id });
  return `https://wordpress.com/post/${Date.now()}`;
}

async function publishToGhost(platform: any, content: any): Promise<string> {
  // TODO: Ghost API integration
  console.log("Publishing to Ghost...", { platform: platform.id, content: content.id });
  return `https://ghost.io/post/${Date.now()}`;
}
