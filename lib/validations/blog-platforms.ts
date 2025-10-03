/**
 * Validation schemas for blog platform integrations
 */

import { z } from 'zod';

// WordPress schemas
export const wordpressConnectSchema = z.object({
  projectId: z.string().cuid(),
  type: z.enum(['oauth', 'api_key']),
  // For OAuth
  code: z.string().optional(),
  // For API key (self-hosted)
  siteUrl: z.string().url().optional(),
  username: z.string().optional(),
  applicationPassword: z.string().optional(),
});

export const wordpressPublishSchema = z.object({
  platformId: z.string().cuid(),
  contentId: z.string().cuid(),
  options: z.object({
    status: z.enum(['draft', 'publish', 'pending', 'private']).default('publish'),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    featuredImage: z.string().url().optional(),
    excerpt: z.string().optional(),
    format: z.enum(['standard', 'aside', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio', 'chat']).optional(),
  }).optional(),
});

// Ghost CMS schemas
export const ghostConnectSchema = z.object({
  projectId: z.string().cuid(),
  apiUrl: z.string().url(),
  adminApiKey: z.string().min(26), // Ghost admin keys are 26+ characters
});

export const ghostPublishSchema = z.object({
  platformId: z.string().cuid(),
  contentId: z.string().cuid(),
  options: z.object({
    status: z.enum(['draft', 'published', 'scheduled']).default('published'),
    publishAt: z.string().datetime().optional(),
    featured: z.boolean().optional(),
    visibility: z.enum(['public', 'members', 'paid']).default('public'),
    authors: z.array(z.string()).optional(),
    customExcerpt: z.string().optional(),
    codeinjectionHead: z.string().optional(),
    codeinjectionFoot: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().url().optional(),
    twitterImage: z.string().url().optional(),
  }).optional(),
});

// Medium schemas
export const mediumConnectSchema = z.object({
  projectId: z.string().cuid(),
  code: z.string(), // OAuth code
});

export const mediumPublishSchema = z.object({
  platformId: z.string().cuid(),
  contentId: z.string().cuid(),
  options: z.object({
    publishStatus: z.enum(['draft', 'public', 'unlisted']).default('public'),
    canonicalUrl: z.string().url().optional(),
    tags: z.array(z.string()).max(5).optional(), // Medium allows max 5 tags
    license: z.enum([
      'all-rights-reserved',
      'cc-40-by',
      'cc-40-by-sa',
      'cc-40-by-nd',
      'cc-40-by-nc',
      'cc-40-by-nc-nd',
      'cc-40-by-nc-sa',
      'cc-40-zero',
      'public-domain'
    ]).default('all-rights-reserved'),
    notifyFollowers: z.boolean().default(false),
    publicationId: z.string().optional(), // For publishing to a publication
  }).optional(),
});

// Webhook schemas
export const webhookConfigureSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.record(z.string()).optional(),
  payloadTemplate: z.string().optional(), // JSON template with variables
  signatureSecret: z.string().optional(), // For HMAC signing
  retryAttempts: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().int().min(0).max(3600).default(60), // seconds
});

export const webhookPublishSchema = z.object({
  platformId: z.string().cuid(),
  contentId: z.string().cuid(),
  dryRun: z.boolean().default(false), // Test mode
});

// Content formatting options
export const contentFormatOptionsSchema = z.object({
  includeCodeHighlighting: z.boolean().default(true),
  convertRelativeUrls: z.boolean().default(true),
  baseUrl: z.string().url().optional(),
  stripHtml: z.boolean().default(false),
  preserveLineBreaks: z.boolean().default(true),
});

// Generic publish response
export const publishResponseSchema = z.object({
  success: z.boolean(),
  platformPostId: z.string().optional(),
  platformUrl: z.string().url().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// OAuth callback schema
export const oauthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

// Platform configuration update
export const platformConfigUpdateSchema = z.object({
  platformId: z.string().cuid(),
  name: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  isConnected: z.boolean().optional(),
});

// Types derived from schemas
export type WordPressConnectInput = z.infer<typeof wordpressConnectSchema>;
export type WordPressPublishInput = z.infer<typeof wordpressPublishSchema>;
export type GhostConnectInput = z.infer<typeof ghostConnectSchema>;
export type GhostPublishInput = z.infer<typeof ghostPublishSchema>;
export type MediumConnectInput = z.infer<typeof mediumConnectSchema>;
export type MediumPublishInput = z.infer<typeof mediumPublishSchema>;
export type WebhookConfigureInput = z.infer<typeof webhookConfigureSchema>;
export type WebhookPublishInput = z.infer<typeof webhookPublishSchema>;
export type ContentFormatOptions = z.infer<typeof contentFormatOptionsSchema>;
export type PublishResponse = z.infer<typeof publishResponseSchema>;
export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;
export type PlatformConfigUpdateInput = z.infer<typeof platformConfigUpdateSchema>;
