/**
 * Zod validation schemas for content editor
 */

import { z } from 'zod';

/**
 * Platform types
 */
export const platformSchema = z.enum([
  'blog',
  'email',
  'twitter',
  'linkedin',
  'facebook',
  'reddit',
]);

export type Platform = z.infer<typeof platformSchema>;

/**
 * Content update schema
 */
export const contentUpdateSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
  title: z.string().optional(),
  platform: platformSchema.optional(),
  metadata: z
    .object({
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      excerpt: z.string().optional(),
    })
    .optional(),
});

export type ContentUpdate = z.infer<typeof contentUpdateSchema>;

/**
 * Content regeneration schema
 */
export const regenerateSchema = z.object({
  contentId: z.string().uuid(),
  refinementPrompt: z.string().max(500).optional(),
  keepPrevious: z.boolean().default(false),
  generateVariations: z.boolean().default(false),
  variationCount: z.number().int().min(1).max(5).default(1),
  aiModel: z.enum(['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet']).default('gpt-4'),
});

export type RegenerateRequest = z.infer<typeof regenerateSchema>;

/**
 * Version creation schema
 */
export const versionCreateSchema = z.object({
  content: z.string().min(1),
  aiModel: z.string().optional(),
  refinementPrompt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type VersionCreate = z.infer<typeof versionCreateSchema>;

/**
 * Version restore schema
 */
export const versionRestoreSchema = z.object({
  versionId: z.string().uuid(),
});

export type VersionRestore = z.infer<typeof versionRestoreSchema>;

/**
 * Draft save schema
 */
export const draftSaveSchema = z.object({
  contentId: z.string().uuid(),
  content: z.string(),
  timestamp: z.date().or(z.string()).optional(),
});

export type DraftSave = z.infer<typeof draftSaveSchema>;

/**
 * Editor state schema (for local storage)
 */
export const editorStateSchema = z.object({
  content: z.string(),
  cursorPosition: z.number().optional(),
  lastModified: z.date().or(z.string()),
  platform: platformSchema.optional(),
});

export type EditorState = z.infer<typeof editorStateSchema>;

/**
 * Content validation by platform
 */
export const platformLimits = {
  blog: {
    minLength: 100,
    maxLength: 50000,
    requiredFields: ['title', 'content'],
  },
  email: {
    minLength: 50,
    maxLength: 10000,
    requiredFields: ['content'],
  },
  twitter: {
    minLength: 1,
    maxLength: 280,
    requiredFields: ['content'],
  },
  linkedin: {
    minLength: 10,
    maxLength: 3000,
    requiredFields: ['content'],
  },
  facebook: {
    minLength: 10,
    maxLength: 5000,
    requiredFields: ['content'],
  },
  reddit: {
    minLength: 1,
    maxLength: 40000,
    requiredFields: ['content'],
  },
} as const;

/**
 * Validate content for specific platform
 */
export function validatePlatformContent(
  content: string,
  platform: Platform
): { valid: boolean; error?: string } {
  const limits = platformLimits[platform];

  if (content.length < limits.minLength) {
    return {
      valid: false,
      error: `Content must be at least ${limits.minLength} characters for ${platform}`,
    };
  }

  if (content.length > limits.maxLength) {
    return {
      valid: false,
      error: `Content exceeds ${limits.maxLength} character limit for ${platform}`,
    };
  }

  return { valid: true };
}

/**
 * Image upload schema
 */
export const imageUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
});

export type ImageUpload = z.infer<typeof imageUploadSchema>;

/**
 * Validate image upload
 */
export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  const schema = imageUploadSchema.parse({
    file,
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });

  if (file.size > schema.maxSize) {
    return {
      valid: false,
      error: `Image size must be less than ${schema.maxSize / 1024 / 1024}MB`,
    };
  }

  if (!schema.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Image type must be one of: ${schema.allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Formatting options schema
 */
export const formattingOptionsSchema = z.object({
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
  strikethrough: z.boolean().default(false),
  code: z.boolean().default(false),
  link: z.object({
    href: z.string().url(),
    text: z.string().optional(),
  }).optional(),
  heading: z.number().int().min(1).max(6).optional(),
  list: z.enum(['bullet', 'ordered']).optional(),
});

export type FormattingOptions = z.infer<typeof formattingOptionsSchema>;

/**
 * Export all schemas
 */
export const schemas = {
  platform: platformSchema,
  contentUpdate: contentUpdateSchema,
  regenerate: regenerateSchema,
  versionCreate: versionCreateSchema,
  versionRestore: versionRestoreSchema,
  draftSave: draftSaveSchema,
  editorState: editorStateSchema,
  imageUpload: imageUploadSchema,
  formattingOptions: formattingOptionsSchema,
} as const;
