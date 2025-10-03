/**
 * Alert Management System
 *
 * Manages alerts and notifications for:
 * - System health issues
 * - Job failures
 * - Performance degradation
 * - Queue backlogs
 * - Platform API failures
 */

import { prisma } from "@/lib/db";
import { SystemHealth, HealthStatus } from "./health-checks";

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Alert types
 */
export enum AlertType {
  SYSTEM_HEALTH = "system_health",
  JOB_FAILURE = "job_failure",
  QUEUE_BACKLOG = "queue_backlog",
  PERFORMANCE_DEGRADATION = "performance_degradation",
  PLATFORM_API_FAILURE = "platform_api_failure",
  DATABASE_ISSUE = "database_issue",
  HIGH_ERROR_RATE = "high_error_rate",
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  type: AlertType;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number;
  webhookUrl?: string;
  emailRecipients?: string[];
  slackWebhook?: string;
}

/**
 * Alert notification
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

/**
 * Alert state tracking
 */
const alertState = new Map<string, { lastTriggered: Date; count: number }>();

/**
 * Default alert configurations
 */
export const DEFAULT_ALERT_CONFIGS: AlertConfig[] = [
  {
    type: AlertType.SYSTEM_HEALTH,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    cooldownMinutes: 15,
  },
  {
    type: AlertType.JOB_FAILURE,
    severity: AlertSeverity.ERROR,
    enabled: true,
    cooldownMinutes: 30,
  },
  {
    type: AlertType.QUEUE_BACKLOG,
    severity: AlertSeverity.WARNING,
    enabled: true,
    cooldownMinutes: 60,
  },
  {
    type: AlertType.PERFORMANCE_DEGRADATION,
    severity: AlertSeverity.WARNING,
    enabled: true,
    cooldownMinutes: 30,
  },
  {
    type: AlertType.PLATFORM_API_FAILURE,
    severity: AlertSeverity.ERROR,
    enabled: true,
    cooldownMinutes: 15,
  },
  {
    type: AlertType.DATABASE_ISSUE,
    severity: AlertSeverity.CRITICAL,
    enabled: true,
    cooldownMinutes: 5,
  },
  {
    type: AlertType.HIGH_ERROR_RATE,
    severity: AlertSeverity.ERROR,
    enabled: true,
    cooldownMinutes: 30,
  },
];

/**
 * Check if alert is in cooldown period
 */
function isInCooldown(
  alertType: AlertType,
  cooldownMinutes: number
): boolean {
  const state = alertState.get(alertType);
  if (!state) return false;

  const cooldownMs = cooldownMinutes * 60 * 1000;
  const timeSinceLastAlert = Date.now() - state.lastTriggered.getTime();

  return timeSinceLastAlert < cooldownMs;
}

/**
 * Record alert trigger
 */
function recordAlertTrigger(alertType: AlertType): void {
  const state = alertState.get(alertType);

  if (state) {
    alertState.set(alertType, {
      lastTriggered: new Date(),
      count: state.count + 1,
    });
  } else {
    alertState.set(alertType, {
      lastTriggered: new Date(),
      count: 1,
    });
  }
}

/**
 * Create alert
 */
export async function createAlert(
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<Alert> {
  const alert: Alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    type,
    severity,
    title,
    message,
    timestamp: new Date(),
    metadata,
    resolved: false,
  };

  // Store in database
  await prisma.alert.create({
    data: {
      type,
      severity,
      title,
      message,
      metadata: metadata || {},
      resolved: false,
    },
  });

  return alert;
}

/**
 * Trigger alert if conditions are met
 */
export async function triggerAlert(
  config: AlertConfig,
  title: string,
  message: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  if (!config.enabled) {
    return false;
  }

  // Check cooldown
  if (isInCooldown(config.type, config.cooldownMinutes)) {
    return false;
  }

  // Create alert
  const alert = await createAlert(
    config.type,
    config.severity,
    title,
    message,
    metadata
  );

  // Record trigger
  recordAlertTrigger(config.type);

  // Send notifications
  await sendAlertNotifications(alert, config);

  return true;
}

/**
 * Send alert notifications
 */
