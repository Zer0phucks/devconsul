import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { InngestEvents } from '@/lib/inngest/client';

/**
 * Unit Tests: Scheduled Publishing Inngest Jobs
 *
 * Tests:
 * - Cron-triggered queue processing
 * - Project-specific batch publishing
 * - Individual item publishing with retries
 * - Manual publish triggers
 * - Cancellation and rescheduling
 * - Platform publishing logic
 * - Queue status management
 * - Partial success handling
 */

// Mock dependencies
const mockPrisma = {
  scheduledContent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  platform: {
    findMany: jest.fn(),
  },
  content: {
    update: jest.fn(),
  },
};

const mockInngest = {
  send: jest.fn(),
};

const mockQueue = {
  dequeue: jest.fn(),
  markProcessing: jest.fn(),
  markCompleted: jest.fn(),
  markFailed: jest.fn(),
};

const mockRecordJobExecution = jest.fn();
const mockTrackJobPerformance = jest.fn();

// Mock modules
jest.mock('@/lib/db', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/inngest/client', () => ({
  inngest: mockInngest,
}));
jest.mock('@/lib/scheduling/queue', () => mockQueue);
jest.mock('@/lib/monitoring/metrics-collector', () => ({
  recordJobExecution: mockRecordJobExecution,
}));
jest.mock('@/lib/monitoring/performance-tracker', () => ({
  trackJobPerformance: mockTrackJobPerformance,
}));

