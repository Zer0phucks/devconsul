/**
 * Facebook Post API
 * POST /api/platforms/social/facebook/post
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createFacebookClient } from '@/lib/platforms/facebook';
import { facebookPagePostSchema, facebookGroupPostSchema } from '@/lib/validations/social-platforms';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId } = body;

    const isGroup = !!groupId;

    // Get Facebook platform connection
    const platform = await prisma.platform.findFirst({
      where: {
        project: { userId: session.user.id },
        type: 'FACEBOOK',
        isConnected: true,
      },
    });

    if (!platform || !platform.accessToken) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }

    const client = createFacebookClient({
      accessToken: platform.accessToken,
      refreshToken: platform.refreshToken || undefined,
      tokenExpiresAt: platform.tokenExpiresAt || undefined,
      pageId: (platform.config as any)?.pageId,
    });

    let response;

    if (isGroup) {
      const validated = facebookGroupPostSchema.parse(body);
      response = await client.postToGroup(validated.groupId, validated.content, {
        link: validated.link,
      });
    } else {
      const validated = facebookPagePostSchema.parse(body);
      response = await client.postToPage(validated.pageId, validated.content, {
        link: validated.link,
        published: validated.published,
        scheduledPublishTime: validated.scheduledPublishTime,
        targetingCountries: validated.targetingCountries,
      });
    }

    // Update platform stats
    await prisma.platform.update({
      where: { id: platform.id },
      data: {
        totalPublished: { increment: 1 },
        lastPublishedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, post: response });
  } catch (error: any) {
    console.error('Facebook post error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post to Facebook' }, { status: 500 });
  }
}
