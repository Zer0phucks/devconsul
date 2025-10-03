/**
 * WordPress content formatter
 * Converts content to WordPress-compatible HTML
 */

import { markdownToHtml, extractExcerpt, getFirstImage } from './markdown-to-html';
import type { ContentFormatOptions } from '@/lib/validations/blog-platforms';

export interface WordPressFormattedContent {
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  format?: string;
  meta?: Record<string, any>;
}

export async function toWordPress(
  title: string,
  markdown: string,
  options: ContentFormatOptions & {
    status?: string;
    categories?: string[];
    tags?: string[];
    format?: string;
  } = {}
): Promise<WordPressFormattedContent> {
  // Convert markdown to HTML
  const content = await markdownToHtml(markdown, options);

  // Extract excerpt if not provided
  const excerpt = options.stripHtml
    ? extractExcerpt(markdown)
    : undefined;

  return {
    title,
    content,
    excerpt,
    status: options.status || 'publish',
    format: options.format || 'standard',
    meta: {
      // WordPress custom meta fields can be added here
    },
  };
}

/**
 * Format WordPress post for API v2
 */
export function formatWordPressPost(
  content: WordPressFormattedContent,
  additionalOptions: {
    categoryIds?: number[];
    tagIds?: number[];
    featuredMediaId?: number;
    slug?: string;
    password?: string;
  } = {}
): Record<string, any> {
  const post: Record<string, any> = {
    title: content.title,
    content: content.content,
    status: content.status,
    format: content.format || 'standard',
  };

  if (content.excerpt) {
    post.excerpt = content.excerpt;
  }

  if (additionalOptions.categoryIds && additionalOptions.categoryIds.length > 0) {
    post.categories = additionalOptions.categoryIds;
  }

  if (additionalOptions.tagIds && additionalOptions.tagIds.length > 0) {
    post.tags = additionalOptions.tagIds;
  }

  if (additionalOptions.featuredMediaId) {
    post.featured_media = additionalOptions.featuredMediaId;
  }

  if (additionalOptions.slug) {
    post.slug = additionalOptions.slug;
  }

  if (additionalOptions.password) {
    post.password = additionalOptions.password;
  }

  return post;
}

/**
 * Sanitize HTML for WordPress
 * WordPress has specific allowed tags and attributes
 */
export function sanitizeForWordPress(html: string): string {
  // WordPress allows most standard HTML tags
  // This is a basic sanitization - WordPress will do additional server-side sanitization

  // Remove potentially dangerous elements
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  html = html.replace(/on\w+\s*=\s*"[^"]*"/gi, ''); // Remove event handlers

  return html;
}

/**
 * Extract featured image from content
 */
export async function extractFeaturedImage(markdown: string): Promise<string | null> {
  return getFirstImage(markdown);
}