async function sendAlertNotifications(
  alert: Alert,
  config: AlertConfig
): Promise<void> {
  const notifications: Promise<void>[] = [];

  // Webhook notification
  if (config.webhookUrl) {
    notifications.push(sendWebhookNotification(alert, config.webhookUrl));
  }

  // Email notification
  if (config.emailRecipients && config.emailRecipients.length > 0) {
    notifications.push(
      sendEmailNotification(alert, config.emailRecipients)
    );
  }

  // Slack notification
  if (config.slackWebhook) {
    notifications.push(sendSlackNotification(alert, config.slackWebhook));
  }

  await Promise.allSettled(notifications);
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  alert: Alert,
  webhookUrl: string
): Promise<void> {
  try {
    const payload = {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp.toISOString(),
      metadata: alert.metadata,
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send webhook notification:", error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  alert: Alert,
  recipients: string[]
): Promise<void> {
  try {
    // Would integrate with email service (SendGrid, etc.)
    console.log("Email notification:", {
      recipients,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      body: alert.message,
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(
  alert: Alert,
  webhookUrl: string
): Promise<void> {
  try {
    const color =
      alert.severity === AlertSeverity.CRITICAL
        ? "danger"
        : alert.severity === AlertSeverity.ERROR
        ? "warning"
        : "good";

    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: "Severity",
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Type",
              value: alert.type,
              short: true,
            },
            {
              title: "Timestamp",
              value: alert.timestamp.toISOString(),
              short: false,
            },
          ],
          footer: "Full Self Publishing Monitoring",
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
  }
}

/**
 * Check system health and trigger alerts
 */
export async function checkAndAlert(
  health: SystemHealth
): Promise<string[]> {
  const triggeredAlerts: string[] = [];

  // System health alert
  if (health.status === HealthStatus.UNHEALTHY) {
    const config = DEFAULT_ALERT_CONFIGS.find(
      (c) => c.type === AlertType.SYSTEM_HEALTH
    );
    if (config) {
      const triggered = await triggerAlert(
        config,
        "System Unhealthy",
        `System is in unhealthy state. ${health.overall.unhealthy} checks failed.`,
        { health }
      );
      if (triggered) triggeredAlerts.push(AlertType.SYSTEM_HEALTH);
    }
  }

  // Database issues
  if (health.checks.database.status === HealthStatus.UNHEALTHY) {
    const config = DEFAULT_ALERT_CONFIGS.find(
      (c) => c.type === AlertType.DATABASE_ISSUE
    );
    if (config) {
      const triggered = await triggerAlert(
        config,
        "Database Issue Detected",
        health.checks.database.message,
        { database: health.checks.database }
      );
      if (triggered) triggeredAlerts.push(AlertType.DATABASE_ISSUE);
    }
  }

  // Job queue issues
  if (health.checks.jobs.status === HealthStatus.UNHEALTHY) {
    const config = DEFAULT_ALERT_CONFIGS.find(
      (c) => c.type === AlertType.JOB_FAILURE
    );
    if (config) {
      const triggered = await triggerAlert(
        config,
        "Job Queue Issues",
        health.checks.jobs.message,
        { jobs: health.checks.jobs }
      );
      if (triggered) triggeredAlerts.push(AlertType.JOB_FAILURE);
    }
  }

  // Queue backlog
  if (health.checks.jobs.details?.stuckJobs > 10) {
    const config = DEFAULT_ALERT_CONFIGS.find(
      (c) => c.type === AlertType.QUEUE_BACKLOG
    );
    if (config) {
      const triggered = await triggerAlert(
        config,
        "Queue Backlog Detected",
        `${health.checks.jobs.details.stuckJobs} stuck jobs in queue`,
        { jobs: health.checks.jobs }
      );
      if (triggered) triggeredAlerts.push(AlertType.QUEUE_BACKLOG);
    }
  }

  // Platform API failures
  if (
    health.checks.platforms.status === HealthStatus.UNHEALTHY ||
    health.checks.platforms.details?.failureRate > 30
  ) {
    const config = DEFAULT_ALERT_CONFIGS.find(
      (c) => c.type === AlertType.PLATFORM_API_FAILURE
    );
    if (config) {
      const triggered = await triggerAlert(
        config,
        "Platform API Failures",
        health.checks.platforms.message,
        { platforms: health.checks.platforms }
      );
      if (triggered) triggeredAlerts.push(AlertType.PLATFORM_API_FAILURE);
    }
  }

  return triggeredAlerts;
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string): Promise<void> {
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get active alerts
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  const alerts = await prisma.alert.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return alerts.map((a) => ({
    id: a.id,
    type: a.type as AlertType,
    severity: a.severity as AlertSeverity,
    title: a.title,
    message: a.message,
    timestamp: a.createdAt,
    metadata: a.metadata as any,
    resolved: a.resolved,
    resolvedAt: a.resolvedAt || undefined,
  }));
}

/**
 * Get alert history
 */
export async function getAlertHistory(
  hours: number = 24
): Promise<Alert[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const alerts = await prisma.alert.findMany({
    where: {
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  return alerts.map((a) => ({
    id: a.id,
    type: a.type as AlertType,
    severity: a.severity as AlertSeverity,
    title: a.title,
    message: a.message,
    timestamp: a.createdAt,
    metadata: a.metadata as any,
    resolved: a.resolved,
    resolvedAt: a.resolvedAt || undefined,
  }));
}

/**
 * Clear alert state (for testing)
 */
export function clearAlertState(): void {
  alertState.clear();
}
