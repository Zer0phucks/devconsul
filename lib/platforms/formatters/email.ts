/**
 * Email Content Formatters
 *
 * Converts markdown to email-safe HTML with:
 * - Inline CSS (email clients don't support external CSS)
 * - Image optimization
 * - Link tracking
 * - Plain text fallback
 * - Spam filter optimization
 */

import { marked } from 'marked';
import { JSDOM } from 'jsdom';

// ============================================
// MARKDOWN TO HTML CONVERSION
// ============================================

export interface EmailFormatOptions {
  inlineCss?: boolean;
  maxImageWidth?: number;
  trackLinks?: boolean;
  trackingDomain?: string;
  unsubscribeUrl?: string;
}

/**
 * Convert markdown to email-safe HTML
 */
export async function markdownToEmailHtml(
  markdown: string,
  options: EmailFormatOptions = {}
): Promise<string> {
  const {
    inlineCss = true,
    maxImageWidth = 600,
    trackLinks = false,
    trackingDomain,
  } = options;

  // Configure marked for email
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Convert markdown to HTML
  let html = marked(markdown) as string;

  // Parse HTML for manipulation
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Apply email-safe styling
  if (inlineCss) {
    applyInlineCss(document);
  }

  // Optimize images
  optimizeImages(document, maxImageWidth);

  // Add link tracking
  if (trackLinks && trackingDomain) {
    addLinkTracking(document, trackingDomain);
  }

  // Ensure all links open in new window
  ensureExternalLinks(document);

  return document.body.innerHTML;
}

/**
 * Apply inline CSS to HTML elements
 */
function applyInlineCss(document: Document): void {
  // Paragraphs
  document.querySelectorAll('p').forEach(el => {
    el.setAttribute('style', 'margin: 0 0 16px; line-height: 1.6; color: #1a202c; font-size: 16px;');
  });

  // Headings
  document.querySelectorAll('h1').forEach(el => {
    el.setAttribute('style', 'margin: 32px 0 16px; font-size: 28px; font-weight: bold; color: #1a202c; line-height: 1.3;');
  });

  document.querySelectorAll('h2').forEach(el => {
    el.setAttribute('style', 'margin: 24px 0 12px; font-size: 24px; font-weight: bold; color: #2d3748; line-height: 1.3;');
  });

  document.querySelectorAll('h3').forEach(el => {
    el.setAttribute('style', 'margin: 20px 0 10px; font-size: 20px; font-weight: 600; color: #2d3748; line-height: 1.3;');
  });

  // Links
  document.querySelectorAll('a').forEach(el => {
    el.setAttribute('style', 'color: #3182ce; text-decoration: none;');
  });

  // Lists
  document.querySelectorAll('ul, ol').forEach(el => {
    el.setAttribute('style', 'margin: 0 0 16px; padding-left: 24px;');
  });

  document.querySelectorAll('li').forEach(el => {
    el.setAttribute('style', 'margin: 4px 0; line-height: 1.6;');
  });

  // Blockquotes
  document.querySelectorAll('blockquote').forEach(el => {
    el.setAttribute('style', 'margin: 16px 0; padding: 12px 20px; border-left: 4px solid #cbd5e0; background: #f7fafc; color: #4a5568; font-style: italic;');
  });

  // Code blocks
  document.querySelectorAll('pre').forEach(el => {
    el.setAttribute('style', 'margin: 16px 0; padding: 16px; background: #2d3748; color: #e2e8f0; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 14px;');
  });

  document.querySelectorAll('code').forEach(el => {
    if (el.parentElement?.tagName !== 'PRE') {
      el.setAttribute('style', 'padding: 2px 6px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 3px; font-family: monospace; font-size: 14px;');
    }
  });

  // Tables
  document.querySelectorAll('table').forEach(el => {
    el.setAttribute('style', 'margin: 16px 0; border-collapse: collapse; width: 100%;');
  });

  document.querySelectorAll('th').forEach(el => {
    el.setAttribute('style', 'padding: 8px 12px; background: #f7fafc; border: 1px solid #e2e8f0; font-weight: 600; text-align: left;');
  });

  document.querySelectorAll('td').forEach(el => {
    el.setAttribute('style', 'padding: 8px 12px; border: 1px solid #e2e8f0;');
  });

  // Horizontal rules
  document.querySelectorAll('hr').forEach(el => {
    el.setAttribute('style', 'margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;');
  });
}

/**
 * Optimize images for email
 */
function optimizeImages(document: Document, maxWidth: number): void {
  document.querySelectorAll('img').forEach(img => {
    // Set max width
    img.setAttribute('style', `max-width: ${maxWidth}px; height: auto; display: block; margin: 16px 0;`);

    // Ensure alt text exists
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', 'Image');
    }

    // Add border for better email client compatibility
    img.setAttribute('border', '0');
  });
}

/**
 * Add link tracking parameters
 */
function addLinkTracking(document: Document, trackingDomain: string): void {
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('http')) {
      const url = new URL(href);
      url.searchParams.set('utm_source', 'email');
      url.searchParams.set('utm_medium', 'newsletter');
      link.setAttribute('href', url.toString());
    }
  });
}

/**
 * Ensure all links open in new window
 */
function ensureExternalLinks(document: Document): void {
  document.querySelectorAll('a').forEach(link => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
}

// ============================================
// PLAIN TEXT GENERATION
// ============================================

/**
 * Generate plain text version from HTML
 */
export function htmlToPlainText(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Remove script and style tags
  document.querySelectorAll('script, style').forEach(el => el.remove());

  // Convert links to text with URL
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    const text = link.textContent;
    if (href && href !== text) {
      link.textContent = `${text} (${href})`;
    }
  });

  // Get text content
  let text = document.body.textContent || '';

  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 line breaks
  text = text.trim();

  return text;
}

// ============================================
// SPAM FILTER OPTIMIZATION
// ============================================

/**
 * Check content for spam triggers
 */
export function checkSpamScore(content: string): {
  score: number;
  triggers: string[];
} {
  const triggers: string[] = [];
  let score = 0;

  const spamWords = [
    'free', 'winner', 'cash', 'bonus', 'prize', 'guarantee',
    'urgent', 'act now', 'limited time', 'click here', 'buy now',
    'congratulations', 'earn money', 'risk-free', 'no obligation',
  ];

  const lowerContent = content.toLowerCase();

  // Check for spam words
  spamWords.forEach(word => {
    if (lowerContent.includes(word)) {
      triggers.push(`Contains spam word: "${word}"`);
      score += 1;
    }
  });

  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3) {
    triggers.push('Excessive capital letters');
    score += 2;
  }

  // Check for excessive exclamation marks
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    triggers.push('Too many exclamation marks');
    score += 1;
  }

  // Check for all caps words
  const allCapsWords = content.match(/\b[A-Z]{4,}\b/g) || [];
  if (allCapsWords.length > 2) {
    triggers.push('Multiple all-caps words');
    score += 1;
  }

  return { score, triggers };
}

/**
 * Add unsubscribe link to content
 */
export function addUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 12px;">
      <p style="margin: 8px 0;">
        This email was sent to you because you subscribed to our mailing list.
      </p>
      <p style="margin: 8px 0;">
        <a href="${unsubscribeUrl}" style="color: #3182ce; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
  `;

  return html + footer;
}

/**
 * Add tracking pixel for open tracking
 */
export function addTrackingPixel(html: string, trackingUrl: string): string {
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
  return html + pixel;
}
