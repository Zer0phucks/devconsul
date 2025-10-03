/**
 * Unit tests for Content Generator
 */

import {
  generateBlogPost,
  generateNewsletter,
  analyzeAndGenerateContent,
} from '@/lib/ai/content-generator';
import type { GitHubActivity, GeneratedContent } from '@/lib/types';
import {
  mockPushActivity,
  mockPullRequestActivity,
  mockReleaseActivity,
  mockActivitiesBatch,
  mockMultiplePushActivities,
} from './__mocks__/github-activities.mock';

// Mock AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn((model) => `openai:${model}`),
}));

// Mock KV store
jest.mock('@/lib/supabase/kv', () => ({
  kv: {
    set: jest.fn().mockResolvedValue('OK'),
    zadd: jest.fn().mockResolvedValue(1),
  },
}));

import { generateText } from 'ai';
import { kv } from '@/lib/supabase/kv';

const mockGenerateText = generateText as jest.MockedFunction<typeof generateText>;

describe('Content Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBlogPost()', () => {
    it('should generate blog post from activities', async () => {
      const mockResponse = {
        text: JSON.stringify({
          title: 'Weekly Development Update',
          content: 'This week we made significant progress on authentication...',
          excerpt: 'Key updates from our development work this week.',
          tags: ['development', 'updates', 'auth'],
        }),
        usage: {
          promptTokens: 150,
          completionTokens: 200,
          totalTokens: 350,
        },
        finishReason: 'stop',
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await generateBlogPost(mockActivitiesBatch);

      expect(result).toEqual({
        title: 'Weekly Development Update',
        content: 'This week we made significant progress on authentication...',
        excerpt: 'Key updates from our development work this week.',
        tags: ['development', 'updates', 'auth'],
        metadata: {},
      });

      // Verify generateText was called with correct parameters
      const callArgs = mockGenerateText.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        model: 'openai:gpt-4', // Uses DEFAULT_CONFIG model
        temperature: 0.7,
        maxTokens: 2000,
      });
    });

    it('should use custom config options', async () => {
      const mockResponse = {
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const customConfig = {
        model: 'gpt-3.5-turbo' as const,
        temperature: 0.5,
        maxTokens: 1000,
        style: 'casual' as const,
      };

      await generateBlogPost(mockActivitiesBatch, customConfig);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai:gpt-3.5-turbo',
          temperature: 0.5,
          maxTokens: 1000,
        })
      );

      const systemMessage = (mockGenerateText.mock.calls[0][0] as any).messages[0].content;
      expect(systemMessage).toContain('casual');
    });

    it('should build context from push activities', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateBlogPost([mockPushActivity]);

      const userMessage = (mockGenerateText.mock.calls[0][0] as any).messages[1].content;
      expect(userMessage).toContain('COMMITS:');
      expect(userMessage).toContain('feat: Add new authentication feature');
      expect(userMessage).toContain('fix: Resolve login bug');
    });

    it('should build context from pull request activities', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateBlogPost([mockPullRequestActivity]);

      const userMessage = (mockGenerateText.mock.calls[0][0] as any).messages[1].content;
      expect(userMessage).toContain('PULL REQUESTS:');
      expect(userMessage).toContain('PR #42: Add OAuth integration');
    });

    it('should build context from release activities', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateBlogPost([mockReleaseActivity]);

      const userMessage = (mockGenerateText.mock.calls[0][0] as any).messages[1].content;
      expect(userMessage).toContain('RELEASES:');
      expect(userMessage).toContain('v1.2.0');
      expect(userMessage).toContain('Major update with new features');
    });

    it('should handle plain text response (non-JSON)', async () => {
      const mockResponse = {
        text: `Blog Post Title
This is line 1 of content
This is line 2 of content`,
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await generateBlogPost(mockActivitiesBatch);

      expect(result).toEqual({
        title: 'Blog Post Title',
        content: mockResponse.text,
        excerpt: 'This is line 1 of content',
        tags: [],
        metadata: {},
      });
    });

    it('should handle empty response gracefully', async () => {
      mockGenerateText.mockResolvedValue({
        text: '',
      });

      const result = await generateBlogPost(mockActivitiesBatch);

      expect(result).toEqual({
        title: 'Untitled',
        content: '',
        excerpt: '',
        tags: [],
        metadata: {},
      });
    });

    it('should throw error when generation fails', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      await expect(generateBlogPost(mockActivitiesBatch)).rejects.toThrow(
        'Content generation failed'
      );
    });

    it('should include code snippets when configured', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateBlogPost(mockActivitiesBatch, { includeCodeSnippets: true });

      const systemMessage = (mockGenerateText.mock.calls[0][0] as any).messages[0].content;
      expect(systemMessage).toContain('Include relevant code snippets');
    });

    it('should exclude code snippets when configured', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateBlogPost(mockActivitiesBatch, { includeCodeSnippets: false });

      const systemMessage = (mockGenerateText.mock.calls[0][0] as any).messages[0].content;
      expect(systemMessage).toContain('Focus on narrative without code snippets');
    });

    it('should target specific audience', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateBlogPost(mockActivitiesBatch, { targetAudience: 'managers' });

      const systemMessage = (mockGenerateText.mock.calls[0][0] as any).messages[0].content;
      expect(systemMessage).toContain('managers');
    });
  });

  describe('generateNewsletter()', () => {
    it('should generate newsletter from activities', async () => {
      const mockResponse = {
        text: JSON.stringify({
          title: 'Weekly Newsletter - January 2024',
          content: 'Welcome to this week\'s newsletter...',
          excerpt: 'Highlights from the week',
          tags: ['newsletter', 'weekly'],
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await generateNewsletter(mockActivitiesBatch);

      expect(result).toEqual({
        title: 'Weekly Newsletter - January 2024',
        content: 'Welcome to this week\'s newsletter...',
        excerpt: 'Highlights from the week',
        tags: ['newsletter', 'weekly'],
        metadata: {},
      });

      // Verify it uses casual style
      const systemMessage = (mockGenerateText.mock.calls[0][0] as any).messages[0].content;
      expect(systemMessage).toContain('engaging');
      expect(systemMessage).toContain('informative');
    });

    it('should use higher temperature for newsletter', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateNewsletter(mockActivitiesBatch);

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
        })
      );
    });

    it('should request specific newsletter sections', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      await generateNewsletter(mockActivitiesBatch);

      const userMessage = (mockGenerateText.mock.calls[0][0] as any).messages[1].content;
      expect(userMessage).toContain('Highlights');
      expect(userMessage).toContain('Details');
      expect(userMessage).toContain('What\'s Next');
    });

    it('should throw error when generation fails', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      await expect(generateNewsletter(mockActivitiesBatch)).rejects.toThrow(
        'Newsletter generation failed'
      );
    });
  });

  describe('analyzeAndGenerateContent()', () => {
    it('should generate content for release activities', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Release Update',
          content: 'We released v1.2.0',
          excerpt: 'New release',
          tags: ['release'],
        }),
      });

      await analyzeAndGenerateContent([mockReleaseActivity]);

      expect(mockGenerateText).toHaveBeenCalled();
      expect(kv.set).toHaveBeenCalledWith(
        expect.stringMatching(/^content:/),
        expect.objectContaining({
          title: 'Release Update',
          status: 'draft',
        }),
        { ex: 7 * 24 * 60 * 60 }
      );
      expect(kv.zadd).toHaveBeenCalledWith('content:drafts', {
        score: expect.any(Number),
        member: expect.stringMatching(/^content:/),
      });
    });

    it('should generate content for merged PRs', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'PR Merged',
          content: 'New features added',
          excerpt: 'PR update',
          tags: ['pr'],
        }),
      });

      await analyzeAndGenerateContent([mockPullRequestActivity]);

      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should generate content for significant commits (5+)', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Development Updates',
          content: 'Multiple commits this week',
          excerpt: 'Updates',
          tags: ['commits'],
        }),
      });

      await analyzeAndGenerateContent(mockMultiplePushActivities);

      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('should not generate content for insignificant activities', async () => {
      await analyzeAndGenerateContent([mockPushActivity]); // Only 1 push

      expect(mockGenerateText).not.toHaveBeenCalled();
      expect(kv.set).not.toHaveBeenCalled();
    });

    it('should handle generation errors gracefully', async () => {
      mockGenerateText.mockRejectedValue(new Error('API Error'));

      // Should not throw, just log
      await expect(
        analyzeAndGenerateContent([mockReleaseActivity])
      ).resolves.toBeUndefined();
    });

    it('should store activity IDs with generated content', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      const activities = [mockReleaseActivity, mockPullRequestActivity];
      await analyzeAndGenerateContent(activities);

      expect(kv.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          activityIds: [mockReleaseActivity.id, mockPullRequestActivity.id],
        }),
        expect.any(Object)
      );
    });
  });

  describe('Metadata Handling', () => {
    it('should preserve metadata from JSON response', async () => {
      const mockResponse = {
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: ['test'],
          metadata: {
            author: 'AI',
            readingTime: '5 min',
          },
        }),
      };

      mockGenerateText.mockResolvedValue(mockResponse);

      const result = await generateBlogPost(mockActivitiesBatch);

      expect(result.metadata).toEqual({
        author: 'AI',
        readingTime: '5 min',
      });
    });

    it('should default to empty metadata object', async () => {
      mockGenerateText.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          tags: [],
        }),
      });

      const result = await generateBlogPost(mockActivitiesBatch);

      expect(result.metadata).toEqual({});
    });
  });
});
