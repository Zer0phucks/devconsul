/**
 * Metrics Aggregation Engine
 * Aggregates raw data into time-period based metrics
 */

import { db } from '@/lib/db';
import { MetricPeriodType } from '@prisma/client';
import { getContentMetrics } from './metrics';

/**
 * Get start and end dates for a period type
 */
export function getPeriodDates(date: Date, periodType: MetricPeriodType) {
  const start = new Date(date);
  const end = new Date(date);

  switch (periodType) {
    case 'HOURLY':
      start.setMinutes(0, 0, 0);
      end.setMinutes(59, 59, 999);
      break;
    case 'DAILY':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'WEEKLY':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'MONTHLY':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'QUARTERLY':
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'YEARLY':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { periodStart: start, periodEnd: end };
}

/**
 * Aggregate content metrics for a period
 */
export async function aggregateContentMetrics(
  projectId: string,
  date: Date,
  periodType: MetricPeriodType
) {
  const { periodStart, periodEnd } = getPeriodDates(date, periodType);

  // Get content metrics for the period
  const metrics = await getContentMetrics(projectId, {
    from: periodStart,
    to: periodEnd,
  });

  // Upsert the aggregated metrics
  const contentMetrics = await db.contentMetrics.upsert({
    where: {
      projectId_periodStart_periodEnd_periodType: {
        projectId,
        periodStart,
        periodEnd,
        periodType,
      },
    },
    update: {
      totalGenerated: metrics.totalGenerated,
      totalPublished: metrics.totalPublished,
      totalFailed: metrics.totalFailed,
      generationSuccessRate: metrics.generationSuccessRate,
      publishSuccessRate: metrics.publishSuccessRate,

      blogPosts: metrics.contentTypeBreakdown.blogPosts,
      emailCampaigns: metrics.contentTypeBreakdown.emailCampaigns,
      socialPosts: metrics.contentTypeBreakdown.socialPosts,

      platformBreakdown: metrics.platformBreakdown,

      openaiGenerations: metrics.aiProviderStats.openai.generations,
      anthropicGenerations: metrics.aiProviderStats.anthropic.generations,
      openaiTokens: metrics.aiProviderStats.openai.tokens,
      anthropicTokens: metrics.aiProviderStats.anthropic.tokens,
      openaiCost: metrics.aiProviderStats.openai.cost,
      anthropicCost: metrics.aiProviderStats.anthropic.cost,

      totalGeneratedTokens:
        metrics.aiProviderStats.openai.tokens + metrics.aiProviderStats.anthropic.tokens,
      totalGeneratedCost:
        metrics.aiProviderStats.openai.cost + metrics.aiProviderStats.anthropic.cost,

      avgContentPerDay: metrics.contentVelocity.avgPerDay,
      avgContentPerWeek: metrics.contentVelocity.avgPerWeek,
      avgContentPerMonth: metrics.contentVelocity.avgPerMonth,

      updatedAt: new Date(),
    },
    create: {
      projectId,
      periodStart,
      periodEnd,
      periodType,

      totalGenerated: metrics.totalGenerated,
      totalPublished: metrics.totalPublished,
      totalFailed: metrics.totalFailed,
      generationSuccessRate: metrics.generationSuccessRate,
      publishSuccessRate: metrics.publishSuccessRate,

      blogPosts: metrics.contentTypeBreakdown.blogPosts,
      emailCampaigns: metrics.contentTypeBreakdown.emailCampaigns,
      socialPosts: metrics.contentTypeBreakdown.socialPosts,

      platformBreakdown: metrics.platformBreakdown,

      openaiGenerations: metrics.aiProviderStats.openai.generations,
      anthropicGenerations: metrics.aiProviderStats.anthropic.generations,
      openaiTokens: metrics.aiProviderStats.openai.tokens,
      anthropicTokens: metrics.aiProviderStats.anthropic.tokens,
      openaiCost: metrics.aiProviderStats.openai.cost,
      anthropicCost: metrics.aiProviderStats.anthropic.cost,

      totalGeneratedTokens:
        metrics.aiProviderStats.openai.tokens + metrics.aiProviderStats.anthropic.tokens,
      totalGeneratedCost:
        metrics.aiProviderStats.openai.cost + metrics.aiProviderStats.anthropic.cost,

      avgContentPerDay: metrics.contentVelocity.avgPerDay,
      avgContentPerWeek: metrics.contentVelocity.avgPerWeek,
      avgContentPerMonth: metrics.contentVelocity.avgPerMonth,
    },
  });

  return contentMetrics;
}

/**
 * Aggregate all periods for a project
 */
export async function aggregateAllPeriods(projectId: string, endDate: Date = new Date()) {
  const results = {
    daily: null,
    weekly: null,
    monthly: null,
    quarterly: null,
    yearly: null,
  };

  // Aggregate for each period type
  results.daily = await aggregateContentMetrics(projectId, endDate, 'DAILY');
  results.weekly = await aggregateContentMetrics(projectId, endDate, 'WEEKLY');
  results.monthly = await aggregateContentMetrics(projectId, endDate, 'MONTHLY');
  results.quarterly = await aggregateContentMetrics(projectId, endDate, 'QUARTERLY');
  results.yearly = await aggregateContentMetrics(projectId, endDate, 'YEARLY');

  return results;
}

/**
 * Calculate content performance score
 */
export function calculatePerformanceScore(metrics: {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  engagementRate?: number;
}): number {
  // Weighted scoring system
  const weights = {
    views: 1,
    likes: 2,
    shares: 3,
    comments: 4,
    clicks: 2,
    engagementRate: 5,
  };

  let score = 0;

  score += (metrics.views || 0) * weights.views;
  score += (metrics.likes || 0) * weights.likes;
  score += (metrics.shares || 0) * weights.shares;
  score += (metrics.comments || 0) * weights.comments;
  score += (metrics.clicks || 0) * weights.clicks;
  score += (metrics.engagementRate || 0) * weights.engagementRate * 100;

  return Math.round(score);
}

/**
 * Update content performance record
 */
export async function updateContentPerformance(
  contentId: string,
  projectId: string,
  platformMetrics: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    clicks?: number;
    engagementRate?: number;
  }
) {
  const performanceScore = calculatePerformanceScore(platformMetrics);

  const performance = await db.contentPerformance.upsert({
    where: {
      contentId,
    },
    update: {
      totalViews: platformMetrics.views || 0,
      totalLikes: platformMetrics.likes || 0,
      totalShares: platformMetrics.shares || 0,
      totalComments: platformMetrics.comments || 0,
      totalClicks: platformMetrics.clicks || 0,
      avgEngagementRate: platformMetrics.engagementRate || 0,
      performanceScore,
      lastUpdated: new Date(),
    },
    create: {
      contentId,
      projectId,
      totalViews: platformMetrics.views || 0,
      totalLikes: platformMetrics.likes || 0,
      totalShares: platformMetrics.shares || 0,
      totalComments: platformMetrics.comments || 0,
      totalClicks: platformMetrics.clicks || 0,
      avgEngagementRate: platformMetrics.engagementRate || 0,
      performanceScore,
    },
  });

  return performance;
}

