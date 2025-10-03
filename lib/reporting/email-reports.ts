/**
 * Email Report System
 *
 * Automated email reports with HTML templates
 */

import { prisma } from "@/lib/db";
import { Resend } from "resend";
import type { EmailReportType } from "@prisma/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email report data structure
 */
interface EmailReportData {
  project: {
    id: string;
    name: string;
  };
  period: {
    from: Date;
    to: Date;
    label: string;
  };
  metrics: {
    contentCreated: number;
    contentPublished: number;
    totalPublications: number;
    successRate: number;
    aiGeneratedCount: number;
  };
  platforms: Array<{
    name: string;
    type: string;
    published: number;
  }>;
  topContent: Array<{
    title: string;
    publishedAt: Date | null;
  }>;
  costSummary?: {
    totalCost: number;
    aiCost: number;
    platformCost: number;
  };
  alerts?: Array<{
    type: string;
    message: string;
    severity: "info" | "warning" | "error";
  }>;
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(
  projectId: string,
  recipients: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Calculate week range
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const data = await fetchReportData(projectId, weekStart, weekEnd);
    data.period.label = "Weekly Summary";

    const html = generateWeeklySummaryHTML(data);
    const subject = `${project.name} - Weekly Summary (${format(weekStart, "MMM dd")} - ${format(weekEnd, "MMM dd")})`;

    const result = await resend.emails.send({
      from: "Full Self Publishing <reports@fullselfpublishing.com>",
      to: recipients,
      subject,
      html,
      headers: {
        "X-Report-Type": "weekly-summary",
        "X-Project-ID": projectId,
      },
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error("Failed to send weekly summary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send monthly digest email
 */
export async function sendMonthlyDigestEmail(
  projectId: string,
  recipients: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Calculate month range
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const data = await fetchReportData(projectId, monthStart, monthEnd);
    data.period.label = "Monthly Digest";

    const html = generateMonthlyDigestHTML(data);
    const subject = `${project.name} - Monthly Digest (${format(monthStart, "MMMM yyyy")})`;

    const result = await resend.emails.send({
      from: "Full Self Publishing <reports@fullselfpublishing.com>",
      to: recipients,
      subject,
      html,
      headers: {
        "X-Report-Type": "monthly-digest",
        "X-Project-ID": projectId,
      },
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error("Failed to send monthly digest:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send budget alert email
 */
export async function sendBudgetAlertEmail(
  projectId: string,
  recipients: string[],
  threshold: number,
  currentCost: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const percentUsed = (currentCost / threshold) * 100;
    const severity = percentUsed >= 90 ? "critical" : percentUsed >= 75 ? "warning" : "info";

    const html = generateBudgetAlertHTML(
      project.name,
      threshold,
      currentCost,
      percentUsed,
      severity
    );

    const subject = `${project.name} - Budget Alert: ${percentUsed.toFixed(0)}% Used`;

    const result = await resend.emails.send({
      from: "Full Self Publishing <alerts@fullselfpublishing.com>",
      to: recipients,
      subject,
      html,
      headers: {
        "X-Report-Type": "budget-alert",
        "X-Project-ID": projectId,
        "X-Priority": severity === "critical" ? "high" : "normal",
      },
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error("Failed to send budget alert:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send publishing failure alert
 */
export async function sendPublishingFailureEmail(
  projectId: string,
  recipients: string[],
  failures: Array<{
    contentTitle: string;
    platform: string;
    error: string;
    timestamp: Date;
  }>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const html = generatePublishingFailureHTML(project.name, failures);
    const subject = `${project.name} - Publishing Failures (${failures.length} items)`;

    const result = await resend.emails.send({
      from: "Full Self Publishing <alerts@fullselfpublishing.com>",
      to: recipients,
      subject,
      html,
      headers: {
        "X-Report-Type": "publishing-failure",
        "X-Project-ID": projectId,
        "X-Failure-Count": failures.length.toString(),
      },
    });

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error("Failed to send publishing failure alert:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch report data from database
 */
async function fetchReportData(
  projectId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<EmailReportData> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Fetch content metrics
  const [contentCreated, contentPublished, aiGeneratedCount] = await Promise.all([
    prisma.content.count({
      where: {
        projectId,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
    }),
    prisma.content.count({
      where: {
        projectId,
        status: "PUBLISHED",
        publishedAt: { gte: dateFrom, lte: dateTo },
      },
    }),
    prisma.content.count({
      where: {
        projectId,
        isAIGenerated: true,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
    }),
  ]);

  // Fetch publication metrics
  const publications = await prisma.contentPublication.findMany({
    where: {
      content: { projectId },
      createdAt: { gte: dateFrom, lte: dateTo },
    },
    include: {
      platform: {
        select: { name: true, type: true },
      },
    },
  });

  const successfulPublications = publications.filter((p) => p.status === "PUBLISHED");
  const successRate =
    publications.length > 0 ? (successfulPublications.length / publications.length) * 100 : 0;

  // Platform breakdown
  const platformMap = new Map<string, { name: string; type: string; count: number }>();
  successfulPublications.forEach((pub) => {
    const key = pub.platform.type;
    if (!platformMap.has(key)) {
      platformMap.set(key, {
        name: pub.platform.name,
        type: pub.platform.type,
        count: 0,
      });
    }
    platformMap.get(key)!.count++;
  });

  // Top content
  const topContent = await prisma.content.findMany({
    where: {
      projectId,
      status: "PUBLISHED",
      publishedAt: { gte: dateFrom, lte: dateTo },
    },
    select: {
      title: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 5,
  });

  return {
    project,
    period: {
      from: dateFrom,
      to: dateTo,
      label: "",
    },
    metrics: {
      contentCreated,
      contentPublished,
      totalPublications: publications.length,
      successRate,
      aiGeneratedCount,
    },
    platforms: Array.from(platformMap.values()).map((p) => ({
      name: p.name,
      type: p.type,
      published: p.count,
    })),
    topContent,
  };
}

/**
 * Generate weekly summary HTML email
 */
function generateWeeklySummaryHTML(data: EmailReportData): string {
  const { project, period, metrics, platforms, topContent } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Summary</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: #2563eb; margin: 0; }
    .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin: 5px 0 0; }
    .section { margin: 30px 0; }
    .section h2 { color: #1e293b; font-size: 18px; margin-bottom: 15px; }
    .platform-item { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${project.name}</h1>
    <p>Weekly Summary - ${format(period.from, "MMM dd")} to ${format(period.to, "MMM dd")}</p>
  </div>

  <div class="content">
    <div class="metric-grid">
      <div class="metric-box">
        <p class="metric-value">${metrics.contentCreated}</p>
        <p class="metric-label">Content Created</p>
      </div>
      <div class="metric-box">
        <p class="metric-value">${metrics.contentPublished}</p>
        <p class="metric-label">Published</p>
      </div>
      <div class="metric-box">
        <p class="metric-value">${metrics.totalPublications}</p>
        <p class="metric-label">Total Publications</p>
      </div>
      <div class="metric-box">
        <p class="metric-value">${metrics.successRate.toFixed(0)}%</p>
        <p class="metric-label">Success Rate</p>
      </div>
    </div>

    <div class="section">
      <h2>Platform Breakdown</h2>
      ${platforms
        .map(
          (p) => `
        <div class="platform-item">
          <strong>${p.name}</strong> (${p.type}): ${p.published} published
        </div>
      `
        )
        .join("")}
    </div>

    <div class="section">
      <h2>Top Published Content</h2>
      <ol>
        ${topContent
          .map(
            (content) => `
          <li>${content.title} - ${content.publishedAt ? format(content.publishedAt, "MMM dd") : "N/A"}</li>
        `
          )
          .join("")}
      </ol>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated report from Full Self Publishing</p>
    <p><a href="https://fullselfpublishing.com/dashboard/${project.id}">View Dashboard</a> | <a href="https://fullselfpublishing.com/settings/notifications">Manage Preferences</a></p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate monthly digest HTML email
 */
function generateMonthlyDigestHTML(data: EmailReportData): string {
  // Similar structure to weekly but with more detailed analytics
  return generateWeeklySummaryHTML(data); // Simplified for now
}

/**
 * Generate budget alert HTML email
 */
function generateBudgetAlertHTML(
  projectName: string,
  threshold: number,
  currentCost: number,
  percentUsed: number,
  severity: string
): string {
  const color = severity === "critical" ? "#dc2626" : severity === "warning" ? "#f59e0b" : "#2563eb";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: ${color}; color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .alert-box { background: #fef2f2; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; }
    .progress-bar { background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
    .progress-fill { background: ${color}; height: 100%; line-height: 30px; text-align: center; color: white; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Budget Alert</h1>
    <p>${projectName}</p>
  </div>

  <div class="content">
    <div class="alert-box">
      <h2>Budget Threshold Reached</h2>
      <p>Your project has used <strong>${percentUsed.toFixed(1)}%</strong> of the allocated budget.</p>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" style="width: ${Math.min(percentUsed, 100)}%">
        ${percentUsed.toFixed(0)}%
      </div>
    </div>

    <p><strong>Budget Limit:</strong> $${threshold.toFixed(2)}</p>
    <p><strong>Current Spend:</strong> $${currentCost.toFixed(2)}</p>
    <p><strong>Remaining:</strong> $${(threshold - currentCost).toFixed(2)}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate publishing failure HTML email
 */
function generatePublishingFailureHTML(
  projectName: string,
  failures: Array<{
    contentTitle: string;
    platform: string;
    error: string;
    timestamp: Date;
  }>
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Publishing Failures</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .failure-item { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 15px; }
    .failure-item h3 { margin: 0 0 10px; color: #991b1b; }
    .failure-item p { margin: 5px 0; font-size: 14px; }
    .error-message { font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Publishing Failures</h1>
    <p>${projectName}</p>
  </div>

  <div class="content">
    <p>${failures.length} content item(s) failed to publish. Please review and retry.</p>

    ${failures
      .map(
        (failure) => `
      <div class="failure-item">
        <h3>${failure.contentTitle}</h3>
        <p><strong>Platform:</strong> ${failure.platform}</p>
        <p><strong>Time:</strong> ${format(failure.timestamp, "MMM dd, yyyy HH:mm")}</p>
        <p><strong>Error:</strong></p>
        <div class="error-message">${failure.error}</div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>
  `;
}
