/**
 * Platform-specific character limits and enforcement
 * Handles truncation, smart splitting, and warnings for approaching limits
 */

export interface PlatformLimits {
  name: string;
  characterLimit: number;
  recommendedLimit?: number;
  truncationSuffix?: string;
  preserveWordBoundary?: boolean;
}

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  twitter: {
    name: 'Twitter/X',
    characterLimit: 280,
    recommendedLimit: 270, // Leave room for link previews
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  linkedin: {
    name: 'LinkedIn',
    characterLimit: 3000,
    recommendedLimit: 2900,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  linkedinArticle: {
    name: 'LinkedIn Article',
    characterLimit: 110000,
    recommendedLimit: 100000,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  facebook: {
    name: 'Facebook',
    characterLimit: 63206,
    recommendedLimit: 60000,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  reddit: {
    name: 'Reddit',
    characterLimit: 40000,
    recommendedLimit: 35000,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  redditTitle: {
    name: 'Reddit Title',
    characterLimit: 300,
    recommendedLimit: 280,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  hashnode: {
    name: 'Hashnode',
    characterLimit: 250000, // Very generous limit for articles
    recommendedLimit: 200000,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  hashnodeTitle: {
    name: 'Hashnode Title',
    characterLimit: 250,
    recommendedLimit: 100,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  devto: {
    name: 'Dev.to',
    characterLimit: 400000, // Dev.to has very generous limits
    recommendedLimit: 350000,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
  devtoTitle: {
    name: 'Dev.to Title',
    characterLimit: 250,
    recommendedLimit: 128,
    truncationSuffix: '…',
    preserveWordBoundary: true,
  },
};

export interface EnforcementResult {
  text: string;
  truncated: boolean;
  originalLength: number;
  finalLength: number;
  warning?: string;
  exceedsLimit: boolean;
}

/**
 * Enforce character limit on text with smart truncation
 */
export function enforceLimit(
  text: string,
  platform: keyof typeof PLATFORM_LIMITS,
  options: {
    forceTruncate?: boolean;
    customSuffix?: string;
  } = {}
): EnforcementResult {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const originalLength = text.length;
  const limit = limits.characterLimit;
  const recommendedLimit = limits.recommendedLimit || limit;
  const suffix = options.customSuffix || limits.truncationSuffix || '…';

  // Check if within limits
  if (originalLength <= limit) {
    return {
      text,
      truncated: false,
      originalLength,
      finalLength: originalLength,
      warning:
        originalLength > recommendedLimit
          ? `Text is approaching the ${limits.name} limit (${originalLength}/${limit} characters)`
          : undefined,
      exceedsLimit: false,
    };
  }

  // Exceeds limit - truncate if forced or return error
  if (!options.forceTruncate) {
    return {
      text,
      truncated: false,
      originalLength,
      finalLength: originalLength,
      warning: `Text exceeds ${limits.name} limit (${originalLength}/${limit} characters)`,
      exceedsLimit: true,
    };
  }

  // Perform smart truncation
  const maxLength = limit - suffix.length;
  let truncated = text.substring(0, maxLength);

  // Preserve word boundary if enabled
  if (limits.preserveWordBoundary) {
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      // Only preserve boundary if we're not losing too much text
      truncated = truncated.substring(0, lastSpace);
    }
  }

  truncated += suffix;

  return {
    text: truncated,
    truncated: true,
    originalLength,
    finalLength: truncated.length,
    warning: `Text was truncated from ${originalLength} to ${truncated.length} characters`,
    exceedsLimit: false,
  };
}

/**
 * Split long text into multiple parts for threading (e.g., Twitter threads)
 */
export function splitForThreading(
  text: string,
  platform: keyof typeof PLATFORM_LIMITS,
  options: {
    threadIndicator?: boolean; // Add "1/n" indicators
    preserveParagraphs?: boolean; // Try to keep paragraphs together
  } = {}
): string[] {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const maxLength = limits.characterLimit - (options.threadIndicator ? 10 : 0); // Reserve space for "1/10"
  const parts: string[] = [];

  if (text.length <= maxLength) {
    return [text];
  }

  // Split by paragraphs if requested
  if (options.preserveParagraphs) {
    const paragraphs = text.split(/\n\n+/);
    let currentPart = '';

    for (const para of paragraphs) {
      if (para.length > maxLength) {
        // Single paragraph exceeds limit - split it by sentences
        if (currentPart) {
          parts.push(currentPart.trim());
          currentPart = '';
        }
        const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
        for (const sentence of sentences) {
          if ((currentPart + sentence).length > maxLength) {
            if (currentPart) {
              parts.push(currentPart.trim());
            }
            currentPart = sentence;
          } else {
            currentPart += sentence;
          }
        }
      } else if ((currentPart + '\n\n' + para).length > maxLength) {
        parts.push(currentPart.trim());
        currentPart = para;
      } else {
        currentPart += (currentPart ? '\n\n' : '') + para;
      }
    }

    if (currentPart) {
      parts.push(currentPart.trim());
    }
  } else {
    // Simple character-based splitting with word boundary preservation
    let remaining = text;
    while (remaining.length > 0) {
      let chunk = remaining.substring(0, maxLength);

      if (remaining.length > maxLength && limits.preserveWordBoundary) {
        const lastSpace = chunk.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.8) {
          chunk = chunk.substring(0, lastSpace);
        }
      }

      parts.push(chunk.trim());
      remaining = remaining.substring(chunk.length).trim();
    }
  }

  // Add thread indicators if requested
  if (options.threadIndicator && parts.length > 1) {
    return parts.map((part, idx) => `${part}\n\n${idx + 1}/${parts.length}`);
  }

  return parts;
}

/**
 * Validate text against platform limits without modifying
 */
export function validateLength(
  text: string,
  platform: keyof typeof PLATFORM_LIMITS
): {
  valid: boolean;
  length: number;
  limit: number;
  warning?: string;
} {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const length = text.length;
  const limit = limits.characterLimit;
  const recommendedLimit = limits.recommendedLimit || limit;

  return {
    valid: length <= limit,
    length,
    limit,
    warning:
      length > recommendedLimit && length <= limit
        ? `Approaching limit (${length}/${limit})`
        : length > limit
          ? `Exceeds limit (${length}/${limit})`
          : undefined,
  };
}

/**
 * Get remaining characters for a platform
 */
export function getRemainingChars(
  text: string,
  platform: keyof typeof PLATFORM_LIMITS
): number {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  return Math.max(0, limits.characterLimit - text.length);
}

/**
 * Calculate percentage of limit used
 */
export function getLimitPercentage(
  text: string,
  platform: keyof typeof PLATFORM_LIMITS
): number {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  return Math.min(100, (text.length / limits.characterLimit) * 100);
}
