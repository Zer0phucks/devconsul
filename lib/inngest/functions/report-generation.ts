/**
 * Report Generation Job Functions
 *
 * Async report generation with export support (CSV, PDF, iCal, ZIP)
 */

import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/db";
import { NonRetriableError } from "inngest";
import { put } from "@vercel/blob";
import { recordJobExecution } from "@/lib/monitoring/metrics-collector";
import { trackJobPerformance } from "@/lib/monitoring/performance-tracker";
import {
  ExportStatus,
  ReportStatus,
  ReportType,
  ReportFormat,
  ExportType,
  EmailReportType,
} from "@prisma/client";
import {
  exportContentHistoryCSV,
  exportAnalyticsCSV,
  exportScheduledContentCSV,
  streamToString,
} from "@/lib/reporting/csv";
import { generatePDFReport, streamPDFToFile } from "@/lib/reporting/pdf";
import {
  exportScheduledContentICalAsync,
  saveICalToFile,
} from "@/lib/reporting/ical";
import {
  exportImageLibraryZIP,
  exportImageMetadataCSV,
} from "@/lib/reporting/image-export";
import {
  sendWeeklySummaryEmail,
  sendMonthlyDigestEmail,
  sendBudgetAlertEmail,
  sendPublishingFailureEmail,
} from "@/lib/reporting/email-reports";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { readFile, unlink } from "fs/promises";

/**
 * Generate Report Job
 *
 * Creates PDF/CSV reports based on ReportConfig
 */
export const generateReportJob = inngest.createFunction(
  {
    id: "generate-report",
    name: "Generate Report from Configuration",
    retries: 3,
    concurrency: {
      limit: 5, // Max 5 concurrent report generations
    },
  },
  { event: "report/generate" },
  async ({ event, step }) => {
    const { reportConfigId, userId, triggeredBy } = event.data;
    const startTime = Date.now();

    // Create report history record
    const reportHistory = await step.run("create-report-history", async () => {
      const config = await prisma.reportConfig.findUnique({
        where: { id: reportConfigId },
      });

      if (!config) {
        throw new NonRetriableError(
          `Report config not found: ${reportConfigId}`
        );
      }

      return await prisma.reportHistory.create({
        data: {
          configId: reportConfigId,
          projectId: config.projectId,
          reportType: config.reportType,
          outputFormat: config.outputFormat,
          status: ReportStatus.PENDING,
          triggeredBy,
          metadata: {
            userId,
          },
        },
      });
    });

    try {
      // Fetch report configuration
      const config = await step.run("fetch-report-config", async () => {
        const cfg = await prisma.reportConfig.findUnique({
          where: { id: reportConfigId },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        });

        if (!cfg) {
          throw new NonRetriableError(
            `Report config not found: ${reportConfigId}`
          );
        }

        return cfg;
      });

      // Update status to processing
      await step.run("mark-processing", async () => {
        await prisma.reportHistory.update({
          where: { id: reportHistory.id },
          data: { status: ReportStatus.PROCESSING },
        });
      });

      // Generate report based on format
      const result = await step.run("generate-report-content", async () => {
        const dateFrom =
          config.dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dateTo = config.dateTo || new Date();

        if (config.outputFormat === ReportFormat.PDF) {
          return await generatePDFReportFile(
            config.projectId,
            config.reportType,
            dateFrom,
            dateTo,
            config.branding as any
          );
        } else if (config.outputFormat === ReportFormat.CSV) {
          return await generateCSVReportFile(
            config.projectId,
            config.reportType,
            dateFrom,
            dateTo
          );
        } else {
          throw new NonRetriableError(
            `Unsupported format: ${config.outputFormat}`
          );
        }
      });

      // Upload to Vercel Blob storage
      const uploadResult = await step.run("upload-to-storage", async () => {
        const filename = generateReportFilename(
          config.project.name,
          config.reportType,
          config.outputFormat
        );

        const fileBuffer = await readFile(result.filePath);

        const blob = await put(filename, fileBuffer, {
          access: "public",
          addRandomSuffix: true,
        });

        // Clean up temp file
        await unlink(result.filePath);

        return {
          url: blob.url,
          size: blob.size,
        };
      });

      // Update report history with success
      await step.run("mark-completed", async () => {
        await prisma.reportHistory.update({
          where: { id: reportHistory.id },
          data: {
            status: ReportStatus.COMPLETED,
            fileUrl: uploadResult.url,
            fileSize: uploadResult.size,
            recordCount: result.recordCount,
            completedAt: new Date(),
            duration: Date.now() - reportHistory.startedAt.getTime(),
          },
        });

        // Update config last run
        await prisma.reportConfig.update({
          where: { id: reportConfigId },
          data: {
            lastRunAt: new Date(),
          },
        });
      });

      // Send email if configured
      if (config.deliveryMethod === "email" && config.recipients) {
        await step.run("send-email-notification", async () => {
          // TODO: Implement email delivery with attachment
          console.log("Email delivery:", {
            recipients: config.recipients,
            fileUrl: uploadResult.url,
          });
        });
      }

      // Record successful execution
      const duration = Date.now() - startTime;
      await recordJobExecution("generate-report", true, duration, {
        reportConfigId,
        format: config.outputFormat,
        fileSize: uploadResult.size,
      });
      await trackJobPerformance("generate-report", duration, true);

      return {
        success: true,
        reportHistoryId: reportHistory.id,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
      };
    } catch (error: any) {
      // Mark report as failed
      await step.run("mark-failed", async () => {
        await prisma.reportHistory.update({
          where: { id: reportHistory.id },
          data: {
            status: ReportStatus.FAILED,
            error: error.message,
            completedAt: new Date(),
            duration: Date.now() - reportHistory.startedAt.getTime(),
          },
        });
      });

      // Record failed execution
      const duration = Date.now() - startTime;
      await recordJobExecution("generate-report", false, duration, {
        error: error.message,
        reportConfigId,
      });
      await trackJobPerformance("generate-report", duration, false);

      throw error;
    }
  }
);

