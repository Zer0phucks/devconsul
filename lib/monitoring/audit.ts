/**
 * Audit Logging Utility
 *
 * Comprehensive audit trail for all user actions and system events.
 * Tracks:
 * - User authentication events
 * - Content generation and modifications
 * - Platform publishing events
 * - Configuration changes
 * - Approval/rejection decisions
 * - Cost-impacting operations
 */

import { prisma } from '@/lib/db';
import { AuditResource } from '@prisma/client';

export interface AuditLogOptions {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource: AuditResource;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  projectId?: string;
  platformId?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    // Filter sensitive data before logging
    const sanitizedOldValues = sanitizeValues(options.oldValues);
    const sanitizedNewValues = sanitizeValues(options.newValues);

    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        userEmail: options.userEmail,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId,
        oldValues: sanitizedOldValues,
        newValues: sanitizedNewValues,
        metadata: options.metadata,
        projectId: options.projectId,
        platformId: options.platformId,
      },
    });
  } catch (error) {
    // Don't throw errors from audit logging - log to console instead
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Sanitize values to remove sensitive data
 */
function sanitizeValues(values?: Record<string, any>): Record<string, any> | undefined {
  if (!values) return undefined;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'privateKey',
    'sessionId',
    'cookie',
  ];

  const sanitized = { ...values };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Audit log helpers for common actions
 */

// User actions
export async function auditUserLogin(userId: string, userEmail: string, ipAddress?: string, userAgent?: string) {
  return createAuditLog({
    userId,
    userEmail,
    ipAddress,
    userAgent,
    action: 'login',
    resource: AuditResource.USER,
    resourceId: userId,
  });
}

export async function auditUserLogout(userId: string, userEmail: string) {
  return createAuditLog({
    userId,
    userEmail,
    action: 'logout',
    resource: AuditResource.USER,
    resourceId: userId,
  });
}

export async function auditUserUpdate(
  userId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'update',
    resource: AuditResource.USER,
    resourceId: userId,
    oldValues,
    newValues,
  });
}

// Project actions
export async function auditProjectCreate(userId: string, projectId: string, projectData: Record<string, any>) {
  return createAuditLog({
    userId,
    action: 'create',
    resource: AuditResource.PROJECT,
    resourceId: projectId,
    projectId,
    newValues: projectData,
  });
}

export async function auditProjectUpdate(
  userId: string,
  projectId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'update',
    resource: AuditResource.PROJECT,
    resourceId: projectId,
    projectId,
    oldValues,
    newValues,
  });
}

export async function auditProjectDelete(userId: string, projectId: string, projectData: Record<string, any>) {
  return createAuditLog({
    userId,
    action: 'delete',
    resource: AuditResource.PROJECT,
    resourceId: projectId,
    projectId,
    oldValues: projectData,
  });
}

// Platform actions
export async function auditPlatformConnect(
  userId: string,
  projectId: string,
  platformId: string,
  platformData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'connect',
    resource: AuditResource.PLATFORM,
    resourceId: platformId,
    projectId,
    platformId,
    newValues: platformData,
  });
}

export async function auditPlatformDisconnect(
  userId: string,
  projectId: string,
  platformId: string,
  platformData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'disconnect',
    resource: AuditResource.PLATFORM,
    resourceId: platformId,
    projectId,
    platformId,
    oldValues: platformData,
  });
}

// Content actions
export async function auditContentGenerate(
  userId: string,
  projectId: string,
  contentId: string,
  contentData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'generate',
    resource: AuditResource.CONTENT,
    resourceId: contentId,
    projectId,
    newValues: contentData,
    metadata: {
      aiGenerated: true,
      generatedAt: new Date().toISOString(),
    },
  });
}

export async function auditContentUpdate(
  userId: string,
  projectId: string,
  contentId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'update',
    resource: AuditResource.CONTENT,
    resourceId: contentId,
    projectId,
    oldValues,
    newValues,
  });
}

export async function auditContentPublish(
  userId: string,
  projectId: string,
  contentId: string,
  platformId: string,
  publishData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'publish',
    resource: AuditResource.CONTENT,
    resourceId: contentId,
    projectId,
    platformId,
    newValues: publishData,
    metadata: {
      publishedAt: new Date().toISOString(),
    },
  });
}

export async function auditContentApprove(
  userId: string,
  projectId: string,
  contentId: string,
  decision: 'approve' | 'reject',
  feedback?: string
) {
  return createAuditLog({
    userId,
    action: decision,
    resource: AuditResource.CONTENT,
    resourceId: contentId,
    projectId,
    metadata: {
      decision,
      feedback,
      decidedAt: new Date().toISOString(),
    },
  });
}

export async function auditContentDelete(
  userId: string,
  projectId: string,
  contentId: string,
  contentData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'delete',
    resource: AuditResource.CONTENT,
    resourceId: contentId,
    projectId,
    oldValues: contentData,
  });
}

// Settings actions
export async function auditSettingsUpdate(
  userId: string,
  projectId: string,
  settingsId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'update',
    resource: AuditResource.SETTINGS,
    resourceId: settingsId,
    projectId,
    oldValues,
    newValues,
  });
}

// Cron job actions
export async function auditCronJobCreate(
  userId: string,
  projectId: string,
  jobId: string,
  jobData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'create',
    resource: AuditResource.CRON_JOB,
    resourceId: jobId,
    projectId,
    newValues: jobData,
  });
}

export async function auditCronJobUpdate(
  userId: string,
  projectId: string,
  jobId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'update',
    resource: AuditResource.CRON_JOB,
    resourceId: jobId,
    projectId,
    oldValues,
    newValues,
  });
}

export async function auditCronJobDelete(
  userId: string,
  projectId: string,
  jobId: string,
  jobData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'delete',
    resource: AuditResource.CRON_JOB,
    resourceId: jobId,
    projectId,
    oldValues: jobData,
  });
}

// Email campaign actions
export async function auditEmailCampaignCreate(
  userId: string,
  projectId: string,
  campaignId: string,
  campaignData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'create',
    resource: AuditResource.EMAIL_CAMPAIGN,
    resourceId: campaignId,
    projectId,
    newValues: campaignData,
  });
}

export async function auditEmailCampaignSend(
  userId: string,
  projectId: string,
  campaignId: string,
  sendData: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: 'send',
    resource: AuditResource.EMAIL_CAMPAIGN,
    resourceId: campaignId,
    projectId,
    newValues: sendData,
    metadata: {
      sentAt: new Date().toISOString(),
    },
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  resource?: AuditResource;
  resourceId?: string;
  action?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.resource) where.resource = filters.resource;
  if (filters.resourceId) where.resourceId = filters.resourceId;
  if (filters.action) where.action = filters.action;
  if (filters.projectId) where.projectId = filters.projectId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: any[]): string {
  const headers = [
    'Timestamp',
    'User ID',
    'User Email',
    'Action',
    'Resource',
    'Resource ID',
    'Project ID',
    'IP Address',
  ];

  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.userId || '',
    log.userEmail || '',
    log.action,
    log.resource,
    log.resourceId,
    log.projectId || '',
    log.ipAddress || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}
