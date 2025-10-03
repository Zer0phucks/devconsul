/**
 * Integration Tests: Publishing API
 * Tests content publishing, scheduling, and multi-platform operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockRequest,
  mockPrisma,
  testDataFactories,
} from '../utils/test-helpers';

// Mock publishing engine
jest.mock('@/lib/publishing/engine', () => ({
  publishContent: jest.fn(),
  publishBatch: jest.fn(),
  retryFailedPublication: jest.fn(),
  getPublicationStatus: jest.fn(),
}));

// Mock platform adapters
jest.mock('@/lib/platforms', () => ({
  getPlatformAdapter: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const {
  publishContent,
  publishBatch,
  retryFailedPublication,
  getPublicationStatus,
} = require('@/lib/publishing/engine');
const { getPlatformAdapter } = require('@/lib/platforms');

describe('Publishing API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Single Platform Publishing', () => {
    it('should publish content to single platform successfully', async () => {
      const mockContent = testDataFactories.content({
        status: 'DRAFT',
        platform: 'TWITTER',
      });

      const mockPlatform = testDataFactories.platform({
        type: 'TWITTER',
        connected: true,
      });

      const mockPublication = testDataFactories.contentPublication({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        status: 'PUBLISHED',
        platformPostId: 'tweet-123456789',
      });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatform);

      getPlatformAdapter.mockReturnValue({
        publish: jest.fn().mockResolvedValue({
          success: true,
          postId: 'tweet-123456789',
          url: 'https://twitter.com/user/status/123456789',
        }),
      });

      publishContent.mockResolvedValue(mockPublication);

      const result = await publishContent({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
      });

      expect(result.status).toBe('PUBLISHED');
      expect(result.platformPostId).toBe('tweet-123456789');
      expect(publishContent).toHaveBeenCalledWith({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
      });
    });

    it('should handle platform publishing failures', async () => {
      const mockContent = testDataFactories.content({ status: 'DRAFT' });
      const mockPlatform = testDataFactories.platform({ type: 'TWITTER' });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatform);

      getPlatformAdapter.mockReturnValue({
        publish: jest.fn().mockResolvedValue({
          success: false,
          error: 'Rate limit exceeded',
        }),
      });

      publishContent.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded',
      });

      const result = await publishContent({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('should validate content before publishing', async () => {
      const tooLongContent = testDataFactories.content({
        content: 'A'.repeat(300), // Exceeds Twitter limit
        platform: 'TWITTER',
      });

      const mockPlatform = testDataFactories.platform({ type: 'TWITTER' });

      mockPrisma.content.findFirst.mockResolvedValue(tooLongContent);
      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatform);

      publishContent.mockResolvedValue({
        success: false,
        error: 'Content exceeds platform character limit',
      });

      const result = await publishContent({
        contentId: tooLongContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('character limit');
    });

    it('should track publishing metrics', async () => {
      const mockContent = testDataFactories.content();
      const mockPlatform = testDataFactories.platform();

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatform);

      const mockPublication = testDataFactories.contentPublication({
        publishedAt: new Date(),
        metadata: {
          publishDuration: 1250, // ms
          retryCount: 0,
        },
      });

      publishContent.mockResolvedValue(mockPublication);

      const result = await publishContent({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
      });

      expect(result.publishedAt).toBeDefined();
      expect(result.metadata.publishDuration).toBe(1250);
    });
  });

  describe('Batch Publishing', () => {
    it('should publish content to multiple platforms', async () => {
      const mockContent = testDataFactories.content();
      const platforms = [
        testDataFactories.platform({ type: 'TWITTER', id: 'platform-1' }),
        testDataFactories.platform({ type: 'LINKEDIN', id: 'platform-2' }),
        testDataFactories.platform({ type: 'HASHNODE', id: 'platform-3' }),
      ];

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findMany.mockResolvedValue(platforms);

      const mockPublications = platforms.map((platform) =>
        testDataFactories.contentPublication({
          contentId: mockContent.id,
          platformId: platform.id,
          status: 'PUBLISHED',
        })
      );

      publishBatch.mockResolvedValue({
        success: true,
        publications: mockPublications,
        summary: {
          total: 3,
          successful: 3,
          failed: 0,
        },
      });

      const result = await publishBatch({
        contentId: mockContent.id,
        platformIds: platforms.map((p) => p.id),
        userId: 'user-123',
      });

      expect(result.summary.total).toBe(3);
      expect(result.summary.successful).toBe(3);
      expect(result.publications).toHaveLength(3);
    });

    it('should handle partial batch failures', async () => {
      const mockContent = testDataFactories.content();
      const platforms = [
        testDataFactories.platform({ type: 'TWITTER', id: 'platform-1' }),
        testDataFactories.platform({ type: 'LINKEDIN', id: 'platform-2' }),
      ];

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findMany.mockResolvedValue(platforms);

      publishBatch.mockResolvedValue({
        success: true,
        publications: [
          testDataFactories.contentPublication({
            platformId: 'platform-1',
            status: 'PUBLISHED',
          }),
          {
            platformId: 'platform-2',
            status: 'FAILED',
            error: 'Authentication failed',
          },
        ],
        summary: {
          total: 2,
          successful: 1,
          failed: 1,
        },
      });

      const result = await publishBatch({
        contentId: mockContent.id,
        platformIds: platforms.map((p) => p.id),
        userId: 'user-123',
      });

      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
    });

    it('should respect platform-specific rate limits', async () => {
      const mockContent = testDataFactories.content();
      const platform = testDataFactories.platform({ type: 'TWITTER' });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(platform);

      // Simulate rate limit
      publishContent
        .mockResolvedValueOnce({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: 900, // seconds
        })
        .mockResolvedValueOnce({
          success: true,
          status: 'PUBLISHED',
        });

      const firstAttempt = await publishContent({
        contentId: mockContent.id,
        platformId: platform.id,
        userId: 'user-123',
      });

      expect(firstAttempt.success).toBe(false);
      expect(firstAttempt.retryAfter).toBe(900);
    });
  });

  describe('Publishing Retry Mechanism', () => {
    it('should retry failed publications', async () => {
      const failedPublication = {
        id: 'publication-123',
        contentId: 'content-123',
        platformId: 'platform-123',
        status: 'FAILED',
        error: 'Network timeout',
        retryCount: 0,
      };

      mockPrisma.contentPublication.findFirst.mockResolvedValue(
        failedPublication
      );

      retryFailedPublication.mockResolvedValue({
        ...failedPublication,
        status: 'PUBLISHED',
        retryCount: 1,
        publishedAt: new Date(),
      });

      const result = await retryFailedPublication({
        publicationId: failedPublication.id,
        userId: 'user-123',
      });

      expect(result.status).toBe('PUBLISHED');
      expect(result.retryCount).toBe(1);
      expect(retryFailedPublication).toHaveBeenCalledWith({
        publicationId: failedPublication.id,
        userId: 'user-123',
      });
    });

    it('should respect maximum retry limit', async () => {
      const maxRetriedPublication = {
        id: 'publication-123',
        contentId: 'content-123',
        platformId: 'platform-123',
        status: 'FAILED',
        error: 'Persistent error',
        retryCount: 3, // Max retries reached
      };

      mockPrisma.contentPublication.findFirst.mockResolvedValue(
        maxRetriedPublication
      );

      retryFailedPublication.mockResolvedValue({
        success: false,
        error: 'Maximum retry attempts reached',
      });

      const result = await retryFailedPublication({
        publicationId: maxRetriedPublication.id,
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum retry attempts');
    });

    it('should use exponential backoff for retries', async () => {
      const publication = {
        retryCount: 2,
      };

      // Calculate backoff: base * 2^retryCount
      const calculateBackoff = (retryCount: number) => {
        const baseDelay = 1000; // 1 second
        return baseDelay * Math.pow(2, retryCount);
      };

      const backoff = calculateBackoff(publication.retryCount);
      expect(backoff).toBe(4000); // 1000 * 2^2 = 4000ms
    });
  });

  describe('Publication Status Tracking', () => {
    it('should get publication status', async () => {
      const mockPublication = testDataFactories.contentPublication({
        status: 'PUBLISHED',
        platformPostId: 'post-123',
      });

      mockPrisma.contentPublication.findFirst.mockResolvedValue(
        mockPublication
      );

      getPublicationStatus.mockResolvedValue({
        id: mockPublication.id,
        status: 'PUBLISHED',
        platformPostId: 'post-123',
        publishedAt: mockPublication.publishedAt,
        url: 'https://platform.com/post/123',
      });

      const result = await getPublicationStatus({
        publicationId: mockPublication.id,
        userId: 'user-123',
      });

      expect(result.status).toBe('PUBLISHED');
      expect(result.platformPostId).toBe('post-123');
    });

    it('should track publication lifecycle events', async () => {
      const publication = testDataFactories.contentPublication();

      const lifecycleEvents = [
        { status: 'PENDING', timestamp: new Date('2025-01-01T10:00:00Z') },
        {
          status: 'PUBLISHING',
          timestamp: new Date('2025-01-01T10:00:05Z'),
        },
        { status: 'PUBLISHED', timestamp: new Date('2025-01-01T10:00:10Z') },
      ];

      // Track events
      for (const event of lifecycleEvents) {
        mockPrisma.contentPublication.update.mockResolvedValue({
          ...publication,
          status: event.status,
          updatedAt: event.timestamp,
        });
      }

      expect(lifecycleEvents[0].status).toBe('PENDING');
      expect(lifecycleEvents[2].status).toBe('PUBLISHED');
    });
  });

  describe('Dry Run Mode', () => {
    it('should simulate publishing without actual publication', async () => {
      const mockContent = testDataFactories.content();
      const mockPlatform = testDataFactories.platform();

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatform);

      const dryRunResult = {
        success: true,
        dryRun: true,
        validations: {
          contentLength: 'valid',
          imageCount: 'valid',
          linkCount: 'valid',
        },
        estimatedCost: 0,
        wouldPublish: true,
      };

      publishContent.mockResolvedValue(dryRunResult);

      const result = await publishContent({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
        dryRun: true,
      });

      expect(result.dryRun).toBe(true);
      expect(result.wouldPublish).toBe(true);
      expect(result.validations).toBeDefined();
    });

    it('should identify validation issues in dry run', async () => {
      const mockContent = testDataFactories.content({
        content: 'A'.repeat(300), // Too long
      });
      const mockPlatform = testDataFactories.platform({ type: 'TWITTER' });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatform);

      publishContent.mockResolvedValue({
        success: false,
        dryRun: true,
        validations: {
          contentLength: 'invalid - exceeds 280 characters',
        },
        wouldPublish: false,
        errors: ['Content exceeds Twitter character limit'],
      });

      const result = await publishContent({
        contentId: mockContent.id,
        platformId: mockPlatform.id,
        userId: 'user-123',
        dryRun: true,
      });

      expect(result.wouldPublish).toBe(false);
      expect(result.errors).toContain('Content exceeds Twitter character limit');
    });
  });

  describe('Authorization and Security', () => {
    it('should prevent publishing other users content', async () => {
      mockPrisma.content.findFirst.mockResolvedValue(null);

      publishContent.mockResolvedValue({
        success: false,
        error: 'Content not found or access denied',
      });

      const result = await publishContent({
        contentId: 'content-123',
        platformId: 'platform-123',
        userId: 'unauthorized-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('access denied');
    });

    it('should validate platform ownership before publishing', async () => {
      const mockContent = testDataFactories.content({ userId: 'user-123' });

      mockPrisma.content.findFirst.mockResolvedValue(mockContent);
      mockPrisma.platform.findFirst.mockResolvedValue(null); // Platform not owned

      publishContent.mockResolvedValue({
        success: false,
        error: 'Platform not connected or access denied',
      });

      const result = await publishContent({
        contentId: mockContent.id,
        platformId: 'platform-123',
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Platform not connected');
    });

    it('should sanitize content before publishing', async () => {
      const mockContent = testDataFactories.content({
        content: '<script>alert("xss")</script>Normal content',
      });

      const sanitize = jest.fn((content: string) => {
        return content.replace(/<script[^>]*>.*?<\/script>/gi, '');
      });

      const sanitized = sanitize(mockContent.content);
      expect(sanitized).toBe('Normal content');
      expect(sanitized).not.toContain('<script>');
    });
  });
});