/**
 * Export Data Job
 *
 * Handles CSV/JSON/iCal/ZIP exports
 */
export const exportDataJob = inngest.createFunction(
  {
    id: "export-data",
    name: "Export Project Data",
    retries: 3,
    concurrency: {
      limit: 3, // Limit concurrent exports
    },
  },
  { event: "export/data" },
  async ({ event, step }) => {
    const {
      projectId,
      exportType,
      outputFormat,
      userId,
      dateFrom,
      dateTo,
      options,
    } = event.data;
    const startTime = Date.now();

    // Create export job record
    const exportJob = await step.run("create-export-job", async () => {
      return await prisma.exportJob.create({
        data: {
          projectId,
          exportType,
          outputFormat,
          status: ExportStatus.PENDING,
          progress: 0,
          startedBy: userId,
          metadata: {
            dateFrom,
            dateTo,
            options,
          },
        },
      });
    });

    try {
      // Update to processing
      await step.run("mark-processing", async () => {
        await prisma.exportJob.update({
          where: { id: exportJob.id },
          data: {
            status: ExportStatus.PROCESSING,
            progress: 10,
          },
        });
      });

      // Generate export file
      const result = await step.run("generate-export", async () => {
        switch (exportType) {
          case ExportType.CONTENT_HISTORY:
            return await exportContentHistoryFile(
              projectId,
              outputFormat,
              dateFrom,
              dateTo,
              options
            );

          case ExportType.ANALYTICS:
            return await exportAnalyticsFile(
              projectId,
              outputFormat,
              dateFrom,
              dateTo
            );

          case ExportType.SCHEDULED_CONTENT:
            if (outputFormat === ReportFormat.ICAL) {
              return await exportScheduledContentICalFile(projectId, options);
            } else {
              return await exportScheduledContentFile(
                projectId,
                outputFormat,
                options
              );
            }

          case ExportType.IMAGE_LIBRARY:
            if (outputFormat === ReportFormat.ZIP) {
              return await exportImageLibraryFile(projectId, options);
            } else {
              return await exportImageLibraryMetadataFile(projectId, options);
            }

          default:
            throw new NonRetriableError(`Unsupported export type: ${exportType}`);
        }
      });

      // Update progress
      await step.run("update-progress", async () => {
        await prisma.exportJob.update({
          where: { id: exportJob.id },
          data: { progress: 60 },
        });
      });

      // Upload to storage
      const uploadResult = await step.run("upload-export", async () => {
        const filename = generateExportFilename(
          exportType,
          outputFormat,
          projectId
        );

        const fileBuffer = await readFile(result.filePath);

        const blob = await put(filename, fileBuffer, {
          access: "public",
          addRandomSuffix: true,
        });

        // Clean up temp file
        await unlink(result.filePath);

        return {
          url: blob.url,
          size: blob.size,
        };
      });

      // Mark completed
      await step.run("mark-completed", async () => {
        await prisma.exportJob.update({
          where: { id: exportJob.id },
          data: {
            status: ExportStatus.COMPLETED,
            progress: 100,
            fileUrl: uploadResult.url,
            fileSize: uploadResult.size,
            recordCount: result.recordCount,
            completedAt: new Date(),
            duration: Date.now() - exportJob.startedAt.getTime(),
          },
        });
      });

      // Record successful execution
      const duration = Date.now() - startTime;
      await recordJobExecution("export-data", true, duration, {
        exportType,
        format: outputFormat,
        fileSize: uploadResult.size,
      });
      await trackJobPerformance("export-data", duration, true);

      return {
        success: true,
        exportJobId: exportJob.id,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
      };
    } catch (error: any) {
      // Mark failed
      await step.run("mark-failed", async () => {
        await prisma.exportJob.update({
          where: { id: exportJob.id },
          data: {
            status: ExportStatus.FAILED,
            error: error.message,
            completedAt: new Date(),
            duration: Date.now() - exportJob.startedAt.getTime(),
          },
        });
      });

      // Record failed execution
      const duration = Date.now() - startTime;
      await recordJobExecution("export-data", false, duration, {
        error: error.message,
        exportType,
      });
      await trackJobPerformance("export-data", duration, false);

      throw error;
    }
  }
);

