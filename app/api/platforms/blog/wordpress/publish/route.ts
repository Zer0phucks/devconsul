/**
 * WordPress post publishing
 * POST /api/platforms/blog/wordpress/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { wordpressPublishSchema } from '@/lib/validations/blog-platforms';
import { createPost, type WordPressClient } from '@/lib/platforms/wordpress';
import { decrypt } from '@/lib/platforms/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = wordpressPublishSchema.parse(body);

    // Get platform credentials
    const platform = await prisma.platform.findFirst({
      where: {
        id: validatedData.platformId,
        userId: session.user.id,
        type: 'WORDPRESS',
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

    let client: WordPressClient;
    if (credentials.authType === 'oauth') {
      client = {
        accessToken: decrypt(credentials.accessToken),
        siteUrl: credentials.siteUrl || 'https://public-api.wordpress.com',
      };
    } else {
      client = {
        siteUrl: credentials.siteUrl,
        apiKey: decrypt(credentials.apiKey),
      };
    }

    // Publish post
    const result = await createPost(
      client,
      content.title,
      content.content,
      validatedData.options
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to publish post' },
        { status: 500 }
      );
    }

    // Record publication
    await prisma.publication.create({
      data: {
        contentId: content.id,
        platformId: platform.id,
        platformPostId: result.platformPostId || '',
        platformUrl: result.platformUrl || '',
        status: 'published',
        metadata: result.metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      platformPostId: result.platformPostId,
      platformUrl: result.platformUrl,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('WordPress publish error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to publish to WordPress' },
      { status: 500 }
    );
  }
}
