import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { generateAndSendNewsletter } from '@/lib/email/newsletter';

// This route is called by Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = headers().get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate and send newsletter
    await generateAndSendNewsletter();

    return NextResponse.json({
      success: true,
      message: 'Newsletter sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Newsletter cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint (for admin)
export async function POST(request: NextRequest) {
  try {
    // Simple auth check (in production, use proper authentication)
    const { adminKey } = await request.json();
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate and send newsletter
    await generateAndSendNewsletter();

    return NextResponse.json({
      success: true,
      message: 'Newsletter sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Manual newsletter error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}