/**
 * Content Metrics Calculation Utilities
 * Provides functions for calculating and aggregating content metrics
 */

import { db } from '@/lib/db';
import { MetricPeriodType } from '@prisma/client';

export interface ContentMetricsResult {
  totalGenerated: number;
  totalPublished: number;
  totalFailed: number;
  generationSuccessRate: number;
  publishSuccessRate: number;
  contentTypeBreakdown: {
    blogPosts: number;
    emailCampaigns: number;
    socialPosts: number;
  };
  platformBreakdown: Record<string, number>;
  aiProviderStats: {
    openai: { generations: number; tokens: number; cost: number };
    anthropic: { generations: number; tokens: number; cost: number };
  };
  contentVelocity: {
    avgPerDay: number;
    avgPerWeek: number;
    avgPerMonth: number;
  };
}

export async function getContentMetrics(
  projectId: string,
  dateRange: { from: Date; to: Date }
): Promise<ContentMetricsResult> {
  const content = await db.content.findMany({
    where: {
      projectId,
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    },
    include: {
      publications: true,
    },
  });

  const totalGenerated = content.length;
  const totalPublished = content.filter((c) => c.status === 'PUBLISHED').length;
  const totalFailed = content.filter((c) => c.status === 'FAILED').length;

  const generationSuccessRate =
    totalGenerated > 0 ? (totalPublished / totalGenerated) * 100 : 0;

  // Calculate publish success rate per platform
  const publishAttempts = content.reduce(
    (sum, c) => sum + (c.publications?.length || 0),
    0
  );
  const publishSuccesses = content.reduce(
    (sum, c) => sum + (c.publications?.filter((p) => p.status === 'PUBLISHED').length || 0),
    0
  );
  const publishSuccessRate =
    publishAttempts > 0 ? (publishSuccesses / publishAttempts) * 100 : 0;

  // Content type breakdown
  const contentTypeBreakdown = {
    blogPosts: content.filter((c) => c.sourceType === 'BLOG_POST').length,
    emailCampaigns: content.filter((c) => c.sourceType === 'EMAIL').length,
    socialPosts: content.filter((c) =>
      ['TWITTER', 'LINKEDIN', 'FACEBOOK', 'REDDIT'].includes(c.sourceType)
    ).length,
  };

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {};
  content.forEach((c) => {
    c.publications?.forEach((p) => {
      const platform = p.platform;
      platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;
    });
  });

  // AI provider stats
  const aiProviderStats = {
    openai: { generations: 0, tokens: 0, cost: 0 },
    anthropic: { generations: 0, tokens: 0, cost: 0 },
  };

  content.forEach((c) => {
    if (c.isAIGenerated && c.aiMetadata) {
      const metadata = c.aiMetadata as any;
      const provider = metadata.provider || 'openai';

      if (provider === 'openai') {
        aiProviderStats.openai.generations++;
        aiProviderStats.openai.tokens += metadata.tokensUsed?.total || 0;
        aiProviderStats.openai.cost += metadata.cost || 0;
      } else if (provider === 'anthropic') {
        aiProviderStats.anthropic.generations++;
        aiProviderStats.anthropic.tokens += metadata.tokensUsed?.total || 0;
        aiProviderStats.anthropic.cost += metadata.cost || 0;
      }
    }
  });

  // Content velocity
  const daysDiff = Math.max(
    1,
    Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
  );
  const avgPerDay = totalGenerated / daysDiff;
  const avgPerWeek = avgPerDay * 7;
  const avgPerMonth = avgPerDay * 30;

  return {
    totalGenerated,
    totalPublished,
    totalFailed,
    generationSuccessRate,
    publishSuccessRate,
    contentTypeBreakdown,
    platformBreakdown,
    aiProviderStats,
    contentVelocity: {
      avgPerDay,
      avgPerWeek,
      avgPerMonth,
    },
  };
}

export async function aggregateMetricsByPeriod(
  projectId: string,
  periodType: MetricPeriodType,
  dateRange: { from: Date; to: Date }
) {
  const metrics = await db.contentMetrics.findMany({
    where: {
      projectId,
      periodType,
      periodStart: { gte: dateRange.from },
      periodEnd: { lte: dateRange.to },
    },
    orderBy: { periodStart: 'asc' },
  });

  return metrics;
}

