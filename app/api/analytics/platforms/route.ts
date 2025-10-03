/**
 * Platform Engagement Metrics API Endpoint
 * GET /api/analytics/platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPlatformEngagementMetrics,
  getTopPerformingContent,
  getBestPostingTimes,
} from '@/lib/analytics/metrics';

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
    const action = searchParams.get('action') || 'engagement';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing required parameter: projectId' }, { status: 400 });
    }

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    const dateRange = {
      from: new Date(from),
      to: new Date(to),
    };

    // Handle different actions
    switch (action) {
      case 'engagement': {
        const engagement = await getPlatformEngagementMetrics(projectId, dateRange);
        return NextResponse.json({ success: true, engagement });
      }

      case 'top-performing': {
        const limit = searchParams.get('limit')
          ? parseInt(searchParams.get('limit')!)
          : 10;
        const topContent = await getTopPerformingContent(projectId, dateRange, limit);
        return NextResponse.json({ success: true, topContent });
      }

      case 'best-times': {
        const platformType = searchParams.get('platform');
        if (!platformType) {
          return NextResponse.json(
            { error: 'Missing required parameter: platform' },
            { status: 400 }
          );
        }

        const bestTimes = await getBestPostingTimes(projectId, platformType, dateRange);
        return NextResponse.json({ success: true, bestTimes });
      }

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Platform metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform metrics', details: error.message },
      { status: 500 }
    );
  }
}
