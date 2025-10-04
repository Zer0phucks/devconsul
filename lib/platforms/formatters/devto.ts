/**
 * Dev.to (Forem) content formatter
 * Converts content to Dev.to-compatible format with frontmatter
 */

export interface DevToFormattedContent {
  title: string;
  bodyMarkdown: string;
  published?: boolean;
  series?: string;
  mainImage?: string;
  canonicalUrl?: string;
  description?: string;
  tags?: string[];
}

/**
 * Convert content to Dev.to format
 * Dev.to uses Markdown with optional frontmatter
 */
export function toDevTo(
  title: string,
  markdown: string,
  options: {
    published?: boolean;
    series?: string;
    mainImage?: string;
    canonicalUrl?: string;
    description?: string;
    tags?: string[];
  } = {}
): DevToFormattedContent {
  // Clean markdown for Dev.to
  const cleanedMarkdown = cleanMarkdownForDevTo(markdown);

  // Dev.to supports frontmatter in the body_markdown field
  const bodyWithFrontmatter = addFrontmatter(cleanedMarkdown, {
    title,
    published: options.published ?? false,
    description: options.description,
    tags: options.tags,
    series: options.series,
    canonical_url: options.canonicalUrl,
    cover_image: options.mainImage,
  });

  return {
    title,
    bodyMarkdown: bodyWithFrontmatter,
    published: options.published,
    series: options.series,
    mainImage: options.mainImage,
    canonicalUrl: options.canonicalUrl,
    description: options.description,
    tags: options.tags,
  };
}

/**
 * Clean markdown for Dev.to compatibility
 */
function cleanMarkdownForDevTo(markdown: string): string {
  let cleaned = markdown;

  // Remove existing frontmatter (we'll add our own)
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n/m, '');

  // Dev.to supports GitHub-flavored Markdown
  // Ensure proper spacing around headers
  cleaned = cleaned.replace(/^(#{1,6})\s*(.+)$/gm, '\n$1 $2\n');

  // Ensure proper spacing around code blocks
  cleaned = cleaned.replace(/^```/gm, '\n```');
  cleaned = cleaned.replace(/```$/gm, '```\n');

  // Dev.to specific features:
  // Liquid tags for embeds (keep as is)
  // {% embed https://... %}

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Add frontmatter to markdown for Dev.to
 */
function addFrontmatter(
  markdown: string,
  options: {
    title: string;
    published: boolean;
    description?: string;
    tags?: string[];
    series?: string;
    canonical_url?: string;
    cover_image?: string;
  }
): string {
  const frontmatter: string[] = ['---'];

  frontmatter.push(`title: ${options.title}`);
  frontmatter.push(`published: ${options.published}`);

  if (options.description) {
    frontmatter.push(`description: ${options.description}`);
  }

  if (options.tags && options.tags.length > 0) {
    frontmatter.push(`tags: ${options.tags.join(', ')}`);
  }

  if (options.series) {
    frontmatter.push(`series: ${options.series}`);
  }

  if (options.canonical_url) {
    frontmatter.push(`canonical_url: ${options.canonical_url}`);
  }

  if (options.cover_image) {
    frontmatter.push(`cover_image: ${options.cover_image}`);
  }

  frontmatter.push('---');
  frontmatter.push('');

  return frontmatter.join('\n') + markdown;
}

/**
 * Format Dev.to post for API
 */
export function formatDevToPost(
  content: DevToFormattedContent,
  options: {
    organizationId?: number;
  } = {}
): Record<string, any> {
  const post: Record<string, any> = {
    title: content.title,
    body_markdown: content.bodyMarkdown,
    published: content.published ?? false,
  };

  if (content.series) {
    post.series = content.series;
  }

  if (content.mainImage) {
    post.main_image = content.mainImage;
  }

  if (content.canonicalUrl) {
    post.canonical_url = content.canonicalUrl;
  }

  if (content.description) {
    post.description = content.description;
  }

  if (content.tags && content.tags.length > 0) {
    post.tags = content.tags;
  }

  if (options.organizationId) {
    post.organization_id = options.organizationId;
  }

  return post;
}

/**
 * Validate Dev.to tags
 * Dev.to has specific requirements for tags
 */
export function validateDevToTags(tags: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (tags.length > 4) {
    errors.push('Dev.to allows a maximum of 4 tags');
  }

  tags.forEach((tag, index) => {
    if (tag.length > 30) {
      errors.push(`Tag ${index + 1} exceeds 30 character limit: "${tag}"`);
    }
    if (tag.length < 1) {
      errors.push(`Tag ${index + 1} is empty`);
    }
    if (!/^[a-z0-9]+$/.test(tag)) {
      errors.push(`Tag ${index + 1} contains invalid characters (only lowercase alphanumeric allowed): "${tag}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert HTML to Dev.to-friendly Markdown
 */
export function htmlToDevToMarkdown(html: string): string {
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

  // Code blocks with language support
  markdown = markdown.replace(/<pre><code(?:\s+class="language-(\w+)")?>(.*?)<\/code><\/pre>/gi, '```$1\n$2\n```\n');
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, '`$1`');

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
 * Extract frontmatter from Dev.to markdown
 */
export function extractDevToFrontmatter(markdown: string): {
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

  // Parse YAML frontmatter
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterText.split('\n');

  lines.forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value: any = line.substring(colonIndex + 1).trim();

      // Handle boolean values
      if (value === 'true') value = true;
      if (value === 'false') value = false;

      // Handle arrays (tags)
      if (value.includes(',')) {
        value = value.split(',').map((v: string) => v.trim());
      }

      // Remove quotes from strings
      if (typeof value === 'string') {
        value = value.replace(/^["']|["']$/g, '');
      }

      frontmatter[key] = value;
    }
  });

  return {
    frontmatter,
    content,
  };
}

/**
 * Generate Dev.to liquid tags for embeds
 */
export function generateLiquidTags(type: string, url: string): string {
  const liquidTags: Record<string, string> = {
    youtube: `{% youtube ${url} %}`,
    twitter: `{% twitter ${url} %}`,
    github: `{% github ${url} %}`,
    codepen: `{% codepen ${url} %}`,
    codesandbox: `{% codesandbox ${url} %}`,
    vimeo: `{% vimeo ${url} %}`,
    instagram: `{% instagram ${url} %}`,
    spotify: `{% spotify ${url} %}`,
  };

  return liquidTags[type.toLowerCase()] || `{% link ${url} %}`;
}

/**
 * Convert embeds to Dev.to liquid tags
 */
export function convertEmbedsToLiquid(markdown: string): string {
  let converted = markdown;

  // YouTube embeds
  converted = converted.replace(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g,
    '{% youtube $1 %}'
  );

  // Twitter embeds
  converted = converted.replace(
    /https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\/(\d+)/g,
    '{% twitter $1 %}'
  );

  // GitHub repos
  converted = converted.replace(
    /https?:\/\/(?:www\.)?github\.com\/([\w-]+\/[\w-]+)/g,
    '{% github $1 %}'
  );

  // CodePen
  converted = converted.replace(
    /https?:\/\/(?:www\.)?codepen\.io\/([\w-]+)\/pen\/([\w-]+)/g,
    '{% codepen https://codepen.io/$1/pen/$2 %}'
  );

  return converted;
}
