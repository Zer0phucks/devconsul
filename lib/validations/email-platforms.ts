import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// ============================================
// PLATFORM CONNECTION SCHEMAS
// ============================================

export const resendConnectSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  fromEmail: emailSchema,
  fromName: z.string().optional(),
  replyTo: emailSchema.optional(),
});

export const sendgridConnectSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  fromEmail: emailSchema,
  fromName: z.string().optional(),
  replyTo: emailSchema.optional(),
});

export const mailchimpConnectSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  server: z.string().min(1, 'Server prefix is required (e.g., us1)'),
});

// ============================================
// EMAIL SENDING SCHEMAS
// ============================================

export const sendEmailSchema = z.object({
  to: z.union([emailSchema, z.array(emailSchema)]),
  subject: z.string().min(1, 'Subject is required').max(200),
  html: z.string().min(1, 'Email content is required'),
  from: emailSchema.optional(),
  fromName: z.string().optional(),
  replyTo: emailSchema.optional(),
  cc: z.array(emailSchema).optional(),
  bcc: z.array(emailSchema).optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
});

export const sendBulkEmailSchema = z.object({
  recipients: z.array(z.object({
    email: emailSchema,
    name: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  })).min(1, 'At least one recipient required'),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  fromEmail: emailSchema.optional(),
  fromName: z.string().optional(),
  replyTo: emailSchema.optional(),
});

export const sendTemplateEmailSchema = z.object({
  to: z.union([emailSchema, z.array(emailSchema)]),
  templateId: z.string().min(1, 'Template ID is required'),
  variables: z.record(z.string()),
  subject: z.string().optional(),
});

// ============================================
// CAMPAIGN SCHEMAS
// ============================================

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  subject: z.string().min(1).max(200),
  fromEmail: emailSchema,
  fromName: z.string().max(100).optional(),
  replyTo: emailSchema.optional(),
  htmlContent: z.string().min(1, 'Email content is required'),
  textContent: z.string().optional(),
  templateId: z.string().optional(),
  emailProvider: z.enum(['RESEND', 'SENDGRID', 'MAILCHIMP']).default('RESEND'),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const addRecipientsSchema = z.object({
  recipients: z.array(z.object({
    email: emailSchema,
    name: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  })).min(1),
});

// ============================================
// TEMPLATE SCHEMAS
// ============================================

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  subject: z.string().max(200).optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  type: z.enum(['NEWSLETTER', 'ANNOUNCEMENT', 'DIGEST', 'PLAIN', 'CUSTOM']).default('CUSTOM'),
  variables: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// ============================================
// CONTACT/SUBSCRIBER SCHEMAS
// ============================================

export const addSubscriberSchema = z.object({
  email: emailSchema,
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['subscribed', 'unsubscribed', 'pending']).default('subscribed'),
});

export const updateSubscriberSchema = addSubscriberSchema.partial().extend({
  email: emailSchema,
});

export const removeSubscriberSchema = z.object({
  email: emailSchema,
});

// ============================================
// UNSUBSCRIBE SCHEMAS
// ============================================

export const unsubscribeSchema = z.object({
  token: z.string().optional(),
  email: emailSchema.optional(),
  reason: z.string().max(500).optional(),
}).refine(
  (data) => data.token || data.email,
  { message: 'Either token or email must be provided' }
);

export const resubscribeSchema = z.object({
  email: emailSchema,
});

// ============================================
// MAILCHIMP SPECIFIC SCHEMAS
// ============================================

export const createMailchimpCampaignSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  subject: z.string().min(1).max(200),
  content: z.object({
    html: z.string().optional(),
    plainText: z.string().optional(),
    template: z.object({
      id: z.number(),
      sections: z.record(z.string()).optional(),
    }).optional(),
  }).refine(
    (data) => data.html || data.template,
    { message: 'Either HTML content or template must be provided' }
  ),
  settings: z.object({
    title: z.string().optional(),
    fromName: z.string().optional(),
    replyTo: emailSchema.optional(),
    toName: z.string().optional(),
  }).optional(),
});

export const createAudienceSchema = z.object({
  name: z.string().min(1).max(100),
  company: z.string().min(1),
  address1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(1),
  country: z.string().length(2),
  fromName: z.string().min(1),
  fromEmail: emailSchema,
  subject: z.string().min(1),
  language: z.string().default('en'),
  permissionReminder: z.string().min(1),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type ResendConnect = z.infer<typeof resendConnectSchema>;
export type SendGridConnect = z.infer<typeof sendgridConnectSchema>;
export type MailchimpConnect = z.infer<typeof mailchimpConnectSchema>;
export type SendEmail = z.infer<typeof sendEmailSchema>;
export type SendBulkEmail = z.infer<typeof sendBulkEmailSchema>;
export type SendTemplateEmail = z.infer<typeof sendTemplateEmailSchema>;
export type CreateCampaign = z.infer<typeof createCampaignSchema>;
export type UpdateCampaign = z.infer<typeof updateCampaignSchema>;
export type AddRecipients = z.infer<typeof addRecipientsSchema>;
export type CreateTemplate = z.infer<typeof createTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type AddSubscriber = z.infer<typeof addSubscriberSchema>;
export type UpdateSubscriber = z.infer<typeof updateSubscriberSchema>;
export type RemoveSubscriber = z.infer<typeof removeSubscriberSchema>;
export type Unsubscribe = z.infer<typeof unsubscribeSchema>;
export type Resubscribe = z.infer<typeof resubscribeSchema>;
export type CreateMailchimpCampaign = z.infer<typeof createMailchimpCampaignSchema>;
export type CreateAudience = z.infer<typeof createAudienceSchema>;
