/**
 * Reddit Post API
 * POST /api/platforms/social/reddit/post
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createRedditClient } from '@/lib/platforms/reddit';
import { redditTextPostSchema, redditLinkPostSchema, redditImagePostSchema } from '@/lib/validations/social-platforms';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, imageUrl } = body;

    const postType = imageUrl ? 'image' : url ? 'link' : 'text';

    // Get Reddit platform connection
    const platform = await prisma.platform.findFirst({
      where: {
        project: { userId: session.user.id },
        type: 'REDDIT',
        isConnected: true,
      },
    });

    if (!platform || !platform.accessToken) {
      return NextResponse.json({ error: 'Reddit not connected' }, { status: 400 });
    }

    const config = platform.config as any;
    const client = createRedditClient({
      accessToken: platform.accessToken,
      refreshToken: platform.refreshToken || undefined,
      tokenExpiresAt: platform.tokenExpiresAt || undefined,
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      userAgent: process.env.REDDIT_USER_AGENT || 'FullSelfPublishing/1.0',
      username: config?.username,
    });

    let response;

    if (postType === 'image') {
      const validated = redditImagePostSchema.parse(body);
      response = await client.submitImagePost(validated.subreddit, validated.title, validated.imageUrl, {
        flairId: validated.flairId,
        nsfw: validated.nsfw,
        spoiler: validated.spoiler,
        sendReplies: validated.sendReplies,
      });
    } else if (postType === 'link') {
      const validated = redditLinkPostSchema.parse(body);
      response = await client.submitLinkPost(validated.subreddit, validated.title, validated.url, {
        flairId: validated.flairId,
        flairText: validated.flairText,
        nsfw: validated.nsfw,
        spoiler: validated.spoiler,
        sendReplies: validated.sendReplies,
      });
    } else {
      const validated = redditTextPostSchema.parse(body);
      response = await client.submitTextPost(validated.subreddit, validated.title, validated.content, {
        flairId: validated.flairId,
        flairText: validated.flairText,
        nsfw: validated.nsfw,
        spoiler: validated.spoiler,
        sendReplies: validated.sendReplies,
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
    console.error('Reddit post error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post to Reddit' }, { status: 500 });
  }
}
