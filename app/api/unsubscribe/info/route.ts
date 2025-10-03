import { NextRequest, NextResponse } from 'next/server';
import { getUnsubscribeInfo } from '@/lib/platforms/unsubscribe';

// GET /api/unsubscribe/info?token=xxx - Get unsubscribe information
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token required' },
        { status: 400 }
      );
    }

    const info = await getUnsubscribeInfo(token);

    if (!info) {
      return NextResponse.json(
        { error: 'Invalid or expired unsubscribe link' },
        { status: 404 }
      );
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error('Get unsubscribe info error:', error);
    return NextResponse.json(
      { error: 'Failed to get unsubscribe information' },
      { status: 500 }
    );
  }
}
