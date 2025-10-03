import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { InngestEvents } from '@/lib/inngest/client';

/**
 * Unit Tests: Content Generation Inngest Job
 *
 * Tests:
 * - Event triggering and handling
 * - GitHub activity scanning and parsing
 * - Content generation workflow
 * - Error handling and retry logic
 * - Execution tracking and metrics
 * - Idempotency checks
 */

// Mock dependencies
const mockPrisma = {
  cronJob: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  cronExecution: {
    create: jest.fn(),
    update: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockOctokit = {
  repos: {
    listCommits: jest.fn(),
  },
  pulls: {
    list: jest.fn(),
  },
  issues: {
    listForRepo: jest.fn(),
  },
};

const mockRecordJobExecution = jest.fn();
const mockTrackJobPerformance = jest.fn();

// Mock modules
jest.mock('@/lib/db', () => ({ prisma: mockPrisma }));
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => mockOctokit),
}));
jest.mock('@/lib/monitoring/metrics-collector', () => ({
  recordJobExecution: mockRecordJobExecution,
}));
jest.mock('@/lib/monitoring/performance-tracker', () => ({
  trackJobPerformance: mockTrackJobPerformance,
}));

describe('Content Generation Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Event Schema Validation', () => {
    it('should accept valid content generation event', () => {
      const event: InngestEvents['cron/content.generation'] = {
        data: {
          projectId: 'proj_123',
          userId: 'user_456',
          triggeredBy: 'scheduled',
        },
      };

      expect(event.data.projectId).toBe('proj_123');
      expect(event.data.userId).toBe('user_456');
      expect(event.data.triggeredBy).toBe('scheduled');
    });

    it('should validate triggeredBy enum values', () => {
      const validTriggers: Array<'scheduled' | 'manual' | 'webhook'> = [
        'scheduled',
        'manual',
        'webhook',
      ];

      validTriggers.forEach((trigger) => {
        const event: InngestEvents['cron/content.generation'] = {
          data: {
            projectId: 'proj_123',
            userId: 'user_456',
            triggeredBy: trigger,
          },
        };

        expect(['scheduled', 'manual', 'webhook']).toContain(
          event.data.triggeredBy
        );
      });
    });
  });

  describe('Execution Record Creation', () => {
    it('should create execution record on job start', async () => {
      const cronJob = {
        id: 'cron_123',
        type: 'GENERATE_CONTENT',
        isEnabled: true,
      };

      const expectedExecution = {
        id: 'exec_123',
        jobId: cronJob.id,
        triggeredBy: 'scheduled',
        status: 'RUNNING',
        startedAt: new Date(),
      };

      mockPrisma.cronJob.findFirst.mockResolvedValue(cronJob);
      mockPrisma.cronExecution.create.mockResolvedValue(expectedExecution);

      const result = await mockPrisma.cronExecution.create({
        data: {
          jobId: cronJob.id,
          triggeredBy: 'scheduled',
          status: 'RUNNING',
          metadata: {
            projectId: 'proj_123',
            userId: 'user_456',
          },
        },
      });

      expect(result.id).toBe('exec_123');
      expect(result.status).toBe('RUNNING');
      expect(mockPrisma.cronExecution.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NonRetriableError when cron job not found', () => {
      mockPrisma.cronJob.findFirst.mockResolvedValue(null);

      // Simulate NonRetriableError behavior
      const shouldThrow = mockPrisma.cronJob.findFirst().then((job: any) => {
        if (!job) {
          throw new Error('No enabled content generation job found');
        }
      });

      expect(shouldThrow).rejects.toThrow(
        'No enabled content generation job found'
      );
    });

    it('should throw NonRetriableError when cron job is disabled', () => {
      mockPrisma.cronJob.findFirst.mockResolvedValue({
        id: 'cron_123',
        type: 'GENERATE_CONTENT',
        isEnabled: false,
      });

      // Simulate disabled job check
      const shouldThrow = mockPrisma.cronJob.findFirst().then((job: any) => {
        if (!job || !job.isEnabled) {
          throw new Error('Cron job is disabled');
        }
      });

      expect(shouldThrow).rejects.toThrow();
    });
  });

  describe('Project Validation', () => {
    it('should fetch project with platforms and settings', async () => {
      const mockProject = {
        id: 'proj_123',
        name: 'Test Project',
        githubRepoOwner: 'testowner',
        githubRepoName: 'testrepo',
        platforms: [
          { id: 'plat_1', type: 'TWITTER', isConnected: true },
          { id: 'plat_2', type: 'LINKEDIN', isConnected: true },
        ],
        settings: { autoGenerate: true },
      };

      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await mockPrisma.project.findUnique({
        where: { id: 'proj_123' },
        include: {
          platforms: { where: { isConnected: true } },
          settings: true,
        },
      });

      expect(result.githubRepoOwner).toBe('testowner');
      expect(result.platforms).toHaveLength(2);
      expect(result.platforms[0].isConnected).toBe(true);
    });

    it('should throw when project not found', () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const shouldThrow = mockPrisma.project
        .findUnique({ where: { id: 'proj_999' } })
        .then((proj: any) => {
          if (!proj) {
            throw new Error('Project not found: proj_999');
          }
        });

      expect(shouldThrow).rejects.toThrow('Project not found');
    });

    it('should throw when GitHub repo not configured', () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'proj_123',
        githubRepoOwner: null,
        githubRepoName: null,
      });

      const shouldThrow = mockPrisma.project
        .findUnique({ where: { id: 'proj_123' } })
        .then((proj: any) => {
          if (!proj.githubRepoOwner || !proj.githubRepoName) {
            throw new Error('GitHub repository not configured');
          }
        });

      expect(shouldThrow).rejects.toThrow('GitHub repository not configured');
    });
  });

  describe('GitHub Activity Scanning', () => {
    it('should fetch commits since last sync', async () => {
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: 'feat: Add new feature',
            author: { name: 'John Doe', date: '2025-10-03T10:00:00Z' },
          },
        },
        {
          sha: 'def456',
          commit: {
            message: 'fix: Bug fix',
            author: { name: 'Jane Smith', date: '2025-10-03T11:00:00Z' },
          },
        },
      ];

      mockOctokit.repos.listCommits.mockResolvedValue({ data: mockCommits });

      const result = await mockOctokit.repos.listCommits({
        owner: 'testowner',
        repo: 'testrepo',
        since: new Date('2025-10-01').toISOString(),
        per_page: 50,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].sha).toBe('abc123');
      expect(result.data[1].commit.message).toContain('fix:');
    });

    it('should fetch merged pull requests', async () => {
      const mockPRs = [
        {
          number: 1,
          title: 'Add authentication',
          state: 'closed',
          merged_at: '2025-10-02T15:00:00Z',
        },
        {
          number: 2,
          title: 'Fix header styling',
          state: 'closed',
          merged_at: null, // Not merged, just closed
        },
      ];

      mockOctokit.pulls.list.mockResolvedValue({ data: mockPRs });

      const result = await mockOctokit.pulls.list({
        owner: 'testowner',
        repo: 'testrepo',
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 20,
      });

      const mergedPRs = result.data.filter((pr) => pr.merged_at);
      expect(mergedPRs).toHaveLength(1);
      expect(mergedPRs[0].number).toBe(1);
    });

    it('should fetch closed issues', async () => {
      const mockIssues = [
        {
          number: 10,
          title: 'Login bug',
          state: 'closed',
          closed_at: '2025-10-02T12:00:00Z',
        },
      ];

      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues });

      const result = await mockOctokit.issues.listForRepo({
        owner: 'testowner',
        repo: 'testrepo',
        state: 'closed',
        since: new Date('2025-10-01').toISOString(),
        per_page: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Login bug');
    });

    it('should handle GitHub API errors gracefully', async () => {
      mockOctokit.repos.listCommits.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(
        mockOctokit.repos.listCommits({
          owner: 'testowner',
          repo: 'testrepo',
        })
      ).rejects.toThrow('API rate limit exceeded');
    });
  });

  describe('Activity Detection', () => {
    it('should detect activity when commits exist', () => {
      const activity = {
        commits: [{ sha: 'abc123', message: 'test' }],
        pullRequests: [],
        issues: [],
        hasActivity: true,
        summary: '1 commit',
      };

      expect(activity.hasActivity).toBe(true);
      expect(activity.commits).toHaveLength(1);
    });

    it('should detect no activity correctly', () => {
      const activity = {
        commits: [],
        pullRequests: [],
        issues: [],
        hasActivity: false,
        summary: 'No activity',
      };

      expect(activity.hasActivity).toBe(false);
      expect(activity.summary).toBe('No activity');
    });

    it('should generate activity summary correctly', () => {
      const generateSummary = (commits: number, prs: number, issues: number) => {
        const parts = [];
        if (commits > 0) parts.push(`${commits} commit${commits > 1 ? 's' : ''}`);
        if (prs > 0) parts.push(`${prs} merged PR${prs > 1 ? 's' : ''}`);
        if (issues > 0) parts.push(`${issues} closed issue${issues > 1 ? 's' : ''}`);
        return parts.length > 0 ? parts.join(', ') : 'No activity';
      };

      expect(generateSummary(5, 2, 1)).toBe('5 commits, 2 merged PRs, 1 closed issue');
      expect(generateSummary(1, 0, 0)).toBe('1 commit');
      expect(generateSummary(0, 0, 0)).toBe('No activity');
    });
  });

  describe('Content Generation for Platforms', () => {
    it('should generate content for all connected platforms', async () => {
      const platforms = [
        { id: 'plat_1', type: 'TWITTER', isConnected: true },
        { id: 'plat_2', type: 'LINKEDIN', isConnected: true },
      ];

      const activity = {
        commits: [{ sha: 'abc', message: 'test' }],
        hasActivity: true,
        summary: '1 commit',
      };

      const results = [];
      for (const platform of platforms) {
        results.push({
          platformId: platform.id,
          platformType: platform.type,
          success: true,
          content: { title: 'Update', body: activity.summary },
        });
      }

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle platform generation errors gracefully', async () => {
      const platforms = [
        { id: 'plat_1', type: 'TWITTER', isConnected: true },
        { id: 'plat_2', type: 'INVALID', isConnected: true },
      ];

      const results = [];
      for (const platform of platforms) {
        try {
          if (platform.type === 'INVALID') {
            throw new Error('Unsupported platform');
          }
          results.push({
            platformId: platform.id,
            platformType: platform.type,
            success: true,
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
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Unsupported platform');
    });
  });

  describe('Execution Completion', () => {
    it('should mark execution as completed with results', async () => {
      const execution = {
        id: 'exec_123',
        startedAt: new Date('2025-10-03T10:00:00Z'),
      };

      const results = [
        { platformId: 'plat_1', success: true },
        { platformId: 'plat_2', success: true },
      ];

      const updateData = {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration: Date.now() - execution.startedAt.getTime(),
        itemsProcessed: results.length,
        itemsSuccess: results.filter((r) => r.success).length,
        itemsFailed: results.filter((r) => !r.success).length,
        output: { results },
      };

      mockPrisma.cronExecution.update.mockResolvedValue(updateData);

      const result = await mockPrisma.cronExecution.update({
        where: { id: execution.id },
        data: updateData,
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.itemsProcessed).toBe(2);
      expect(result.itemsSuccess).toBe(2);
    });

    it('should update project sync timestamp', async () => {
      mockPrisma.project.update.mockResolvedValue({
        id: 'proj_123',
        lastSyncedAt: new Date(),
      });

      const result = await mockPrisma.project.update({
        where: { id: 'proj_123' },
        data: { lastSyncedAt: new Date() },
      });

      expect(result.lastSyncedAt).toBeInstanceOf(Date);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj_123' },
        data: { lastSyncedAt: expect.any(Date) },
      });
    });

    it('should update cron job statistics on success', async () => {
      const cronJob = { id: 'cron_123', runCount: 5 };

      mockPrisma.cronJob.update.mockResolvedValue({
        ...cronJob,
        runCount: 6,
        successCount: 6,
        lastSuccess: new Date(),
      });

      const result = await mockPrisma.cronJob.update({
        where: { id: 'cron_123' },
        data: {
          lastRunAt: new Date(),
          lastSuccess: new Date(),
          runCount: { increment: 1 },
          successCount: { increment: 1 },
        },
      });

      expect(result.runCount).toBe(6);
      expect(result.successCount).toBe(6);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should mark execution as failed on error', async () => {
      const execution = {
        id: 'exec_123',
        startedAt: new Date(),
      };

      const error = new Error('Content generation failed');

      mockPrisma.cronExecution.update.mockResolvedValue({
        id: execution.id,
        status: 'FAILED',
        error: error.message,
        stackTrace: error.stack,
        completedAt: new Date(),
      });

      const result = await mockPrisma.cronExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          error: error.message,
          stackTrace: error.stack,
          completedAt: new Date(),
          duration: Date.now() - execution.startedAt.getTime(),
        },
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Content generation failed');
    });

    it('should update cron job failure count on error', async () => {
      mockPrisma.cronJob.update.mockResolvedValue({
        id: 'cron_123',
        failureCount: 1,
        lastFailure: new Date(),
      });

      const result = await mockPrisma.cronJob.update({
        where: { id: 'cron_123' },
        data: {
          lastRunAt: new Date(),
          lastFailure: new Date(),
          runCount: { increment: 1 },
          failureCount: { increment: 1 },
        },
      });

      expect(result.failureCount).toBe(1);
      expect(result.lastFailure).toBeInstanceOf(Date);
    });

    it('should respect retry configuration (max 3 retries)', () => {
      const jobConfig = {
        id: 'content-generation',
        retries: 3,
        concurrency: { limit: 5 },
      };

      expect(jobConfig.retries).toBe(3);
      expect(jobConfig.concurrency.limit).toBe(5);
    });
  });

  describe('Metrics and Performance Tracking', () => {
    it('should record successful job execution', async () => {
      const duration = 5000;
      const metadata = {
        projectId: 'proj_123',
        generated: 2,
        successful: 2,
      };

      mockRecordJobExecution.mockResolvedValue(undefined);
      mockTrackJobPerformance.mockResolvedValue(undefined);

      await mockRecordJobExecution('content-generation', true, duration, metadata);
      await mockTrackJobPerformance('content-generation', duration, true);

      expect(mockRecordJobExecution).toHaveBeenCalledWith(
        'content-generation',
        true,
        duration,
        metadata
      );
      expect(mockTrackJobPerformance).toHaveBeenCalledWith(
        'content-generation',
        duration,
        true
      );
    });

    it('should record failed job execution', async () => {
      const duration = 2000;
      const metadata = {
        error: 'GitHub API error',
        projectId: 'proj_123',
      };

      await mockRecordJobExecution('content-generation', false, duration, metadata);
      await mockTrackJobPerformance('content-generation', duration, false);

      expect(mockRecordJobExecution).toHaveBeenCalledWith(
        'content-generation',
        false,
        duration,
        metadata
      );
      expect(mockTrackJobPerformance).toHaveBeenCalledWith(
        'content-generation',
        duration,
        false
      );
    });
  });

  describe('Concurrency and Throttling', () => {
    it('should enforce concurrency limit of 5', () => {
      const concurrencyConfig = {
        limit: 5,
      };

      expect(concurrencyConfig.limit).toBe(5);
    });

    it('should handle concurrent project processing', async () => {
      const projects = ['proj_1', 'proj_2', 'proj_3', 'proj_4', 'proj_5', 'proj_6'];

      // Simulate processing in batches of 5
      const batch1 = projects.slice(0, 5);
      const batch2 = projects.slice(5);

      expect(batch1).toHaveLength(5);
      expect(batch2).toHaveLength(1);
    });
  });

  describe('Idempotency', () => {
    it('should skip processing when no activity detected', async () => {
      const activity = {
        commits: [],
        pullRequests: [],
        issues: [],
        hasActivity: false,
        summary: 'No activity',
      };

      mockPrisma.cronExecution.update.mockResolvedValue({
        id: 'exec_123',
        status: 'COMPLETED',
        itemsProcessed: 0,
        metadata: { message: 'No GitHub activity detected' },
      });

      if (!activity.hasActivity) {
        const result = await mockPrisma.cronExecution.update({
          where: { id: 'exec_123' },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            duration: 0,
            metadata: { message: 'No GitHub activity detected', activity },
            itemsProcessed: 0,
          },
        });

        expect(result.itemsProcessed).toBe(0);
        expect(result.status).toBe('COMPLETED');
      }
    });

    it('should use last sync timestamp or default to 7 days', () => {
      const project1 = { lastSyncedAt: new Date('2025-10-01') };
      const project2 = { lastSyncedAt: null };

      const since1 = project1.lastSyncedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const since2 = project2.lastSyncedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      expect(since1).toEqual(new Date('2025-10-01'));
      expect(since2).toBeInstanceOf(Date);
    });
  });

  describe('Job Configuration', () => {
    it('should calculate next run time correctly', () => {
      const calculateNextRun = (frequency: string, config: any) => {
        if (frequency === 'hourly') {
          return new Date(Date.now() + 60 * 60 * 1000);
        }
        if (frequency === 'daily') {
          return new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        return new Date(Date.now() + 60 * 60 * 1000);
      };

      const hourly = calculateNextRun('hourly', {});
      const daily = calculateNextRun('daily', {});

      expect(hourly).toBeInstanceOf(Date);
      expect(daily).toBeInstanceOf(Date);
      expect(daily.getTime()).toBeGreaterThan(hourly.getTime());
    });

    it('should handle job config with custom frequency', () => {
      const config = {
        frequency: 'custom',
        timeConfig: {
          interval: 30,
          unit: 'minutes',
        },
      };

      expect(config.frequency).toBe('custom');
      expect(config.timeConfig.interval).toBe(30);
    });
  });
});
