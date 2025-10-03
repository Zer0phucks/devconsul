/**
 * SendGrid Email Platform Integration
 *
 * Comprehensive SendGrid integration with:
 * - Transactional and marketing emails
 * - Dynamic template support
 * - Contact list management
 * - Email statistics and analytics
 */

import sgMail from '@sendgrid/mail';
import sgClient from '@sendgrid/client';
import { prisma } from '@/lib/db';
import type { EmailCampaignStatus, EmailRecipientStatus } from '@prisma/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface SendGridEmailOptions {
  from?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: SendGridAttachment[];
  categories?: string[];
  customArgs?: Record<string, string>;
  sendAt?: number; // Unix timestamp
  trackingSettings?: {
    clickTracking?: { enable: boolean };
    openTracking?: { enable: boolean };
    subscriptionTracking?: { enable: boolean };
  };
}

export interface SendGridAttachment {
  content: string; // Base64 encoded
  filename: string;
  type?: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface DynamicTemplateData {
  [key: string]: any;
}

export interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  customFields?: Record<string, any>;
}

export interface EmailStats {
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  bounces: number;
  spamReports: number;
  unsubscribes: number;
}

// ============================================
// SENDGRID CLIENT
// ============================================

export class SendGridClient {
  private config: SendGridConfig;

  constructor(config: SendGridConfig) {
    this.config = config;
    sgMail.setApiKey(config.apiKey);
    sgClient.setApiKey(config.apiKey);
  }

  /**
   * Send individual email
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    options: SendGridEmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const msg: any = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: options.from || this.config.fromEmail,
          name: options.fromName || this.config.fromName,
        },
        subject,
        html,
        replyTo: options.replyTo || this.config.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
        categories: options.categories,
        customArgs: options.customArgs,
        sendAt: options.sendAt,
        trackingSettings: options.trackingSettings || {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error: any) {
      console.error('SendGrid send error:', error);
      const errorMsg = error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send email using dynamic template
   */
  async sendTransactional(
    to: string | string[],
    templateId: string,
    dynamicData: DynamicTemplateData,
    options: SendGridEmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const msg: any = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: options.from || this.config.fromEmail,
          name: options.fromName || this.config.fromName,
        },
        templateId,
        dynamicTemplateData: dynamicData,
        replyTo: options.replyTo || this.config.replyTo,
        categories: options.categories,
        customArgs: options.customArgs,
        trackingSettings: options.trackingSettings || {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      };

