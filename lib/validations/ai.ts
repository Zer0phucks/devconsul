/**
 * Zod Validation Schemas for AI Content Generation
 */

import { z } from 'zod';

export const platformSchema = z.enum([
  'blog',
  'email',
  'twitter',
  'linkedin',
  'facebook',
  'reddit',
]);

export const aiProviderSchema = z.enum(['openai', 'anthropic']);

export const brandVoiceSchema = z.object({
  tone: z.string().optional(),
  audience: z.string().optional(),
  themes: z.array(z.string()).optional(),
});

export const githubActivitySchema = z.object({
  type: z.enum(['commit', 'pr', 'issue', 'release', 'review']),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  timestamp: z.coerce.date(),
  author: z.string().optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
  filesChanged: z.array(z.string()).optional(),
});

export const generateContentSchema = z.object({
  activities: z.array(githubActivitySchema).min(1, 'At least one activity required'),
  platform: platformSchema,
  brandVoice: brandVoiceSchema.optional(),
  customPrompt: z.string().optional(),
  provider: aiProviderSchema.optional(),
  projectId: z.string().cuid().optional(),
});

export const generateAllPlatformsSchema = z.object({
  activities: z.array(githubActivitySchema).min(1, 'At least one activity required'),
  enabledPlatforms: z
    .array(platformSchema)
    .min(1, 'At least one platform must be enabled'),
  brandVoice: brandVoiceSchema.optional(),
  provider: aiProviderSchema.optional(),
  projectId: z.string().cuid().optional(),
});

export const regenerateContentSchema = z.object({
  contentId: z.string().cuid(),
  refinementPrompt: z.string().optional(),
  provider: aiProviderSchema.optional(),
});

export type Platform = z.infer<typeof platformSchema>;
export type AIProvider = z.infer<typeof aiProviderSchema>;
export type BrandVoice = z.infer<typeof brandVoiceSchema>;
export type GitHubActivity = z.infer<typeof githubActivitySchema>;
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type GenerateAllPlatformsInput = z.infer<typeof generateAllPlatformsSchema>;
export type RegenerateContentInput = z.infer<typeof regenerateContentSchema>;
