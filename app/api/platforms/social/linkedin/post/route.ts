/**
 * LinkedIn Post API
 * POST /api/platforms/social/linkedin/post
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth-helpers";
import { prisma } from '@/lib/prisma';
import { createLinkedInClient } from '@/lib/platforms/linkedin';
import { linkedInPostSchema, linkedInOrganizationPostSchema, linkedInArticleSchema } from '@/lib/validations/social-platforms';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, title } = body;

    // Determine post type
    const isArticle = !!title;
    const isOrganization = !!organizationId;

    // Get LinkedIn platform connection
    const platform = await prisma.platform.findFirst({
      where: {
        project: { userId: session.user.id },
        type: 'LINKEDIN',
        isConnected: true,
      },
    });

    if (!platform || !platform.accessToken) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 });
    }

    const client = createLinkedInClient({
      accessToken: platform.accessToken,
      refreshToken: platform.refreshToken || undefined,
      tokenExpiresAt: platform.tokenExpiresAt || undefined,
      personId: (platform.config as any)?.personId,
    });

    let response;

    if (isArticle) {
      const validated = linkedInArticleSchema.parse(body);
      response = await client.createArticle(validated);
    } else if (isOrganization) {
      const validated = linkedInOrganizationPostSchema.parse(body);
      response = await client.createOrganizationPost(validated.organizationId, validated.content, {
        visibility: validated.visibility,
        mediaUrls: validated.mediaUrls,
      });
    } else {
      const validated = linkedInPostSchema.parse(body);
      response = await client.createPost(validated.content, {
        visibility: validated.visibility,
        mediaUrls: validated.mediaUrls,
        articleLink: validated.articleLink,
        commentingDisabled: validated.commentingDisabled,
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
    console.error('LinkedIn post error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post to LinkedIn' }, { status: 500 });
  }
}
