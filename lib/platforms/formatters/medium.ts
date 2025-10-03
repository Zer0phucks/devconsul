/**
 * Medium content formatter
 * Converts content to Medium-compatible format
 */

import type { ContentFormatOptions } from '@/lib/validations/blog-platforms';

export interface MediumFormattedContent {
  title: string;
  contentFormat: 'markdown' | 'html';
  content: string;
  canonicalUrl?: string;
  tags?: string[];
  publishStatus?: 'draft' | 'public' | 'unlisted';
  license?: string;
  notifyFollowers?: boolean;
}

/**
 * Convert content to Medium format
 * Medium supports both Markdown and HTML
 */
export function toMedium(
  title: string,
  markdown: string,
  options: {
    canonicalUrl?: string;
    tags?: string[];
    publishStatus?: 'draft' | 'public' | 'unlisted';
    license?: string;
    notifyFollowers?: boolean;
  } = {}
): MediumFormattedContent {
  // Clean markdown for Medium
  const cleanedMarkdown = cleanMarkdownForMedium(markdown);

  return {
    title,
    contentFormat: 'markdown', // Medium prefers Markdown
    content: cleanedMarkdown,
    canonicalUrl: options.canonicalUrl,
    tags: options.tags?.slice(0, 5), // Medium allows max 5 tags
    publishStatus: options.publishStatus || 'public',
    license: options.license || 'all-rights-reserved',
    notifyFollowers: options.notifyFollowers !== undefined ? options.notifyFollowers : false,
  };
}

/**
 * Clean markdown for Medium compatibility
 */
function cleanMarkdownForMedium(markdown: string): string {
  let cleaned = markdown;

  // Medium has specific markdown support
  // Keep it simple and clean

  // Ensure proper spacing around headers
  cleaned = cleaned.replace(/^(#{1,6})\s*(.+)$/gm, '\n$1 $2\n');

  // Ensure proper spacing around code blocks
  cleaned = cleaned.replace(/^```/gm, '\n```');
  cleaned = cleaned.replace(/```$/gm, '```\n');

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Format Medium post for API
 */
export function formatMediumPost(content: MediumFormattedContent): Record<string, any> {
  const post: Record<string, any> = {
    title: content.title,
    contentFormat: content.contentFormat,
    content: content.content,
    publishStatus: content.publishStatus || 'public',
  };

  if (content.canonicalUrl) {
    post.canonicalUrl = content.canonicalUrl;
  }

  if (content.tags && content.tags.length > 0) {
    post.tags = content.tags.slice(0, 5); // Enforce 5 tag limit
  }

  if (content.license) {
    post.license = content.license;
  }

  if (content.notifyFollowers !== undefined) {
    post.notifyFollowers = content.notifyFollowers;
  }

  return post;
}

/**
 * Validate Medium tags
 * Medium has strict requirements for tags
 */
export function validateMediumTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tags.length > 5) {
    errors.push('Medium allows a maximum of 5 tags');
  }

  tags.forEach((tag, index) => {
    if (tag.length > 25) {
      errors.push(`Tag ${index + 1} exceeds 25 character limit: "${tag}"`);
    }
    if (tag.length < 1) {
      errors.push(`Tag ${index + 1} is empty`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert HTML to Medium-friendly format
 * Medium has limited HTML support, better to use Markdown
 */
export function htmlToMediumMarkdown(html: string): string {
  // Basic HTML to Markdown conversion
  // For production, consider using a library like turndown

  let markdown = html;

  // Headers
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Bold and italic
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');

  // Links
  markdown = markdown.replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images
  markdown = markdown.replace(/<img\s+src="([^"]+)"(?:\s+alt="([^"]*)")?[^>]*>/gi, '![$2]($1)');

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Paragraphs
  markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');

  // Lists
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  markdown = markdown.replace(/<\/?[uo]l>/gi, '\n');

  // Code
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  markdown = markdown.replace(/<pre>(.*?)<\/pre>/gi, '```\n$1\n```\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}
