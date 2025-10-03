/**
 * Social media content formatters
 * Convert content to platform-specific formats with hashtags, mentions, and formatting
 */

export interface FormatOptions {
  hashtags?: string[];
  maxHashtags?: number;
  mentions?: string[];
  includeUrl?: string;
  tone?: 'professional' | 'casual' | 'technical';
}

/**
 * Format content for Twitter/X
 * - 280 character limit
 * - Max 2-3 hashtags recommended
 * - @ mentions
 * - URL shortening considerations
 */
export function toTwitterFormat(
  content: string,
  options: FormatOptions = {}
): string {
  let formatted = content.trim();

  // Twitter prefers concise content
  if (formatted.length > 240 && !options.includeUrl) {
    // Leave room for hashtags
    formatted = formatted.substring(0, 237) + '...';
  }

  // Add mentions at the beginning if provided
  if (options.mentions && options.mentions.length > 0) {
    const mentions = options.mentions
      .map((m) => (m.startsWith('@') ? m : `@${m}`))
      .join(' ');
    formatted = `${mentions} ${formatted}`;
  }

  // Add hashtags at the end (max 2-3 for best engagement)
  if (options.hashtags && options.hashtags.length > 0) {
    const maxTags = options.maxHashtags || 3;
    const tags = options.hashtags
      .slice(0, maxTags)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(' ');
    formatted = `${formatted}\n\n${tags}`;
  }

  // Add URL at the end if provided
  if (options.includeUrl) {
    formatted = `${formatted}\n\n${options.includeUrl}`;
  }

  return formatted;
}

/**
 * Format content for LinkedIn
 * - 3000 character limit for posts
 * - Professional tone
 * - Preserve line breaks
 * - Hashtags at end
 */
export function toLinkedInFormat(
  content: string,
  options: FormatOptions = {}
): string {
  let formatted = content.trim();

  // LinkedIn preserves formatting - ensure proper spacing
  formatted = formatted.replace(/\n{3,}/g, '\n\n'); // Max 2 line breaks

  // Add professional introduction if casual
  if (options.tone === 'casual') {
    formatted = professionalizeContent(formatted);
  }

  // Add hashtags at the end (LinkedIn supports more hashtags)
  if (options.hashtags && options.hashtags.length > 0) {
    const maxTags = options.maxHashtags || 5;
    const tags = options.hashtags
      .slice(0, maxTags)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(' ');
    formatted = `${formatted}\n\n${tags}`;
  }

  // Add URL if provided
  if (options.includeUrl) {
    formatted = `${formatted}\n\n🔗 ${options.includeUrl}`;
  }

  return formatted;
}

/**
 * Format content for Facebook
 * - No strict limit but 63,206 recommended
 * - Casual tone acceptable
 * - Emoji support
 * - Hashtags less important
 */
export function toFacebookFormat(
  content: string,
  options: FormatOptions = {}
): string {
  let formatted = content.trim();

  // Facebook is more casual - can add emojis for engagement
  if (options.tone !== 'professional') {
    formatted = casualizeContent(formatted);
  }

  // Facebook hashtags are less effective - use sparingly
  if (options.hashtags && options.hashtags.length > 0) {
    const maxTags = options.maxHashtags || 2;
    const tags = options.hashtags
      .slice(0, maxTags)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(' ');
    formatted = `${formatted}\n\n${tags}`;
  }

  // Add URL if provided
  if (options.includeUrl) {
    formatted = `${formatted}\n\n${options.includeUrl}`;
  }

  return formatted;
}

/**
 * Format content for Reddit
 * - Markdown formatting
 * - 40,000 character limit
 * - Community-specific formatting
 * - No hashtags (use flair instead)
 */
export function toRedditFormat(
  content: string,
  options: FormatOptions = {}
): string {
  let formatted = content.trim();

  // Reddit uses markdown - ensure proper formatting
  formatted = markdownizeContent(formatted);

  // Add URL if provided (Reddit prefers markdown links)
  if (options.includeUrl) {
    formatted = `${formatted}\n\n---\n\n[Original Source](${options.includeUrl})`;
  }

  // Reddit doesn't use hashtags - they use flair instead
  // Mentions use u/ prefix
  if (options.mentions && options.mentions.length > 0) {
    const mentions = options.mentions
      .map((m) => (m.startsWith('u/') ? m : `u/${m}`))
      .join(', ');
    formatted = `${formatted}\n\n*Mentioned: ${mentions}*`;
  }

  return formatted;
}

/**
 * Helper: Make content more professional for LinkedIn
 */
function professionalizeContent(content: string): string {
  // Remove excessive emojis
  let professional = content.replace(/[\u{1F600}-\u{1F64F}]{2,}/gu, '');

  // Ensure proper capitalization
  professional = professional
    .split('\n')
    .map((line) => {
      if (line.trim().length > 0) {
        return line.charAt(0).toUpperCase() + line.slice(1);
      }
      return line;
    })
    .join('\n');

  return professional;
}

/**
 * Helper: Make content more casual for Facebook
 */
function casualizeContent(content: string): string {
  // Add appropriate emojis at the start
  const emojis = ['👋', '💡', '🚀', '✨', '🎯'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return `${randomEmoji} ${content}`;
}

/**
 * Helper: Convert content to Reddit markdown
 */
function markdownizeContent(content: string): string {
  let markdown = content;

  // Ensure code blocks are properly formatted
  markdown = markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``;
  });

  // Ensure lists are properly formatted
  markdown = markdown.replace(/^[-*] /gm, '- ');

  // Ensure headers have proper spacing
  markdown = markdown.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');

  return markdown;
}

/**
 * Extract hashtags from content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = content.match(hashtagRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extract mentions from content
 */
export function extractMentions(
  content: string,
  platform: 'twitter' | 'reddit' | 'linkedin' = 'twitter'
): string[] {
  const prefix = platform === 'reddit' ? 'u/' : '@';
  const mentionRegex =
    platform === 'reddit' ? /u\/[\w-]+/g : /@[\w]+/g;
  const matches = content.match(mentionRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Strip hashtags from content
 */
export function stripHashtags(content: string): string {
  return content.replace(/#[\w]+/g, '').trim();
}

/**
 * Strip mentions from content
 */
export function stripMentions(content: string): string {
  return content.replace(/[@u\/][\w-]+/g, '').trim();
}

/**
 * Optimize hashtags for platform
 */
export function optimizeHashtags(
  hashtags: string[],
  platform: 'twitter' | 'linkedin' | 'facebook'
): string[] {
  const limits = {
    twitter: 3,
    linkedin: 5,
    facebook: 2,
  };

  const limit = limits[platform];

  // Remove duplicates and ensure # prefix
  const unique = [...new Set(hashtags)].map((tag) =>
    tag.startsWith('#') ? tag : `#${tag}`
  );

  // Sort by length (shorter hashtags first for Twitter)
  if (platform === 'twitter') {
    unique.sort((a, b) => a.length - b.length);
  }

  return unique.slice(0, limit);
}

/**
 * Add call-to-action to content
 */
export function addCallToAction(
  content: string,
  cta: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'reddit'
): string {
  const separator = platform === 'reddit' ? '\n\n---\n\n' : '\n\n';
  return `${content}${separator}${cta}`;
}

/**
 * Format thread numbering for Twitter
 */
export function formatThreadNumber(index: number, total: number): string {
  return `${index + 1}/${total}`;
}

/**
 * Create thread indicator
 */
export function createThreadIndicator(
  text: string,
  index: number,
  total: number
): string {
  if (total === 1) return text;
  return `${text}\n\n🧵 ${formatThreadNumber(index, total)}`;
}
