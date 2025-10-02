import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { parseGitHubEvent, storeActivity } from '@/lib/github/webhook-handler';
import { analyzeAndGenerateContent } from '@/lib/ai/content-generator';

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-hub-signature-256');
    const eventType = headersList.get('x-github-event');

    // Verify webhook signature
    if (!signature || !verifySignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      );
    }

    // Parse the event
    const event = JSON.parse(body);

    // Convert to our activity format
    const activity = await parseGitHubEvent(event, eventType);

    // Store the activity
    await storeActivity(activity);

    // For significant events, trigger immediate content generation
    const significantEvents = ['release', 'pull_request'];
    if (significantEvents.includes(activity.type)) {
      // Trigger async content generation (don't wait for it)
      analyzeAndGenerateContent([activity]).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      type: activity.type
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GitHub sends a ping event when setting up webhooks
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'GitHub webhook endpoint is ready'
  });
}