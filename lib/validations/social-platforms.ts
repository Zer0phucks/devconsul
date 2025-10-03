/**
 * Validation schemas for social media platforms
 * Zod schemas for request/response validation
 */

import { z } from 'zod';

// ============================================
// TWITTER SCHEMAS
// ============================================

export const twitterPostSchema = z.object({
  text: z.string().min(1).max(280),
  mediaIds: z.array(z.string()).max(4).optional(),
  replyToTweetId: z.string().optional(),
  quoteTweetId: z.string().optional(),
  pollOptions: z.array(z.string()).min(2).max(4).optional(),
  pollDurationMinutes: z.number().min(5).max(10080).optional(), // Max 7 days
  replySettings: z.enum(['everyone', 'mentionedUsers', 'following']).optional(),
});

export const twitterThreadSchema = z.object({
  tweets: z.array(z.string().min(1)).min(1),
  addThreadIndicators: z.boolean().optional().default(true),
});

export const twitterMediaUploadSchema = z.object({
  imageBase64: z.string(),
  mediaType: z.string().optional().default('image/png'),
});

export const twitterConnectSchema = z.object({
  code: z.string(),
  state: z.string(),
  codeVerifier: z.string(),
});

// ============================================
// LINKEDIN SCHEMAS
// ============================================

export const linkedInPostSchema = z.object({
  content: z.string().min(1).max(3000),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC'),
  mediaUrls: z.array(z.string().url()).max(9).optional(),
  articleLink: z.string().url().optional(),
  commentingDisabled: z.boolean().optional(),
});

export const linkedInOrganizationPostSchema = z.object({
  organizationId: z.string(),
  content: z.string().min(1).max(3000),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS']).optional().default('PUBLIC'),
  mediaUrls: z.array(z.string().url()).max(9).optional(),
});

export const linkedInArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(110000),
  thumbnail: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
});

export const linkedInConnectSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// ============================================
// FACEBOOK SCHEMAS
// ============================================

export const facebookPagePostSchema = z.object({
  pageId: z.string(),
  content: z.string().min(1),
  link: z.string().url().optional(),
  published: z.boolean().optional().default(true),
  scheduledPublishTime: z.number().optional(), // Unix timestamp
  targetingCountries: z.array(z.string().length(2)).optional(), // Country codes
});

export const facebookGroupPostSchema = z.object({
  groupId: z.string(),
  content: z.string().min(1),
  link: z.string().url().optional(),
});

export const facebookPhotoSchema = z.object({
  pageId: z.string(),
  imageBase64: z.string(),
  caption: z.string().optional(),
  published: z.boolean().optional().default(true),
  scheduledPublishTime: z.number().optional(),
  noStory: z.boolean().optional(),
});

export const facebookScheduleSchema = z.object({
  pageId: z.string(),
  content: z.string().min(1),
  publishTime: z.string().datetime(), // ISO 8601
  link: z.string().url().optional(),
});

export const facebookConnectSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// ============================================
// REDDIT SCHEMAS
// ============================================

export const redditTextPostSchema = z.object({
  subreddit: z.string().min(1),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(40000),
  flairId: z.string().optional(),
  flairText: z.string().optional(),
  nsfw: z.boolean().optional(),
  spoiler: z.boolean().optional(),
  sendReplies: z.boolean().optional().default(true),
});

export const redditLinkPostSchema = z.object({
  subreddit: z.string().min(1),
  title: z.string().min(1).max(300),
  url: z.string().url(),
  flairId: z.string().optional(),
  flairText: z.string().optional(),
  nsfw: z.boolean().optional(),
  spoiler: z.boolean().optional(),
  sendReplies: z.boolean().optional().default(true),
});

export const redditImagePostSchema = z.object({
  subreddit: z.string().min(1),
  title: z.string().min(1).max(300),
  imageUrl: z.string().url(),
  flairId: z.string().optional(),
  nsfw: z.boolean().optional(),
  spoiler: z.boolean().optional(),
  sendReplies: z.boolean().optional().default(true),
});

export const redditFlairSchema = z.object({
  subreddit: z.string().min(1),
  postId: z.string(),
  flairId: z.string(),
  flairText: z.string().optional(),
});

export const redditConnectSchema = z.object({
  code: z.string(),
  state: z.string(),
});

// ============================================
// COMMON SCHEMAS
// ============================================

export const platformConnectionSchema = z.object({
  projectId: z.string(),
  platformType: z.enum(['TWITTER', 'LINKEDIN', 'FACEBOOK', 'REDDIT']),
  name: z.string().min(1),
});

export const deletePostSchema = z.object({
  postId: z.string(),
});

// ============================================
// RESPONSE TYPES
// ============================================

export type TwitterPost = z.infer<typeof twitterPostSchema>;
export type TwitterThread = z.infer<typeof twitterThreadSchema>;
export type LinkedInPost = z.infer<typeof linkedInPostSchema>;
export type LinkedInArticle = z.infer<typeof linkedInArticleSchema>;
export type FacebookPagePost = z.infer<typeof facebookPagePostSchema>;
export type FacebookGroupPost = z.infer<typeof facebookGroupPostSchema>;
export type RedditTextPost = z.infer<typeof redditTextPostSchema>;
export type RedditLinkPost = z.infer<typeof redditLinkPostSchema>;
