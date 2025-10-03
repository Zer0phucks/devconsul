/**
 * Email Platforms Integration Index
 *
 * Centralized exports for all email platform integrations
 */

// Resend
export {
  ResendClient,
  createResendClient,
  createResendClientFromPlatform,
  getDefaultResendClient,
  type ResendConfig,
  type EmailOptions,
  type EmailAttachment,
  type EmailRecipient,
  type EmailTemplate,
  type EmailStatus,
  type BulkEmailResult,
} from './resend';

// SendGrid
export {
  SendGridClient,
  createSendGridClient,
  createSendGridClientFromPlatform,
  getDefaultSendGridClient,
  type SendGridConfig,
  type SendGridEmailOptions,
  type SendGridAttachment,
  type DynamicTemplateData,
  type ContactData,
  type EmailStats,
} from './sendgrid';

// Mailchimp
export {
  MailchimpClient,
  createMailchimpClient,
  createMailchimpClientFromPlatform,
  getDefaultMailchimpClient,
  getMailchimpAuthUrl,
  exchangeMailchimpCode,
  type MailchimpConfig,
  type MailchimpOAuthConfig,
  type CampaignSettings,
  type CampaignContent,
  type AudienceData,
  type SubscriberData,
  type CampaignReport,
} from './mailchimp';

// Email Formatters
export {
  markdownToEmailHtml,
  htmlToPlainText,
  checkSpamScore,
  addUnsubscribeFooter,
  addTrackingPixel,
  type EmailFormatOptions,
} from './formatters/email';

// Unsubscribe Management
export {
  generateUnsubscribeToken,
  generateUnsubscribeUrl,
  isEmailUnsubscribed,
  unsubscribeEmail,
  unsubscribeByToken,
  resubscribeEmail,
  getUnsubscribeInfo,
  filterUnsubscribedEmails,
  getUnsubscribeStats,
  validateCanSpamCompliance,
  addPhysicalAddress,
} from './unsubscribe';

// Email Templates
export { NewsletterEmail } from './email-templates/newsletter';
export { AnnouncementEmail } from './email-templates/announcement';
export { DigestEmail } from './email-templates/digest';
export { PlainEmail } from './email-templates/plain';
