import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    // Simple auth check
    const cookie = request.cookies.get('admin_auth');
    if (!cookie || cookie.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stats from KV (in production, get from database)
    const [subscribers, blogPosts, newslettersSent] = await Promise.all([
      kv.get<number>('stats:subscribers') || 0,
      kv.get<number>('stats:blog_posts') || 0,
      kv.get<number>('stats:newsletters_sent') || 0,
    ]);

    return NextResponse.json({
      subscribers,
      blogPosts,
      newslettersSent,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json({
      subscribers: 0,
      blogPosts: 0,
      newslettersSent: 0,
    });
  }
}