/**
 * Content Metrics API Endpoint
 * GET /api/analytics/content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { getContentMetrics, aggregateMetricsByPeriod } from '@/lib/analytics/metrics';
import { MetricPeriodType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const periodType = searchParams.get('periodType') as MetricPeriodType | null;

    if (!projectId || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectId, from, to' },
        { status: 400 }
      );
    }

    const dateRange = {
      from: new Date(from),
      to: new Date(to),
    };

    // Get aggregated metrics if period type is specified
    if (periodType) {
      const aggregatedMetrics = await aggregateMetricsByPeriod(projectId, periodType, dateRange);
      return NextResponse.json({
        success: true,
        periodType,
        metrics: aggregatedMetrics,
      });
    }

    // Get real-time metrics
    const metrics = await getContentMetrics(projectId, dateRange);

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('Content metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content metrics', details: error.message },
      { status: 500 }
    );
  }
}
