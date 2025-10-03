/**
 * Unit tests for OpenAI Provider
 */

import { OpenAIProvider, createOpenAIProvider } from '@/lib/ai/providers/openai';
import type { GenerationResult, GenerationError } from '@/lib/ai/providers/openai';

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn((model) => `openai:${model}`),
}));

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;
const mockOpenAI = openai as jest.MockedFunction<typeof openai>;

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider({
      apiKey: 'test-api-key',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
    });
  });

  describe('generate()', () => {
    it('should generate content successfully with GPT-4', async () => {
      const mockResponse = {
        text: 'Generated content',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        finishReason: 'stop',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await provider.generate(
        'You are a helpful assistant',
        'Write a blog post'
      );

      expect(result).toMatchObject({
        content: 'Generated content',
        model: 'gpt-4',
        tokensUsed: {
          prompt: 100,
          completion: 50,
          total: 150,
        },
        finishReason: 'stop',
      });

      expect((result as GenerationResult).cost).toBeGreaterThan(0);
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'openai:gpt-4',
        system: 'You are a helpful assistant',
        prompt: 'Write a blog post',
        maxTokens: 2000,
        temperature: 0.7,
      });
    });

    it('should calculate cost correctly for GPT-4', async () => {
      const mockResponse = {
        text: 'Generated content',
        usage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
        finishReason: 'stop',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await provider.generate('System', 'User prompt');
      const expectedCost = (1000 / 1000) * 0.03 + (500 / 1000) * 0.06;

      expect((result as GenerationResult).cost).toBe(
        Number(expectedCost.toFixed(6))
      );
    });

    it('should calculate cost correctly for GPT-3.5-turbo', async () => {
      provider = new OpenAIProvider({
        apiKey: 'test-api-key',
        model: 'gpt-3.5-turbo',
      });

      const mockResponse = {
        text: 'Generated content',
        usage: {
          promptTokens: 1000,
          completionTokens: 500,
          totalTokens: 1500,
        },
        finishReason: 'stop',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await provider.generate('System', 'User prompt');
      const expectedCost = (1000 / 1000) * 0.0005 + (500 / 1000) * 0.0015;

      expect((result as GenerationResult).cost).toBe(
        Number(expectedCost.toFixed(6))
      );
    });

    it('should handle model override in options', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Content',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        finishReason: 'stop',
      });

      await provider.generate('System', 'Prompt', {
        model: 'gpt-3.5-turbo',
        temperature: 0.9,
      });

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai:gpt-3.5-turbo',
          temperature: 0.9,
        })
      );
    });

    it('should handle empty content response', async () => {
      mockGenerateText.mockResolvedValue({
        text: '',
        usage: { promptTokens: 10, completionTokens: 0, totalTokens: 10 },
        finishReason: 'stop',
      });

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'No content generated',
        retryable: true,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors (429)', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      mockGenerateText.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT',
        retryable: true,
      });
    });

    it('should handle rate limit errors (by code)', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).code = 'rate_limit_exceeded';
      mockGenerateText.mockRejectedValue(error);

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
      mockGenerateText.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
      });
    });

    it('should handle authentication errors (by code)', async () => {
      const error = new Error('Invalid API key');
      (error as any).code = 'invalid_api_key';
      mockGenerateText.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Invalid API key',
        code: 'AUTH_ERROR',
        retryable: false,
      });
    });

    it('should handle server errors (5xx)', async () => {
      const error = new Error('Server error');
      (error as any).status = 500;
      mockGenerateText.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'OpenAI server error',
        code: 'SERVER_ERROR',
        retryable: true,
      });
    });

    it('should handle network errors (ENOTFOUND)', async () => {
      const error = new Error('Network error');
      (error as any).code = 'ENOTFOUND';
      mockGenerateText.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Network error',
        code: 'NETWORK_ERROR',
        retryable: true,
      });
    });

    it('should handle network errors (ECONNREFUSED)', async () => {
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';
      mockGenerateText.mockRejectedValue(error);

      const result = await provider.generate('System', 'Prompt');

      expect(result).toEqual({
        error: 'Network error',
        code: 'NETWORK_ERROR',
        retryable: true,
      });
    });

    it('should handle generic errors', async () => {
      const error = new Error('Unknown error');
      (error as any).type = 'unknown_error';
      mockGenerateText.mockRejectedValue(error);

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
      mockGenerateText.mockResolvedValue({
        text: 'OK',
        usage: { promptTokens: 5, completionTokens: 1, totalTokens: 6 },
        finishReason: 'stop',
      });

      const result = await provider.testConnection();

      expect(result).toBe(true);
      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'You are a helpful assistant.',
          prompt: 'Say "OK" if you can read this.',
          maxTokens: 10,
        })
      );
    });

    it('should return false for failed connection', async () => {
      mockGenerateText.mockRejectedValue(new Error('Connection failed'));

      const result = await provider.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('createOpenAIProvider()', () => {
    it('should create provider with default config', () => {
      const provider = createOpenAIProvider();

      expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should create provider with custom config', () => {
      const provider = createOpenAIProvider({
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 1000,
      });

      expect(provider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe('Token Usage and Cost Tracking', () => {
    it('should default to 0 tokens when usage not provided', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Content',
        finishReason: 'stop',
      });

      const result = await provider.generate('System', 'Prompt');

      expect((result as GenerationResult).tokensUsed).toEqual({
        prompt: 0,
        completion: 0,
        total: 0,
      });
      expect((result as GenerationResult).cost).toBe(0);
    });

    it('should handle partial usage data', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Content',
        usage: {
          promptTokens: 100,
        },
        finishReason: 'stop',
      });

      const result = await provider.generate('System', 'Prompt');

      expect((result as GenerationResult).tokensUsed).toEqual({
        prompt: 100,
        completion: 0,
        total: 0,
      });
    });

    it('should use default finish reason when not provided', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Content',
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      });

      const result = await provider.generate('System', 'Prompt');

      expect((result as GenerationResult).finishReason).toBe('stop');
    });
  });
});
