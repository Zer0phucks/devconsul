/**
 * Mock utilities for AI SDK (Vercel AI SDK)
 */

export const mockGenerateTextSuccess = {
  text: JSON.stringify({
    title: 'Test Blog Post',
    content: 'This is test content for the blog post.',
    excerpt: 'Test excerpt',
    tags: ['test', 'ai', 'blog'],
  }),
  usage: {
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
  },
  finishReason: 'stop',
};

export const mockGenerateTextPlainText = {
  text: `Test Blog Post Title
This is the first line of content.
More content here.`,
  usage: {
    promptTokens: 80,
    completionTokens: 40,
    totalTokens: 120,
  },
  finishReason: 'stop',
};

export const mockGenerateTextError = new Error('API rate limit exceeded');

export const mockOpenAIModel = jest.fn();
export const mockAnthropicModel = jest.fn();

// Mock generateText function
export const mockGenerateText = jest.fn();

// Setup default successful response
export const setupSuccessfulGeneration = () => {
  mockGenerateText.mockResolvedValue(mockGenerateTextSuccess);
};

// Setup error response
export const setupFailedGeneration = (error = mockGenerateTextError) => {
  mockGenerateText.mockRejectedValue(error);
};

// Reset all mocks
export const resetAllMocks = () => {
  mockGenerateText.mockReset();
  mockOpenAIModel.mockReset();
  mockAnthropicModel.mockReset();
};
