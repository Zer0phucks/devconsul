/**
 * Prompt Library Validation Schemas
 * Zod schemas for prompt CRUD operations
 */

import { z } from 'zod';
import { templatePlatformSchema } from './template';

/**
 * Prompt category enum
 */
export const promptCategorySchema = z.enum([
  'TECHNICAL_UPDATE',
  'FEATURE_ANNOUNCEMENT',
  'BUG_FIX',
  'RELEASE_NOTES',
  'TUTORIAL',
  'CASE_STUDY',
  'WEEKLY_DIGEST',
  'MONTHLY_SUMMARY',
  'PRODUCT_UPDATE',
  'COMMUNITY_UPDATE',
  'CUSTOM',
]);

/**
 * Create prompt schema
 */
export const createPromptSchema = z.object({
  name: z.string().min(1, 'Prompt name is required').max(200),
  description: z.string().max(1000).optional(),
  category: promptCategorySchema,
  systemPrompt: z.string().min(10, 'System prompt must be at least 10 characters'),
  userPrompt: z.string().min(10, 'User prompt must be at least 10 characters'),
  platform: templatePlatformSchema,
  contentType: z.string().max(100).optional(),
  tone: z.string().max(50).optional(),
  targetLength: z.number().int().min(0).optional(),
  variables: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  projectId: z.string().optional(),
  templateId: z.string().optional(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;

/**
 * Update prompt schema
 */
export const updatePromptSchema = createPromptSchema.partial();

export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

/**
 * Query prompts schema
 */
export const queryPromptsSchema = z.object({
  projectId: z.string().optional(),
  platform: templatePlatformSchema.optional(),
  category: promptCategorySchema.optional(),
  templateId: z.string().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usageCount', 'averageRating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryPromptsInput = z.infer<typeof queryPromptsSchema>;

/**
 * Generate with prompt schema
 */
export const generateWithPromptSchema = z.object({
  promptId: z.string().cuid().optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  provider: z.enum(['openai', 'anthropic']).optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(100).max(100000).optional(),
});

export type GenerateWithPromptInput = z.infer<typeof generateWithPromptSchema>;

/**
 * Rate prompt effectiveness schema
 */
export const ratePromptSchema = z.object({
  promptId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
  generatedContentId: z.string().optional(),
});

export type RatePromptInput = z.infer<typeof ratePromptSchema>;

/**
 * Validate prompt quality
 */
export function validatePromptQuality(
  systemPrompt: string,
  userPrompt: string
): {
  score: number; // 0-100
  suggestions: string[];
} {
  let score = 100;
  const suggestions: string[] = [];

  // System prompt checks
  if (systemPrompt.length < 50) {
    score -= 15;
    suggestions.push('System prompt is very short. Consider adding more context and instructions.');
  }

  if (!systemPrompt.toLowerCase().includes('you are')) {
    score -= 10;
    suggestions.push('System prompt should define the AI\'s role (e.g., "You are a...")');
  }

  // User prompt checks
  if (userPrompt.length < 30) {
    score -= 15;
    suggestions.push('User prompt is very short. Add more specific instructions.');
  }

  if (!userPrompt.includes('{{') && !userPrompt.includes('}}')) {
    score -= 20;
    suggestions.push('User prompt doesn\'t use variables. Consider using {{variables}} for dynamic content.');
  }

  // Check for clear instructions
  const hasInstructions = /create|generate|write|compose|produce/i.test(userPrompt);
  if (!hasInstructions) {
    score -= 10;
    suggestions.push('Add clear action verbs (create, generate, write) to guide the AI.');
  }

  // Check for output format specification
  const hasFormat = /format|structure|markdown|html|json/i.test(systemPrompt + userPrompt);
  if (!hasFormat) {
    score -= 10;
    suggestions.push('Specify the desired output format (markdown, HTML, etc.)');
  }

  // Check for tone/style guidance
  const hasTone = /tone|style|voice|professional|casual|technical/i.test(systemPrompt);
  if (!hasTone) {
    score -= 5;
    suggestions.push('Consider specifying tone and style preferences.');
  }

  // Positive indicators
  if (systemPrompt.includes('example') || userPrompt.includes('example')) {
    score += 5;
  }

  if (systemPrompt.length > 200 && userPrompt.length > 100) {
    score += 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    suggestions,
  };
}

/**
 * Estimate token usage for prompt
 */
export function estimatePromptTokens(systemPrompt: string, userPrompt: string): number {
  // Rough estimation: ~4 characters per token
  const totalChars = systemPrompt.length + userPrompt.length;
  return Math.ceil(totalChars / 4);
}
