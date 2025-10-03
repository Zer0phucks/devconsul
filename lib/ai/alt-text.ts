/**
 * Alt Text Generation using OpenAI Vision API
 * Generates accessible alt text descriptions for images
 */

import OpenAI from 'openai';

export interface AltTextConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  detailLevel?: 'low' | 'high' | 'auto';
}

export interface AltTextOptions {
  imageUrl?: string;
  imageBase64?: string;
  context?: string; // Additional context about the image
  purpose?: 'accessibility' | 'seo' | 'both';
  maxLength?: number; // Maximum character count
  includeColors?: boolean;
  includeText?: boolean; // Include text found in image
  detailLevel?: 'low' | 'high' | 'auto';
}

export interface AltTextResult {
  altText: string;
  description: string;
  detectedText?: string;
  tags?: string[];
  confidence: number;
  cost: number;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AltTextError {
  error: string;
  code?: string;
  retryable: boolean;
}

// Vision API pricing (GPT-4 Vision)
const VISION_COSTS = {
  prompt: 0.01, // per 1K tokens
  completion: 0.03, // per 1K tokens
};

export class AltTextGenerator {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private detailLevel: 'low' | 'high' | 'auto';

  constructor(config: AltTextConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model || 'gpt-4-vision-preview';
    this.maxTokens = config.maxTokens || 300;
    this.detailLevel = config.detailLevel || 'auto';
  }

