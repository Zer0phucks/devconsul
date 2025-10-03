/**
 * DALL-E 3 Image Generation Module
 * Handles AI-powered image generation using OpenAI's DALL-E 3 API
 */

import OpenAI from 'openai';

export interface ImageGenerationConfig {
  apiKey?: string;
  model?: 'dall-e-3' | 'dall-e-2';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  size?: '1024x1024' | '1792x1024' | '1024x1792' | '256x256' | '512x512';
}

export interface ImageGenerationOptions {
  prompt: string;
  model?: 'dall-e-3' | 'dall-e-2';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  size?: '1024x1024' | '1792x1024' | '1024x1792' | '256x256' | '512x512';
  n?: number; // Number of images (DALL-E 2 only, max 10)
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string; // DALL-E 3 automatically revises prompts
  b64Json?: string; // Base64 encoded image
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  model: string;
  prompt: string;
  revisedPrompt?: string;
  cost: number;
  createdAt: number;
}

export interface ImageGenerationError {
  error: string;
  code?: string;
  retryable: boolean;
  details?: any;
}

// DALL-E 3 Pricing (as of 2024)
// Standard: $0.040 per image
// HD: $0.080 per image
const DALLE3_COSTS = {
  standard: {
    '1024x1024': 0.040,
    '1792x1024': 0.080,
    '1024x1792': 0.080,
  },
  hd: {
    '1024x1024': 0.080,
    '1792x1024': 0.120,
    '1024x1792': 0.120,
  },
};

// DALL-E 2 Pricing
const DALLE2_COSTS = {
  '256x256': 0.016,
  '512x512': 0.018,
  '1024x1024': 0.020,
};

export class DALLEImageGenerator {
  private client: OpenAI;
  private model: 'dall-e-3' | 'dall-e-2';
  private quality: 'standard' | 'hd';
  private style: 'vivid' | 'natural';
  private size: '1024x1024' | '1792x1024' | '1024x1792';

  constructor(config: ImageGenerationConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model || 'dall-e-3';
    this.quality = config.quality || 'standard';
    this.style = config.style || 'vivid';
    this.size = config.size || '1024x1024';
  }

