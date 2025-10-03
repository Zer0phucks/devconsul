/**
 * Hashtag Injection System
 * Smart hashtag placement with platform-specific optimization
 */

export interface HashtagConfig {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  maxHashtags?: number;
  placement?: 'end' | 'inline' | 'smart';
  generateFromContent?: boolean;
}

export interface HashtagResult {
  content: string;
  hashtags: string[];
  placement: 'end' | 'inline';
  metadata: {
    originalHashtags: string[];
    generatedHashtags: string[];
    totalHashtags: number;
  };
}

/**
 * Platform-specific hashtag limits and best practices
 */
const HASHTAG_LIMITS: Record<string, { max: number; recommended: number }> = {
  twitter: { max: 5, recommended: 2 },
  linkedin: { max: 10, recommended: 5 },
  facebook: { max: 5, recommended: 2 },
  instagram: { max: 30, recommended: 11 },
};

/**
 * Inject hashtags into content with smart placement
 */
export function injectHashtags(
  content: string,
  hashtags: string[],
  config: HashtagConfig
): HashtagResult {
  const { platform, maxHashtags, placement = 'smart' } = config;

  // Normalize hashtags (ensure # prefix, remove duplicates)
  const normalizedHashtags = normalizeHashtags(hashtags);

  // Extract existing hashtags from content
  const existingHashtags = extractHashtagsFromContent(content);

  // Combine and deduplicate
  const allHashtags = [...new Set([...existingHashtags, ...normalizedHashtags])];

  // Apply platform limits
  const limit = maxHashtags || HASHTAG_LIMITS[platform].recommended;
  const optimizedHashtags = optimizeHashtagsForPlatform(
    allHashtags,
    platform,
    limit
  );

  // Remove existing hashtags from content
  let cleanContent = removeHashtagsFromContent(content);

  // Determine placement strategy
  const actualPlacement = placement === 'smart'
    ? getSmartPlacement(platform, cleanContent)
    : placement;

  // Inject hashtags
  let finalContent: string;
  if (actualPlacement === 'inline') {
    finalContent = injectInline(cleanContent, optimizedHashtags);
  } else {
    finalContent = injectAtEnd(cleanContent, optimizedHashtags, platform);
  }

  return {
    content: finalContent,
    hashtags: optimizedHashtags,
    placement: actualPlacement,
    metadata: {
      originalHashtags: existingHashtags,
      generatedHashtags: normalizedHashtags,
      totalHashtags: optimizedHashtags.length,
    },
  };
}

/**
 * Generate hashtags from content using keyword extraction
 */
export function generateHashtagsFromContent(
  content: string,
  count: number = 5
): string[] {
  // Extract potential keywords
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Minimum 4 characters

  // Common words to exclude
  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they',
    'what', 'when', 'where', 'which', 'while', 'there', 'their',
    'about', 'would', 'could', 'should', 'these', 'those',
  ]);

  // Filter and count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });

  // Sort by frequency and take top N
  const topWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);

  // Convert to hashtags (capitalize first letter of each word)
  return topWords.map(word =>
    '#' + word.charAt(0).toUpperCase() + word.slice(1)
  );
}

/**
 * Normalize hashtags (add # prefix, remove spaces, validate)
 */
