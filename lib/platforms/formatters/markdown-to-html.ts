/**
 * Convert Markdown to HTML with code highlighting support
 */

import { remark } from 'remark';
import html from 'remark-html';
import type { ContentFormatOptions } from '@/lib/validations/blog-platforms';

export async function markdownToHtml(
  markdown: string,
  options: ContentFormatOptions = {}
): Promise<string> {
  const {
    includeCodeHighlighting = true,
    convertRelativeUrls = true,
    baseUrl,
    stripHtml = false,
    preserveLineBreaks = true,
  } = options;

  try {
    let processedMarkdown = markdown;

    // Convert relative URLs to absolute if baseUrl provided
    if (convertRelativeUrls && baseUrl) {
      processedMarkdown = processedMarkdown.replace(
        /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
        `![$1](${baseUrl}/$2)`
      );
      processedMarkdown = processedMarkdown.replace(
        /\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g,
        `[$1](${baseUrl}/$2)`
      );
    }

    // Process markdown to HTML
    const result = await remark()
      .use(html, {
        sanitize: false, // We trust our own content
        allowDangerousHtml: !stripHtml
      })
      .process(processedMarkdown);

    let htmlContent = String(result);

    // Preserve line breaks if requested
    if (preserveLineBreaks) {
      htmlContent = htmlContent.replace(/\n\n/g, '<br><br>');
    }

    // Add syntax highlighting classes for code blocks
    if (includeCodeHighlighting) {
      htmlContent = htmlContent.replace(
        /<pre><code class="language-(\w+)">/g,
        '<pre><code class="language-$1 hljs">'
      );
    }

    return htmlContent;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    throw new Error('Failed to convert markdown to HTML');
  }
}

/**
 * Extract excerpt from markdown
 */
export function extractExcerpt(markdown: string, maxLength: number = 160): string {
  // Remove markdown formatting
  let text = markdown
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
    .trim();

  // Truncate to max length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim();
    // Find the last space to avoid cutting words
    const lastSpace = text.lastIndexOf(' ');
    if (lastSpace > 0) {
      text = text.substring(0, lastSpace);
    }
    text += '...';
  }

  return text;
}

/**
 * Extract all images from markdown
 */
export function extractImages(markdown: string): Array<{ alt: string; url: string }> {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: Array<{ alt: string; url: string }> = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2],
    });
  }

  return images;
}

/**
 * Get first image from markdown (for featured image)
 */
export function getFirstImage(markdown: string): string | null {
  const images = extractImages(markdown);
  return images.length > 0 ? images[0].url : null;
}