/**
 * Send Email Report Job
 *
 * Automated email reporting (weekly, monthly, alerts)
 */
export const sendEmailReportJob = inngest.createFunction(
  {
    id: "send-email-report",
    name: "Send Email Report",
    retries: 2,
  },
  { event: "report/email.send" },
  async ({ event, step }) => {
    const { subscriptionId, reportType, projectId, triggeredBy } = event.data;

    // Fetch subscription
    const subscription = await step.run("fetch-subscription", async () => {
      const sub = await prisma.emailReportSubscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!sub) {
        throw new NonRetriableError(
          `Email subscription not found: ${subscriptionId}`
        );
      }

      if (!sub.isActive) {
        throw new NonRetriableError("Email subscription is not active");
      }

      return sub;
    });

    // Send email based on report type
    const result = await step.run("send-email", async () => {
      switch (reportType) {
        case EmailReportType.WEEKLY_SUMMARY:
          return await sendWeeklySummaryEmail(projectId, subscription.recipients);

        case EmailReportType.MONTHLY_DIGEST:
          return await sendMonthlyDigestEmail(projectId, subscription.recipients);

        case EmailReportType.BUDGET_ALERT:
          // Fetch current costs
          const costs = await prisma.costTracking.aggregate({
            where: { projectId },
            _sum: { totalCost: true },
          });

          const threshold = subscription.thresholds?.budgetLimit || 100;
          const currentCost = costs._sum.totalCost || 0;

          return await sendBudgetAlertEmail(
            projectId,
            subscription.recipients,
            threshold,
            currentCost
          );

        case EmailReportType.PUBLISHING_FAILURES:
          // Fetch recent failures
          const failures = await prisma.contentPublication.findMany({
            where: {
              content: { projectId },
              status: "FAILED",
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
              },
            },
            include: {
              content: {
                select: { title: true },
              },
              platform: {
                select: { name: true, type: true },
              },
            },
          });

          return await sendPublishingFailureEmail(
            projectId,
            subscription.recipients,
            failures
          );

        default:
          throw new NonRetriableError(`Unsupported email report type: ${reportType}`);
      }
    });

    // Update subscription stats
    await step.run("update-subscription-stats", async () => {
      await prisma.emailReportSubscription.update({
        where: { id: subscriptionId },
        data: {
          lastSentAt: new Date(),
          deliveryCount: { increment: 1 },
          lastDeliveryStatus: result.success ? "SUCCESS" : "FAILED",
        },
      });
    });

    return {
      success: result.success,
      messageId: result.messageId,
      subscriptionId,
    };
  }
);

