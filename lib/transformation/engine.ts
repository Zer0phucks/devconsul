/**
 * Cross-Platform Content Transformation Engine
 * Intelligent content adaptation with AI-powered summarization and format conversion
 */

import { createOpenAIProvider } from '@/lib/ai/providers/openai';
import { createAnthropicProvider } from '@/lib/ai/providers/anthropic';
import { PLATFORM_LIMITS, splitForThreading } from '@/lib/platforms/limits';
import type { Platform } from '@/lib/ai/generator';

export type TransformationSource = 'blog' | 'email' | 'twitter' | 'linkedin' | 'facebook' | 'reddit';
export type TransformationTarget = Platform;

export interface TransformationContext {
  content: string;
  sourceFormat: TransformationSource;
  targetFormat: TransformationTarget;
  preserveKeyPoints?: boolean;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
  aiProvider?: 'openai' | 'anthropic';
}

export interface TransformedContent {
  content: string;
  metadata: {
    sourceFormat: TransformationSource;
    targetFormat: TransformationTarget;
    transformationType: 'summarize' | 'expand' | 'reformat' | 'split';
    qualityScore: number; // 0-100
    keyPointsPreserved: string[];
    aiModel?: string;
    tokensUsed?: number;
    transformedAt: Date;
  };
  warnings?: string[];
}

export interface TransformationRule {
  from: TransformationSource;
  to: TransformationTarget;
  strategy: 'summarize' | 'expand' | 'reformat' | 'split';
  charLimit?: number;
  preserveMarkdown?: boolean;
  addHashtags?: boolean;
  shortenLinks?: boolean;
  splitIntoThread?: boolean;
}

/**
 * Platform-specific transformation rules
 */
export const TRANSFORMATION_RULES: Record<string, TransformationRule> = {
  // Blog → Short-form platforms
  'blog-twitter': {
    from: 'blog',
    to: 'twitter',
    strategy: 'summarize',
    charLimit: 280,
    preserveMarkdown: false,
    addHashtags: true,
    shortenLinks: true,
    splitIntoThread: true,
  },
  'blog-linkedin': {
    from: 'blog',
    to: 'linkedin',
    strategy: 'reformat',
    charLimit: 3000,
    preserveMarkdown: false,
    addHashtags: true,
    shortenLinks: false,
  },
  'blog-facebook': {
    from: 'blog',
    to: 'facebook',
    strategy: 'summarize',
    charLimit: 600,
    preserveMarkdown: false,
    addHashtags: true,
    shortenLinks: true,
  },
  'blog-reddit': {
    from: 'blog',
    to: 'reddit',
    strategy: 'reformat',
    charLimit: 40000,
    preserveMarkdown: true,
    addHashtags: false,
    shortenLinks: false,
  },

  // Email → Social platforms
  'email-twitter': {
    from: 'email',
    to: 'twitter',
    strategy: 'summarize',
    charLimit: 280,
    preserveMarkdown: false,
    addHashtags: true,
    shortenLinks: true,
    splitIntoThread: true,
  },
  'email-linkedin': {
    from: 'email',
    to: 'linkedin',
    strategy: 'reformat',
    charLimit: 3000,
    preserveMarkdown: false,
    addHashtags: true,
  },
  'email-facebook': {
    from: 'email',
    to: 'facebook',
    strategy: 'summarize',
    charLimit: 600,
    preserveMarkdown: false,
    addHashtags: true,
  },

  // Long-form → Short-form
  'linkedin-twitter': {
    from: 'linkedin',
    to: 'twitter',
    strategy: 'summarize',
    charLimit: 280,
    preserveMarkdown: false,
    addHashtags: true,
    shortenLinks: true,
    splitIntoThread: true,
  },
  'facebook-twitter': {
    from: 'facebook',
    to: 'twitter',
    strategy: 'summarize',
    charLimit: 280,
    preserveMarkdown: false,
    addHashtags: true,
    shortenLinks: true,
  },
};

/**
 * Main transformation engine
 */
export class ContentTransformationEngine {
  private aiProvider: 'openai' | 'anthropic';

  constructor(aiProvider: 'openai' | 'anthropic' = 'openai') {
    this.aiProvider = aiProvider;
  }

