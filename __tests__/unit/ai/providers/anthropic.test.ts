/**
 * Unit tests for Anthropic Provider
 */

// Mock Anthropic SDK before importing
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

import {
  AnthropicProvider,
  createAnthropicProvider,
} from '@/lib/ai/providers/anthropic';
import type {
  GenerationResult,
  GenerationError,
} from '@/lib/ai/providers/anthropic';
import Anthropic from '@anthropic-ai/sdk';

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock client
    mockClient = {
      messages: {
        create: jest.fn(),
      },
    };

    // Reset the mock implementation
    (Anthropic as any).mockImplementation(() => mockClient);

    provider = new AnthropicProvider({
      apiKey: 'test-api-key',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 2000,
      temperature: 0.7,
    });
  });

  describe('generate()', () => {
    it('should generate content successfully with Claude', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Generated content from Claude',
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
        stop_reason: 'end_turn',
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generate(
        'You are a helpful assistant',
        'Write a blog post'
      );

      expect(result).toMatchObject({
        content: 'Generated content from Claude',
        model: 'claude-3-sonnet-20240229',
        tokensUsed: {
          prompt: 100,
          completion: 50,
          total: 150,
        },
        finishReason: 'end_turn',
      });

      expect((result as GenerationResult).cost).toBeGreaterThan(0);
      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        system: 'You are a helpful assistant',
        messages: [
          {
            role: 'user',
            content: 'Write a blog post',
          },
        ],
      });
    });

    it('should calculate cost correctly for Claude Sonnet', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Content' }],
        usage: {
          input_tokens: 1_000_000,
          output_tokens: 500_000,
        },
        stop_reason: 'end_turn',
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generate('System', 'Prompt');
      // Cost: (1M / 1M) * $3 + (500K / 1M) * $15 = $3 + $7.5 = $10.5
      const expectedCost = 1 * 3.0 + 0.5 * 15.0;

      expect((result as GenerationResult).cost).toBe(
        Number(expectedCost.toFixed(6))
      );
    });

    it('should calculate cost correctly for Claude Opus', async () => {
      provider = new AnthropicProvider({
        apiKey: 'test-api-key',
        model: 'claude-3-opus-20240229',
      });

      const mockResponse = {
        content: [{ type: 'text', text: 'Content' }],
        usage: {
          input_tokens: 1_000_000,
          output_tokens: 500_000,
        },
        stop_reason: 'end_turn',
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generate('System', 'Prompt');
      // Cost: (1M / 1M) * $15 + (500K / 1M) * $75 = $15 + $37.5 = $52.5
      const expectedCost = 1 * 15.0 + 0.5 * 75.0;

      expect((result as GenerationResult).cost).toBe(
        Number(expectedCost.toFixed(6))
      );
    });

    it('should calculate cost correctly for Claude Haiku', async () => {
      provider = new AnthropicProvider({
        apiKey: 'test-api-key',
        model: 'claude-3-haiku-20240307',
      });

      const mockResponse = {
        content: [{ type: 'text', text: 'Content' }],
        usage: {
          input_tokens: 1_000_000,
          output_tokens: 500_000,
        },
        stop_reason: 'end_turn',
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.generate('System', 'Prompt');
      // Cost: (1M / 1M) * $0.25 + (500K / 1M) * $1.25 = $0.25 + $0.625 = $0.875
      const expectedCost = 1 * 0.25 + 0.5 * 1.25;

      expect((result as GenerationResult).cost).toBe(
        Number(expectedCost.toFixed(6))
      );
    });

    it('should handle model override in options', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Content' }],
        usage: { input_tokens: 10, output_tokens: 10 },
        stop_reason: 'end_turn',
      });

      await provider.generate('System', 'Prompt', {
        model: 'claude-3-haiku-20240307',
        temperature: 0.9,
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-haiku-20240307',
          temperature: 0.9,
        })
      );
    });

    it('should handle non-text content response', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'image',
            source: { type: 'base64', data: 'image-data' },
          },
        ],
        usage: { input_tokens: 10, output_tokens: 0 },
        stop_reason: 'end_turn',
      });

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'No text content generated',
        retryable: true,
      });
    });

    it('should handle empty content array', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [],
        usage: { input_tokens: 10, output_tokens: 0 },
        stop_reason: 'end_turn',
      });

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'No text content generated',
        retryable: true,
      });
    });

    it('should use default finish reason when not provided', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Content' }],
        usage: { input_tokens: 10, output_tokens: 10 },
      });

      const result = await provider.generate('System', 'Prompt');

      expect((result as GenerationResult).finishReason).toBe('end_turn');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors (429)', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });

    it('should handle rate limit errors (by type)', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).type = 'rate_limit_error';
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });

    it('should handle authentication errors (401)', async () => {
      const error = new Error('Invalid API key');
      (error as any).status = 401;
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
      });
    });

    it('should handle authentication errors (by type)', async () => {
      const error = new Error('Invalid API key');
      (error as any).type = 'authentication_error';
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
      });
    });

    it('should handle overloaded errors (529)', async () => {
      const error = new Error('Service overloaded');
      (error as any).status = 529;
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Anthropic service overloaded',
        code: 'OVERLOADED',
        retryable: true,
      });
    });

    it('should handle overloaded errors (by type)', async () => {
      const error = new Error('Service overloaded');
      (error as any).type = 'overloaded_error';
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Anthropic service overloaded',
        code: 'OVERLOADED',
        retryable: true,
      });
    });

    it('should handle server errors (5xx)', async () => {
      const error = new Error('Server error');
      (error as any).status = 500;
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Anthropic server error',
        code: 'SERVER_ERROR',
        retryable: true,
      });
    });

    it('should handle network errors (ENOTFOUND)', async () => {
      const error = new Error('Network error');
      (error as any).code = 'ENOTFOUND';
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Network error',
        code: 'NETWORK_ERROR',
        retryable: true,
      });
    });

    it('should handle generic errors', async () => {
      const error = new Error('Unknown error');
      (error as any).error = { type: 'unknown_error' };
      mockClient.messages.create.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Unknown error',
        code: 'unknown_error',
        retryable: false,
      });
    });
  });

  describe('testConnection()', () => {
    it('should return true for successful connection', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: { input_tokens: 5, output_tokens: 1 },
        stop_reason: 'end_turn',
      });

      const result = await provider.testConnection();

      expect(result).toBe(true);
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a helpful assistant.',
          messages: [
            { role: 'user', content: 'Say "OK" if you can read this.' },
          ],
          max_tokens: 10,
        })
      );
    });

    it('should return false for failed connection', async () => {
      mockClient.messages.create.mockRejectedValue(
        new Error('Connection failed')
      );

      const result = await provider.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('createAnthropicProvider()', () => {
    beforeEach(() => {
      delete process.env.ANTHROPIC_API_KEY;
    });

    it('should throw error when API key is not configured', () => {
      expect(() => createAnthropicProvider()).toThrow(
        'Anthropic API key not configured'
      );
    });

    it('should create provider with env API key', () => {
      process.env.ANTHROPIC_API_KEY = 'env-api-key';

      const provider = createAnthropicProvider();

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(MockedAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'env-api-key',
        })
      );
    });

    it('should create provider with custom config', () => {
      const provider = createAnthropicProvider({
        apiKey: 'custom-api-key',
        model: 'claude-3-opus-20240229',
        temperature: 0.5,
        maxTokens: 1000,
      });

      expect(provider).toBeInstanceOf(AnthropicProvider);
      expect(MockedAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'custom-api-key',
        })
      );
    });

    it('should prefer custom API key over env variable', () => {
      process.env.ANTHROPIC_API_KEY = 'env-api-key';

      createAnthropicProvider({ apiKey: 'custom-api-key' });

      expect(MockedAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'custom-api-key',
        })
      );
    });
  });
});
