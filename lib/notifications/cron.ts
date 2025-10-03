/**
 * Cron Job Notification System
 *
 * Handles notifications for cron job executions
 */

import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { ExecutionStatus } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Notification types
 */
export enum NotificationType {
  JOB_SUCCESS = "JOB_SUCCESS",
  JOB_FAILURE = "JOB_FAILURE",
  JOB_PARTIAL = "JOB_PARTIAL",
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  onSuccess: boolean;
  onFailure: boolean;
  onPartial: boolean;
}

/**
 * Send notification for cron job execution
 */
export async function sendExecutionNotification(
  executionId: string,
  type: NotificationType
) {
  try {
    const execution = await prisma.cronExecution.findUnique({
      where: { id: executionId },
      include: {
        job: {
          include: {
            project: {
              include: {
                user: true,
                settings: true,
              },
            },
          },
        },
      },
    });

    if (!execution) {
      console.error(`Execution not found: ${executionId}`);
      return;
    }

    const user = execution.job.project.user;
    const settings = execution.job.project.settings[0];

    // Check notification preferences
    if (!settings?.emailNotifications) {
      return;
    }

    const notificationEvents = (settings.notificationEvents || []) as string[];

    // Check if this event type should trigger notification
    const shouldNotify =
      (type === NotificationType.JOB_SUCCESS && notificationEvents.includes("job_success")) ||
      (type === NotificationType.JOB_FAILURE && notificationEvents.includes("job_failure")) ||
      (type === NotificationType.JOB_PARTIAL && notificationEvents.includes("job_partial"));

    if (!shouldNotify) {
      return;
    }

    // Send email notification
    await sendEmailNotification(execution, user, type);

    // Create in-app notification
    await createInAppNotification(execution, user.id, type);
  } catch (error) {
    console.error("Failed to send notification:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  execution: any,
  user: any,
  type: NotificationType
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - skipping email notification");
    return;
  }

  const subject = getEmailSubject(execution, type);
  const body = getEmailBody(execution, type);

  try {
    await resend.emails.send({
      from: "Full Self Publishing <noreply@fullselfpublishing.com>",
      to: user.email,
      subject,
      html: body,
    });
  } catch (error) {
    console.error("Email notification error:", error);
  }
}

/**
 * Create in-app notification
 */
async function createInAppNotification(
  execution: any,
  userId: string,
  type: NotificationType
) {
  // Store notification in user preferences or separate notifications table
  const notification = {
    userId,
    type,
    title: getNotificationTitle(execution, type),
    message: getNotificationMessage(execution, type),
    link: `/projects/${execution.job.projectId}/cron/${execution.jobId}`,
    read: false,
    createdAt: new Date(),
  };

  // For now, append to user preferences
  // In production, you'd have a separate Notifications table
  await prisma.user.update({
    where: { id: userId },
    data: {
      preferences: {
        ...(await getUserPreferences(userId)),
        notifications: [
          notification,
          ...((await getExistingNotifications(userId)) || []).slice(0, 49), // Keep last 50
        ],
      },
    },
  });
}

/**
 * Get email subject
 */
function getEmailSubject(execution: any, type: NotificationType): string {
  const jobName = execution.job.name;
  const projectName = execution.job.project.name;

  switch (type) {
    case NotificationType.JOB_SUCCESS:
      return `✅ ${jobName} completed successfully`;
    case NotificationType.JOB_FAILURE:
      return `❌ ${jobName} failed`;
    case NotificationType.JOB_PARTIAL:
      return `⚠️ ${jobName} completed with errors`;
    default:
      return `Cron Job Notification - ${jobName}`;
  }
}

/**
 * Get email body
 */
function getEmailBody(execution: any, type: NotificationType): string {
  const jobName = execution.job.name;
  const projectName = execution.job.project.name;
  const duration = execution.duration ? `${Math.round(execution.duration / 1000)}s` : "N/A";

  const statusIcon =
    type === NotificationType.JOB_SUCCESS
      ? "✅"
      : type === NotificationType.JOB_FAILURE
      ? "❌"
      : "⚠️";

  const statusText =
    type === NotificationType.JOB_SUCCESS
      ? "completed successfully"
      : type === NotificationType.JOB_FAILURE
      ? "failed"
      : "completed with errors";

  let details = "";

  if (execution.itemsProcessed) {
    details += `<li>Items processed: ${execution.itemsProcessed}</li>`;
  }

  if (execution.itemsSuccess) {
    details += `<li>Successful: ${execution.itemsSuccess}</li>`;
  }

  if (execution.itemsFailed) {
    details += `<li>Failed: ${execution.itemsFailed}</li>`;
  }

  if (execution.error) {
    details += `<li><strong>Error:</strong> ${execution.error}</li>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
          ul { padding-left: 20px; }
          .status { font-size: 24px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="status">${statusIcon}</div>
            <h2 style="margin: 0;">Cron Job Notification</h2>
          </div>

          <div class="content">
            <p><strong>Job:</strong> ${jobName}</p>
            <p><strong>Project:</strong> ${projectName}</p>
            <p><strong>Status:</strong> ${statusText}</p>
            <p><strong>Duration:</strong> ${duration}</p>

            ${details ? `<h3>Details:</h3><ul>${details}</ul>` : ""}

            <p style="margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/projects/${execution.job.projectId}/cron"
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Execution Details
              </a>
            </p>
          </div>

          <div class="footer">
            <p>Full Self Publishing - Automated Content Generation</p>
            <p>To manage notification preferences, visit your project settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get notification title
 */
function getNotificationTitle(execution: any, type: NotificationType): string {
  const jobName = execution.job.name;

  switch (type) {
    case NotificationType.JOB_SUCCESS:
      return `${jobName} completed successfully`;
    case NotificationType.JOB_FAILURE:
      return `${jobName} failed`;
    case NotificationType.JOB_PARTIAL:
      return `${jobName} completed with errors`;
    default:
      return `Cron job notification`;
  }
}

/**
 * Get notification message
 */
function getNotificationMessage(execution: any, type: NotificationType): string {
  const duration = execution.duration ? `in ${Math.round(execution.duration / 1000)}s` : "";

  switch (type) {
    case NotificationType.JOB_SUCCESS:
      return `Execution completed successfully ${duration}`;
    case NotificationType.JOB_FAILURE:
      return `Execution failed: ${execution.error || "Unknown error"}`;
    case NotificationType.JOB_PARTIAL:
      return `Execution completed with ${execution.itemsFailed} failures ${duration}`;
    default:
      return "Cron job execution notification";
  }
}

/**
 * Helper to get user preferences
 */
async function getUserPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  return (user?.preferences as any) || {};
}

/**
 * Helper to get existing notifications
 */
async function getExistingNotifications(userId: string) {
  const prefs = await getUserPreferences(userId);
  return prefs.notifications || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(userId: string, notificationIndex: number) {
  const notifications = await getExistingNotifications(userId);

  if (notifications[notificationIndex]) {
    notifications[notificationIndex].read = true;

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...(await getUserPreferences(userId)),
          notifications,
        },
      },
    });
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notifications = await getExistingNotifications(userId);
  return notifications.filter((n: any) => !n.read).length;
}
