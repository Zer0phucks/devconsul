/**
 * Resend Email Platform Integration
 *
 * Provides comprehensive email sending capabilities using Resend API:
 * - Individual and bulk email sending
 * - Template-based emails with variable substitution
 * - Email tracking (opens, clicks, delivery status)
 * - Attachments and advanced options
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/db';
import type {
  EmailCampaignStatus,
  EmailRecipientStatus,
  EmailProvider
} from '@prisma/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface EmailOptions {
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
  headers?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  customFields?: Record<string, any>;
}

export interface EmailTemplate {
  templateId: string;
  variables: Record<string, string>;
}

export interface EmailStatus {
  id: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';
  createdAt: string;
  from: string;
  to: string;
  subject: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

// ============================================
// RESEND CLIENT
// ============================================

export class ResendClient {
  private client: Resend;
  private config: ResendConfig;

  constructor(config: ResendConfig) {
    this.config = config;
    this.client = new Resend(config.apiKey);
  }

  /**
   * Send individual email
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    options: EmailOptions = {}
  ): Promise<{ id: string; error?: string }> {
    try {
      const from = this.formatFrom(
        options.from || this.config.fromEmail,
        options.fromName || this.config.fromName
      );

      const result = await this.client.emails.send({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        replyTo: options.replyTo || this.config.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
        tags: options.tags,
        headers: options.headers,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { id: result.data!.id };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Resend send error:', errorMsg);
      return { id: '', error: errorMsg };
    }
  }

  /**
   * Send bulk emails (batch processing)
   */
  async sendBulkEmail(
    recipients: EmailRecipient[],
    subject: string,
    html: string,
    options: EmailOptions = {}
  ): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Resend rate limit: batch in groups of 100
    const batchSize = 100;
    const batches = this.chunkArray(recipients, batchSize);

    for (const batch of batches) {
      const promises = batch.map(async (recipient) => {
        // Personalize HTML with recipient data
        const personalizedHtml = this.replaceVariables(html, {
          name: recipient.name || recipient.email,
          email: recipient.email,
          ...recipient.customFields,
        });

        const emailResult = await this.sendEmail(
          recipient.email,
          subject,
          personalizedHtml,
          options
        );

        if (emailResult.error) {
          result.failed++;
          result.errors.push({
            email: recipient.email,
            error: emailResult.error,
          });
        } else {
          result.sent++;
        }

        return emailResult;
      });

      await Promise.all(promises);
    }

    return result;
  }

  /**
   * Create and send email using template
   */
  async createEmailWithTemplate(
    to: string | string[],
    subject: string,
    templateId: string,
    variables: Record<string, string>,
    options: EmailOptions = {}
  ): Promise<{ id: string; error?: string }> {
    try {
      // Get template from database
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Replace variables in HTML and text content
      const html = this.replaceVariables(template.htmlContent, variables);
      const text = template.textContent
        ? this.replaceVariables(template.textContent, variables)
        : undefined;

      // Use template subject if not provided
      const finalSubject = subject || this.replaceVariables(template.subject || '', variables);

      return await this.sendEmail(to, finalSubject, html, {
        ...options,
        // Include text version if available
        ...(text && { text }),
      } as any);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { id: '', error: errorMsg };
    }
  }

  /**
   * Enable email tracking (opens and clicks)
   */
  async trackEmailOpens(emailId: string): Promise<boolean> {
    // Resend automatically tracks opens when tags are included
    // This method is a placeholder for additional tracking logic
    return true;
  }

  /**
   * Get email delivery status
   */
  async getEmailStatus(emailId: string): Promise<EmailStatus | null> {
    try {
      const result = await this.client.emails.get(emailId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const email = result.data;
      if (!email) return null;

      return {
        id: email.id,
        status: email.last_event as any || 'sent',
        createdAt: email.created_at,
        from: email.from,
        to: Array.isArray(email.to) ? email.to[0] : email.to,
        subject: email.subject,
      };
    } catch (error) {
      console.error('Failed to get email status:', error);
      return null;
    }
  }

  /**
   * Send email campaign
   */
  async sendCampaign(
    campaignId: string,
    progressCallback?: (sent: number, total: number) => void
  ): Promise<void> {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { recipients: true },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      throw new Error(`Campaign is already ${campaign.status.toLowerCase()}`);
    }

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' as EmailCampaignStatus },
    });

    const total = campaign.recipients.length;
    let sent = 0;

    try {
      for (const recipient of campaign.recipients) {
        // Skip if already sent or unsubscribed
        if (recipient.status === 'SENT' || recipient.status === 'UNSUBSCRIBED') {
          continue;
        }

        // Check unsubscribe list
        const isUnsubscribed = await prisma.emailUnsubscribe.findFirst({
          where: {
            email: recipient.email,
            isActive: true,
          },
        });

        if (isUnsubscribed) {
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'UNSUBSCRIBED' as EmailRecipientStatus,
              unsubscribedAt: new Date(),
            },
          });
          continue;
        }

        // Personalize content
        const html = this.replaceVariables(campaign.htmlContent, {
          name: recipient.name || recipient.email,
          email: recipient.email,
          unsubscribe: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${recipient.token}`,
          ...recipient.customFields,
        });

        // Send email
        const result = await this.sendEmail(
          recipient.email,
          campaign.subject,
          html,
          {
            from: campaign.fromEmail,
            fromName: campaign.fromName || undefined,
            replyTo: campaign.replyTo || undefined,
            trackOpens: true,
            trackClicks: true,
          }
        );

        // Update recipient status
        if (result.error) {
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'FAILED' as EmailRecipientStatus,
              errorMsg: result.error,
            },
          });
        } else {
          await prisma.emailRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'SENT' as EmailRecipientStatus,
              sentAt: new Date(),
            },
          });
          sent++;
        }

        // Call progress callback
        if (progressCallback) {
          progressCallback(sent, total);
        }
      }

      // Update campaign status and stats
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT' as EmailCampaignStatus,
          sentAt: new Date(),
          totalSent: sent,
        },
      });
    } catch (error) {
      // Mark campaign as failed
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'FAILED' as EmailCampaignStatus },
      });
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Format "from" address with name
   */
  private formatFrom(email: string, name?: string): string {
    return name ? `${name} <${email}>` : email;
  }

  /**
   * Replace template variables
   */
  private replaceVariables(
    content: string,
    variables: Record<string, string>
  ): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}|{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create Resend client from API key
 */
export function createResendClient(config: ResendConfig): ResendClient {
  return new ResendClient(config);
}

/**
 * Create Resend client from platform configuration
 */
export async function createResendClientFromPlatform(
  platformId: string
): Promise<ResendClient> {
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform || platform.type !== 'RESEND') {
    throw new Error('Invalid Resend platform');
  }

  if (!platform.apiKey) {
    throw new Error('Resend API key not configured');
  }

  const config = platform.config as any || {};

  return createResendClient({
    apiKey: platform.apiKey,
    fromEmail: config.fromEmail || process.env.FROM_EMAIL || '',
    fromName: config.fromName,
    replyTo: config.replyTo,
  });
}

/**
 * Get or create default Resend client
 */
export function getDefaultResendClient(): ResendClient {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable not set');
  }

  if (!fromEmail) {
    throw new Error('FROM_EMAIL environment variable not set');
  }

  return createResendClient({
    apiKey,
    fromEmail,
    fromName: process.env.FROM_NAME,
    replyTo: process.env.REPLY_TO_EMAIL,
  });
}
