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

// Hashnode
export {
  createHashnodeClient,
  getHashnodeOAuthUrl,
  getHashnodeAccessToken,
  getUserInfo as getHashnodeUserInfo,
  createArticle as createHashnodeArticle,
  updateArticle as updateHashnodeArticle,
  deleteArticle as deleteHashnodeArticle,
  getPublications as getHashnodePublications,
  getPublicationByDomain as getHashnodePublicationByDomain,
  testConnection as testHashnodeConnection,
  type HashnodeClient,
  type HashnodePostOptions,
} from './hashnode';

// Dev.to
export {
  createDevToClient,
  getUserInfo as getDevToUserInfo,
  createArticle as createDevToArticle,
  updateArticle as updateDevToArticle,
  publishArticle as publishDevToArticle,
  unpublishArticle as unpublishDevToArticle,
  getArticle as getDevToArticle,
  getArticles as getDevToArticles,
  getOrganizations as getDevToOrganizations,
  uploadImage as uploadDevToImage,
  testConnection as testDevToConnection,
  type DevToClient,
  type DevToPostOptions,
} from './devto';

// Hashnode Formatters
export {
  toHashnode,
  formatHashnodePost,
  generateSlug as generateHashnodeSlug,
  validateHashnodeTags,
  htmlToHashnodeMarkdown,
  extractFrontmatter as extractHashnodeFrontmatter,
} from './formatters/hashnode';

// Dev.to Formatters
export {
  toDevTo,
  formatDevToPost,
  validateDevToTags,
  htmlToDevToMarkdown,
  extractDevToFrontmatter,
  generateLiquidTags,
  convertEmbedsToLiquid,
} from './formatters/devto';
