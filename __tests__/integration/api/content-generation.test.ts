/**
 * Integration Tests: Content Generation API
 * Tests AI content generation endpoints with provider integration
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST as generateHandler } from '@/app/api/ai/generate/route';
import {
  createMockRequest,
  testDataFactories,
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../utils/test-helpers';

// Mock AI generation functions
jest.mock('@/lib/ai/generator', () => ({
  generateContent: jest.fn(),
  validateContent: jest.fn(),
}));

jest.mock('@/lib/validations/ai', () => ({
  generateContentSchema: {
    safeParse: jest.fn(),
  },
}));

const { generateContent, validateContent } = require('@/lib/ai/generator');
const { generateContentSchema } = require('@/lib/validations/ai');

describe('Content Generation API Integration Tests', () => {
  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('POST /api/ai/generate', () => {
    it('should generate content with valid input', async () => {
      const requestData = {
        activities: [
          {
            id: 'activity-1',
            type: 'commit',
            message: 'Fix authentication bug',
            repository: 'test/repo',
          },
        ],
        platform: 'TWITTER',
        brandVoice: 'professional',
        projectId: 'project-123',
      };

      const mockGeneratedContent = {
        success: true,
        content: 'Just fixed a critical authentication bug in our project! 🔒',
        platform: 'TWITTER',
        metadata: {
          provider: 'openai',
          model: 'gpt-4',
          tokensUsed: 150,
        },
      };

      const mockValidation = {
        valid: true,
        errors: [],
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });
      generateContent.mockResolvedValue(mockGeneratedContent);
      validateContent.mockReturnValue(mockValidation);

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(mockGeneratedContent.content);
      expect(data.data.platform).toBe('TWITTER');
      expect(data.data.metadata).toBeDefined();
      expect(data.data.validation.valid).toBe(true);

      expect(generateContent).toHaveBeenCalledWith({
        activities: requestData.activities,
        platform: requestData.platform,
        brandVoice: requestData.brandVoice,
        customPrompt: undefined,
        provider: undefined,
        projectId: requestData.projectId,
      });
    });

    it('should validate request data with schema', async () => {
      const invalidData = {
        // Missing required fields
        platform: 'TWITTER',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [
            { path: ['activities'], message: 'Required field missing' },
          ],
        },
      });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: invalidData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
      expect(generateContent).not.toHaveBeenCalled();
    });

    it('should handle AI provider failures gracefully', async () => {
      const requestData = {
        activities: [
          {
            id: 'activity-1',
            type: 'commit',
            message: 'Test commit',
          },
        ],
        platform: 'TWITTER',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: false,
        error: 'OpenAI API rate limit exceeded',
      });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('OpenAI API rate limit exceeded');
    });

    it('should support custom prompts', async () => {
      const requestData = {
        activities: [
          {
            id: 'activity-1',
            type: 'release',
            version: 'v2.0.0',
          },
        ],
        platform: 'LINKEDIN',
        customPrompt: 'Focus on the technical improvements',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: true,
        content: 'Technical improvements in v2.0.0...',
        platform: 'LINKEDIN',
        metadata: {},
      });

      validateContent.mockReturnValue({ valid: true, errors: [] });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          customPrompt: 'Focus on the technical improvements',
        })
      );
    });

    it('should support provider selection', async () => {
      const requestData = {
        activities: [{ id: 'activity-1', type: 'commit' }],
        platform: 'TWITTER',
        provider: 'anthropic',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: true,
        content: 'Generated by Claude...',
        platform: 'TWITTER',
        metadata: { provider: 'anthropic', model: 'claude-3-opus' },
      });

      validateContent.mockReturnValue({ valid: true, errors: [] });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.metadata.provider).toBe('anthropic');
      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'anthropic' })
      );
    });

    it('should validate generated content for platform', async () => {
      const requestData = {
        activities: [{ id: 'activity-1', type: 'commit' }],
        platform: 'TWITTER',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: true,
        content: 'A'.repeat(300), // Too long for Twitter
        platform: 'TWITTER',
        metadata: {},
      });

      validateContent.mockReturnValue({
        valid: false,
        errors: ['Content exceeds Twitter character limit of 280'],
      });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Still returns success
      expect(data.data.validation.valid).toBe(false);
      expect(data.data.validation.errors).toContain(
        'Content exceeds Twitter character limit of 280'
      );
      expect(validateContent).toHaveBeenCalledWith('A'.repeat(300), 'TWITTER');
    });

    it('should handle multiple activities', async () => {
      const requestData = {
        activities: [
          { id: 'activity-1', type: 'commit', message: 'Fix bug' },
          { id: 'activity-2', type: 'commit', message: 'Add feature' },
          { id: 'activity-3', type: 'release', version: 'v1.2.0' },
        ],
        platform: 'LINKEDIN',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: true,
        content: 'This week: bug fixes, new features, and v1.2.0 release!',
        platform: 'LINKEDIN',
        metadata: {},
      });

      validateContent.mockReturnValue({ valid: true, errors: [] });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          activities: expect.arrayContaining([
            expect.objectContaining({ id: 'activity-1' }),
            expect.objectContaining({ id: 'activity-2' }),
            expect.objectContaining({ id: 'activity-3' }),
          ]),
        })
      );
    });

    it('should track token usage in metadata', async () => {
      const requestData = {
        activities: [{ id: 'activity-1', type: 'commit' }],
        platform: 'TWITTER',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: true,
        content: 'Generated content',
        platform: 'TWITTER',
        metadata: {
          provider: 'openai',
          model: 'gpt-4',
          tokensUsed: 250,
          estimatedCost: 0.005,
        },
      });

      validateContent.mockReturnValue({ valid: true, errors: [] });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(data.data.metadata.tokensUsed).toBe(250);
      expect(data.data.metadata.estimatedCost).toBe(0.005);
    });

    it('should handle brand voice customization', async () => {
      const brandVoices = ['professional', 'casual', 'technical', 'friendly'];

      for (const brandVoice of brandVoices) {
        const requestData = {
          activities: [{ id: 'activity-1', type: 'commit' }],
          platform: 'TWITTER',
          brandVoice,
          projectId: 'project-123',
        };

        generateContentSchema.safeParse.mockReturnValue({
          success: true,
          data: requestData,
        });

        generateContent.mockResolvedValue({
          success: true,
          content: `Content in ${brandVoice} voice`,
          platform: 'TWITTER',
          metadata: {},
        });

        validateContent.mockReturnValue({ valid: true, errors: [] });

        const request = createMockRequest('POST', '/api/ai/generate', {
          body: requestData,
          userId: 'user-123',
        });

        const response = await generateHandler(request);
        expect(response.status).toBe(200);
        expect(generateContent).toHaveBeenCalledWith(
          expect.objectContaining({ brandVoice })
        );
      }
    });

    it('should handle network timeout errors', async () => {
      const requestData = {
        activities: [{ id: 'activity-1', type: 'commit' }],
        platform: 'TWITTER',
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockRejectedValue(new Error('Request timeout after 60s'));

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Request timeout after 60s');
    });
  });

  describe('Platform-Specific Generation', () => {
    const platforms = [
      'TWITTER',
      'LINKEDIN',
      'MEDIUM',
      'HASHNODE',
      'DEVTO',
      'WORDPRESS',
    ];

    it.each(platforms)('should generate content for %s', async (platform) => {
      const requestData = {
        activities: [{ id: 'activity-1', type: 'commit' }],
        platform,
        projectId: 'project-123',
      };

      generateContentSchema.safeParse.mockReturnValue({
        success: true,
        data: requestData,
      });

      generateContent.mockResolvedValue({
        success: true,
        content: `Platform-optimized content for ${platform}`,
        platform,
        metadata: {},
      });

      validateContent.mockReturnValue({ valid: true, errors: [] });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: requestData,
        userId: 'user-123',
      });

      const response = await generateHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.platform).toBe(platform);
      expect(validateContent).toHaveBeenCalledWith(
        expect.any(String),
        platform
      );
    });
  });
});