  /**
   * Transform content from one format to another
   */
  async transform(context: TransformationContext): Promise<TransformedContent> {
    const rule = this.getTransformationRule(context.sourceFormat, context.targetFormat);

    if (!rule) {
      throw new Error(
        `No transformation rule found for ${context.sourceFormat} → ${context.targetFormat}`
      );
    }

    let transformed: string;
    let keyPoints: string[] = [];
    let aiModel: string | undefined;
    let tokensUsed: number | undefined;

    switch (rule.strategy) {
      case 'summarize':
        const summary = await this.summarizeContent(
          context.content,
          context.targetFormat,
          rule.charLimit || 280,
          context.tone
        );
        transformed = summary.content;
        keyPoints = summary.keyPoints;
        aiModel = summary.model;
        tokensUsed = summary.tokensUsed;
        break;

      case 'expand':
        const expanded = await this.expandContent(
          context.content,
          context.targetFormat,
          context.tone
        );
        transformed = expanded.content;
        keyPoints = expanded.keyPoints;
        aiModel = expanded.model;
        tokensUsed = expanded.tokensUsed;
        break;

      case 'reformat':
        transformed = this.reformatContent(context.content, rule);
        keyPoints = this.extractKeyPoints(context.content);
        break;

      case 'split':
        const parts = this.splitContent(context.content, rule);
        transformed = parts.join('\n\n---\n\n');
        keyPoints = this.extractKeyPoints(context.content);
        break;

      default:
        throw new Error(`Unknown transformation strategy: ${rule.strategy}`);
    }

    const qualityScore = this.calculateQualityScore(
      context.content,
      transformed,
      keyPoints,
      rule
    );

    const warnings = this.validateTransformation(transformed, rule);

    return {
      content: transformed,
      metadata: {
        sourceFormat: context.sourceFormat,
        targetFormat: context.targetFormat,
        transformationType: rule.strategy,
        qualityScore,
        keyPointsPreserved: keyPoints,
        aiModel,
        tokensUsed,
        transformedAt: new Date(),
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get transformation rule for source → target conversion
   */
  private getTransformationRule(
    source: TransformationSource,
    target: TransformationTarget
  ): TransformationRule | null {
    const key = `${source}-${target}`;
    return TRANSFORMATION_RULES[key] || null;
  }

  /**
   * AI-powered summarization
   */
  private async summarizeContent(
    content: string,
    targetPlatform: TransformationTarget,
    charLimit: number,
    tone?: string
  ): Promise<{
    content: string;
    keyPoints: string[];
    model: string;
    tokensUsed: number;
  }> {
    const systemPrompt = `You are a content transformation expert. Summarize the given content for ${targetPlatform} while:
1. Staying within ${charLimit} characters
2. Preserving the main message and key points
3. Using a ${tone || 'professional'} tone
4. Making it engaging for the platform's audience
5. Removing markdown formatting unless specified`;

    const userPrompt = `Summarize this content for ${targetPlatform} (max ${charLimit} chars):\n\n${content}\n\nProvide:
1. The summarized content
2. A list of key points preserved (as JSON array)

Format as JSON:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...]
}`;

    try {
      let result;
      if (this.aiProvider === 'openai') {
        const openai = createOpenAIProvider();
        result = await openai.generate(systemPrompt, userPrompt);
      } else {
        const anthropic = createAnthropicProvider();
        result = await anthropic.generate(systemPrompt, userPrompt);
      }

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Parse JSON response
      const parsed = JSON.parse(result.content);

      return {
        content: parsed.summary,
        keyPoints: parsed.keyPoints || [],
        model: result.model,
        tokensUsed: result.tokensUsed.total,
      };
    } catch (error: any) {
      console.error('AI summarization failed:', error);
      // Fallback to simple truncation
      return {
        content: this.simpleSummarize(content, charLimit),
        keyPoints: this.extractKeyPoints(content),
        model: 'fallback',
        tokensUsed: 0,
      };
    }
  }

  /**
   * AI-powered content expansion
   */
  private async expandContent(
    content: string,
    targetPlatform: TransformationTarget,
    tone?: string
  ): Promise<{
    content: string;
    keyPoints: string[];
    model: string;
    tokensUsed: number;
  }> {
    const systemPrompt = `You are a content transformation expert. Expand the given content for ${targetPlatform} while:
1. Maintaining the core message
2. Adding relevant details and context
3. Using a ${tone || 'professional'} tone
4. Making it comprehensive for the platform's audience`;

    const userPrompt = `Expand this content for ${targetPlatform}:\n\n${content}\n\nProvide:
1. The expanded content
2. A list of key points added (as JSON array)

Format as JSON:
{
  "expanded": "...",
  "keyPoints": ["point1", "point2", ...]
}`;

    try {
      let result;
      if (this.aiProvider === 'openai') {
        const openai = createOpenAIProvider();
        result = await openai.generate(systemPrompt, userPrompt);
      } else {
        const anthropic = createAnthropicProvider();
        result = await anthropic.generate(systemPrompt, userPrompt);
      }

      if ('error' in result) {
        throw new Error(result.error);
      }

      const parsed = JSON.parse(result.content);

      return {
        content: parsed.expanded,
        keyPoints: parsed.keyPoints || [],
        model: result.model,
        tokensUsed: result.tokensUsed.total,
      };
    } catch (error: any) {
      console.error('AI expansion failed:', error);
      return {
        content: content,
        keyPoints: this.extractKeyPoints(content),
        model: 'fallback',
        tokensUsed: 0,
      };
    }
  }

  /**
   * Simple rule-based reformatting
   */
  private reformatContent(content: string, rule: TransformationRule): string {
    let reformatted = content;

    // Remove markdown if not preserved
    if (!rule.preserveMarkdown) {
      reformatted = this.stripMarkdown(reformatted);
    }

    // Apply character limit if specified
    if (rule.charLimit && reformatted.length > rule.charLimit) {
      reformatted = reformatted.substring(0, rule.charLimit - 3) + '...';
    }

    return reformatted.trim();
  }

  /**
   * Split content into multiple parts (e.g., Twitter threads)
   */
  private splitContent(content: string, rule: TransformationRule): string[] {
    if (!rule.splitIntoThread || !rule.charLimit) {
      return [content];
    }

    // Use platform limits splitting logic
    const platformKey = `${rule.to}` as keyof typeof PLATFORM_LIMITS;
    return splitForThreading(content, platformKey, {
      threadIndicator: true,
      preserveParagraphs: true,
    });
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string, maxPoints: number = 5): string[] {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

    // Simple extraction: take first few sentences as key points
    return sentences
      .slice(0, maxPoints)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 200);
  }

  /**
   * Simple truncation-based summarization (fallback)
   */
  private simpleSummarize(content: string, charLimit: number): string {
    if (content.length <= charLimit) {
      return content;
    }

    // Try to break at sentence boundary
    const truncated = content.substring(0, charLimit - 3);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');

    const breakPoint = Math.max(lastPeriod, lastQuestion, lastExclamation);

    if (breakPoint > charLimit * 0.7) {
      return truncated.substring(0, breakPoint + 1);
    }

    return truncated + '...';
  }

  /**
   * Strip markdown formatting
   */
  private stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links but keep text
      .replace(/`(.+?)`/g, '$1') // Remove code blocks
      .replace(/^>\s/gm, '') // Remove blockquotes
      .replace(/^-\s/gm, '') // Remove list markers
      .replace(/^\d+\.\s/gm, '') // Remove numbered lists
      .trim();
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(
    original: string,
    transformed: string,
    keyPoints: string[],
    rule: TransformationRule
  ): number {
    let score = 100;

    // Deduct if too short relative to original (for expansions)
    if (rule.strategy === 'expand' && transformed.length < original.length) {
      score -= 20;
    }

    // Deduct if too long (for summarizations)
    if (rule.strategy === 'summarize' && rule.charLimit) {
      if (transformed.length > rule.charLimit) {
        score -= 30;
      }
    }

    // Deduct if no key points extracted
    if (keyPoints.length === 0) {
      score -= 15;
    }

    // Deduct if content seems truncated badly
    if (transformed.endsWith('...') && rule.strategy !== 'summarize') {
      score -= 10;
    }

    // Bonus for good length ratio (summarizations)
    if (rule.strategy === 'summarize') {
      const ratio = transformed.length / original.length;
      if (ratio >= 0.2 && ratio <= 0.4) {
        score += 10; // Good compression ratio
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validate transformation meets requirements
   */
  private validateTransformation(
    content: string,
    rule: TransformationRule
  ): string[] {
    const warnings: string[] = [];

    // Check character limit
    if (rule.charLimit && content.length > rule.charLimit) {
      warnings.push(
        `Content exceeds ${rule.to} character limit (${content.length}/${rule.charLimit})`
      );
    }

    // Check if content is too short
    if (content.length < 50) {
      warnings.push('Transformed content may be too short to be meaningful');
    }

    // Check if markdown is present when it shouldn't be
    if (!rule.preserveMarkdown && /[#*`\[]/.test(content)) {
      warnings.push('Markdown formatting detected but not preserved for this platform');
    }

    return warnings;
  }
}

/**
 * Batch transform content to multiple platforms
 */
export async function transformToMultiplePlatforms(
  content: string,
  sourceFormat: TransformationSource,
  targetPlatforms: TransformationTarget[],
  options?: {
    tone?: 'professional' | 'casual' | 'technical' | 'friendly';
    aiProvider?: 'openai' | 'anthropic';
  }
): Promise<Record<TransformationTarget, TransformedContent>> {
  const engine = new ContentTransformationEngine(options?.aiProvider);
  const results: Record<string, TransformedContent> = {};

  for (const target of targetPlatforms) {
    try {
      const transformed = await engine.transform({
        content,
        sourceFormat,
        targetFormat: target,
        tone: options?.tone,
        aiProvider: options?.aiProvider,
      });
      results[target] = transformed;
    } catch (error: any) {
      console.error(`Transformation to ${target} failed:`, error);
      // Store error result
      results[target] = {
        content: '',
        metadata: {
          sourceFormat,
          targetFormat: target,
          transformationType: 'summarize',
          qualityScore: 0,
          keyPointsPreserved: [],
          transformedAt: new Date(),
        },
        warnings: [`Transformation failed: ${error.message}`],
      };
    }
  }

  return results as Record<TransformationTarget, TransformedContent>;
}
