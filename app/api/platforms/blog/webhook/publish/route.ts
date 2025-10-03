/**
 * Webhook content publishing
 * POST /api/platforms/blog/webhook/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { webhookPublishSchema } from '@/lib/validations/blog-platforms';
import { sendWebhook, type WebhookConfig } from '@/lib/platforms/webhook';
import { decrypt } from '@/lib/platforms/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = webhookPublishSchema.parse(body);

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

    // Get content
    const content = await prisma.content.findFirst({
      where: {
        id: validatedData.contentId,
        userId: session.user.id,
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
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

    // Send webhook
    const result = await sendWebhook(config, {
      title: content.title,
      content: content.content,
      author: session.user.name || 'Unknown',
      publishedAt: new Date().toISOString(),
      tags: validatedData.options?.tags,
      metadata: validatedData.options?.metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send webhook' },
        { status: 500 }
      );
    }

    // Record publication
    await prisma.publication.create({
      data: {
        contentId: content.id,
        platformId: platform.id,
        platformPostId: `webhook-${Date.now()}`,
        platformUrl: credentials.url,
        status: 'published',
        metadata: result.metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Webhook publish error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to publish via webhook' },
      { status: 500 }
    );
  }
}
