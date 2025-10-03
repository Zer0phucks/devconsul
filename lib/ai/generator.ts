/**
 * AI Content Generation Engine
 * Orchestrates content generation with provider fallback and platform routing
 */

import { createOpenAIProvider, OpenAIProvider } from './providers/openai';
import { createAnthropicProvider, AnthropicProvider } from './providers/anthropic';
import type { GenerationResult, GenerationError } from './providers/openai';
import * as blogPrompts from './prompts/blog';
import * as emailPrompts from './prompts/email';
import * as twitterPrompts from './prompts/twitter';
import * as linkedinPrompts from './prompts/linkedin';
import * as facebookPrompts from './prompts/facebook';
import * as redditPrompts from './prompts/reddit';
import { db } from '@/lib/db';

export type Platform = 'blog' | 'email' | 'twitter' | 'linkedin' | 'facebook' | 'reddit';

export type AIProvider = 'openai' | 'anthropic';

export interface GitHubActivity {
  type: 'commit' | 'pr' | 'issue' | 'release' | 'review';
  title: string;
  description?: string;
  url?: string;
  timestamp: Date;
  author?: string;
  additions?: number;
  deletions?: number;
  filesChanged?: string[];
}

export interface BrandVoiceSettings {
  tone?: string;
  audience?: string;
  themes?: string[];
}

export interface GenerationContext {
  activities: GitHubActivity[];
  platform: Platform;
  brandVoice?: BrandVoiceSettings;
  customPrompt?: string;
  provider?: AIProvider;
  projectId?: string;
}

export interface ContentGenerationResult {
  success: boolean;
  content?: string;
  platform: Platform;
  metadata: {
    provider: AIProvider;
    model: string;
    tokensUsed: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost: number;
    finishReason: string;
    generatedAt: Date;
  };
  error?: string;
}

/**
 * Parse GitHub activities into readable context string
 */
export function parseGitHubActivity(activities: GitHubActivity[]): string {
  if (!activities || activities.length === 0) {
    return 'No recent GitHub activity to report.';
  }

  const grouped = activities.reduce(
    (acc, activity) => {
      acc[activity.type] = acc[activity.type] || [];
      acc[activity.type].push(activity);
      return acc;
    },
    {} as Record<string, GitHubActivity[]>
  );

  let context = 'Recent GitHub Development Activity:\n\n';

  // Commits
  if (grouped.commit && grouped.commit.length > 0) {
    context += `Commits (${grouped.commit.length}):\n`;
    grouped.commit.slice(0, 10).forEach((commit) => {
      context += `- ${commit.title}`;
      if (commit.additions || commit.deletions) {
        context += ` (+${commit.additions || 0}/-${commit.deletions || 0})`;
      }
      if (commit.filesChanged && commit.filesChanged.length > 0) {
        context += `\n  Files: ${commit.filesChanged.slice(0, 3).join(', ')}`;
        if (commit.filesChanged.length > 3) {
          context += ` and ${commit.filesChanged.length - 3} more`;
        }
      }
      context += '\n';
    });
    context += '\n';
  }

  // Pull Requests
  if (grouped.pr && grouped.pr.length > 0) {
    context += `Pull Requests (${grouped.pr.length}):\n`;
    grouped.pr.forEach((pr) => {
      context += `- ${pr.title}\n`;
      if (pr.description) {
        context += `  ${pr.description.slice(0, 200)}\n`;
      }
    });
    context += '\n';
  }

  // Issues
  if (grouped.issue && grouped.issue.length > 0) {
    context += `Issues (${grouped.issue.length}):\n`;
    grouped.issue.slice(0, 5).forEach((issue) => {
      context += `- ${issue.title}\n`;
    });
    context += '\n';
  }

  // Releases
  if (grouped.release && grouped.release.length > 0) {
    context += `Releases (${grouped.release.length}):\n`;
    grouped.release.forEach((release) => {
      context += `- ${release.title}\n`;
      if (release.description) {
        context += `  ${release.description}\n`;
      }
    });
    context += '\n';
  }

  return context.trim();
}

/**
 * Get platform-specific prompt generators
 */
