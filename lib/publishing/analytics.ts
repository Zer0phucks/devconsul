/**
 * Publishing Analytics
 *
 * Track and analyze publishing metrics and performance
 */

import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// ============================================
// PUBLISHING STATISTICS
// ============================================

/**
 * Get publishing statistics for project
 */
export async function getPublishingStats(
  projectId: string,
  dateRange?: {
    startDate: Date;
    endDate: Date;
  }
) {
  const where: any = {
    content: { projectId },
  };

  if (dateRange) {
    where.publishedAt = {
      gte: startOfDay(dateRange.startDate),
      lte: endOfDay(dateRange.endDate),
    };
  }

  // Get all publications
  const publications = await prisma.contentPublication.findMany({
    where,
    include: {
      platform: true,
      content: true,
    },
  });

  // Calculate statistics by platform
  const platformStats: Record<string, {
    platformId: string;
    platformName: string;
    platformType: string;
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
  }> = {};

  for (const pub of publications) {
    if (!platformStats[pub.platformId]) {
      platformStats[pub.platformId] = {
        platformId: pub.platformId,
        platformName: pub.platform.name,
        platformType: pub.platform.type,
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
      };
    }

    const stats = platformStats[pub.platformId];
    stats.total++;

    switch (pub.status) {
      case 'PUBLISHED':
        stats.successful++;
        break;
      case 'FAILED':
        stats.failed++;
        break;
      case 'PENDING':
      case 'RETRYING':
        stats.pending++;
        break;
    }

    stats.successRate = stats.total > 0
      ? (stats.successful / stats.total) * 100
      : 0;
  }

  // Overall statistics
  const overall = {
    totalPublications: publications.length,
    successful: publications.filter((p) => p.status === 'PUBLISHED').length,
    failed: publications.filter((p) => p.status === 'FAILED').length,
    pending: publications.filter((p) =>
      p.status === 'PENDING' || p.status === 'RETRYING'
    ).length,
    successRate: publications.length > 0
      ? (publications.filter((p) => p.status === 'PUBLISHED').length / publications.length) * 100
      : 0,
  };

  return {
    overall,
    byPlatform: Object.values(platformStats),
  };
}

/**
 * Get platform health score (0-100)
 */
