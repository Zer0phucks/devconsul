/**
 * Ghost post publishing
 * POST /api/platforms/blog/ghost/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { ghostPublishSchema } from '@/lib/validations/blog-platforms';
import { createPost, type GhostClient } from '@/lib/platforms/ghost';
import { decrypt } from '@/lib/platforms/encryption';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = ghostPublishSchema.parse(body);

    // Get platform credentials
    const platform = await prisma.platform.findFirst({
      where: {
        id: validatedData.platformId,
        userId: session.user.id,
        type: 'GHOST',
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

    const client: GhostClient = {
      apiUrl: credentials.apiUrl,
      adminApiKey: decrypt(credentials.adminApiKey),
    };

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
    console.error('Ghost publish error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to publish to Ghost' },
      { status: 500 }
    );
  }
}
