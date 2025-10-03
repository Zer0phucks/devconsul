/**
 * Twitter Post API
 * POST /api/platforms/social/twitter/post
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth-helpers";
import { prisma } from '@/lib/prisma';
import { createTwitterClient } from '@/lib/platforms/twitter';
import { twitterPostSchema, twitterThreadSchema } from '@/lib/validations/social-platforms';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Check if it's a thread or single post
    const isThread = Array.isArray(body.tweets);

    if (isThread) {
      // Validate thread
      const validated = twitterThreadSchema.parse(body);

      // Get Twitter platform connection
      const platform = await prisma.platform.findFirst({
        where: {
          project: {
            userId: session.user.id,
          },
          type: 'TWITTER',
          isConnected: true,
        },
      });

      if (!platform || !platform.accessToken) {
        return NextResponse.json({ error: 'Twitter not connected' }, { status: 400 });
      }

      // Create client and post thread
      const client = createTwitterClient({
        accessToken: platform.accessToken,
        refreshToken: platform.refreshToken || undefined,
        tokenExpiresAt: platform.tokenExpiresAt || undefined,
      });

      const responses = await client.postThread(validated);

      // Update platform stats
      await prisma.platform.update({
        where: { id: platform.id },
        data: {
          totalPublished: { increment: responses.length },
          lastPublishedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        thread: responses,
        count: responses.length,
      });
    } else {
      // Validate single post
      const validated = twitterPostSchema.parse(body);

      // Get Twitter platform connection
      const platform = await prisma.platform.findFirst({
        where: {
          project: {
            userId: session.user.id,
          },
          type: 'TWITTER',
          isConnected: true,
        },
      });

      if (!platform || !platform.accessToken) {
        return NextResponse.json({ error: 'Twitter not connected' }, { status: 400 });
      }

      // Create client and post tweet
      const client = createTwitterClient({
        accessToken: platform.accessToken,
        refreshToken: platform.refreshToken || undefined,
        tokenExpiresAt: platform.tokenExpiresAt || undefined,
      });

      const response = await client.postTweet(validated.text, {
        mediaIds: validated.mediaIds,
        replyToTweetId: validated.replyToTweetId,
        quoteTweetId: validated.quoteTweetId,
        pollOptions: validated.pollOptions,
        pollDurationMinutes: validated.pollDurationMinutes,
        replySettings: validated.replySettings,
      });

      // Update platform stats
      await prisma.platform.update({
        where: { id: platform.id },
        data: {
          totalPublished: { increment: 1 },
          lastPublishedAt: new Date(),
        },
      });

      // Get updated tokens if refreshed
      const updatedTokens = client.getEncryptedTokens();
      if (updatedTokens.accessToken !== platform.accessToken) {
        await prisma.platform.update({
          where: { id: platform.id },
          data: {
            accessToken: updatedTokens.accessToken,
            refreshToken: updatedTokens.refreshToken,
            tokenExpiresAt: updatedTokens.tokenExpiresAt,
          },
        });
      }

      return NextResponse.json({
        success: true,
        post: response,
      });
    }
  } catch (error: any) {
    console.error('Twitter post error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post to Twitter' },
      { status: 500 }
    );
  }
}