function normalizeHashtags(hashtags: string[]): string[] {
  return hashtags
    .map(tag => {
      let normalized = tag.trim();

      // Add # prefix if missing
      if (!normalized.startsWith('#')) {
        normalized = '#' + normalized;
      }

      // Remove spaces and special characters (except #)
      normalized = normalized.replace(/[^\w#]/g, '');

      // Ensure at least one character after #
      return normalized.length > 1 ? normalized : null;
    })
    .filter((tag): tag is string => tag !== null);
}

/**
 * Extract hashtags from content
 */
function extractHashtagsFromContent(content: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = content.match(hashtagRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Remove hashtags from content
 */
function removeHashtagsFromContent(content: string): string {
  return content.replace(/#[\w]+/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Optimize hashtags for specific platform
 */
function optimizeHashtagsForPlatform(
  hashtags: string[],
  platform: string,
  limit: number
): string[] {
  const unique = [...new Set(hashtags)];

  // Platform-specific sorting
  let sorted = unique;

  if (platform === 'twitter') {
    // Twitter: prefer shorter hashtags (better visibility)
    sorted = unique.sort((a, b) => a.length - b.length);
  } else if (platform === 'linkedin') {
    // LinkedIn: prefer professional/industry hashtags (longer OK)
    sorted = unique.sort((a, b) => b.length - a.length);
  } else if (platform === 'instagram') {
    // Instagram: mix of popular and niche (varies by length)
    sorted = unique.sort(() => Math.random() - 0.5);
  }

  return sorted.slice(0, limit);
}

/**
 * Determine smart placement based on platform and content
 */
function getSmartPlacement(
  platform: string,
  content: string
): 'inline' | 'end' {
  // Twitter: inline if short content, end if long
  if (platform === 'twitter') {
    return content.length < 150 ? 'inline' : 'end';
  }

  // LinkedIn: always at end (professional format)
  if (platform === 'linkedin') {
    return 'end';
  }

  // Facebook: inline for short posts, end for long
  if (platform === 'facebook') {
    return content.length < 200 ? 'inline' : 'end';
  }

  // Instagram: always at end (standard practice)
  if (platform === 'instagram') {
    return 'end';
  }

  return 'end';
}

/**
 * Inject hashtags inline (scattered throughout content)
 */
function injectInline(content: string, hashtags: string[]): string {
  if (hashtags.length === 0) return content;

  const sentences = content.split(/\.\s+/);
  const hashtagsToInsert = [...hashtags];

  // Distribute hashtags across sentences
  const result = sentences.map((sentence, index) => {
    if (hashtagsToInsert.length > 0 && index > 0 && index % 2 === 0) {
      const hashtag = hashtagsToInsert.shift();
      return `${sentence}. ${hashtag}`;
    }
    return sentence;
  });

  // Add remaining hashtags at end
  const finalContent = result.join('. ');
  if (hashtagsToInsert.length > 0) {
    return `${finalContent} ${hashtagsToInsert.join(' ')}`;
  }

  return finalContent;
}

/**
 * Inject hashtags at the end
 */
function injectAtEnd(
  content: string,
  hashtags: string[],
  platform: string
): string {
  if (hashtags.length === 0) return content;

  const separator = platform === 'linkedin' ? '\n\n' : '\n\n';
  return `${content.trim()}${separator}${hashtags.join(' ')}`;
}

/**
 * Add platform-specific call-to-action with hashtags
 */
export function addCTAWithHashtags(
  content: string,
  cta: string,
  hashtags: string[],
  platform: string
): string {
  const hashtagConfig: HashtagConfig = {
    platform: platform as any,
    placement: 'end',
  };

  const result = injectHashtags(content, hashtags, hashtagConfig);
  return `${result.content}\n\n${cta}`;
}

/**
 * Validate hashtag quality
 */
export function validateHashtags(hashtags: string[]): {
  valid: string[];
  invalid: string[];
  warnings: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  hashtags.forEach(tag => {
    // Check format
    if (!tag.startsWith('#')) {
      invalid.push(tag);
      warnings.push(`"${tag}" doesn't start with #`);
      return;
    }

    // Check length (too short)
    if (tag.length <= 2) {
      invalid.push(tag);
      warnings.push(`"${tag}" is too short`);
      return;
    }

    // Check length (too long)
    if (tag.length > 30) {
      warnings.push(`"${tag}" is very long and may not be searchable`);
    }

    // Check for spaces or special characters
    if (/[^\w#]/.test(tag)) {
      invalid.push(tag);
      warnings.push(`"${tag}" contains invalid characters`);
      return;
    }

    // Check if all numbers
    if (/^#\d+$/.test(tag)) {
      warnings.push(`"${tag}" is all numbers - may not be effective`);
    }

    valid.push(tag);
  });

  return { valid, invalid, warnings };
}

/**
 * Suggest related hashtags based on input
 */
export function suggestRelatedHashtags(
  baseHashtags: string[],
  category?: string
): string[] {
  // This is a simplified version - in production, you might use an API
  // or database of popular hashtags by category

  const suggestions: Record<string, string[]> = {
    tech: ['#Technology', '#Innovation', '#Developer', '#Coding', '#Software'],
    business: ['#Business', '#Entrepreneur', '#Startup', '#Marketing', '#Sales'],
    design: ['#Design', '#UX', '#UI', '#Creative', '#Branding'],
    ai: ['#AI', '#MachineLearning', '#DeepLearning', '#DataScience', '#ML'],
    default: ['#Tips', '#Tutorial', '#Guide', '#HowTo', '#Learn'],
  };

  const cat = category?.toLowerCase() || 'default';
  return suggestions[cat] || suggestions.default;
}

/**
 * Calculate hashtag effectiveness score (0-100)
 */
export function calculateHashtagScore(
  hashtags: string[],
  platform: string
): number {
  let score = 100;

  const limits = HASHTAG_LIMITS[platform];
  if (!limits) return 50;

  // Deduct for too many hashtags
  if (hashtags.length > limits.max) {
    score -= (hashtags.length - limits.max) * 10;
  }

  // Deduct for too few hashtags (if appropriate for platform)
  if (platform === 'instagram' && hashtags.length < 5) {
    score -= 20;
  }

  // Deduct for very long hashtags
  hashtags.forEach(tag => {
    if (tag.length > 20) score -= 5;
  });

  // Deduct for all-caps hashtags (looks spammy)
  const allCaps = hashtags.filter(tag =>
    tag.slice(1) === tag.slice(1).toUpperCase()
  );
  if (allCaps.length > 0) {
    score -= allCaps.length * 5;
  }

  return Math.max(0, Math.min(100, score));
}
