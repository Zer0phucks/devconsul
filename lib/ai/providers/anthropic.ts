/**
 * Anthropic Claude Provider Wrapper
 * Handles Anthropic API integration with error handling and token tracking
 */

import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResult {
  content: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  finishReason: string;
}

export interface GenerationError {
  error: string;
  code?: string;
  retryable: boolean;
}

// Token costs per 1M tokens (as of 2024)
const TOKEN_COSTS: Record<string, { prompt: number; completion: number }> = {
  'claude-3-opus-20240229': { prompt: 15.0, completion: 75.0 },
  'claude-3-sonnet-20240229': { prompt: 3.0, completion: 15.0 },
  'claude-3-haiku-20240307': { prompt: 0.25, completion: 1.25 },
};

export class AnthropicProvider {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Generate content using Anthropic Claude
   */
  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: Partial<AnthropicConfig>
  ): Promise<GenerationResult | GenerationError> {
    try {
      const model = options?.model || this.model;
      const maxTokens = options?.maxTokens || this.maxTokens;
      const temperature = options?.temperature || this.temperature;

      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text content
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return {
          error: 'No text content generated',
          retryable: true,
        };
      }

      const tokensUsed = {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      };

      const cost = this.calculateCost(model, tokensUsed);

      return {
        content: textContent.text,
        model,
        tokensUsed,
        cost,
        finishReason: response.stop_reason || 'end_turn',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Calculate cost based on token usage (per million tokens)
   */
  private calculateCost(
    model: string,
    tokens: { prompt: number; completion: number }
  ): number {
    const costs = TOKEN_COSTS[model] || TOKEN_COSTS['claude-3-sonnet-20240229'];
    const promptCost = (tokens.prompt / 1_000_000) * costs.prompt;
    const completionCost = (tokens.completion / 1_000_000) * costs.completion;
    return Number((promptCost + completionCost).toFixed(6));
  }

  /**
   * Handle Anthropic API errors
   */
  private handleError(error: any): GenerationError {
    const errorMessage = error.message || 'Unknown error';
    const errorType = error.type || error.error?.type;

    // Rate limit errors
    if (errorType === 'rate_limit_error' || error.status === 429) {
      return {
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryable: true,
      };
    }

    // Invalid API key
    if (errorType === 'authentication_error' || error.status === 401) {
      return {
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
      };
    }

    // Overloaded errors
    if (errorType === 'overloaded_error' || error.status === 529) {
      return {
        error: 'Anthropic service overloaded',
        code: 'OVERLOADED',
        retryable: true,
      };
    }

    // Server errors
    if (error.status >= 500 && error.status < 600) {
      return {
        error: 'Anthropic server error',
        code: 'SERVER_ERROR',
        retryable: true,
      };
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        error: 'Network error',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }

    // Generic error
    return {
      error: errorMessage,
      code: errorType,
      retryable: false,
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generate(
        'You are a helpful assistant.',
        'Say "OK" if you can read this.',
        { maxTokens: 10 }
      );
      return 'content' in result;
    } catch {
      return false;
    }
  }
}

/**
 * Create Anthropic provider instance
 */
export function createAnthropicProvider(
  config?: Partial<AnthropicConfig>
): AnthropicProvider {
  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  return new AnthropicProvider({
    apiKey,
    ...config,
  });
}