export async function getPlatformEngagementMetrics(
  projectId: string,
  dateRange: { from: Date; to: Date }
) {
  const metrics = await db.platformMetrics.findMany({
    where: {
      projectId,
      periodStart: { gte: dateRange.from },
      periodEnd: { lte: dateRange.to },
    },
    orderBy: { periodStart: 'asc' },
  });

  // Aggregate by platform type
  const platformAggregates: Record<
    string,
    {
      totalViews: number;
      totalLikes: number;
      totalShares: number;
      totalComments: number;
      totalClicks: number;
      totalImpressions: number;
      avgEngagementRate: number;
      avgCTR: number;
      followerGrowth: number;
    }
  > = {};

  metrics.forEach((m) => {
    const platform = m.platformType;
    if (!platformAggregates[platform]) {
      platformAggregates[platform] = {
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        totalClicks: 0,
        totalImpressions: 0,
        avgEngagementRate: 0,
        avgCTR: 0,
        followerGrowth: 0,
      };
    }

    platformAggregates[platform].totalViews += m.views || 0;
    platformAggregates[platform].totalLikes += m.likes || 0;
    platformAggregates[platform].totalShares += m.shares || 0;
    platformAggregates[platform].totalComments += m.comments || 0;
    platformAggregates[platform].totalClicks += m.clicks || 0;
    platformAggregates[platform].totalImpressions += m.impressions || 0;
    platformAggregates[platform].followerGrowth += m.followerGrowth || 0;
  });

  // Calculate averages
  Object.keys(platformAggregates).forEach((platform) => {
    const platformMetrics = metrics.filter((m) => m.platformType === platform);
    const count = platformMetrics.length;

    if (count > 0) {
      const totalEngagementRate = platformMetrics.reduce(
        (sum, m) => sum + (m.engagementRate || 0),
        0
      );
      const totalCTR = platformMetrics.reduce((sum, m) => sum + (m.clickThroughRate || 0), 0);

      platformAggregates[platform].avgEngagementRate = totalEngagementRate / count;
      platformAggregates[platform].avgCTR = totalCTR / count;
    }
  });

  return {
    metrics,
    platformAggregates,
  };
}

export async function getTopPerformingContent(
  projectId: string,
  dateRange: { from: Date; to: Date },
  limit: number = 10
) {
  const performance = await db.contentPerformance.findMany({
    where: {
      projectId,
      recordedAt: { gte: dateRange.from, lte: dateRange.to },
    },
    orderBy: { performanceScore: 'desc' },
    take: limit,
    include: {
      content: {
        select: {
          id: true,
          title: true,
          sourceType: true,
          createdAt: true,
        },
      },
    },
  });

  return performance;
}

export async function getBestPostingTimes(
  projectId: string,
  platformType: string,
  dateRange: { from: Date; to: Date }
) {
  const metrics = await db.platformMetrics.findMany({
    where: {
      projectId,
      platformType: platformType as any,
      periodStart: { gte: dateRange.from },
      periodEnd: { lte: dateRange.to },
    },
    select: {
      periodStart: true,
      engagementRate: true,
      views: true,
      likes: true,
      shares: true,
      comments: true,
    },
  });

  // Group by hour of day
  const hourlyEngagement: Record<number, { count: number; totalEngagement: number }> = {};

  metrics.forEach((m) => {
    const hour = m.periodStart.getHours();
    if (!hourlyEngagement[hour]) {
      hourlyEngagement[hour] = { count: 0, totalEngagement: 0 };
    }
    hourlyEngagement[hour].count++;
    hourlyEngagement[hour].totalEngagement += m.engagementRate || 0;
  });

  // Calculate average engagement per hour
  const hourlyAverages = Object.entries(hourlyEngagement).map(([hour, data]) => ({
    hour: parseInt(hour),
    avgEngagement: data.totalEngagement / data.count,
  }));

  // Sort by engagement
  hourlyAverages.sort((a, b) => b.avgEngagement - a.avgEngagement);

  return hourlyAverages.slice(0, 5); // Top 5 hours
}
