/**
 * Monitoring Statistics API Endpoint
 *
 * GET /api/monitoring/stats - Get error statistics and patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { apiErrorHandler } from '@/lib/monitoring/error-handler';
import { AuthorizationError } from '@/lib/monitoring/sentry';
import { ErrorLevel, ErrorStatus } from '@prisma/client';

/**
 * GET /api/monitoring/stats
 * Get monitoring statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError('Authentication required');
    }

    // Only admins can view stats
    if (session.user.role !== 'ADMIN') {
      throw new AuthorizationError('Admin access required');
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get error statistics
    const [
      totalErrors,
      newErrors,
      resolvedErrors,
      errorsByLevel,
      errorsByStatus,
      errorsByType,
      recentErrors,
      topErrors,
      errorPatterns,
      errorTrend,
    ] = await Promise.all([
      // Total errors in period
      prisma.errorLog.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // New errors
      prisma.errorLog.count({
        where: {
          createdAt: { gte: startDate },
          status: ErrorStatus.NEW,
        },
      }),

      // Resolved errors
      prisma.errorLog.count({
        where: {
          createdAt: { gte: startDate },
          status: ErrorStatus.RESOLVED,
        },
      }),

      // Errors by level
      prisma.errorLog.groupBy({
        by: ['level'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      }),

      // Errors by status
      prisma.errorLog.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      }),

      // Errors by type
      prisma.errorLog.groupBy({
        by: ['errorType'],
        where: {
          createdAt: { gte: startDate },
          errorType: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            errorType: 'desc',
          },
        },
        take: 10,
      }),

      // Recent errors
      prisma.errorLog.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          level: true,
          message: true,
          errorType: true,
          createdAt: true,
          status: true,
        },
      }),

      // Top errors by occurrences
      prisma.errorLog.findMany({
        where: {
          lastSeenAt: { gte: startDate },
        },
        orderBy: { occurrences: 'desc' },
        take: 10,
        select: {
          id: true,
          errorHash: true,
          level: true,
          message: true,
          errorType: true,
          occurrences: true,
          firstSeenAt: true,
          lastSeenAt: true,
          status: true,
        },
      }),

      // Error patterns
      prisma.errorPattern.findMany({
        where: {
          isActive: true,
          lastSeen: { gte: startDate },
        },
        orderBy: { occurrences: 'desc' },
        take: 10,
      }),

      // Error trend (daily counts)
      prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT
          DATE_TRUNC('day', "createdAt") as date,
          COUNT(*) as count
        FROM "error_logs"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `,
    ]);

    // Format error trend data
    const trend = errorTrend.map((item) => ({
      date: item.date,
      count: Number(item.count),
    }));

    // Calculate error rate
    const hoursInPeriod = days * 24;
    const errorRate = totalErrors / hoursInPeriod;

    // Calculate resolution rate
    const resolutionRate =
      totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

    return NextResponse.json({
      summary: {
        total: totalErrors,
        new: newErrors,
        resolved: resolvedErrors,
        errorRate: Math.round(errorRate * 100) / 100,
        resolutionRate: Math.round(resolutionRate * 100) / 100,
      },
      byLevel: errorsByLevel.reduce(
        (acc, item) => {
          acc[item.level] = item._count;
          return acc;
        },
        {} as Record<ErrorLevel, number>
      ),
      byStatus: errorsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<ErrorStatus, number>
      ),
      byType: errorsByType.map((item) => ({
        type: item.errorType,
        count: item._count,
      })),
      recent: recentErrors,
      topErrors,
      patterns: errorPatterns,
      trend,
    });
  } catch (error) {
    return apiErrorHandler(error as Error, request, {
      userId: (await getServerSession(authOptions))?.user?.id,
    });
  }
}
