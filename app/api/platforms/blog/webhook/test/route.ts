/**
 * Webhook connection test
 * POST /api/platforms/blog/webhook/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sendWebhook, type WebhookConfig } from '@/lib/platforms/webhook';
import { decrypt } from '@/lib/platforms/encryption';

const testSchema = z.object({
  platformId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = testSchema.parse(body);

    // Get platform credentials
    const platform = await prisma.platform.findFirst({
      where: {
        id: validatedData.platformId,
        userId: session.user.id,
        type: 'WEBHOOK',
        isActive: true,
      },
    });

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found or inactive' },
        { status: 404 }
      );
    }

    // Parse credentials
    const credentials = JSON.parse(platform.credentials);

    const config: WebhookConfig = {
      url: credentials.url,
      method: credentials.method,
      headers: credentials.headers || {},
      payloadTemplate: credentials.payloadTemplate,
      retryAttempts: credentials.retryAttempts || 3,
      retryDelay: credentials.retryDelay || 60,
    };

    if (credentials.signatureSecret) {
      config.signatureSecret = decrypt(credentials.signatureSecret);
    }

    // Send test webhook (dry run)
    const result = await sendWebhook(
      config,
      {
        title: 'Test Webhook',
        content: 'This is a test message to verify webhook configuration',
        author: session.user.name || 'System',
        publishedAt: new Date().toISOString(),
      },
      { dryRun: true }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Webhook test failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook configuration is valid',
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Webhook test error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
