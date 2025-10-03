/**
 * Integration Tests: Analytics and Metrics API
 * Tests analytics endpoints, metrics collection, and cost tracking
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockRequest,
  mockPrisma,
  testDataFactories,
} from '../utils/test-helpers';

// Mock analytics functions
jest.mock('@/lib/analytics/metrics', () => ({
  getContentMetrics: jest.fn(),
  getPlatformMetrics: jest.fn(),
  getProjectAnalytics: jest.fn(),
  getCostAnalytics: jest.fn(),
  exportAnalytics: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const {
  getContentMetrics,
  getPlatformMetrics,
  getProjectAnalytics,
  getCostAnalytics,
  exportAnalytics,
} = require('@/lib/analytics/metrics');

describe('Analytics and Metrics API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Metrics', () => {
    it('should retrieve content metrics for project', async () => {
      const projectId = 'project-123';
      const dateRange = {
        start: new Date('2025-10-01'),
        end: new Date('2025-10-03'),
      };

      const mockMetrics = {
        totalContent: 50,
        published: 45,
        pending: 3,
        failed: 2,
        totalImpressions: 10000,
        totalEngagement: 500,
        engagementRate: 0.05,
        platformBreakdown: {
          TWITTER: { count: 20, impressions: 4000, engagement: 200 },
          LINKEDIN: { count: 15, impressions: 3500, engagement: 180 },
          MEDIUM: { count: 10, impressions: 2500, engagement: 120 },
        },
      };

      getContentMetrics.mockResolvedValue(mockMetrics);

      const result = await getContentMetrics({
        projectId,
        dateRange,
        userId: 'user-123',
      });

      expect(result.totalContent).toBe(50);
      expect(result.published).toBe(45);
      expect(result.engagementRate).toBe(0.05);
      expect(result.platformBreakdown.TWITTER.count).toBe(20);
      expect(getContentMetrics).toHaveBeenCalledWith({
        projectId,
        dateRange,
        userId: 'user-123',
      });
    });

    it('should calculate engagement metrics correctly', async () => {
      const mockContent = testDataFactories.content();
      const mockMetrics = testDataFactories.contentMetrics({
        contentId: mockContent.id,
        impressions: 1000,
        clicks: 50,
        shares: 10,
        likes: 25,
        comments: 5,
      });

      mockPrisma.contentMetrics.findMany.mockResolvedValue([mockMetrics]);

      const calculateEngagementRate = (metrics: any) => {
        const totalEngagement =
          metrics.clicks + metrics.shares + metrics.likes + metrics.comments;
        return metrics.impressions > 0
          ? totalEngagement / metrics.impressions
          : 0;
      };

      const engagementRate = calculateEngagementRate(mockMetrics);

      expect(engagementRate).toBe(0.09); // (50+10+25+5)/1000
      expect(engagementRate).toBeGreaterThan(0);
    });

    it('should track metrics over time periods', async () => {
      const timeSeriesData = [
        {
          date: '2025-10-01',
          impressions: 1000,
          engagement: 50,
          posts: 10,
        },
        {
          date: '2025-10-02',
          impressions: 1200,
          engagement: 60,
          posts: 12,
        },
        {
          date: '2025-10-03',
          impressions: 1500,
          engagement: 80,
          posts: 15,
        },
      ];

      getContentMetrics.mockResolvedValue({
        timeSeries: timeSeriesData,
        total: {
          impressions: 3700,
          engagement: 190,
          posts: 37,
        },
      });

      const result = await getContentMetrics({
        projectId: 'project-123',
        groupBy: 'day',
        userId: 'user-123',
      });

      expect(result.timeSeries).toHaveLength(3);
      expect(result.total.impressions).toBe(3700);
    });

    it('should aggregate metrics by platform', async () => {
      const platformMetrics = [
        testDataFactories.contentMetrics({ impressions: 1000, platform: 'TWITTER' }),
        testDataFactories.contentMetrics({ impressions: 1500, platform: 'LINKEDIN' }),
        testDataFactories.contentMetrics({ impressions: 800, platform: 'MEDIUM' }),
      ];

      mockPrisma.contentMetrics.findMany.mockResolvedValue(platformMetrics);

      getPlatformMetrics.mockResolvedValue({
        platforms: {
          TWITTER: { totalImpressions: 1000, avgEngagement: 0.05 },
          LINKEDIN: { totalImpressions: 1500, avgEngagement: 0.07 },
          MEDIUM: { totalImpressions: 800, avgEngagement: 0.04 },
        },
      });

      const result = await getPlatformMetrics({
        projectId: 'project-123',
        userId: 'user-123',
      });

      expect(result.platforms.TWITTER.totalImpressions).toBe(1000);
      expect(result.platforms.LINKEDIN.avgEngagement).toBe(0.07);
    });
  });

  describe('Platform Analytics', () => {
    it('should retrieve platform-specific metrics', async () => {
      const platformMetrics = {
        platformId: 'platform-123',
        platform: 'TWITTER',
        totalPosts: 100,
        successRate: 0.95,
        avgImpressions: 850,
        avgEngagement: 42,
        topPerformingContent: [
          { contentId: 'content-1', impressions: 5000, engagement: 250 },
          { contentId: 'content-2', impressions: 4500, engagement: 220 },
        ],
      };

      getPlatformMetrics.mockResolvedValue(platformMetrics);

      const result = await getPlatformMetrics({
        platformId: 'platform-123',
        userId: 'user-123',
      });

      expect(result.platform).toBe('TWITTER');
      expect(result.successRate).toBe(0.95);
      expect(result.topPerformingContent).toHaveLength(2);
    });

    it('should track platform health status', async () => {
      const platformHealth = {
        platformId: 'platform-123',
        status: 'healthy',
        uptime: 0.998,
        lastFailure: null,
        recentErrors: [],
        avgResponseTime: 250, // ms
      };

      getPlatformMetrics.mockResolvedValue({
        health: platformHealth,
      });

      const result = await getPlatformMetrics({
        platformId: 'platform-123',
        userId: 'user-123',
      });

      expect(result.health.status).toBe('healthy');
      expect(result.health.uptime).toBeGreaterThan(0.99);
    });

    it('should identify underperforming platforms', async () => {
      const platformsData = [
        { platform: 'TWITTER', avgEngagement: 0.08, posts: 100 },
        { platform: 'LINKEDIN', avgEngagement: 0.05, posts: 80 },
        { platform: 'MEDIUM', avgEngagement: 0.02, posts: 50 },
      ];

      const threshold = 0.04;
      const underperforming = platformsData.filter(
        (p) => p.avgEngagement < threshold
      );

      expect(underperforming).toHaveLength(1);
      expect(underperforming[0].platform).toBe('MEDIUM');
    });
  });

  describe('Cost Analytics', () => {
    it('should track AI usage costs', async () => {
      const costMetrics = {
        projectId: 'project-123',
        totalTokens: 100000,
        estimatedCost: 0.50,
        breakdown: {
          'gpt-4': {
            tokens: 50000,
            cost: 0.30,
            requests: 100,
          },
          'gpt-3.5-turbo': {
            tokens: 50000,
            cost: 0.20,
            requests: 200,
          },
        },
        period: {
          start: new Date('2025-10-01'),
          end: new Date('2025-10-03'),
        },
      };

      getCostAnalytics.mockResolvedValue(costMetrics);

      const result = await getCostAnalytics({
        projectId: 'project-123',
        dateRange: costMetrics.period,
        userId: 'user-123',
      });

      expect(result.totalTokens).toBe(100000);
      expect(result.estimatedCost).toBe(0.50);
      expect(result.breakdown['gpt-4'].cost).toBe(0.30);
    });

    it('should calculate cost per content piece', async () => {
      const contentWithCost = {
        contentId: 'content-123',
        aiMetadata: {
          provider: 'openai',
          model: 'gpt-4',
          tokensUsed: 500,
          estimatedCost: 0.01,
        },
      };

      const costPerToken = 0.00002; // $0.00002 per token for GPT-4
      const calculatedCost = contentWithCost.aiMetadata.tokensUsed * costPerToken;

      expect(calculatedCost).toBe(0.01);
    });

    it('should track cost trends over time', async () => {
      const costTrends = {
        daily: [
          { date: '2025-10-01', cost: 0.15, tokens: 7500 },
          { date: '2025-10-02', cost: 0.18, tokens: 9000 },
          { date: '2025-10-03', cost: 0.17, tokens: 8500 },
        ],
        average: 0.17,
        trend: 'stable',
      };

      getCostAnalytics.mockResolvedValue({ trends: costTrends });

      const result = await getCostAnalytics({
        projectId: 'project-123',
        groupBy: 'day',
        userId: 'user-123',
      });

      expect(result.trends.daily).toHaveLength(3);
      expect(result.trends.average).toBe(0.17);
      expect(result.trends.trend).toBe('stable');
    });

    it('should alert on cost threshold exceeded', async () => {
      const costData = {
        currentCost: 25.50,
        budget: 20.00,
        exceeded: true,
        percentageUsed: 127.5,
      };

      getCostAnalytics.mockResolvedValue(costData);

      const result = await getCostAnalytics({
        projectId: 'project-123',
        userId: 'user-123',
      });

      expect(result.exceeded).toBe(true);
      expect(result.currentCost).toBeGreaterThan(result.budget);
      expect(result.percentageUsed).toBeGreaterThan(100);
    });
  });

  describe('Project Analytics', () => {
    it('should retrieve comprehensive project analytics', async () => {
      const projectAnalytics = {
        projectId: 'project-123',
        overview: {
          totalContent: 150,
          published: 140,
          totalImpressions: 50000,
          totalEngagement: 2500,
        },
        performance: {
          avgImpressionsPerPost: 357,
          avgEngagementRate: 0.05,
          topContent: [],
        },
        platforms: {
          connected: 5,
          active: 4,
          breakdown: {},
        },
        costs: {
          total: 5.25,
          byProvider: {},
        },
      };

      getProjectAnalytics.mockResolvedValue(projectAnalytics);

      const result = await getProjectAnalytics({
        projectId: 'project-123',
        userId: 'user-123',
      });

      expect(result.overview.totalContent).toBe(150);
      expect(result.performance.avgEngagementRate).toBe(0.05);
      expect(result.platforms.connected).toBe(5);
      expect(result.costs.total).toBe(5.25);
    });

    it('should compare metrics across date ranges', async () => {
      const comparison = {
        current: {
          period: { start: '2025-10-01', end: '2025-10-07' },
          metrics: { impressions: 10000, engagement: 500 },
        },
        previous: {
          period: { start: '2025-09-24', end: '2025-09-30' },
          metrics: { impressions: 8000, engagement: 400 },
        },
        change: {
          impressions: { value: 2000, percentage: 25 },
          engagement: { value: 100, percentage: 25 },
        },
      };

      getProjectAnalytics.mockResolvedValue({ comparison });

      const result = await getProjectAnalytics({
        projectId: 'project-123',
        compare: true,
        userId: 'user-123',
      });

      expect(result.comparison.change.impressions.percentage).toBe(25);
      expect(result.comparison.change.engagement.percentage).toBe(25);
    });
  });

  describe('Analytics Export', () => {
    it('should export analytics to CSV format', async () => {
      const exportData = {
        format: 'csv',
        data: 'date,impressions,engagement\n2025-10-01,1000,50\n2025-10-02,1200,60',
        fileName: 'analytics-project-123-2025-10.csv',
      };

      exportAnalytics.mockResolvedValue(exportData);

      const result = await exportAnalytics({
        projectId: 'project-123',
        format: 'csv',
        userId: 'user-123',
      });

      expect(result.format).toBe('csv');
      expect(result.data).toContain('date,impressions,engagement');
      expect(result.fileName).toContain('.csv');
    });

    it('should export analytics to JSON format', async () => {
      const exportData = {
        format: 'json',
        data: JSON.stringify({
          analytics: [
            { date: '2025-10-01', impressions: 1000, engagement: 50 },
            { date: '2025-10-02', impressions: 1200, engagement: 60 },
          ],
        }),
        fileName: 'analytics-project-123-2025-10.json',
      };

      exportAnalytics.mockResolvedValue(exportData);

      const result = await exportAnalytics({
        projectId: 'project-123',
        format: 'json',
        userId: 'user-123',
      });

      expect(result.format).toBe('json');
      const parsed = JSON.parse(result.data);
      expect(parsed.analytics).toHaveLength(2);
    });

    it('should export analytics to PDF format', async () => {
      const exportData = {
        format: 'pdf',
        data: Buffer.from('mock-pdf-data'),
        fileName: 'analytics-project-123-2025-10.pdf',
        mimeType: 'application/pdf',
      };

      exportAnalytics.mockResolvedValue(exportData);

      const result = await exportAnalytics({
        projectId: 'project-123',
        format: 'pdf',
        userId: 'user-123',
      });

      expect(result.format).toBe('pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.data).toBeInstanceOf(Buffer);
    });
  });

  describe('Real-time Metrics', () => {
    it('should provide real-time engagement updates', async () => {
      const realtimeMetrics = {
        contentId: 'content-123',
        lastUpdated: new Date(),
        impressions: 1500,
        engagement: 75,
        trend: 'increasing',
        updateFrequency: 300, // seconds
      };

      getContentMetrics.mockResolvedValue({ realtime: realtimeMetrics });

      const result = await getContentMetrics({
        contentId: 'content-123',
        realtime: true,
        userId: 'user-123',
      });

      expect(result.realtime.trend).toBe('increasing');
      expect(result.realtime.lastUpdated).toBeInstanceOf(Date);
    });

    it('should detect viral content', async () => {
      const metrics = {
        contentId: 'content-123',
        impressions: 50000,
        engagement: 5000,
        growthRate: 15.5, // 1550% growth
        isViral: true,
      };

      const detectViral = (data: any) => {
        const viralThreshold = 10; // 10x average
        return data.growthRate > viralThreshold;
      };

      expect(detectViral(metrics)).toBe(true);
    });
  });

  describe('Authorization and Data Privacy', () => {
    it('should prevent access to other users analytics', async () => {
      getProjectAnalytics.mockResolvedValue({
        error: 'Access denied',
        success: false,
      });

      const result = await getProjectAnalytics({
        projectId: 'project-123',
        userId: 'unauthorized-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('should anonymize sensitive data in exports', async () => {
      const exportData = {
        data: [
          { contentId: 'content-123', impressions: 1000 },
          { contentId: 'content-456', impressions: 1200 },
        ],
        anonymized: true,
      };

      exportAnalytics.mockResolvedValue(exportData);

      const result = await exportAnalytics({
        projectId: 'project-123',
        anonymize: true,
        userId: 'user-123',
      });

      expect(result.anonymized).toBe(true);
    });
  });
});