      await sgMail.send(msg);
      return { success: true };
    } catch (error: any) {
      console.error('SendGrid template send error:', error);
      const errorMsg = error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send marketing email to contact list
   */
  async sendMarketingEmail(
    listId: string,
    subject: string,
    html: string,
    options: SendGridEmailOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get contacts from list
      const contacts = await this.getListContacts(listId);

      if (!contacts || contacts.length === 0) {
        return { success: false, error: 'No contacts in list' };
      }

      // Send to all contacts
      const emails = contacts.map(c => c.email);
      return await this.sendEmail(emails, subject, html, options);
    } catch (error: any) {
      console.error('SendGrid marketing email error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Create contact
   */
  async createContact(
    email: string,
    customFields?: Record<string, any>
  ): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      const request: any = {
        url: '/v3/marketing/contacts',
        method: 'PUT',
        body: {
          contacts: [
            {
              email,
              ...customFields,
            },
          ],
        },
      };

      const [response] = await sgClient.request(request);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return { success: true };
      }

      return { success: false, error: 'Failed to create contact' };
    } catch (error: any) {
      console.error('SendGrid create contact error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Add contact to list
   */
  async addToList(
    email: string,
    listId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, ensure contact exists
      await this.createContact(email);

      // Then add to list
      const request: any = {
        url: `/v3/marketing/lists/${listId}/contacts`,
        method: 'POST',
        body: {
          contacts: [email],
        },
      };

      const [response] = await sgClient.request(request);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return { success: true };
      }

      return { success: false, error: 'Failed to add to list' };
    } catch (error: any) {
      console.error('SendGrid add to list error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Remove contact from list
   */
  async removeFromList(
    email: string,
    listId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get contact ID by email
      const contactId = await this.getContactIdByEmail(email);

      if (!contactId) {
        return { success: false, error: 'Contact not found' };
      }

      const request: any = {
        url: `/v3/marketing/lists/${listId}/contacts`,
        method: 'DELETE',
        qs: {
          contact_ids: contactId,
        },
      };

      await sgClient.request(request);
      return { success: true };
    } catch (error: any) {
      console.error('SendGrid remove from list error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(
    startDate: string,
    endDate?: string
  ): Promise<EmailStats | null> {
    try {
      const request: any = {
        url: '/v3/stats',
        method: 'GET',
        qs: {
          start_date: startDate,
          end_date: endDate || startDate,
          aggregated_by: 'day',
        },
      };

      const [response] = await sgClient.request(request);
      const stats = response.body[0]?.stats?.[0]?.metrics;

      if (!stats) return null;

      return {
        delivered: stats.delivered || 0,
        opens: stats.opens || 0,
        uniqueOpens: stats.unique_opens || 0,
        clicks: stats.clicks || 0,
        uniqueClicks: stats.unique_clicks || 0,
        bounces: stats.bounces || 0,
        spamReports: stats.spam_reports || 0,
        unsubscribes: stats.unsubscribes || 0,
      };
    } catch (error) {
      console.error('SendGrid stats error:', error);
      return null;
    }
  }

  /**
   * Get contact lists
   */
  async getLists(): Promise<Array<{ id: string; name: string; contactCount: number }>> {
    try {
      const request: any = {
        url: '/v3/marketing/lists',
        method: 'GET',
      };

      const [response] = await sgClient.request(request);
      const lists = response.body.result || [];

      return lists.map((list: any) => ({
        id: list.id,
        name: list.name,
        contactCount: list.contact_count || 0,
      }));
    } catch (error) {
      console.error('SendGrid get lists error:', error);
      return [];
    }
  }

  /**
   * Create contact list
   */
  async createList(name: string): Promise<{ success: boolean; listId?: string; error?: string }> {
    try {
      const request: any = {
        url: '/v3/marketing/lists',
        method: 'POST',
        body: {
          name,
        },
      };

      const [response] = await sgClient.request(request);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return { success: true, listId: response.body.id };
      }

      return { success: false, error: 'Failed to create list' };
    } catch (error: any) {
      console.error('SendGrid create list error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Get contacts from a list
   */
  private async getListContacts(listId: string): Promise<Array<{ email: string }>> {
    try {
      const request: any = {
        url: `/v3/marketing/lists/${listId}/contacts`,
        method: 'GET',
      };

      const [response] = await sgClient.request(request);
      return response.body.result || [];
    } catch (error) {
      console.error('SendGrid get list contacts error:', error);
      return [];
    }
  }

  /**
   * Get contact ID by email
   */
  private async getContactIdByEmail(email: string): Promise<string | null> {
    try {
      const request: any = {
        url: '/v3/marketing/contacts/search',
        method: 'POST',
        body: {
          query: `email LIKE '${email}'`,
        },
      };

      const [response] = await sgClient.request(request);
      const contact = response.body.result?.[0];

      return contact?.id || null;
    } catch (error) {
      console.error('SendGrid get contact ID error:', error);
      return null;
    }
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create SendGrid client from config
 */
export function createSendGridClient(config: SendGridConfig): SendGridClient {
  return new SendGridClient(config);
}

/**
 * Create SendGrid client from platform configuration
 */
export async function createSendGridClientFromPlatform(
  platformId: string
): Promise<SendGridClient> {
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform || platform.type !== 'SENDGRID') {
    throw new Error('Invalid SendGrid platform');
  }

  if (!platform.apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const config = platform.config as any || {};

  return createSendGridClient({
    apiKey: platform.apiKey,
    fromEmail: config.fromEmail || process.env.FROM_EMAIL || '',
    fromName: config.fromName,
    replyTo: config.replyTo,
  });
}

/**
 * Get default SendGrid client
 */
export function getDefaultSendGridClient(): SendGridClient {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY environment variable not set');
  }

  if (!fromEmail) {
    throw new Error('FROM_EMAIL environment variable not set');
  }

  return createSendGridClient({
    apiKey,
    fromEmail,
    fromName: process.env.FROM_NAME,
    replyTo: process.env.REPLY_TO_EMAIL,
  });
}