export async function getPlatformHealthScore(platformId: string): Promise<number> {
  // Get recent publications (last 30 days)
  const thirtyDaysAgo = subDays(new Date(), 30);

  const publications = await prisma.contentPublication.findMany({
    where: {
      platformId,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  if (publications.length === 0) return 100; // No data = assume healthy

  const successful = publications.filter((p) => p.status === 'PUBLISHED').length;
  const failed = publications.filter((p) => p.status === 'FAILED').length;
  const retrying = publications.filter((p) => p.status === 'RETRYING').length;

  // Calculate health score
  const successRate = (successful / publications.length) * 100;
  const failureRate = (failed / publications.length) * 100;
  const retryRate = (retrying / publications.length) * 100;

  // Health score formula
  let score = 100;
  score -= failureRate * 0.5; // Failures hurt score
  score -= retryRate * 0.25; // Retries hurt score less
  score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

  return Math.round(score);
}

/**
 * Get publishing trends
 */
export async function getPublishingTrends(
  projectId: string,
  days: number = 30
): Promise<{
  daily: Array<{
    date: string;
    total: number;
    successful: number;
    failed: number;
  }>;
  summary: {
    totalDays: number;
    averagePerDay: number;
    peakDay: string;
    peakCount: number;
  };
}> {
  const startDate = subDays(new Date(), days);

  const publications = await prisma.contentPublication.findMany({
    where: {
      content: { projectId },
      createdAt: { gte: startDate },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by day
  const dailyStats: Record<string, {
    total: number;
    successful: number;
    failed: number;
  }> = {};

  for (const pub of publications) {
    const dateKey = format(pub.createdAt, 'yyyy-MM-dd');

    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = {
        total: 0,
        successful: 0,
        failed: 0,
      };
    }

    dailyStats[dateKey].total++;
    if (pub.status === 'PUBLISHED') {
      dailyStats[dateKey].successful++;
    } else if (pub.status === 'FAILED') {
      dailyStats[dateKey].failed++;
    }
  }

  const daily = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    ...stats,
  }));

  // Calculate summary
  const peakDay = daily.reduce((max, day) =>
    day.total > max.total ? day : max,
    daily[0] || { date: '', total: 0 }
  );

  const totalPublications = daily.reduce((sum, day) => sum + day.total, 0);
  const averagePerDay = daily.length > 0 ? totalPublications / daily.length : 0;

  return {
    daily,
    summary: {
      totalDays: daily.length,
      averagePerDay: Math.round(averagePerDay * 10) / 10,
      peakDay: peakDay.date,
      peakCount: peakDay.total,
    },
  };
}

/**
 * Get most published content types
 */
export async function getMostPublishedContentTypes(
  projectId: string,
  limit: number = 10
) {
  const content = await prisma.content.findMany({
    where: {
      projectId,
      publications: {
        some: {
          status: 'PUBLISHED',
        },
      },
    },
    include: {
      _count: {
        select: {
          publications: {
            where: {
              status: 'PUBLISHED',
            },
          },
        },
      },
    },
    orderBy: {
      publications: {
        _count: 'desc',
      },
    },
    take: limit,
  });

  return content.map((item) => ({
    contentId: item.id,
    title: item.title,
    sourceType: item.sourceType,
    publicationCount: item._count.publications,
    tags: item.tags,
  }));
}

/**
 * Get average time to publish
 */
export async function getAverageTimeToPublish(
  projectId: string
): Promise<{
  averageMinutes: number;
  byPlatform: Record<string, number>;
}> {
  const publications = await prisma.contentPublication.findMany({
    where: {
      content: { projectId },
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    include: {
      platform: true,
    },
  });

  const times: number[] = [];
  const platformTimes: Record<string, number[]> = {};

  for (const pub of publications) {
    if (!pub.publishedAt) continue;

    const timeToPublish = pub.publishedAt.getTime() - pub.createdAt.getTime();
    const minutes = timeToPublish / 1000 / 60;

    times.push(minutes);

    if (!platformTimes[pub.platformId]) {
      platformTimes[pub.platformId] = [];
    }
    platformTimes[pub.platformId].push(minutes);
  }

  const averageMinutes = times.length > 0
    ? times.reduce((sum, t) => sum + t, 0) / times.length
    : 0;

  const byPlatform: Record<string, number> = {};
  for (const [platformId, platformTimesArray] of Object.entries(platformTimes)) {
    byPlatform[platformId] = platformTimesArray.reduce((sum, t) => sum + t, 0) / platformTimesArray.length;
  }

  return {
    averageMinutes: Math.round(averageMinutes * 10) / 10,
    byPlatform: Object.fromEntries(
      Object.entries(byPlatform).map(([id, avg]) => [id, Math.round(avg * 10) / 10])
    ),
  };
}

/**
 * Get peak publishing times
 */
export async function getPeakPublishingTimes(
  projectId: string
): Promise<{
  byHour: Array<{ hour: number; count: number }>;
  byDayOfWeek: Array<{ day: number; dayName: string; count: number }>;
}> {
  const publications = await prisma.contentPublication.findMany({
    where: {
      content: { projectId },
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
  });

  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<number, number> = {};

  for (const pub of publications) {
    if (!pub.publishedAt) continue;

    const hour = pub.publishedAt.getHours();
    const day = pub.publishedAt.getDay();

    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    byHour: Object.entries(hourCounts).map(([hour, count]) => ({
      hour: Number(hour),
      count,
    })),
    byDayOfWeek: Object.entries(dayCounts).map(([day, count]) => ({
      day: Number(day),
      dayName: dayNames[Number(day)],
      count,
    })),
  };
}