  /**
   * Generate alt text for an image
   */
  async generate(
    options: AltTextOptions
  ): Promise<AltTextResult | AltTextError> {
    try {
      if (!options.imageUrl && !options.imageBase64) {
        return {
          error: 'Either imageUrl or imageBase64 must be provided',
          code: 'MISSING_IMAGE',
          retryable: false,
        };
      }

      const prompt = this.buildPrompt(options);
      const imageContent = this.prepareImageContent(options);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              imageContent,
            ],
          },
        ],
        max_tokens: this.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          error: 'No content generated',
          retryable: true,
        };
      }

      // Parse the response
      const parsed = this.parseResponse(content, options);

      const tokensUsed = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      };

      const cost = this.calculateCost(tokensUsed);

      return {
        ...parsed,
        cost,
        tokensUsed,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Generate alt text for multiple images (batch processing)
   */
  async generateBatch(
    images: Array<{ url?: string; base64?: string; context?: string }>,
    options?: Omit<AltTextOptions, 'imageUrl' | 'imageBase64' | 'context'>
  ): Promise<Array<AltTextResult | AltTextError>> {
    const results: Array<AltTextResult | AltTextError> = [];

    for (const image of images) {
      const result = await this.generate({
        ...options,
        imageUrl: image.url,
        imageBase64: image.base64,
        context: image.context,
      });
      results.push(result);

      // Add delay to avoid rate limits
      if (images.indexOf(image) < images.length - 1) {
        await this.delay(500); // 0.5 second delay
      }
    }

    return results;
  }

  /**
   * Analyze image for content insights
   */
  async analyzeImage(
    imageUrl: string
  ): Promise<
    | {
        description: string;
        objects: string[];
        colors: string[];
        mood: string;
        accessibility: {
          hasText: boolean;
          textContent?: string;
          colorContrast?: string;
        };
      }
    | AltTextError
  > {
    try {
      const prompt = `Analyze this image in detail. Provide:
1. A comprehensive description
2. List of main objects/subjects (as JSON array)
3. Dominant colors (as JSON array)
4. Overall mood/emotion
5. Accessibility info:
   - Does it contain text? (true/false)
   - If yes, what text? (string)
   - Color contrast assessment (good/poor)

Format your response as JSON with keys: description, objects, colors, mood, accessibility`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          error: 'No analysis generated',
          retryable: true,
        };
      }

      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // If JSON parsing fails, return as error
      }

      return {
        error: 'Failed to parse analysis response',
        retryable: false,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Build prompt based on options
   */
  private buildPrompt(options: AltTextOptions): string {
    const parts: string[] = [];

    // Base instruction
    if (options.purpose === 'accessibility') {
      parts.push(
        'Generate a concise, descriptive alt text for this image that helps visually impaired users understand the content.'
      );
    } else if (options.purpose === 'seo') {
      parts.push(
        'Generate SEO-optimized alt text for this image that describes the content clearly and includes relevant keywords.'
      );
    } else {
      parts.push(
        'Generate alt text for this image that is both accessible for screen readers and optimized for SEO.'
      );
    }

    // Add context
    if (options.context) {
      parts.push(`Context: ${options.context}`);
    }

    // Add specific requirements
    const requirements: string[] = [];

    if (options.maxLength) {
      requirements.push(
        `keep it under ${options.maxLength} characters`
      );
    }

    if (options.includeColors) {
      requirements.push('mention dominant colors');
    }

    if (options.includeText) {
      requirements.push('include any text visible in the image');
    }

    if (requirements.length > 0) {
      parts.push(`Requirements: ${requirements.join(', ')}.`);
    }

    // Output format
    parts.push(
      '\n\nProvide your response in this format:\nALT: [concise alt text]\nDESC: [detailed description]\nTAGS: [comma-separated relevant tags]\nTEXT: [any text found in image, or "none"]'
    );

    return parts.join(' ');
  }

  /**
   * Prepare image content for Vision API
   */
  private prepareImageContent(options: AltTextOptions): any {
    const detailLevel = options.detailLevel || this.detailLevel;

    if (options.imageUrl) {
      return {
        type: 'image_url',
        image_url: {
          url: options.imageUrl,
          detail: detailLevel,
        },
      };
    }

    if (options.imageBase64) {
      const base64Data = options.imageBase64.startsWith('data:')
        ? options.imageBase64
        : `data:image/jpeg;base64,${options.imageBase64}`;

      return {
        type: 'image_url',
        image_url: {
          url: base64Data,
          detail: detailLevel,
        },
      };
    }

    throw new Error('No image provided');
  }

  /**
   * Parse Vision API response
   */
  private parseResponse(
    content: string,
    options: AltTextOptions
  ): Omit<AltTextResult, 'cost' | 'tokensUsed'> {
    const lines = content.split('\n');
    let altText = '';
    let description = '';
    let detectedText: string | undefined;
    let tags: string[] = [];

    for (const line of lines) {
      if (line.startsWith('ALT:')) {
        altText = line.replace('ALT:', '').trim();
      } else if (line.startsWith('DESC:')) {
        description = line.replace('DESC:', '').trim();
      } else if (line.startsWith('TAGS:')) {
        const tagString = line.replace('TAGS:', '').trim();
        tags = tagString.split(',').map((t) => t.trim());
      } else if (line.startsWith('TEXT:')) {
        const text = line.replace('TEXT:', '').trim();
        if (text.toLowerCase() !== 'none') {
          detectedText = text;
        }
      }
    }

    // Fallback: use entire content if parsing fails
    if (!altText) {
      altText = content.slice(0, options.maxLength || 125);
      description = content;
    }

    // Apply max length constraint
    if (options.maxLength && altText.length > options.maxLength) {
      altText = altText.slice(0, options.maxLength - 3) + '...';
    }

    // Calculate confidence based on response quality
    const confidence = this.calculateConfidence(altText, description, tags);

    return {
      altText,
      description,
      detectedText,
      tags: tags.length > 0 ? tags : undefined,
      confidence,
    };
  }

  /**
   * Calculate confidence score for generated alt text
   */
  private calculateConfidence(
    altText: string,
    description: string,
    tags: string[]
  ): number {
    let score = 0.5; // Base score

    // Length check (alt text should be descriptive but concise)
    if (altText.length >= 10 && altText.length <= 125) {
      score += 0.2;
    }

    // Description quality
    if (description.length > altText.length) {
      score += 0.1;
    }

    // Tags provided
    if (tags.length > 0) {
      score += 0.1;
    }

    // No placeholders or errors
    if (
      !altText.includes('[') &&
      !altText.includes('Error') &&
      !altText.includes('Unable')
    ) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: {
    prompt: number;
    completion: number;
  }): number {
    const promptCost = (tokens.prompt / 1000) * VISION_COSTS.prompt;
    const completionCost =
      (tokens.completion / 1000) * VISION_COSTS.completion;
    return Number((promptCost + completionCost).toFixed(6));
  }

  /**
   * Handle errors
   */
  private handleError(error: any): AltTextError {
    const errorMessage = error.message || 'Unknown error';
    const errorCode = error.code || error.type;

    // Rate limit errors
    if (errorCode === 'rate_limit_exceeded' || error.status === 429) {
      return {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryable: true,
      };
    }

    // Invalid API key
    if (errorCode === 'invalid_api_key' || error.status === 401) {
      return {
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
      };
    }

    // Image errors
    if (errorCode === 'invalid_image_url') {
      return {
        error: 'Invalid or inaccessible image URL',
        code: 'INVALID_IMAGE',
        retryable: false,
      };
    }

    // Server errors
    if (error.status >= 500) {
      return {
        error: 'OpenAI server error',
        code: 'SERVER_ERROR',
        retryable: true,
      };
    }

    // Generic error
    return {
      error: errorMessage,
      code: errorCode,
      retryable: false,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use a simple test image (1x1 pixel data URL)
      const testImage =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await this.generate({
        imageBase64: testImage,
        purpose: 'accessibility',
        maxLength: 50,
      });

      return 'altText' in result;
    } catch {
      return false;
    }
  }
}

/**
 * Create alt text generator instance
 */
export function createAltTextGenerator(
  config?: AltTextConfig
): AltTextGenerator {
  return new AltTextGenerator(config);
}

/**
 * Quick helper to generate alt text
 */
export async function generateAltText(
  imageUrl: string,
  options?: Omit<AltTextOptions, 'imageUrl'>
): Promise<AltTextResult | AltTextError> {
  const generator = createAltTextGenerator();
  return generator.generate({ imageUrl, ...options });
}

/**
 * Generate alt text with context
 */
export async function generateAltTextWithContext(
  imageUrl: string,
  context: {
    title?: string;
    description?: string;
    tags?: string[];
  }
): Promise<AltTextResult | AltTextError> {
  const generator = createAltTextGenerator();

  const contextString = [
    context.title && `Title: ${context.title}`,
    context.description && `Description: ${context.description}`,
    context.tags &&
      context.tags.length > 0 &&
      `Related to: ${context.tags.join(', ')}`,
  ]
    .filter(Boolean)
    .join('. ');

  return generator.generate({
    imageUrl,
    context: contextString,
    purpose: 'both',
    maxLength: 125,
    includeText: true,
  });
}
