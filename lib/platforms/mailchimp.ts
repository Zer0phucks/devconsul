/**
 * Mailchimp Email Platform Integration
 *
 * Full-featured Mailchimp integration with:
 * - OAuth 2.0 authentication
 * - Campaign creation and management
 * - Audience (list) management
 * - Campaign analytics and reporting
 */

import mailchimp from '@mailchimp/mailchimp_marketing';
import { prisma } from '@/lib/db';
import type { EmailCampaignStatus } from '@prisma/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface MailchimpConfig {
  apiKey: string;
  server: string; // e.g., 'us1', 'us2', etc.
}

export interface MailchimpOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface CampaignSettings {
  subjectLine: string;
  title: string;
  fromName: string;
  replyTo: string;
  toName?: string;
  folderId?: string;
  authenticate?: boolean;
  autoFooter?: boolean;
  inlineCss?: boolean;
  autoTweet?: boolean;
  fbComments?: boolean;
}

export interface CampaignContent {
  html?: string;
  plainText?: string;
  template?: {
    id: number;
    sections?: Record<string, string>;
  };
}

export interface AudienceData {
  name: string;
  company: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  language: string;
  permissionReminder: string;
}

export interface SubscriberData {
  email: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
  mergeFields?: Record<string, any>;
  interests?: Record<string, boolean>;
  tags?: string[];
}

export interface CampaignReport {
  campaignId: string;
  emails: {
    sent: number;
    delivered: number;
    opened: number;
    uniqueOpens: number;
    clicked: number;
    uniqueClicks: number;
    bounced: number;
    unsubscribed: number;
  };
  openRate: number;
  clickRate: number;
  sendTime: string;
}

// ============================================
// MAILCHIMP CLIENT
// ============================================

export class MailchimpClient {
  private config: MailchimpConfig;

