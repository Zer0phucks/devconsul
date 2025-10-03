import { z } from "zod"

// Platform types
export const platformTypes = [
  "wordpress",
  "ghost",
  "medium",
  "twitter",
  "linkedin",
  "facebook",
  "reddit",
  "resend",
  "sendgrid",
  "mailchimp",
  "webhook",
] as const

export type PlatformType = typeof platformTypes[number]

// OAuth connection schema
export const oauthConnectionSchema = z.object({
  platform: z.enum(platformTypes),
  redirectUri: z.string().url(),
  state: z.string().min(32), // CSRF protection
})

// API key connection schema
export const apiKeyConnectionSchema = z.object({
  platform: z.enum(platformTypes),
  apiKey: z.string().min(1, "API key is required"),
  additionalFields: z.record(z.string()).optional(),
})

// WordPress connection
export const wordpressConnectionSchema = z.object({
  platform: z.literal("wordpress"),
  siteUrl: z.string().url("Invalid WordPress site URL"),
  username: z.string().min(1, "Username is required"),
  applicationPassword: z.string().min(1, "Application password is required"),
  defaultCategory: z.string().optional(),
  defaultTags: z.array(z.string()).optional(),
})

// Ghost connection
export const ghostConnectionSchema = z.object({
  platform: z.literal("ghost"),
  siteUrl: z.string().url("Invalid Ghost site URL"),
  adminApiKey: z.string().min(1, "Admin API key is required"),
  authorName: z.string().optional(),
})

// Medium connection (OAuth)
export const mediumConnectionSchema = z.object({
  platform: z.literal("medium"),
  accessToken: z.string().min(1),
  userId: z.string().min(1),
  username: z.string().optional(),
  publicationId: z.string().optional(),
})

// Twitter connection (OAuth)
export const twitterConnectionSchema = z.object({
  platform: z.literal("twitter"),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  userId: z.string().min(1),
  username: z.string().optional(),
  includeHashtags: z.boolean().default(false),
  hashtags: z.array(z.string()).optional(),
})

// LinkedIn connection (OAuth)
export const linkedinConnectionSchema = z.object({
  platform: z.literal("linkedin"),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  userId: z.string().min(1),
  postAs: z.enum(["personal", "company"]).default("personal"),
  companyId: z.string().optional(),
})

// Facebook connection (OAuth)
export const facebookConnectionSchema = z.object({
  platform: z.literal("facebook"),
  accessToken: z.string().min(1),
  userId: z.string().min(1),
  targetType: z.enum(["page", "group"]).default("page"),
  pageId: z.string().optional(),
  groupId: z.string().optional(),
})

// Reddit connection (OAuth)
export const redditConnectionSchema = z.object({
  platform: z.literal("reddit"),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  username: z.string().optional(),
  defaultSubreddit: z.string().optional(),
  flair: z.string().optional(),
})

// Resend connection
export const resendConnectionSchema = z.object({
  platform: z.literal("resend"),
  apiKey: z.string().min(1, "Resend API key is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Invalid email address"),
  replyTo: z.string().email("Invalid reply-to address").optional(),
})

// SendGrid connection
export const sendgridConnectionSchema = z.object({
  platform: z.literal("sendgrid"),
  apiKey: z.string().min(1, "SendGrid API key is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Invalid email address"),
  replyTo: z.string().email("Invalid reply-to address").optional(),
})

// Mailchimp connection (OAuth)
export const mailchimpConnectionSchema = z.object({
  platform: z.literal("mailchimp"),
  accessToken: z.string().min(1),
  apiServer: z.string().min(1), // e.g., "us1", "us2"
  audienceId: z.string().optional(),
  campaignPrefix: z.string().optional(),
})

// Webhook connection
export const webhookConnectionSchema = z.object({
  platform: z.literal("webhook"),
  endpointUrl: z.string().url("Invalid webhook URL"),
  httpMethod: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  headers: z.record(z.string()).optional(),
  payloadTemplate: z.string().optional(),
  authToken: z.string().optional(),
  signatureSecret: z.string().optional(), // HMAC secret
})

// Connection status
export const connectionStatusSchema = z.object({
  platformId: z.string(),
  status: z.enum(["connected", "error", "expired", "disconnected"]),
  lastSyncAt: z.date().optional(),
  errorMessage: z.string().optional(),
  accountInfo: z.object({
    username: z.string().optional(),
    email: z.string().optional(),
    profileUrl: z.string().optional(),
  }).optional(),
})

// Platform settings update
export const platformSettingsUpdateSchema = z.object({
  platformId: z.string(),
  settings: z.record(z.any()),
})

// Character limits by platform
export const platformCharacterLimits: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206, // No strict limit, but warn at 1000
  reddit: 40000,
}

// Image generation settings
export const imageGenerationSchema = z.object({
  enabled: z.boolean().default(false),
  style: z.enum(["photorealistic", "illustration", "abstract"]).default("photorealistic"),
  aspectRatio: z.enum(["16:9", "1:1", "4:3"]).default("16:9"),
  provider: z.enum(["dalle", "midjourney"]).default("dalle"),
})

// Platform-specific validation helper
export function getPlatformSchema(platform: PlatformType) {
  const schemas: Record<PlatformType, z.ZodSchema> = {
    wordpress: wordpressConnectionSchema,
    ghost: ghostConnectionSchema,
    medium: mediumConnectionSchema,
    twitter: twitterConnectionSchema,
    linkedin: linkedinConnectionSchema,
    facebook: facebookConnectionSchema,
    reddit: redditConnectionSchema,
    resend: resendConnectionSchema,
    sendgrid: sendgridConnectionSchema,
    mailchimp: mailchimpConnectionSchema,
    webhook: webhookConnectionSchema,
  }

  return schemas[platform]
}

// Test connection request
export const testConnectionSchema = z.object({
  platformId: z.string(),
})

// Disconnect request
export const disconnectSchema = z.object({
  platformId: z.string(),
  confirmText: z.string().optional(),
})
