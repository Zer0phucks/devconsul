/**
 * Platform-specific content formatters
 * Handles formatting and rendering for different platforms
 */

import { marked } from 'marked';

export type Platform =
  | 'blog'
  | 'email'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'reddit';

export interface FormattedContent {
  html: string;
  plainText: string;
  metadata: {
    characterCount: number;
    wordCount: number;
    readTime: number; // in minutes
    tweetCount?: number;
  };
}

/**
 * Calculate reading time based on word count
 * Average reading speed: 200 words per minute
 */
function calculateReadTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Format content for blog posts
 * Markdown → HTML with syntax highlighting support
 */
export async function formatForBlog(content: string): Promise<FormattedContent> {
  // Configure marked for blog formatting
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const html = await marked(content);
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim();
  const wordCount = countWords(plainText);

  return {
    html,
    plainText,
    metadata: {
      characterCount: plainText.length,
      wordCount,
      readTime: calculateReadTime(wordCount),
    },
  };
}

/**
 * Format content for email
 * Markdown → Responsive HTML email
 */
export async function formatForEmail(content: string): Promise<FormattedContent> {
  const html = await marked(content);
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim();
  const wordCount = countWords(plainText);

  // Wrap in email-friendly HTML structure
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
      ${html}
    </div>
  `;

  return {
    html: emailHtml,
    plainText,
    metadata: {
      characterCount: plainText.length,
      wordCount,
      readTime: calculateReadTime(wordCount),
    },
  };
}

/**
 * Format content for Twitter
 * Split into tweets with thread numbering
 */
export function formatForTwitter(content: string): FormattedContent {
  const MAX_TWEET_LENGTH = 280;
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim();

  // Split into tweets
  const tweets: string[] = [];
  let currentTweet = '';
  const paragraphs = plainText.split('\n\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');

    for (const word of words) {
      // Account for thread numbering (e.g., "1/5 ")
      const threadPrefix = tweets.length > 0 ? `${tweets.length + 1}/${Math.ceil(plainText.length / MAX_TWEET_LENGTH)} ` : '';
      const testTweet = currentTweet ? `${currentTweet} ${word}` : word;

      if ((testTweet + threadPrefix).length > MAX_TWEET_LENGTH) {
        tweets.push(currentTweet.trim());
        currentTweet = word;
      } else {
        currentTweet = testTweet;
      }
    }

    if (currentTweet) {
      tweets.push(currentTweet.trim());
      currentTweet = '';
    }
  }

  // Add thread numbering
  const numberedTweets = tweets.map((tweet, index) => {
    if (tweets.length > 1) {
      return `${index + 1}/${tweets.length} ${tweet}`;
    }
    return tweet;
  });

  const html = numberedTweets
    .map((tweet, i) => `<div class="tweet" data-tweet="${i + 1}">${tweet}</div>`)
    .join('\n');

  return {
    html,
    plainText: numberedTweets.join('\n\n'),
    metadata: {
      characterCount: plainText.length,
      wordCount: countWords(plainText),
      readTime: calculateReadTime(countWords(plainText)),
      tweetCount: tweets.length,
    },
  };
}

/**
 * Format content for LinkedIn
 * Preserve line breaks, professional styling
 */
export function formatForLinkedIn(content: string): FormattedContent {
  const plainText = content.replace(/[#*_`~]/g, '').trim();
  const wordCount = countWords(plainText);

  // LinkedIn supports line breaks and basic formatting
  const html = plainText
    .split('\n')
    .map(line => {
      if (!line.trim()) return '<br>';
      // Detect hashtags and bold them
      const formatted = line.replace(/#(\w+)/g, '<strong>#$1</strong>');
      return `<p>${formatted}</p>`;
    })
    .join('\n');

  return {
    html,
    plainText,
    metadata: {
      characterCount: plainText.length,
      wordCount,
      readTime: calculateReadTime(wordCount),
    },
  };
}

/**
 * Format content for Facebook
 * Casual format with emoji support
 */
export function formatForFacebook(content: string): FormattedContent {
  const plainText = content.replace(/[#*_`~]/g, '').trim();
  const wordCount = countWords(plainText);

  // Facebook supports emojis and line breaks
  const html = plainText
    .split('\n')
    .map(line => line.trim() ? `<p>${line}</p>` : '<br>')
    .join('\n');

  return {
    html,
    plainText,
    metadata: {
      characterCount: plainText.length,
      wordCount,
      readTime: calculateReadTime(wordCount),
    },
  };
}

/**
 * Format content for Reddit
 * Markdown with code blocks and subreddit styling
 */
export async function formatForReddit(content: string): Promise<FormattedContent> {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const html = await marked(content);
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim();
  const wordCount = countWords(plainText);

  return {
    html,
    plainText,
    metadata: {
      characterCount: plainText.length,
      wordCount,
      readTime: calculateReadTime(wordCount),
    },
  };
}

/**
 * Main formatter function - routes to platform-specific formatter
 */
export async function formatContent(
  content: string,
  platform: Platform
): Promise<FormattedContent> {
  switch (platform) {
    case 'blog':
      return formatForBlog(content);
    case 'email':
      return formatForEmail(content);
    case 'twitter':
      return formatForTwitter(content);
    case 'linkedin':
      return formatForLinkedIn(content);
    case 'facebook':
      return formatForFacebook(content);
    case 'reddit':
      return formatForReddit(content);
    default:
      return formatForBlog(content);
  }
}

/**
 * Get character limit for platform
 */
export function getPlatformCharLimit(platform: Platform): number {
  const limits: Record<Platform, number> = {
    blog: 10000,
    email: 5000,
    twitter: 280,
    linkedin: 3000,
    facebook: 5000,
    reddit: 40000,
  };
  return limits[platform];
}

/**
 * Check if content exceeds platform limit
 */
export function exceedsLimit(content: string, platform: Platform): boolean {
  const limit = getPlatformCharLimit(platform);
  return content.length > limit;
}
