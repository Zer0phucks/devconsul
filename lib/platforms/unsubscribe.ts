/**
 * Unsubscribe Management System
 *
 * CAN-SPAM compliant unsubscribe handling:
 * - Unique unsubscribe tokens
 * - Global unsubscribe list
 * - Opt-out verification before sending
 * - Resubscribe capability
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate unique unsubscribe token
 */
export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/unsubscribe/${token}`;
}

// ============================================
// UNSUBSCRIBE OPERATIONS
// ============================================

/**
 * Check if email is unsubscribed
 */
export async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const unsubscribe = await prisma.emailUnsubscribe.findFirst({
    where: {
      email: email.toLowerCase(),
      isActive: true,
    },
  });

  return !!unsubscribe;
}

/**
 * Unsubscribe email address
 */
export async function unsubscribeEmail(
  email: string,
  options: {
    reason?: string;
    projectId?: string;
    campaignId?: string;
    token?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase();

    // Check if already unsubscribed
    const existing = await prisma.emailUnsubscribe.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Reactivate if previously unsubscribed
      await prisma.emailUnsubscribe.update({
        where: { email: normalizedEmail },
        data: {
          isActive: true,
          unsubscribedAt: new Date(),
          reason: options.reason,
          projectId: options.projectId,
          campaignId: options.campaignId,
          token: options.token,
          resubscribedAt: null,
        },
      });
    } else {
      // Create new unsubscribe record
      await prisma.emailUnsubscribe.create({
        data: {
          email: normalizedEmail,
          unsubscribedAt: new Date(),
          reason: options.reason,
          projectId: options.projectId,
          campaignId: options.campaignId,
          token: options.token,
          isActive: true,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unsubscribe by token
 */
export async function unsubscribeByToken(
  token: string,
  reason?: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    // Find recipient by token
    const recipient = await prisma.emailRecipient.findUnique({
      where: { token },
      include: { campaign: true },
    });

    if (!recipient) {
      return { success: false, error: 'Invalid unsubscribe token' };
    }

    // Unsubscribe the email
    const result = await unsubscribeEmail(recipient.email, {
      reason,
      projectId: recipient.campaign.projectId,
      campaignId: recipient.campaignId,
      token,
    });

    if (!result.success) {
      return result;
    }

    // Update recipient status
    await prisma.emailRecipient.update({
      where: { id: recipient.id },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });

    return { success: true, email: recipient.email };
  } catch (error) {
    console.error('Unsubscribe by token error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resubscribe email address
 */
export async function resubscribeEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase();

    const unsubscribe = await prisma.emailUnsubscribe.findUnique({
      where: { email: normalizedEmail },
    });

    if (!unsubscribe) {
      return { success: false, error: 'Email not found in unsubscribe list' };
    }

    await prisma.emailUnsubscribe.update({
      where: { email: normalizedEmail },
      data: {
        isActive: false,
        resubscribedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Resubscribe error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get unsubscribe details by token
 */
export async function getUnsubscribeInfo(token: string): Promise<{
  email: string;
  campaignName: string;
  projectName?: string;
} | null> {
  try {
    const recipient = await prisma.emailRecipient.findUnique({
      where: { token },
      include: {
        campaign: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!recipient) return null;

    return {
      email: recipient.email,
      campaignName: recipient.campaign.name,
      projectName: recipient.campaign.project.name,
    };
  } catch (error) {
    console.error('Get unsubscribe info error:', error);
    return null;
  }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Filter out unsubscribed emails from a list
 */
export async function filterUnsubscribedEmails(
  emails: string[]
): Promise<string[]> {
  const normalizedEmails = emails.map(e => e.toLowerCase());

  const unsubscribed = await prisma.emailUnsubscribe.findMany({
    where: {
      email: { in: normalizedEmails },
      isActive: true,
    },
    select: { email: true },
  });

  const unsubscribedSet = new Set(unsubscribed.map(u => u.email));

  return emails.filter(email => !unsubscribedSet.has(email.toLowerCase()));
}

/**
 * Get unsubscribe statistics
 */
export async function getUnsubscribeStats(projectId?: string): Promise<{
  total: number;
  active: number;
  resubscribed: number;
  byProject?: Record<string, number>;
}> {
  const where = projectId ? { projectId } : {};

  const [total, active, resubscribed] = await Promise.all([
    prisma.emailUnsubscribe.count({ where }),
    prisma.emailUnsubscribe.count({ where: { ...where, isActive: true } }),
    prisma.emailUnsubscribe.count({ where: { ...where, isActive: false, resubscribedAt: { not: null } } }),
  ]);

  const stats: any = {
    total,
    active,
    resubscribed,
  };

  // Get stats by project
  if (!projectId) {
    const byProject = await prisma.emailUnsubscribe.groupBy({
      by: ['projectId'],
      where: { isActive: true },
      _count: true,
    });

    stats.byProject = Object.fromEntries(
      byProject
        .filter(item => item.projectId)
        .map(item => [item.projectId!, item._count])
    );
  }

  return stats;
}

// ============================================
// CAN-SPAM COMPLIANCE
// ============================================

/**
 * Validate email complies with CAN-SPAM requirements
 */
export function validateCanSpamCompliance(html: string): {
  compliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for unsubscribe link
  if (!html.includes('unsubscribe') && !html.includes('opt-out')) {
    issues.push('Missing unsubscribe link');
  }

  // Check for physical address (common requirement)
  const hasAddress = /\d+\s+[\w\s]+,\s*[\w\s]+,\s*[A-Z]{2}\s+\d{5}/.test(html);
  if (!hasAddress) {
    issues.push('Missing physical mailing address (recommended for CAN-SPAM compliance)');
  }

  // Check for "From" address indication
  if (!html.includes('@')) {
    issues.push('No email address visible in content');
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Add physical address to email footer (CAN-SPAM requirement)
 */
export function addPhysicalAddress(
  html: string,
  address: {
    company: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  }
): string {
  const addressHtml = `
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 11px;">
      <p style="margin: 4px 0;">
        ${address.company}<br>
        ${address.street}<br>
        ${address.city}, ${address.state} ${address.zip}
      </p>
    </div>
  `;

  return html + addressHtml;
}