/**
 * Track analytics event
 */
export async function trackAnalyticsEvent(
  projectId: string,
  eventType: string,
  metadata?: Record<string, any>
) {
  return await db.analyticsEvent.create({
    data: {
      projectId,
      eventType: eventType as any,
      eventData: metadata || {},
    },
  });
}

/**
 * Get analytics events for a period
 */
export async function getAnalyticsEvents(
  projectId: string,
  dateRange: { from: Date; to: Date },
  eventType?: string
) {
  return await db.analyticsEvent.findMany({
    where: {
      projectId,
      timestamp: { gte: dateRange.from, lte: dateRange.to },
      ...(eventType && { eventType: eventType as any }),
    },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Batch aggregate metrics for multiple days
 */
export async function batchAggregateMetrics(
  projectId: string,
  startDate: Date,
  endDate: Date,
  periodType: MetricPeriodType = 'DAILY'
) {
  const results = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const metrics = await aggregateContentMetrics(projectId, current, periodType);
    results.push(metrics);

    // Move to next period
    switch (periodType) {
      case 'HOURLY':
        current.setHours(current.getHours() + 1);
        break;
      case 'DAILY':
        current.setDate(current.getDate() + 1);
        break;
      case 'WEEKLY':
        current.setDate(current.getDate() + 7);
        break;
      case 'MONTHLY':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'QUARTERLY':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'YEARLY':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return results;
}
