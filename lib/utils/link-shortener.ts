/**
 * Link Shortening Integration
 * Supports bit.ly, TinyURL, and custom URL shortening
 */

export interface LinkShortenerConfig {
  provider: 'bitly' | 'tinyurl' | 'custom';
  apiKey?: string;
  customEndpoint?: string;
}

export interface ShortenedLink {
  originalUrl: string;
  shortUrl: string;
  provider: string;
  createdAt: Date;
}

/**
 * Shorten a URL using configured provider
 */
export async function shortenUrl(
  url: string,
  config: LinkShortenerConfig
): Promise<ShortenedLink> {
  switch (config.provider) {
    case 'bitly':
      return shortenWithBitly(url, config.apiKey!);
    case 'tinyurl':
      return shortenWithTinyURL(url);
    case 'custom':
      return shortenWithCustom(url, config.customEndpoint!);
    default:
      throw new Error(`Unknown link shortener provider: ${config.provider}`);
  }
}

/**
 * Shorten URL with bit.ly
 * Requires BITLY_API_KEY environment variable
 */
async function shortenWithBitly(url: string, apiKey: string): Promise<ShortenedLink> {
  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        long_url: url,
        domain: 'bit.ly',
      }),
    });

    if (!response.ok) {
      throw new Error(`Bitly API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      originalUrl: url,
      shortUrl: data.link,
      provider: 'bitly',
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('Bitly shortening failed:', error);
    // Fallback to TinyURL
    return shortenWithTinyURL(url);
  }
}

/**
 * Shorten URL with TinyURL (no API key required)
 */
async function shortenWithTinyURL(url: string): Promise<ShortenedLink> {
  try {
    const response = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(`TinyURL API error: ${response.statusText}`);
    }

    const shortUrl = await response.text();

    return {
      originalUrl: url,
      shortUrl: shortUrl.trim(),
      provider: 'tinyurl',
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('TinyURL shortening failed:', error);
    // Return original URL as fallback
    return {
      originalUrl: url,
      shortUrl: url,
      provider: 'fallback',
      createdAt: new Date(),
    };
  }
}

/**
 * Shorten URL with custom endpoint
 */
async function shortenWithCustom(
  url: string,
  endpoint: string
): Promise<ShortenedLink> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Custom shortener error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      originalUrl: url,
      shortUrl: data.shortUrl || data.short_url || data.url,
      provider: 'custom',
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('Custom shortening failed:', error);
    // Fallback to TinyURL
    return shortenWithTinyURL(url);
  }
}

/**
 * Batch shorten multiple URLs
 */
export async function shortenMultipleUrls(
  urls: string[],
  config: LinkShortenerConfig
): Promise<ShortenedLink[]> {
  const results: ShortenedLink[] = [];

  for (const url of urls) {
    try {
      const shortened = await shortenUrl(url, config);
      results.push(shortened);
    } catch (error) {
      console.error(`Failed to shorten ${url}:`, error);
      // Add original URL as fallback
      results.push({
        originalUrl: url,
        shortUrl: url,
        provider: 'fallback',
        createdAt: new Date(),
      });
    }
  }

  return results;
}

/**
 * Extract all URLs from content
 */
export function extractUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Replace URLs in content with shortened versions
 */
export async function replaceUrlsWithShortened(
  content: string,
  config: LinkShortenerConfig
): Promise<{
  content: string;
  shortenedLinks: ShortenedLink[];
}> {
  const urls = extractUrls(content);

  if (urls.length === 0) {
    return {
      content,
      shortenedLinks: [],
    };
  }

  const shortenedLinks = await shortenMultipleUrls(urls, config);

  let updatedContent = content;
  shortenedLinks.forEach((link) => {
    updatedContent = updatedContent.replace(link.originalUrl, link.shortUrl);
  });

  return {
    content: updatedContent,
    shortenedLinks,
  };
}

/**
 * Add UTM parameters to URL for tracking
 */
export function addUtmParameters(
  url: string,
  params: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  }
): string {
  try {
    const urlObj = new URL(url);

    if (params.source) urlObj.searchParams.set('utm_source', params.source);
    if (params.medium) urlObj.searchParams.set('utm_medium', params.medium);
    if (params.campaign) urlObj.searchParams.set('utm_campaign', params.campaign);
    if (params.term) urlObj.searchParams.set('utm_term', params.term);
    if (params.content) urlObj.searchParams.set('utm_content', params.content);

    return urlObj.toString();
  } catch (error) {
    console.error('Failed to add UTM parameters:', error);
    return url;
  }
}

/**
 * Create platform-specific tracking URL
 */
export function createTrackingUrl(
  url: string,
  platform: string,
  campaign?: string
): string {
  return addUtmParameters(url, {
    source: platform,
    medium: 'social',
    campaign: campaign || 'auto-generated',
  });
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}