/**
 * Schedule Email Reports Cron
 *
 * Checks subscriptions and triggers scheduled email reports
 */
export const scheduleEmailReportsCron = inngest.createFunction(
  {
    id: "schedule-email-reports-cron",
    name: "Process Scheduled Email Reports",
    retries: 0,
  },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    // Find subscriptions due for sending
    const dueSubscriptions = await step.run("find-due-subscriptions", async () => {
      const now = new Date();

      return await prisma.emailReportSubscription.findMany({
        where: {
          isActive: true,
          nextScheduledAt: {
            lte: now,
          },
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
      });
    });

    if (dueSubscriptions.length === 0) {
      return { processed: 0, message: "No subscriptions due" };
    }

    // Trigger email jobs
    const results = await step.run("trigger-email-jobs", async () => {
      const jobResults = [];

      for (const subscription of dueSubscriptions) {
        try {
          await inngest.send({
            name: "report/email.send",
            data: {
              subscriptionId: subscription.id,
              reportType: subscription.reportType,
              projectId: subscription.projectId,
              triggeredBy: "cron",
            },
          });

          // Calculate next scheduled time
          const nextScheduledAt = calculateNextScheduledTime(
            subscription.frequency,
            subscription.scheduleConfig as any
          );

          // Update subscription
          await prisma.emailReportSubscription.update({
            where: { id: subscription.id },
            data: { nextScheduledAt },
          });

          jobResults.push({
            subscriptionId: subscription.id,
            triggered: true,
          });
        } catch (error: any) {
          jobResults.push({
            subscriptionId: subscription.id,
            triggered: false,
            error: error.message,
          });
        }
      }

      return jobResults;
    });

    return {
      processed: dueSubscriptions.length,
      triggered: results.filter((r) => r.triggered).length,
      results,
    };
  }
);

/**
 * Helper: Generate PDF report file
 */
async function generatePDFReportFile(
  projectId: string,
  reportType: ReportType,
  dateFrom: Date,
  dateTo: Date,
  branding?: any
): Promise<{ filePath: string; recordCount: number }> {
  const stream = await generatePDFReport({
    projectId,
    reportType,
    dateFrom,
    dateTo,
    branding,
    includeCharts: true,
    includeExecutiveSummary: true,
  });

  const tempPath = join(tmpdir(), `report-${Date.now()}.pdf`);
  const bytesWritten = await streamPDFToFile(stream, tempPath);

  return {
    filePath: tempPath,
    recordCount: bytesWritten,
  };
}

/**
 * Helper: Generate CSV report file
 */
async function generateCSVReportFile(
  projectId: string,
  reportType: ReportType,
  dateFrom: Date,
  dateTo: Date
): Promise<{ filePath: string; recordCount: number }> {
  let stream;

  if (reportType === ReportType.CONTENT_PERFORMANCE) {
    stream = await exportContentHistoryCSV({ projectId, dateFrom, dateTo });
  } else if (reportType === ReportType.PUBLISHING_ANALYTICS) {
    stream = await exportAnalyticsCSV(projectId, dateFrom, dateTo);
  } else {
    throw new NonRetriableError(
      `CSV not supported for report type: ${reportType}`
    );
  }

  const csvContent = await streamToString(stream);
  const tempPath = join(tmpdir(), `report-${Date.now()}.csv`);

  const { writeFile } = await import("fs/promises");
  await writeFile(tempPath, csvContent, "utf8");

  const lines = csvContent.split("\n").filter((line) => line.trim()).length;

  return {
    filePath: tempPath,
    recordCount: lines - 1, // Exclude header
  };
}

/**
 * Helper: Export content history file
 */
async function exportContentHistoryFile(
  projectId: string,
  format: ReportFormat,
  dateFrom?: Date,
  dateTo?: Date,
  options?: any
): Promise<{ filePath: string; recordCount: number }> {
  const stream = await exportContentHistoryCSV({
    projectId,
    dateFrom,
    dateTo,
    ...options,
  });

  const csvContent = await streamToString(stream);
  const tempPath = join(
    tmpdir(),
    `content-history-${Date.now()}.${format.toLowerCase()}`
  );

  const { writeFile } = await import("fs/promises");
  await writeFile(tempPath, csvContent, "utf8");

  const lines = csvContent.split("\n").filter((line) => line.trim()).length;

  return {
    filePath: tempPath,
    recordCount: lines - 1,
  };
}

