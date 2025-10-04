/**
 * Analytics Export API Endpoint
 * GET /api/analytics/export - Export analytics data as CSV or JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { getContentMetrics, getPlatformEngagementMetrics } from '@/lib/analytics/metrics';
import { getCostSummary } from '@/lib/analytics/cost-tracker';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const format = searchParams.get('format') || 'json';
    const dataType = searchParams.get('type') || 'content';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

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

    // Fetch data based on type
    let data: any;
    let filename: string;

    switch (dataType) {
      case 'content': {
        data = await getContentMetrics(projectId, dateRange);
        filename = `content-metrics-${from}-to-${to}`;
        break;
      }

      case 'platforms': {
        const platformData = await getPlatformEngagementMetrics(projectId, dateRange);
        data = platformData.platformAggregates;
        filename = `platform-metrics-${from}-to-${to}`;
        break;
      }

      case 'costs': {
        const costData = await getCostSummary(projectId, dateRange);
        data = costData;
        filename = `cost-summary-${from}-to-${to}`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    // Export as JSON
    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    // Export as CSV
    if (format === 'csv') {
      const csv = convertToCSV(data, dataType);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use json or csv' }, { status: 400 });
  } catch (error: any) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any, dataType: string): string {
  let headers: string[];
  let rows: string[][] = [];

  switch (dataType) {
    case 'content': {
      headers = [
        'Total Generated',
        'Total Published',
        'Total Failed',
        'Generation Success Rate (%)',
        'Publish Success Rate (%)',
        'Blog Posts',
        'Email Campaigns',
        'Social Posts',
        'OpenAI Generations',
        'Anthropic Generations',
        'OpenAI Tokens',
        'Anthropic Tokens',
        'OpenAI Cost ($)',
        'Anthropic Cost ($)',
        'Avg Per Day',
        'Avg Per Week',
        'Avg Per Month',
      ];

      rows.push([
        data.totalGenerated.toString(),
        data.totalPublished.toString(),
        data.totalFailed.toString(),
        data.generationSuccessRate.toFixed(2),
        data.publishSuccessRate.toFixed(2),
        data.contentTypeBreakdown.blogPosts.toString(),
        data.contentTypeBreakdown.emailCampaigns.toString(),
        data.contentTypeBreakdown.socialPosts.toString(),
        data.aiProviderStats.openai.generations.toString(),
        data.aiProviderStats.anthropic.generations.toString(),
        data.aiProviderStats.openai.tokens.toString(),
        data.aiProviderStats.anthropic.tokens.toString(),
        data.aiProviderStats.openai.cost.toFixed(4),
        data.aiProviderStats.anthropic.cost.toFixed(4),
        data.contentVelocity.avgPerDay.toFixed(2),
        data.contentVelocity.avgPerWeek.toFixed(2),
        data.contentVelocity.avgPerMonth.toFixed(2),
      ]);
      break;
    }

    case 'platforms': {
      headers = [
        'Platform',
        'Total Views',
        'Total Likes',
        'Total Shares',
        'Total Comments',
        'Total Clicks',
        'Total Impressions',
        'Avg Engagement Rate (%)',
        'Avg CTR (%)',
        'Follower Growth',
      ];

      Object.entries(data).forEach(([platform, metrics]: [string, any]) => {
        rows.push([
          platform,
          metrics.totalViews.toString(),
          metrics.totalLikes.toString(),
          metrics.totalShares.toString(),
          metrics.totalComments.toString(),
          metrics.totalClicks.toString(),
          metrics.totalImpressions.toString(),
          (metrics.avgEngagementRate * 100).toFixed(2),
          (metrics.avgCTR * 100).toFixed(2),
          metrics.followerGrowth.toString(),
        ]);
      });
      break;
    }

    case 'costs': {
      headers = [
        'Service',
        'Total Cost ($)',
        'Tokens Used',
        'API Calls',
        'Images Generated',
      ];

      Object.entries(data.serviceBreakdown).forEach(([service, metrics]: [string, any]) => {
        rows.push([
          service,
          metrics.totalCost.toFixed(4),
          metrics.tokensUsed.toString(),
          metrics.apiCalls.toString(),
          metrics.imagesGenerated.toString(),
        ]);
      });

      // Add total row
      rows.push([
        'TOTAL',
        data.totalCost.toFixed(4),
        data.totalTokens.toString(),
        data.totalApiCalls.toString(),
        data.totalImages.toString(),
      ]);
      break;
    }

    default:
      return '';
  }

  // Build CSV string
  const csvRows = [headers.join(','), ...rows.map((row) => row.join(','))];

  return csvRows.join('\n');
}
