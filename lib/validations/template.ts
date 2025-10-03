/**
 * Template Validation Schemas
 * Zod schemas for template CRUD operations
 */

import { z } from 'zod';

/**
 * Template platform enum
 */
export const templatePlatformSchema = z.enum([
  'BLOG',
  'EMAIL',
  'NEWSLETTER',
  'TWITTER',
  'LINKEDIN',
  'FACEBOOK',
  'REDDIT',
  'HASHNODE',
  'DEVTO',
  'MEDIUM',
  'WORDPRESS',
  'GHOST',
  'ALL',
]);

/**
 * Create template schema
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional(),
  platform: templatePlatformSchema,
  category: z.string().max(100).optional(),
  content: z.string().min(10, 'Template content must be at least 10 characters'),
  subject: z.string().max(200).optional(),
  variables: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  projectId: z.string().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

/**
 * Update template schema
 */
export const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().cuid(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

/**
 * Query templates schema
 */
export const queryTemplatesSchema = z.object({
  projectId: z.string().optional(),
  platform: templatePlatformSchema.optional(),
  category: z.string().optional(),
  isDefault: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usageCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryTemplatesInput = z.infer<typeof queryTemplatesSchema>;

/**
 * Render template schema
 */
export const renderTemplateSchema = z.object({
  templateId: z.string().cuid().optional(),
  templateContent: z.string().min(1).optional(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  strict: z.boolean().default(false),
  escapeHtml: z.boolean().default(false),
});

export type RenderTemplateInput = z.infer<typeof renderTemplateSchema>;

/**
 * Validate template content
 */
export function validateTemplateContent(content: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length
  if (content.length < 10) {
    errors.push('Template must be at least 10 characters');
  }

  // Check maximum length (reasonable limit)
  if (content.length > 100000) {
    errors.push('Template exceeds maximum length of 100,000 characters');
  }

  // Check for unclosed variable tags
  const openCount = (content.match(/\{\{/g) || []).length;
  const closeCount = (content.match(/\}\}/g) || []).length;

  if (openCount !== closeCount) {
    errors.push(`Mismatched variable tags: ${openCount} opening tags, ${closeCount} closing tags`);
  }

  // Check for nested variables
  if (content.includes('{{{{') || content.includes('}}}}')) {
    errors.push('Nested variable tags are not supported');
  }

  // Check for empty variable names
  const emptyVars = content.match(/\{\{\s*\}\}/g);
  if (emptyVars) {
    errors.push(`Found ${emptyVars.length} empty variable tag(s)`);
  }

  // Warning: Check for undefined common variables
  const commonVars = ['repository', 'project Name', 'author Name', 'date'];
  const usedVars = extractVariablesFromContent(content);

  usedVars.forEach((varName) => {
    if (varName.includes(' ')) {
      warnings.push(`Variable "${varName}" contains spaces - use camelCase instead`);
    }
    if (varName !== varName.trim()) {
      warnings.push(`Variable "${varName}" has leading/trailing whitespace`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract variable names from template content
 */
function extractVariablesFromContent(content: string): string[] {
  const variableRegex = /\{\{([^}|]+)(?:\|[^}]+)?\}\}/g;
  const matches = content.matchAll(variableRegex);
  const names = new Set<string>();

  for (const match of matches) {
    names.add(match[1].trim());
  }

  return Array.from(names);
}

/**
 * Validate template for specific platform
 */
export function validateTemplateForPlatform(
  content: string,
  platform: string
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = validateTemplateContent(content);

  // Platform-specific validations
  switch (platform.toUpperCase()) {
    case 'TWITTER':
      // Check if content might exceed Twitter limits
      if (content.length > 1000) {
        result.warnings.push('Template might generate content exceeding Twitter character limits');
      }
      break;

    case 'EMAIL':
    case 'NEWSLETTER':
      // Email templates should have subject
      if (!content.includes('subject') && !content.includes('Subject')) {
        result.warnings.push('Email templates typically include a subject line');
      }
      break;

    case 'LINKEDIN':
      // LinkedIn has character limits
      if (content.length > 3000) {
        result.warnings.push('Template might generate content exceeding LinkedIn post limits');
      }
      break;
  }

  return result;
}
