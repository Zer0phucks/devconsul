/**
 * OpenAI Provider Wrapper
 * Handles OpenAI API integration with error handling and token tracking
 */

import OpenAI from 'openai';

export interface OpenAIConfig {
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

// Token costs per 1K tokens (as of 2024)
const TOKEN_COSTS: Record<string, { prompt: number; completion: number }> = {
  'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
};

export class OpenAIProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'gpt-3.5-turbo';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Generate content using OpenAI
   */
  async generate(
    systemPrompt: string,
    userPrompt: string,
    options?: Partial<OpenAIConfig>
  ): Promise<GenerationResult | GenerationError> {
    try {
      const model = options?.model || this.model;
      const maxTokens = options?.maxTokens || this.maxTokens;
      const temperature = options?.temperature || this.temperature;

      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        return {
          error: 'No content generated',
          retryable: true,
        };
      }

      const tokensUsed = {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      };

      const cost = this.calculateCost(model, tokensUsed);

      return {
        content: choice.message.content,
        model,
        tokensUsed,
        cost,
        finishReason: choice.finish_reason || 'stop',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(
    model: string,
    tokens: { prompt: number; completion: number }
  ): number {
    const costs = TOKEN_COSTS[model] || TOKEN_COSTS['gpt-3.5-turbo'];
    const promptCost = (tokens.prompt / 1000) * costs.prompt;
    const completionCost = (tokens.completion / 1000) * costs.completion;
    return Number((promptCost + completionCost).toFixed(6));
  }

  /**
   * Handle OpenAI API errors
   */
  private handleError(error: any): GenerationError {
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

    // Server errors
    if (error.status >= 500) {
      return {
        error: 'OpenAI server error',
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
      code: errorCode,
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
 * Create OpenAI provider instance
 */
export function createOpenAIProvider(config?: Partial<OpenAIConfig>): OpenAIProvider {
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAIProvider({
    apiKey,
    ...config,
  });
}
