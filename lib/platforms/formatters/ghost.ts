/**
 * Ghost CMS content formatter
 * Converts content to Ghost Mobiledoc/Lexical format
 */

import { markdownToHtml, extractExcerpt } from './markdown-to-html';
import type { ContentFormatOptions } from '@/lib/validations/blog-platforms';

export interface GhostFormattedContent {
  title: string;
  mobiledoc?: string; // Legacy format
  lexical?: string; // Modern format (Ghost 5.0+)
  html?: string;
  custom_excerpt?: string;
  status: string;
  visibility?: string;
  published_at?: string;
  featured?: boolean;
  tags?: Array<{ name: string }>;
  authors?: string[];
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  twitter_image?: string;
  codeinjection_head?: string;
  codeinjection_foot?: string;
}

/**
 * Convert markdown to Ghost Lexical format (recommended for Ghost 5.0+)
 */
export async function toGhost(
  title: string,
  markdown: string,
  options: ContentFormatOptions & {
    status?: string;
    visibility?: string;
    featured?: boolean;
    publishAt?: string;
    tags?: string[];
    authors?: string[];
  } = {}
): Promise<GhostFormattedContent> {
  // Convert markdown to HTML for Ghost
  const html = await markdownToHtml(markdown, {
    ...options,
    includeCodeHighlighting: true,
  });

  // Extract excerpt
  const customExcerpt = extractExcerpt(markdown, 300);

  // Create Lexical format (simplified version)
  // Ghost will handle full conversion on their end
  const lexical = createSimpleLexical(html);

  return {
    title,
    html,
    lexical,
    custom_excerpt: customExcerpt,
    status: options.status || 'published',
    visibility: options.visibility || 'public',
    published_at: options.publishAt,
    featured: options.featured || false,
    tags: options.tags?.map(name => ({ name })),
    authors: options.authors,
  };
}

/**
 * Create simplified Lexical JSON format
 * Ghost Admin API accepts both HTML and Lexical
 */
function createSimpleLexical(html: string): string {
  // Simplified Lexical structure
  // Ghost will convert HTML to proper Lexical format
  const lexicalDoc = {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: html,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };

  return JSON.stringify(lexicalDoc);
}

/**
 * Create Mobiledoc format (legacy, for Ghost < 5.0)
 */
export function createMobiledoc(html: string): string {
  const mobiledoc = {
    version: '0.3.1',
    atoms: [],
    cards: [['html', { html }]],
    markups: [],
    sections: [[10, 0]],
  };

  return JSON.stringify(mobiledoc);
}

/**
 * Format Ghost post for Admin API v5
 */
export function formatGhostPost(
  content: GhostFormattedContent,
  additionalOptions: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    twitterImage?: string;
    codeinjectionHead?: string;
    codeinjectionFoot?: string;
  } = {}
): { posts: Array<Record<string, any>> } {
  const post: Record<string, any> = {
    title: content.title,
    status: content.status,
  };

  // Use Lexical (preferred) or HTML
  if (content.lexical) {
    post.lexical = content.lexical;
  } else if (content.html) {
    post.html = content.html;
  }

  if (content.custom_excerpt) {
    post.custom_excerpt = content.custom_excerpt;
  }

  if (content.visibility) {
    post.visibility = content.visibility;
  }

  if (content.published_at) {
    post.published_at = content.published_at;
  }

  if (content.featured !== undefined) {
    post.featured = content.featured;
  }

  if (content.tags && content.tags.length > 0) {
    post.tags = content.tags;
  }

  if (content.authors && content.authors.length > 0) {
    post.authors = content.authors;
  }

  // Meta fields
  if (additionalOptions.slug) {
    post.slug = additionalOptions.slug;
  }

  if (additionalOptions.metaTitle) {
    post.meta_title = additionalOptions.metaTitle;
  }

  if (additionalOptions.metaDescription) {
    post.meta_description = additionalOptions.metaDescription;
  }

  if (additionalOptions.ogImage) {
    post.og_image = additionalOptions.ogImage;
  }

  if (additionalOptions.twitterImage) {
    post.twitter_image = additionalOptions.twitterImage;
  }

  if (additionalOptions.codeinjectionHead) {
    post.codeinjection_head = additionalOptions.codeinjectionHead;
  }

  if (additionalOptions.codeinjectionFoot) {
    post.codeinjection_foot = additionalOptions.codeinjectionFoot;
  }

  // Ghost API expects posts array
  return { posts: [post] };
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