/**
 * Helper: Export analytics file
 */
async function exportAnalyticsFile(
  projectId: string,
  format: ReportFormat,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{ filePath: string; recordCount: number }> {
  const stream = await exportAnalyticsCSV(projectId, dateFrom, dateTo);
  const csvContent = await streamToString(stream);

  const tempPath = join(
    tmpdir(),
    `analytics-${Date.now()}.${format.toLowerCase()}`
  );

  const { writeFile } = await import("fs/promises");
  await writeFile(tempPath, csvContent, "utf8");

  const lines = csvContent.split("\n").filter((line) => line.trim()).length;

  return {
    filePath: tempPath,
    recordCount: lines - 1,
  };
}

/**
 * Helper: Export scheduled content file (CSV)
 */
async function exportScheduledContentFile(
  projectId: string,
  format: ReportFormat,
  options?: any
): Promise<{ filePath: string; recordCount: number }> {
  const stream = await exportScheduledContentCSV(projectId);
  const csvContent = await streamToString(stream);

  const tempPath = join(
    tmpdir(),
    `scheduled-${Date.now()}.${format.toLowerCase()}`
  );

  const { writeFile } = await import("fs/promises");
  await writeFile(tempPath, csvContent, "utf8");

  const lines = csvContent.split("\n").filter((line) => line.trim()).length;

  return {
    filePath: tempPath,
    recordCount: lines - 1,
  };
}

/**
 * Helper: Export scheduled content iCal file
 */
async function exportScheduledContentICalFile(
  projectId: string,
  options?: any
): Promise<{ filePath: string; recordCount: number }> {
  const icalContent = await exportScheduledContentICalAsync({
    projectId,
    ...options,
  });

  const tempPath = join(tmpdir(), `calendar-${Date.now()}.ics`);
  const fileSize = await saveICalToFile(icalContent, tempPath);

  // Count events
  const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;

  return {
    filePath: tempPath,
    recordCount: eventCount,
  };
}

/**
 * Helper: Export image library ZIP
 */
async function exportImageLibraryFile(
  projectId: string,
  options?: any
): Promise<{ filePath: string; recordCount: number }> {
  const tempPath = join(tmpdir(), `images-${Date.now()}.zip`);

  const result = await exportImageLibraryZIP(
    {
      projectId,
      ...options,
    },
    tempPath
  );

  return {
    filePath: tempPath,
    recordCount: result.imageCount,
  };
}

/**
 * Helper: Export image library metadata CSV
 */
async function exportImageLibraryMetadataFile(
  projectId: string,
  options?: any
): Promise<{ filePath: string; recordCount: number }> {
  const csvContent = await exportImageMetadataCSV({
    projectId,
    ...options,
  });

  const tempPath = join(tmpdir(), `image-metadata-${Date.now()}.csv`);

  const { writeFile } = await import("fs/promises");
  await writeFile(tempPath, csvContent, "utf8");

  const lines = csvContent.split("\n").filter((line) => line.trim()).length;

  return {
    filePath: tempPath,
    recordCount: lines - 1,
  };
}

/**
 * Helper: Generate report filename
 */
function generateReportFilename(
  projectName: string,
  reportType: ReportType,
  format: ReportFormat
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const typeSlug = reportType.toLowerCase().replace(/_/g, "-");

  return `${safeName}-${typeSlug}-${timestamp}.${format.toLowerCase()}`;
}

/**
 * Helper: Generate export filename
 */
function generateExportFilename(
  exportType: ExportType,
  format: ReportFormat,
  projectId: string
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const typeSlug = exportType.toLowerCase().replace(/_/g, "-");

  return `export-${typeSlug}-${projectId.slice(0, 8)}-${timestamp}.${format.toLowerCase()}`;
}

/**
 * Helper: Calculate next scheduled time for email reports
 */
function calculateNextScheduledTime(
  frequency: string,
  config: any
): Date {
  const now = new Date();

  switch (frequency) {
    case "daily":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);

    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    case "monthly":
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;

    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