  constructor(config: MailchimpConfig) {
    this.config = config;
    mailchimp.setConfig({
      apiKey: config.apiKey,
      server: config.server,
    });
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    listId: string,
    subject: string,
    content: CampaignContent,
    settings?: Partial<CampaignSettings>
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const campaign = await mailchimp.campaigns.create({
        type: 'regular',
        recipients: {
          list_id: listId,
        },
        settings: {
          subject_line: subject,
          title: settings?.title || subject,
          from_name: settings?.fromName || this.config.server,
          reply_to: settings?.replyTo || '',
          ...settings,
        },
      });

      // Set campaign content
      if (content.html) {
        await mailchimp.campaigns.setContent(campaign.id, {
          html: content.html,
          plain_text: content.plainText,
        });
      } else if (content.template) {
        await mailchimp.campaigns.setContent(campaign.id, {
          template: content.template,
        });
      }

      return { success: true, campaignId: campaign.id };
    } catch (error: any) {
      console.error('Mailchimp create campaign error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Send a campaign
   */
  async sendCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await mailchimp.campaigns.send(campaignId);
      return { success: true };
    } catch (error: any) {
      console.error('Mailchimp send campaign error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Schedule a campaign
   */
  async scheduleCampaign(
    campaignId: string,
    sendTime: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await mailchimp.campaigns.schedule(campaignId, {
        schedule_time: sendTime.toISOString(),
      });
      return { success: true };
    } catch (error: any) {
      console.error('Mailchimp schedule campaign error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Add subscriber to audience
   */
  async addSubscriber(
    listId: string,
    subscriberData: SubscriberData
  ): Promise<{ success: boolean; subscriberId?: string; error?: string }> {
    try {
      const response = await mailchimp.lists.addListMember(listId, {
        email_address: subscriberData.email,
        status: subscriberData.status,
        merge_fields: subscriberData.mergeFields,
        interests: subscriberData.interests,
        tags: subscriberData.tags,
      });

      return { success: true, subscriberId: response.id };
    } catch (error: any) {
      console.error('Mailchimp add subscriber error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Update subscriber
   */
  async updateSubscriber(
    listId: string,
    email: string,
    updates: Partial<SubscriberData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriberHash = this.getSubscriberHash(email);

      await mailchimp.lists.updateListMember(listId, subscriberHash, {
        email_address: email,
        status_if_new: updates.status || 'subscribed',
        merge_fields: updates.mergeFields,
        interests: updates.interests,
      });

      if (updates.tags && updates.tags.length > 0) {
        await mailchimp.lists.updateListMemberTags(listId, subscriberHash, {
          tags: updates.tags.map(tag => ({ name: tag, status: 'active' })),
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Mailchimp update subscriber error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Remove subscriber (unsubscribe)
   */
  async removeSubscriber(
    listId: string,
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subscriberHash = this.getSubscriberHash(email);

      await mailchimp.lists.updateListMember(listId, subscriberHash, {
        email_address: email,
        status: 'unsubscribed',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Mailchimp remove subscriber error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get all audiences (lists)
   */
  async getAudiences(): Promise<Array<{ id: string; name: string; memberCount: number }>> {
    try {
      const response = await mailchimp.lists.getAllLists({ count: 1000 });

      return response.lists.map(list => ({
        id: list.id,
        name: list.name,
        memberCount: list.stats.member_count || 0,
      }));
    } catch (error) {
      console.error('Mailchimp get audiences error:', error);
      return [];
    }
  }

  /**
   * Create new audience
   */
  async createAudience(
    audienceData: AudienceData
  ): Promise<{ success: boolean; audienceId?: string; error?: string }> {
    try {
      const response = await mailchimp.lists.createList({
        name: audienceData.name,
        contact: {
          company: audienceData.company,
          address1: audienceData.address1,
          city: audienceData.city,
          state: audienceData.state,
          zip: audienceData.zip,
          country: audienceData.country,
        },
        permission_reminder: audienceData.permissionReminder,
        campaign_defaults: {
          from_name: audienceData.fromName,
          from_email: audienceData.fromEmail,
          subject: audienceData.subject,
          language: audienceData.language,
        },
        email_type_option: true,
      });

      return { success: true, audienceId: response.id };
    } catch (error: any) {
      console.error('Mailchimp create audience error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get campaign report/analytics
   */
  async getCampaignReport(campaignId: string): Promise<CampaignReport | null> {
    try {
      const report = await mailchimp.reports.getCampaignReport(campaignId);

      return {
        campaignId: report.id,
        emails: {
          sent: report.emails_sent || 0,
          delivered: (report.emails_sent || 0) - (report.bounces?.hard_bounces || 0),
          opened: report.opens?.unique_opens || 0,
          uniqueOpens: report.opens?.unique_opens || 0,
          clicked: report.clicks?.unique_clicks || 0,
          uniqueClicks: report.clicks?.unique_subscriber_clicks || 0,
          bounced: report.bounces?.hard_bounces || 0,
          unsubscribed: report.unsubscribed || 0,
        },
        openRate: report.opens?.open_rate || 0,
        clickRate: report.clicks?.click_rate || 0,
        sendTime: report.send_time || '',
      };
    } catch (error) {
      console.error('Mailchimp get campaign report error:', error);
      return null;
    }
  }

  /**
   * Get campaigns
   */
  async getCampaigns(): Promise<Array<{ id: string; title: string; status: string }>> {
    try {
      const response = await mailchimp.campaigns.list({ count: 1000 });

      return response.campaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.settings.title || '',
        status: campaign.status,
      }));
    } catch (error) {
      console.error('Mailchimp get campaigns error:', error);
      return [];
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await mailchimp.campaigns.remove(campaignId);
      return { success: true };
    } catch (error: any) {
      console.error('Mailchimp delete campaign error:', error);
      return {
        success: false,
        error: error.response?.body?.detail || error.message || 'Unknown error',
      };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Generate MD5 hash for subscriber email
   */
  private getSubscriberHash(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }
}

// ============================================
// OAUTH FUNCTIONS
// ============================================

/**
 * Generate OAuth authorization URL
 */
export function getMailchimpAuthUrl(config: MailchimpOAuthConfig): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
  });

  return `https://login.mailchimp.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeMailchimpCode(
  code: string,
  config: MailchimpOAuthConfig
): Promise<{ accessToken: string; server: string } | null> {
  try {
    const response = await fetch('https://login.mailchimp.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();

    // Get server/datacenter from metadata
    const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
      headers: {
        Authorization: `OAuth ${data.access_token}`,
      },
    });

    if (!metadataResponse.ok) {
      throw new Error('Failed to get server metadata');
    }

    const metadata = await metadataResponse.json();

    return {
      accessToken: data.access_token,
      server: metadata.dc,
    };
  } catch (error) {
    console.error('Mailchimp OAuth error:', error);
    return null;
  }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create Mailchimp client from config
 */
export function createMailchimpClient(config: MailchimpConfig): MailchimpClient {
  return new MailchimpClient(config);
}

/**
 * Create Mailchimp client from platform configuration
 */
export async function createMailchimpClientFromPlatform(
  platformId: string
): Promise<MailchimpClient> {
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform || platform.type !== 'MAILCHIMP') {
    throw new Error('Invalid Mailchimp platform');
  }

  if (!platform.accessToken) {
    throw new Error('Mailchimp not connected');
  }

  const config = platform.config as any || {};

  return createMailchimpClient({
    apiKey: platform.accessToken,
    server: config.server || 'us1',
  });
}

/**
 * Get default Mailchimp client
 */
export function getDefaultMailchimpClient(): MailchimpClient {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER || 'us1';

  if (!apiKey) {
    throw new Error('MAILCHIMP_API_KEY environment variable not set');
  }

  return createMailchimpClient({
    apiKey,
    server,
  });
}