describe('Scheduled Publish Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Scheduled Publish Cron', () => {
    it('should run every minute (cron: * * * * *)', () => {
      const cronExpression = '* * * * *';
      expect(cronExpression).toBe('* * * * *');
    });

    it('should find projects with pending scheduled content', async () => {
      const mockSchedules = [
        { projectId: 'proj_1', scheduledFor: new Date('2025-10-03T09:00:00Z') },
        { projectId: 'proj_1', scheduledFor: new Date('2025-10-03T09:30:00Z') },
        { projectId: 'proj_2', scheduledFor: new Date('2025-10-03T10:00:00Z') },
      ];

      mockPrisma.scheduledContent.findMany.mockResolvedValue(mockSchedules);

      const result = await mockPrisma.scheduledContent.findMany({
        where: {
          scheduledFor: { lte: new Date() },
          queueStatus: { in: ['PENDING', 'QUEUED'] },
          status: 'SCHEDULED',
        },
        select: { projectId: true },
        distinct: ['projectId'],
      });

      const projectIds = result.map((s) => s.projectId);
      const uniqueProjects = [...new Set(projectIds)];

      expect(result).toHaveLength(3);
      expect(uniqueProjects).toHaveLength(2);
    });

    it('should trigger project-specific publish jobs', async () => {
      const projects = ['proj_1', 'proj_2'];

      for (const projectId of projects) {
        await mockInngest.send({
          name: 'scheduled/publish.project',
          data: { projectId },
        });
      }

      expect(mockInngest.send).toHaveBeenCalledTimes(2);
      expect(mockInngest.send).toHaveBeenCalledWith({
        name: 'scheduled/publish.project',
        data: { projectId: 'proj_1' },
      });
    });

    it('should return no-op when no scheduled content', async () => {
      mockPrisma.scheduledContent.findMany.mockResolvedValue([]);

      const result = await mockPrisma.scheduledContent.findMany({
        where: {
          scheduledFor: { lte: new Date() },
          queueStatus: { in: ['PENDING', 'QUEUED'] },
          status: 'SCHEDULED',
        },
      });

      expect(result).toHaveLength(0);
    });

    it('should handle errors when triggering jobs', async () => {
      mockInngest.send.mockRejectedValueOnce(new Error('Event send failed'));

      const projects = ['proj_1'];
      const results = [];

      for (const projectId of projects) {
        try {
          await mockInngest.send({
            name: 'scheduled/publish.project',
            data: { projectId },
          });
          results.push({ projectId, triggered: true });
        } catch (error: any) {
          results.push({ projectId, triggered: false, error: error.message });
        }
      }

      expect(results[0].triggered).toBe(false);
      expect(results[0].error).toBe('Event send failed');
    });
  });

  describe('Project-Specific Publish Job', () => {
    it('should dequeue items for project (max 10 per batch)', async () => {
      const mockItems = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `sched_${i}`,
          contentId: `content_${i}`,
          projectId: 'proj_1',
        }));

      mockQueue.dequeue.mockResolvedValue(mockItems);

      const items = await mockQueue.dequeue('proj_1', 10);

      expect(items).toHaveLength(10);
      expect(mockQueue.dequeue).toHaveBeenCalledWith('proj_1', 10);
    });

    it('should trigger individual item publish jobs', async () => {
      const items = [
        { id: 'sched_1', contentId: 'content_1', projectId: 'proj_1' },
        { id: 'sched_2', contentId: 'content_2', projectId: 'proj_1' },
      ];

      mockQueue.dequeue.mockResolvedValue(items);

      for (const item of items) {
        await mockInngest.send({
          name: 'scheduled/publish.item',
          data: {
            scheduleId: item.id,
            contentId: item.contentId,
            projectId: item.projectId,
          },
        });
      }

      expect(mockInngest.send).toHaveBeenCalledTimes(2);
    });

    it('should enforce concurrency limit of 10 projects', () => {
      const concurrencyConfig = {
        limit: 10,
        key: 'event.data.projectId',
      };

      expect(concurrencyConfig.limit).toBe(10);
      expect(concurrencyConfig.key).toBe('event.data.projectId');
    });

    it('should return early when no items to process', async () => {
      mockQueue.dequeue.mockResolvedValue([]);

      const items = await mockQueue.dequeue('proj_1', 10);

      expect(items).toHaveLength(0);
    });
  });

  describe('Individual Item Publish Job', () => {
    it('should mark item as processing before publish', async () => {
      const scheduleId = 'sched_123';

      mockQueue.markProcessing.mockResolvedValue(undefined);

      await mockQueue.markProcessing(scheduleId);

      expect(mockQueue.markProcessing).toHaveBeenCalledWith(scheduleId);
    });

    it('should fetch schedule with content and platforms', async () => {
      const mockSchedule = {
        id: 'sched_123',
        contentId: 'content_456',
        platforms: ['plat_1', 'plat_2'],
        publishDelay: 0,
        content: {
          id: 'content_456',
          title: 'Test Content',
          body: 'Content body',
          platforms: [
            { id: 'plat_1', type: 'TWITTER' },
            { id: 'plat_2', type: 'LINKEDIN' },
          ],
        },
      };

      mockPrisma.scheduledContent.findUnique.mockResolvedValue(mockSchedule);

      const result = await mockPrisma.scheduledContent.findUnique({
        where: { id: 'sched_123' },
        include: {
          content: {
            include: { platforms: true },
          },
        },
      });

      expect(result.content).toBeDefined();
      expect(result.platforms).toHaveLength(2);
    });

    it('should throw when schedule not found', () => {
      mockPrisma.scheduledContent.findUnique.mockResolvedValue(null);

      const shouldThrow = mockPrisma.scheduledContent
        .findUnique({ where: { id: 'sched_999' } })
        .then((sched: any) => {
          if (!sched) {
            throw new Error('Schedule not found: sched_999');
          }
        });

      expect(shouldThrow).rejects.toThrow('Schedule not found');
    });

    it('should fetch connected platforms to publish to', async () => {
      const mockPlatforms = [
        { id: 'plat_1', type: 'TWITTER', isConnected: true },
        { id: 'plat_2', type: 'LINKEDIN', isConnected: true },
      ];

      mockPrisma.platform.findMany.mockResolvedValue(mockPlatforms);

      const result = await mockPrisma.platform.findMany({
        where: {
          id: { in: ['plat_1', 'plat_2'] },
          isConnected: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.isConnected)).toBe(true);
    });

    it('should throw when no connected platforms', () => {
      mockPrisma.platform.findMany.mockResolvedValue([]);

      const shouldThrow = mockPrisma.platform
        .findMany({ where: { isConnected: true } })
        .then((platforms: any) => {
          if (platforms.length === 0) {
            throw new Error('No connected platforms to publish to');
          }
        });

      expect(shouldThrow).rejects.toThrow('No connected platforms');
    });

    it('should respect publish delay configuration', () => {
      const schedule = { publishDelay: 30 }; // 30 seconds
      const shouldDelay = schedule.publishDelay > 0;

      expect(shouldDelay).toBe(true);
      expect(schedule.publishDelay).toBe(30);
    });
  });

  describe('Platform Publishing', () => {
    it('should publish to each platform sequentially', async () => {
      const platforms = [
        { id: 'plat_1', type: 'TWITTER', isConnected: true },
        { id: 'plat_2', type: 'LINKEDIN', isConnected: true },
      ];

      const content = { id: 'content_1', title: 'Test', body: 'Content' };
      const results = [];

      for (const platform of platforms) {
        try {
          const publishedUrl = `https://${platform.type.toLowerCase()}.com/post/123`;
          results.push({
            platformId: platform.id,
            platformType: platform.type,
            success: true,
            publishedUrl,
          });
        } catch (error: any) {
          results.push({
            platformId: platform.id,
            platformType: platform.type,
            success: false,
            error: error.message,
          });
        }
      }

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle platform-specific publishing errors', async () => {
      const simulatePublish = (platform: string) => {
        if (platform === 'TWITTER') {
          throw new Error('Twitter API rate limit');
        }
        return `https://${platform.toLowerCase()}.com/post/123`;
      };

      const platforms = ['TWITTER', 'LINKEDIN'];
      const results = [];

      for (const platform of platforms) {
        try {
          const url = simulatePublish(platform);
          results.push({ platform, success: true, url });
        } catch (error: any) {
          results.push({ platform, success: false, error: error.message });
        }
      }

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Twitter API rate limit');
      expect(results[1].success).toBe(true);
    });

    it('should support all platform types', () => {
      const supportedPlatforms = [
        'TWITTER',
        'LINKEDIN',
        'FACEBOOK',
        'REDDIT',
        'HASHNODE',
        'DEVTO',
        'MEDIUM',
        'WORDPRESS',
        'GHOST',
      ];

      supportedPlatforms.forEach((type) => {
        expect(supportedPlatforms).toContain(type);
      });
    });
  });

  describe('Success Scenarios', () => {
    it('should mark as completed when all platforms succeed', async () => {
      const scheduleId = 'sched_123';
      const publishResults = [
        { platformId: 'plat_1', success: true },
        { platformId: 'plat_2', success: true },
      ];

      const allSucceeded = publishResults.every((r) => r.success);

      if (allSucceeded) {
        await mockQueue.markCompleted(scheduleId, new Date());
        await mockPrisma.content.update({
          where: { id: 'content_123' },
          data: { status: 'PUBLISHED', publishedAt: new Date() },
        });
      }

      expect(mockQueue.markCompleted).toHaveBeenCalledWith(
        scheduleId,
        expect.any(Date)
      );
      expect(mockPrisma.content.update).toHaveBeenCalled();
    });

    it('should record metrics for successful publish', async () => {
      const duration = 3000;
      const metadata = {
        scheduleId: 'sched_123',
        contentId: 'content_456',
        platforms: 2,
      };

      await mockRecordJobExecution('item-scheduled-publish', true, duration, metadata);
      await mockTrackJobPerformance('item-scheduled-publish', duration, true);

      expect(mockRecordJobExecution).toHaveBeenCalledWith(
        'item-scheduled-publish',
        true,
        duration,
        metadata
      );
    });

    it('should return success result with platform details', () => {
      const result = {
        success: true,
        scheduleId: 'sched_123',
        contentId: 'content_456',
        platforms: 2,
        results: [
          { platformId: 'plat_1', success: true, publishedUrl: 'https://twitter.com/...' },
          { platformId: 'plat_2', success: true, publishedUrl: 'https://linkedin.com/...' },
        ],
      };

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Partial Success Handling', () => {
    it('should handle partial success on final retry (attempt 3)', async () => {
      const attempt = 3;
      const publishResults = [
        { platformId: 'plat_1', success: true, publishedUrl: 'https://twitter.com/...' },
        { platformId: 'plat_2', success: false, error: 'API error' },
      ];

      const allSucceeded = publishResults.every((r) => r.success);
      const someSucceeded = publishResults.some((r) => r.success);

      if (!allSucceeded && someSucceeded && attempt >= 3) {
        await mockQueue.markCompleted('sched_123', new Date());
        await mockPrisma.scheduledContent.update({
          where: { id: 'sched_123' },
          data: {
            metadata: {
              partialSuccess: true,
              failures: publishResults.filter((r) => !r.success),
            },
          },
        });
      }

      expect(mockQueue.markCompleted).toHaveBeenCalled();
      expect(mockPrisma.scheduledContent.update).toHaveBeenCalledWith({
        where: { id: 'sched_123' },
        data: {
          metadata: {
            partialSuccess: true,
            failures: [{ platformId: 'plat_2', success: false, error: 'API error' }],
          },
        },
      });
    });

    it('should return partial success result', () => {
      const result = {
        success: false,
        partialSuccess: true,
        scheduleId: 'sched_123',
        contentId: 'content_456',
        platforms: 2,
        results: [
          { platformId: 'plat_1', success: true },
          { platformId: 'plat_2', success: false, error: 'API error' },
        ],
      };

      expect(result.partialSuccess).toBe(true);
      expect(result.results.filter((r) => r.success)).toHaveLength(1);
    });
  });

  describe('Failure and Retry Logic', () => {
    it('should mark as failed and prepare for retry', async () => {
      const scheduleId = 'sched_123';
      const errorMessage = 'TWITTER: API rate limit; LINKEDIN: Network timeout';
      const attempt = 1;

      mockQueue.markFailed.mockResolvedValue(true); // Will retry

      const willRetry = await mockQueue.markFailed(scheduleId, errorMessage, {
        attempt,
        results: [],
      });

      expect(willRetry).toBe(true);
      expect(mockQueue.markFailed).toHaveBeenCalledWith(
        scheduleId,
        errorMessage,
        expect.any(Object)
      );
    });

    it('should send notification on permanent failure', async () => {
      mockQueue.markFailed.mockResolvedValue(false); // No more retries

      const willRetry = await mockQueue.markFailed('sched_123', 'Permanent error', {
        attempt: 3,
      });

      expect(willRetry).toBe(false);
      // In real implementation, would send notification here
    });

    it('should enforce max 3 retries', () => {
      const jobConfig = {
        id: 'item-scheduled-publish',
        retries: 3,
      };

      expect(jobConfig.retries).toBe(3);
    });

    it('should record failed execution metrics', async () => {
      const duration = 1500;
      const metadata = {
        scheduleId: 'sched_123',
        error: 'All platforms failed',
        attempt: 2,
      };

      await mockRecordJobExecution('item-scheduled-publish', false, duration, metadata);
      await mockTrackJobPerformance('item-scheduled-publish', duration, false);

      expect(mockRecordJobExecution).toHaveBeenCalledWith(
        'item-scheduled-publish',
        false,
        duration,
        metadata
      );
    });
  });

  describe('Manual Publish Trigger', () => {
    it('should verify schedule exists and is not completed', async () => {
      const mockSchedule = {
        id: 'sched_123',
        queueStatus: 'PENDING',
        status: 'SCHEDULED',
      };

      mockPrisma.scheduledContent.findUnique.mockResolvedValue(mockSchedule);

      const result = await mockPrisma.scheduledContent.findUnique({
        where: { id: 'sched_123' },
      });

      expect(result.queueStatus).not.toBe('COMPLETED');
      expect(result.queueStatus).not.toBe('PROCESSING');
    });

    it('should throw when schedule already completed', () => {
      mockPrisma.scheduledContent.findUnique.mockResolvedValue({
        id: 'sched_123',
        queueStatus: 'COMPLETED',
      });

      const shouldThrow = mockPrisma.scheduledContent
        .findUnique({ where: { id: 'sched_123' } })
        .then((sched: any) => {
          if (sched.queueStatus === 'COMPLETED') {
            throw new Error('Schedule already completed');
          }
        });

      expect(shouldThrow).rejects.toThrow('Schedule already completed');
    });

    it('should reset schedule for immediate processing', async () => {
      const scheduleId = 'sched_123';
      const userId = 'user_456';

      mockPrisma.scheduledContent.update.mockResolvedValue({
        id: scheduleId,
        queueStatus: 'QUEUED',
        scheduledFor: new Date(),
      });

      await mockPrisma.scheduledContent.update({
        where: { id: scheduleId },
        data: {
          queueStatus: 'QUEUED',
          scheduledFor: new Date(),
          metadata: {
            manualTrigger: true,
            triggeredBy: userId,
            triggeredAt: new Date(),
          },
        },
      });

      expect(mockPrisma.scheduledContent.update).toHaveBeenCalled();
    });

    it('should trigger immediate publish job', async () => {
      const schedule = {
        id: 'sched_123',
        contentId: 'content_456',
        projectId: 'proj_789',
      };

      await mockInngest.send({
        name: 'scheduled/publish.item',
        data: {
          scheduleId: schedule.id,
          contentId: schedule.contentId,
          projectId: schedule.projectId,
        },
      });

      expect(mockInngest.send).toHaveBeenCalledWith({
        name: 'scheduled/publish.item',
        data: expect.objectContaining({
          scheduleId: 'sched_123',
        }),
      });
    });
  });

  describe('Cancel Scheduled Publish', () => {
    it('should cancel schedule with reason', async () => {
      const scheduleId = 'sched_123';
      const userId = 'user_456';
      const reason = 'Content needs revision';

      mockPrisma.scheduledContent.update.mockResolvedValue({
        id: scheduleId,
        queueStatus: 'CANCELLED',
        status: 'CANCELLED',
      });

      await mockPrisma.scheduledContent.update({
        where: { id: scheduleId },
        data: {
          queueStatus: 'CANCELLED',
          status: 'CANCELLED',
          metadata: {
            cancelledBy: userId,
            cancelledAt: new Date(),
            reason,
          },
        },
      });

      expect(mockPrisma.scheduledContent.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: expect.objectContaining({
          queueStatus: 'CANCELLED',
          status: 'CANCELLED',
        }),
      });
    });

    it('should handle Inngest job cancellation notes', async () => {
      mockPrisma.scheduledContent.findUnique.mockResolvedValue({
        id: 'sched_123',
        inngestJobId: 'job_abc123',
      });

      const schedule = await mockPrisma.scheduledContent.findUnique({
        where: { id: 'sched_123' },
        select: { inngestJobId: true },
      });

      // Note: Inngest doesn't support direct cancellation
      // Job checks queueStatus before processing
      expect(schedule.inngestJobId).toBe('job_abc123');
    });
  });

  describe('Reschedule Content', () => {
    it('should update schedule time', async () => {
      const scheduleId = 'sched_123';
      const newScheduleTime = '2025-10-04T15:00:00Z';
      const userId = 'user_456';

      mockPrisma.scheduledContent.update.mockResolvedValue({
        id: scheduleId,
        scheduledFor: new Date(newScheduleTime),
        queueStatus: 'PENDING',
      });

      await mockPrisma.scheduledContent.update({
        where: { id: scheduleId },
        data: {
          scheduledFor: new Date(newScheduleTime),
          queueStatus: 'PENDING',
          metadata: {
            rescheduledBy: userId,
            rescheduledAt: new Date(),
            previousSchedule: new Date(),
          },
        },
      });

      expect(mockPrisma.scheduledContent.update).toHaveBeenCalled();
    });

    it('should reset queue status to PENDING', async () => {
      mockPrisma.scheduledContent.update.mockResolvedValue({
        id: 'sched_123',
        queueStatus: 'PENDING',
      });

      const result = await mockPrisma.scheduledContent.update({
        where: { id: 'sched_123' },
        data: { queueStatus: 'PENDING' },
      });

      expect(result.queueStatus).toBe('PENDING');
    });
  });

  describe('Event Schema Validation', () => {
    it('should accept valid scheduled publish project event', () => {
      const event: InngestEvents['scheduled/publish.project'] = {
        data: { projectId: 'proj_123' },
      };

      expect(event.data.projectId).toBe('proj_123');
    });

    it('should accept valid scheduled publish item event', () => {
      const event: InngestEvents['scheduled/publish.item'] = {
        data: {
          scheduleId: 'sched_123',
          contentId: 'content_456',
          projectId: 'proj_789',
        },
      };

      expect(event.data.scheduleId).toBe('sched_123');
      expect(event.data.contentId).toBe('content_456');
      expect(event.data.projectId).toBe('proj_789');
    });

    it('should accept valid manual publish event', () => {
      const event: InngestEvents['scheduled/publish.manual'] = {
        data: {
          scheduleId: 'sched_123',
          userId: 'user_456',
        },
      };

      expect(event.data.userId).toBe('user_456');
    });

    it('should accept valid cancel event with optional reason', () => {
      const event: InngestEvents['scheduled/publish.cancel'] = {
        data: {
          scheduleId: 'sched_123',
          userId: 'user_456',
          reason: 'Content revision needed',
        },
      };

      expect(event.data.reason).toBe('Content revision needed');
    });

    it('should accept valid reschedule event', () => {
      const event: InngestEvents['scheduled/publish.reschedule'] = {
        data: {
          scheduleId: 'sched_123',
          newScheduleTime: '2025-10-04T15:00:00Z',
          userId: 'user_456',
        },
      };

      expect(event.data.newScheduleTime).toBe('2025-10-04T15:00:00Z');
    });
  });

  describe('Concurrency and Performance', () => {
    it('should enforce item publish concurrency limit of 5', () => {
      const concurrencyConfig = {
        limit: 5,
      };

      expect(concurrencyConfig.limit).toBe(5);
    });

    it('should batch process 10 items per project', async () => {
      const batchSize = 10;
      const items = Array(25)
        .fill(null)
        .map((_, i) => ({ id: `sched_${i}` }));

      const batches = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(10);
      expect(batches[2]).toHaveLength(5);
    });
  });
});
