import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivities } from '@/lib/github/webhook-handler';

export async function GET(request: NextRequest) {
  try {
    // Simple auth check (in production, use proper authentication)
    const cookie = request.cookies.get('admin_auth');
    if (!cookie || cookie.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await getRecentActivities(20);

    // Group activities by type
    const byType = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      total: activities.length,
      byType,
      recentActivities: activities.slice(0, 10),
    });
  } catch (error) {
    console.error('Failed to get activities:', error);
    return NextResponse.json(
      { error: 'Failed to load activities' },
      { status: 500 }
    );
  }
}