  /**
   * Generate images using DALL-E
   */
  async generate(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult | ImageGenerationError> {
    try {
      const model = options.model || this.model;
      const quality = options.quality || this.quality;
      const style = options.style || this.style;
      const size = options.size || this.size;
      const n = options.n || 1;

      // Validate options
      const validation = this.validateOptions(model, quality, style, size, n);
      if (validation) {
        return validation;
      }

      // Generate images
      const response = await this.client.images.generate({
        model,
        prompt: options.prompt,
        n: model === 'dall-e-3' ? 1 : n, // DALL-E 3 only supports n=1
        quality: model === 'dall-e-3' ? quality : undefined,
        style: model === 'dall-e-3' ? style : undefined,
        size: size as any,
        response_format: 'url',
      });

      if (!response.data || response.data.length === 0) {
        return {
          error: 'No images generated',
          retryable: true,
        };
      }

      const images: GeneratedImage[] = response.data.map((img) => ({
        url: img.url!,
        revisedPrompt: img.revised_prompt,
      }));

      const cost = this.calculateCost(model, quality, size, n);

      return {
        images,
        model,
        prompt: options.prompt,
        revisedPrompt: response.data[0]?.revised_prompt,
        cost,
        createdAt: response.created,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Generate multiple images with different prompts (batch generation)
   */
  async generateBatch(
    prompts: string[],
    options?: Omit<ImageGenerationOptions, 'prompt'>
  ): Promise<Array<ImageGenerationResult | ImageGenerationError>> {
    const results: Array<ImageGenerationResult | ImageGenerationError> = [];

    for (const prompt of prompts) {
      const result = await this.generate({
        ...options,
        prompt,
      });
      results.push(result);

      // Add delay to avoid rate limits
      if (prompts.indexOf(prompt) < prompts.length - 1) {
        await this.delay(1000); // 1 second delay between requests
      }
    }

    return results;
  }

  /**
   * Generate image variations (DALL-E 2 only)
   * Creates variations of an existing image
   */
  async createVariation(
    imageFile: File | Blob,
    options?: {
      n?: number;
      size?: '256x256' | '512x512' | '1024x1024';
    }
  ): Promise<ImageGenerationResult | ImageGenerationError> {
    try {
      const n = options?.n || 1;
      const size = options?.size || '1024x1024';

      if (n > 10) {
        return {
          error: 'Maximum 10 variations allowed',
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }

      const response = await this.client.images.createVariation({
        image: imageFile,
        n,
        size,
        response_format: 'url',
      });

      if (!response.data || response.data.length === 0) {
        return {
          error: 'No variations generated',
          retryable: true,
        };
      }

      const images: GeneratedImage[] = response.data.map((img) => ({
        url: img.url!,
      }));

      const cost = DALLE2_COSTS[size] * n;

      return {
        images,
        model: 'dall-e-2',
        prompt: 'Variation generation',
        cost,
        createdAt: response.created,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Enhance prompt for better image generation
   * Adds context and style guidelines
   */
  enhancePrompt(
    basePrompt: string,
    options?: {
      contentType?: string;
      platform?: string;
      style?: string;
      additionalContext?: string;
    }
  ): string {
    const parts: string[] = [basePrompt];

    // Add content type context
    if (options?.contentType) {
      const typeContext = {
        blog: 'professional blog header image',
        social: 'engaging social media graphic',
        email: 'clean email newsletter header',
        featured: 'eye-catching featured image',
      }[options.contentType];

      if (typeContext) {
        parts.push(`suitable for ${typeContext}`);
      }
    }

    // Add platform-specific requirements
    if (options?.platform) {
      const platformContext = {
        twitter: 'optimized for Twitter feed, 16:9 aspect ratio',
        linkedin: 'professional LinkedIn post image',
        facebook: 'Facebook-friendly visuals',
        instagram: 'Instagram-style aesthetic',
      }[options.platform];

      if (platformContext) {
        parts.push(platformContext);
      }
    }

    // Add style guidance
    if (options?.style) {
      parts.push(`${options.style} style`);
    }

    // Add additional context
    if (options?.additionalContext) {
      parts.push(options.additionalContext);
    }

    return parts.join(', ');
  }

  /**
   * Generate platform-specific image prompt
   */
  generatePlatformPrompt(
    content: {
      title: string;
      excerpt?: string;
      tags?: string[];
    },
    platform: string
  ): string {
    const { title, excerpt, tags } = content;

    let prompt = `Create a professional image for: ${title}`;

    if (excerpt) {
      prompt += `. Context: ${excerpt.slice(0, 200)}`;
    }

    if (tags && tags.length > 0) {
      prompt += `. Related to: ${tags.slice(0, 3).join(', ')}`;
    }

    // Platform-specific enhancements
    const platformEnhancements = {
      twitter: 'vibrant, attention-grabbing, suitable for tech audience',
      linkedin: 'professional, corporate, business-appropriate',
      facebook: 'warm, engaging, community-friendly',
      blog: 'clean, modern, technical blog aesthetic',
      email: 'simple, clear, professional newsletter header',
    };

    const enhancement = platformEnhancements[platform as keyof typeof platformEnhancements];
    if (enhancement) {
      prompt += `. Style: ${enhancement}`;
    }

    return prompt;
  }

  /**
   * Validate generation options
   */
  private validateOptions(
    model: string,
    quality: string,
    style: string,
    size: string,
    n: number
  ): ImageGenerationError | null {
    // DALL-E 3 validations
    if (model === 'dall-e-3') {
      if (n !== 1) {
        return {
          error: 'DALL-E 3 only supports generating 1 image at a time',
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }

      if (!['1024x1024', '1792x1024', '1024x1792'].includes(size)) {
        return {
          error: `Invalid size for DALL-E 3: ${size}`,
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }

      if (!['standard', 'hd'].includes(quality)) {
        return {
          error: `Invalid quality for DALL-E 3: ${quality}`,
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }

      if (!['vivid', 'natural'].includes(style)) {
        return {
          error: `Invalid style for DALL-E 3: ${style}`,
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }
    }

    // DALL-E 2 validations
    if (model === 'dall-e-2') {
      if (n > 10) {
        return {
          error: 'DALL-E 2 supports maximum 10 images per request',
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }

      if (!['256x256', '512x512', '1024x1024'].includes(size)) {
        return {
          error: `Invalid size for DALL-E 2: ${size}`,
          code: 'INVALID_PARAMETER',
          retryable: false,
        };
      }
    }

    return null;
  }

  /**
   * Calculate generation cost
   */
  private calculateCost(
    model: string,
    quality: string,
    size: string,
    n: number
  ): number {
    if (model === 'dall-e-3') {
      const costs = DALLE3_COSTS[quality as keyof typeof DALLE3_COSTS];
      return costs?.[size as keyof typeof costs] || 0.040;
    }

    if (model === 'dall-e-2') {
      const cost = DALLE2_COSTS[size as keyof typeof DALLE2_COSTS] || 0.020;
      return cost * n;
    }

    return 0;
  }

  /**
   * Handle OpenAI API errors
   */
  private handleError(error: any): ImageGenerationError {
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || error.type;

    // Rate limit errors
    if (errorCode === 'rate_limit_exceeded' || error.status === 429) {
      return {
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT',
        retryable: true,
        details: error,
      };
    }

    // Invalid API key
    if (errorCode === 'invalid_api_key' || error.status === 401) {
      return {
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
        details: error,
      };
    }

    // Content policy violation
    if (errorCode === 'content_policy_violation') {
      return {
        error: 'Content policy violation. Please modify your prompt.',
        code: 'CONTENT_POLICY',
        retryable: false,
        details: error,
      };
    }

    // Server errors
    if (error.status >= 500) {
      return {
        error: 'OpenAI server error. Please try again.',
        code: 'SERVER_ERROR',
        retryable: true,
        details: error,
      };
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        error: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
        details: error,
      };
    }

    // Generic error
    return {
      error: errorMessage,
      code: errorCode || 'UNKNOWN_ERROR',
      retryable: false,
      details: error,
    };
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generate({
        prompt: 'A simple test image',
        size: '256x256',
        model: 'dall-e-2',
      });
      return 'images' in result && result.images.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Create DALL-E image generator instance
 */
export function createImageGenerator(
  config?: ImageGenerationConfig
): DALLEImageGenerator {
  return new DALLEImageGenerator(config);
}

/**
 * Quick helper to generate a single image
 */
export async function generateImage(
  prompt: string,
  options?: Omit<ImageGenerationOptions, 'prompt'>
): Promise<ImageGenerationResult | ImageGenerationError> {
  const generator = createImageGenerator();
  return generator.generate({ prompt, ...options });
}

/**
 * Generate featured image from content
 */
export async function generateFeaturedImage(content: {
  title: string;
  excerpt?: string;
  tags?: string[];
}): Promise<ImageGenerationResult | ImageGenerationError> {
  const generator = createImageGenerator();

  const prompt = generator.generatePlatformPrompt(content, 'blog');

  return generator.generate({
    prompt,
    quality: 'hd',
    size: '1792x1024',
  });
}

/**
 * Generate social media card image
 */
export async function generateSocialCard(
  content: {
    title: string;
    excerpt?: string;
    tags?: string[];
  },
  platform: 'twitter' | 'linkedin' | 'facebook'
): Promise<ImageGenerationResult | ImageGenerationError> {
  const generator = createImageGenerator();

  const prompt = generator.generatePlatformPrompt(content, platform);

  // Platform-specific sizes
  const sizes = {
    twitter: '1792x1024', // 16:9
    linkedin: '1792x1024', // ~1.91:1
    facebook: '1792x1024', // ~1.91:1
  } as const;

  return generator.generate({
    prompt,
    quality: 'standard',
    size: sizes[platform],
  });
}
