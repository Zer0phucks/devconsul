/**
 * Hashnode content formatter
 * Converts content to Hashnode-compatible format
 */

export interface HashnodeFormattedContent {
  title: string;
  contentMarkdown: string;
  coverImageUrl?: string;
  tags?: { id: string; name: string; slug: string }[];
  subtitle?: string;
  slug?: string;
}

/**
 * Convert content to Hashnode format
 * Hashnode uses Markdown for content
 */
export function toHashnode(
  title: string,
  markdown: string,
  options: {
    coverImageUrl?: string;
    tags?: { id: string; name: string; slug: string }[];
    subtitle?: string;
    slug?: string;
  } = {}
): HashnodeFormattedContent {
  // Clean markdown for Hashnode
  const cleanedMarkdown = cleanMarkdownForHashnode(markdown);

  return {
    title,
    contentMarkdown: cleanedMarkdown,
    coverImageUrl: options.coverImageUrl,
    tags: options.tags,
    subtitle: options.subtitle,
    slug: options.slug,
  };
}

/**
 * Clean markdown for Hashnode compatibility
 */
function cleanMarkdownForHashnode(markdown: string): string {
  let cleaned = markdown;

  // Hashnode supports GitHub-flavored Markdown
  // Ensure proper spacing around headers
  cleaned = cleaned.replace(/^(#{1,6})\s*(.+)$/gm, '\n$1 $2\n');

  // Ensure proper spacing around code blocks
  cleaned = cleaned.replace(/^```/gm, '\n```');
  cleaned = cleaned.replace(/```$/gm, '```\n');

  // Fix frontmatter (Hashnode doesn't use it in API)
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n/m, '');

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Format Hashnode post for GraphQL API
 */
export function formatHashnodePost(
  content: HashnodeFormattedContent,
  options: {
    publicationId?: string;
    disableComments?: boolean;
    metaTags?: {
      title?: string;
      description?: string;
      image?: string;
    };
    seriesId?: string;
    originalArticleURL?: string;
  } = {}
): Record<string, any> {
  const post: Record<string, any> = {
    title: content.title,
    contentMarkdown: content.contentMarkdown,
    publicationId: options.publicationId,
  };

  if (content.coverImageUrl) {
    post.coverImageOptions = {
      coverImageURL: content.coverImageUrl,
    };
  }

  if (content.tags && content.tags.length > 0) {
    post.tags = content.tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));
  }

  if (content.subtitle) {
    post.subtitle = content.subtitle;
  }

  if (content.slug) {
    post.slug = content.slug;
  }

  if (options.disableComments !== undefined) {
    post.disableComments = options.disableComments;
  }

  if (options.metaTags) {
    post.metaTags = {
      title: options.metaTags.title,
      description: options.metaTags.description,
      image: options.metaTags.image,
    };
  }

  if (options.seriesId) {
    post.seriesId = options.seriesId;
  }

  if (options.originalArticleURL) {
    post.originalArticleURL = options.originalArticleURL;
  }

  return post;
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

/**
 * Validate Hashnode tags
 */
export function validateHashnodeTags(
  tags: { id: string; name: string; slug: string }[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tags.length > 5) {
    errors.push('Hashnode allows a maximum of 5 tags');
  }

  tags.forEach((tag, index) => {
    if (!tag.id || !tag.name || !tag.slug) {
      errors.push(`Tag ${index + 1} is missing required fields (id, name, slug)`);
    }
    if (tag.name.length > 50) {
      errors.push(`Tag ${index + 1} name exceeds 50 character limit: "${tag.name}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert HTML to Hashnode-friendly Markdown
 */
export function htmlToHashnodeMarkdown(html: string): string {
  // Basic HTML to Markdown conversion
  let markdown = html;

  // Headers
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n\n');

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
  markdown = markdown.replace(/<pre><code(?:\s+class="language-(\w+)")?>(.*?)<\/code><\/pre>/gi, '```$1\n$2\n```\n');

  // Blockquotes
  markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

/**
 * Extract frontmatter from markdown
 */
export function extractFrontmatter(markdown: string): {
  frontmatter: Record<string, any> | null;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: null,
      content: markdown,
    };
  }

  const frontmatterText = match[1];
  const content = match[2];

  // Parse YAML frontmatter (simple key-value pairs)
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterText.split('\n');

  lines.forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
    }
  });

  return {
    frontmatter,
    content,
  };
}
