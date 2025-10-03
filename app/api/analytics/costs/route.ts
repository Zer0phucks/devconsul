/**
 * Cost Tracking API Endpoint
 * GET /api/analytics/costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCostSummary,
  getMonthlyCostSummaries,
  getCostPerContent,
  checkBudgetAlerts,
  getCostOptimizationRecommendations,
} from '@/lib/analytics/cost-tracker';

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
    const action = searchParams.get('action') || 'summary';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const monthlyBudget = searchParams.get('budget');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing required parameter: projectId' }, { status: 400 });
    }

    // Handle different actions
    switch (action) {
      case 'summary': {
        if (!from || !to) {
          return NextResponse.json(
            { error: 'Missing required parameters: from, to' },
            { status: 400 }
          );
        }

        const summary = await getCostSummary(projectId, {
          from: new Date(from),
          to: new Date(to),
        });

        return NextResponse.json({ success: true, summary });
      }

      case 'monthly': {
        const months = searchParams.get('months')
          ? parseInt(searchParams.get('months')!)
          : 12;
        const summaries = await getMonthlyCostSummaries(projectId, months);

        return NextResponse.json({ success: true, summaries });
      }

      case 'per-content': {
        if (!from || !to) {
          return NextResponse.json(
            { error: 'Missing required parameters: from, to' },
            { status: 400 }
          );
        }

        const costPerContent = await getCostPerContent(projectId, {
          from: new Date(from),
          to: new Date(to),
        });

        return NextResponse.json({ success: true, costPerContent });
      }

      case 'budget-alerts': {
        if (!monthlyBudget) {
          return NextResponse.json(
            { error: 'Missing required parameter: budget' },
            { status: 400 }
          );
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const alerts = await checkBudgetAlerts(
          projectId,
          parseFloat(monthlyBudget),
          { from: monthStart, to: monthEnd }
        );

        return NextResponse.json({ success: true, alerts });
      }

      case 'optimization': {
        if (!from || !to) {
          return NextResponse.json(
            { error: 'Missing required parameters: from, to' },
            { status: 400 }
          );
        }

        const recommendations = await getCostOptimizationRecommendations(projectId, {
          from: new Date(from),
          to: new Date(to),
        });

        return NextResponse.json({ success: true, recommendations });
      }

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Cost tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost data', details: error.message },
      { status: 500 }
    );
  }
}