function getPlatformPrompts(platform: Platform) {
  switch (platform) {
    case 'blog':
      return blogPrompts;
    case 'email':
      return emailPrompts;
    case 'twitter':
      return twitterPrompts;
    case 'linkedin':
      return linkedinPrompts;
    case 'facebook':
      return facebookPrompts;
    case 'reddit':
      return redditPrompts;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Generate content for a specific platform
 */
export async function generateContent(
  context: GenerationContext
): Promise<ContentGenerationResult> {
  const {
    activities,
    platform,
    brandVoice,
    customPrompt,
    provider: preferredProvider,
    projectId,
  } = context;

  // Parse GitHub activity
  const parsedActivities = parseGitHubActivity(activities);

  // Get platform-specific prompts
  const prompts = getPlatformPrompts(platform);
  const systemPrompt = (prompts as any).createSystemPrompt
    ? (prompts as any).createSystemPrompt()
    : '';
  const userPrompt = customPrompt || (prompts as any).createUserPrompt({
    activities: parsedActivities,
    brandVoice,
  });

  // Determine provider order (with fallback)
  const defaultProvider = (preferredProvider || process.env.AI_PROVIDER || 'openai') as AIProvider;
  const fallbackProvider = defaultProvider === 'openai' ? 'anthropic' : 'openai';

  // Try primary provider
  const primaryResult = await tryGenerate(defaultProvider, systemPrompt, userPrompt);

  if ('content' in primaryResult) {
    // Success - store in database if projectId provided
    if (projectId) {
      await storeGeneratedContent(projectId, platform, primaryResult, defaultProvider);
    }

    return {
      success: true,
      content: primaryResult.content,
      platform,
      metadata: {
        provider: defaultProvider,
        model: primaryResult.model,
        tokensUsed: primaryResult.tokensUsed,
        cost: primaryResult.cost,
        finishReason: primaryResult.finishReason,
        generatedAt: new Date(),
      },
    };
  }

  // Primary failed - try fallback if retryable
  if (primaryResult.retryable) {
    const fallbackResult = await tryGenerate(fallbackProvider, systemPrompt, userPrompt);

    if ('content' in fallbackResult) {
      // Fallback success
      if (projectId) {
        await storeGeneratedContent(projectId, platform, fallbackResult, fallbackProvider);
      }

      return {
        success: true,
        content: fallbackResult.content,
        platform,
        metadata: {
          provider: fallbackProvider,
          model: fallbackResult.model,
          tokensUsed: fallbackResult.tokensUsed,
          cost: fallbackResult.cost,
          finishReason: fallbackResult.finishReason,
          generatedAt: new Date(),
        },
      };
    }

    // Both failed
    return {
      success: false,
      platform,
      metadata: {
        provider: defaultProvider,
        model: '',
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        cost: 0,
        finishReason: 'error',
        generatedAt: new Date(),
      },
      error: `Both providers failed. Primary: ${primaryResult.error}, Fallback: ${fallbackResult.error}`,
    };
  }

  // Primary failed with non-retryable error
  return {
    success: false,
    platform,
    metadata: {
      provider: defaultProvider,
      model: '',
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      cost: 0,
      finishReason: 'error',
      generatedAt: new Date(),
    },
    error: primaryResult.error,
  };
}

/**
 * Try generation with a specific provider
 */
async function tryGenerate(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string
): Promise<GenerationResult | GenerationError> {
  try {
    if (provider === 'openai') {
      const openai = createOpenAIProvider();
      return await openai.generate(systemPrompt, userPrompt);
    } else {
      const anthropic = createAnthropicProvider();
      return await anthropic.generate(systemPrompt, userPrompt);
    }
  } catch (error: any) {
    return {
      error: error.message || 'Unknown error',
      retryable: true,
    };
  }
}

/**
 * Store generated content in database
 */
async function storeGeneratedContent(
  projectId: string,
  platform: Platform,
  result: GenerationResult,
  provider: AIProvider
): Promise<void> {
  try {
    await db.content.create({
      data: {
        projectId,
        sourceType: 'AI_GENERATED',
        title: extractTitle(result.content, platform),
        body: result.content,
        rawContent: result.content,
        status: 'DRAFT',
        isAIGenerated: true,
        aiModel: result.model,
        aiMetadata: {
          provider,
          tokensUsed: result.tokensUsed,
          cost: result.cost,
          finishReason: result.finishReason,
          platform,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to store generated content:', error);
    // Don't throw - generation still succeeded
  }
}

/**
 * Extract title from generated content
 */
function extractTitle(content: string, platform: Platform): string {
  // Try to extract title from markdown heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // For email, look for subject line
  if (platform === 'email') {
    const subjectMatch = content.match(/^Subject:\s+(.+)$/m);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }
  }

  // For Reddit, look for title
  if (platform === 'reddit') {
    const titleMatch = content.match(/^Title:\s+(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }

  // Fallback: use first line or platform name
  const firstLine = content.split('\n')[0].trim();
  return firstLine.slice(0, 100) || `${platform} content`;
}

/**
 * Generate content for all enabled platforms
 */
export async function generateForAllPlatforms(
  activities: GitHubActivity[],
  enabledPlatforms: Platform[],
  settings?: {
    brandVoice?: BrandVoiceSettings;
    provider?: AIProvider;
    projectId?: string;
    enableTransformation?: boolean;
    transformationSettings?: {
      shortenLinks?: boolean;
      addHashtags?: boolean;
      hashtags?: string[];
      tone?: 'professional' | 'casual' | 'technical' | 'friendly';
    };
  }
): Promise<ContentGenerationResult[]> {
  const results: ContentGenerationResult[] = [];

  for (const platform of enabledPlatforms) {
    const result = await generateContent({
      activities,
      platform,
      brandVoice: settings?.brandVoice,
      provider: settings?.provider,
      projectId: settings?.projectId,
    });
    results.push(result);
  }

  return results;
}

/**
 * Generate content with automatic cross-platform adaptation
 */
export async function generateWithAdaptation(
  activities: GitHubActivity[],
  basePlatform: Platform,
  targetPlatforms: Platform[],
  settings?: {
    brandVoice?: BrandVoiceSettings;
    provider?: AIProvider;
    projectId?: string;
    transformationSettings?: {
      shortenLinks?: boolean;
      addHashtags?: boolean;
      hashtags?: string[];
      generateHashtags?: boolean;
      tone?: 'professional' | 'casual' | 'technical' | 'friendly';
    };
  }
): Promise<{
  base: ContentGenerationResult;
  adaptations: Record<Platform, any>;
}> {
  // Generate base content
  const baseResult = await generateContent({
    activities,
    platform: basePlatform,
    brandVoice: settings?.brandVoice,
    provider: settings?.provider,
    projectId: settings?.projectId,
  });

  if (!baseResult.success || !baseResult.content) {
    return {
      base: baseResult,
      adaptations: {},
    };
  }

  // Import transformation utilities dynamically to avoid circular dependencies
  const { transformToMultiplePlatforms } = await import('@/lib/transformation/engine');
  const { injectHashtags, generateHashtagsFromContent } = await import(
    '@/lib/utils/hashtag-injector'
  );

  // Transform base content to target platforms
  const adaptations = await transformToMultiplePlatforms(
    baseResult.content,
    basePlatform as any,
    targetPlatforms as any[],
    {
      tone: settings?.transformationSettings?.tone,
      aiProvider: settings?.provider,
    }
  );

  // Post-process adaptations with hashtags if enabled
  if (settings?.transformationSettings?.addHashtags) {
    for (const [platform, result] of Object.entries(adaptations)) {
      let hashtags = settings.transformationSettings.hashtags || [];

      // Generate hashtags if enabled
      if (settings.transformationSettings.generateHashtags) {
        const generated = generateHashtagsFromContent(result.content, 3);
        hashtags = [...hashtags, ...generated];
      }

      if (hashtags.length > 0) {
        const hashtagResult = injectHashtags(result.content, hashtags, {
          platform: platform as any,
          placement: 'smart',
        });
        result.content = hashtagResult.content;
      }
    }
  }

  return {
    base: baseResult,
    adaptations,
  };
}

/**
 * Validate generated content meets platform requirements
 */
export function validateContent(content: string, platform: Platform): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  switch (platform) {
    case 'twitter':
      // Check each tweet in thread
      const tweets = content.split(/\d+\//).filter((t) => t.trim());
      tweets.forEach((tweet, index) => {
        const cleanTweet = tweet.trim();
        if (cleanTweet.length > 280) {
          errors.push(`Tweet ${index + 1} exceeds 280 characters (${cleanTweet.length})`);
        }
      });
      break;

    case 'linkedin':
      if (content.length < 1300) {
        errors.push('LinkedIn post should be at least 1300 characters');
      }
      if (content.length > 3000) {
        errors.push('LinkedIn post exceeds 3000 characters');
      }
      break;

    case 'facebook':
      if (content.length < 400) {
        errors.push('Facebook post should be at least 400 characters');
      }
      if (content.length > 600) {
        errors.push('Facebook post exceeds 600 characters');
      }
      break;

    case 'email':
      if (content.length < 300) {
        errors.push('Email should be at least 300 words');
      }
      if (content.length > 600) {
        errors.push('Email exceeds 600 words');
      }
      break;

    case 'blog':
      if (content.length < 800) {
        errors.push('Blog post should be at least 800 words');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
