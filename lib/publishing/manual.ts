/**
 * Manual Publishing System
 *
 * Core functions for manual content publishing to platforms
 */

import { prisma } from '@/lib/db';
import { PlatformType } from '@prisma/client';
import { createPublication, updatePublicationStatus } from './status';
import { mapErrorToUserMessage, formatErrorForDisplay } from './errors';
import { validateContentForPlatform } from '@/lib/validations/publishing';
import type { PlatformResult, PublishResponse } from '@/lib/validations/publishing';

// Import platform clients
import { createWordPressClient } from '@/lib/platforms/wordpress';
import { createTwitterClient } from '@/lib/platforms/twitter';
import { createLinkedInClient } from '@/lib/platforms/linkedin';
import { createFacebookClient } from '@/lib/platforms/facebook';
import { createRedditClient } from '@/lib/platforms/reddit';
import { createMediumClient } from '@/lib/platforms/medium';
import { createGhostClient } from '@/lib/platforms/ghost';
import { createResendClient } from '@/lib/platforms/resend';
import { createSendGridClient } from '@/lib/platforms/sendgrid';
import { createMailchimpClient } from '@/lib/platforms/mailchimp';
import { createWebhookClient } from '@/lib/platforms/webhook';

// ============================================
// CORE PUBLISHING FUNCTIONS
// ============================================

/**
 * Publish content to a single platform
 */
export async function publishToSinglePlatform(
  contentId: string,
  platformId: string,
  options?: {
    dryRun?: boolean;
    metadata?: Record<string, unknown>;
  }
): Promise<PlatformResult> {
  try {
    // Step 1: Validate content exists
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { project: true },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    if (!content.title || !content.body) {
      throw new Error('Content missing required fields (title and body)');
    }

    // Step 2: Validate platform exists and is connected
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      throw new Error('Platform not found');
    }

    if (!platform.isConnected) {
      throw new Error('Platform is not connected. Please reconnect in settings.');
    }

    // Check token expiration
    if (platform.tokenExpiresAt && platform.tokenExpiresAt < new Date()) {
      throw new Error('Platform connection expired. Please reconnect.');
    }

    // Step 3: Validate content meets platform requirements
    const validation = validateContentForPlatform(
      {
        title: content.title,
        body: content.body,
        excerpt: content.excerpt || undefined,
      },
      platform.type
    );

    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    // Return early if dry run
    if (options?.dryRun) {
      return {
        platformId: platform.id,
        platformType: platform.type,
        platformName: platform.name,
        status: 'success',
        warnings: validation.warnings,
      };
    }

    // Step 4: Create publication record
    const publication = await createPublication(
      contentId,
      platformId,
      options?.metadata
    );

    // Update status to PUBLISHING
    await updatePublicationStatus(publication.id, {
      status: 'PUBLISHING',
    });

    // Step 5: Format content for platform
    const formattedContent = await formatContentForPlatform(content, platform.type);

    // Step 6: Call platform API to publish
    const publishResult = await publishToPlatformAPI(
      formattedContent,
      platform
    );

    // Step 7: Update publication with success
    await updatePublicationStatus(publication.id, {
      status: 'PUBLISHED',
      platformPostId: publishResult.postId,
      platformUrl: publishResult.url,
      metadata: publishResult.metadata,
    });

    return {
      platformId: platform.id,
      platformType: platform.type,
      platformName: platform.name,
      status: 'success',
      publicationId: publication.id,
      platformPostId: publishResult.postId,
      platformUrl: publishResult.url,
      warnings: validation.warnings,
    };
  } catch (error) {
    // Handle publication failure
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Try to update publication status if it was created
    try {
      const existingPub = await prisma.contentPublication.findUnique({
        where: {
          contentId_platformId: {
            contentId,
            platformId,
          },
        },
      });

      if (existingPub) {
        await updatePublicationStatus(existingPub.id, {
          status: 'FAILED',
          error: errorMessage,
        });
      }
    } catch (updateError) {
      // Log update error but don't throw
      console.error('Failed to update publication status:', updateError);
    }

    // Get platform for error formatting
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    return {
      platformId,
      platformType: platform?.type || 'WEBHOOK',
      platformName: platform?.name || 'Unknown',
      status: 'failed',
      error: formatErrorForDisplay(
        errorMessage,
        platform?.type,
        platform?.name
      ),
    };
  }
}

/**
 * Publish content to multiple platforms
 */
export async function publishToMultiplePlatforms(
  contentId: string,
  platformIds: string[],
  options?: {
    dryRun?: boolean;
    metadata?: Record<string, unknown>;
  }
): Promise<PublishResponse> {
  // Publish to all platforms in parallel (max 5 concurrent)
  const results: PlatformResult[] = [];
  const batchSize = 5;

  for (let i = 0; i < platformIds.length; i += batchSize) {
    const batch = platformIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((platformId) =>
        publishToSinglePlatform(contentId, platformId, options)
      )
    );
    results.push(...batchResults);
  }

  // Calculate summary
  const summary = {
    total: results.length,
    successful: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    pending: 0,
  };

  return {
    success: summary.failed === 0,
    contentId,
    results,
    summary,
    errors: results.filter((r) => r.error).map((r) => r.error!),
  };
}

/**
 * Publish content to all enabled platforms
 */
export async function publishAllEnabled(
  contentId: string,
  options?: {
    dryRun?: boolean;
  }
): Promise<PublishResponse> {
  // Get content with project
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      project: {
        include: {
          platforms: {
            where: {
              isConnected: true,
            },
          },
        },
      },
    },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  const platformIds = content.project.platforms.map((p) => p.id);

  if (platformIds.length === 0) {
    return {
      success: false,
      contentId,
      results: [],
      summary: { total: 0, successful: 0, failed: 0, pending: 0 },
      errors: ['No enabled platforms found for this project'],
    };
  }

  return publishToMultiplePlatforms(contentId, platformIds, options);
}

// ============================================
// PLATFORM API PUBLISHING
// ============================================

interface PublishResult {
  postId: string;
  url: string;
  metadata?: Record<string, unknown>;
}

/**
 * Publish to specific platform API
 */
async function publishToPlatformAPI(
  content: FormattedContent,
  platform: {
    id: string;
    type: PlatformType;
    accessToken: string | null;
    refreshToken: string | null;
    apiKey: string | null;
    apiSecret: string | null;
    config: any;
  }
): Promise<PublishResult> {
  switch (platform.type) {
    case 'WORDPRESS': {
      const client = createWordPressClient({
        siteUrl: platform.config?.siteUrl,
        username: platform.config?.username,
        password: platform.apiKey || '',
      });
      const post = await client.publishPost({
        title: content.title,
        content: content.htmlContent,
        status: 'publish',
        excerpt: content.excerpt,
        tags: content.tags,
        categories: content.categories,
      });
      return {
        postId: String(post.id),
        url: post.link,
        metadata: { slug: post.slug },
      };
    }

    case 'TWITTER': {
      const client = createTwitterClient({
        apiKey: platform.apiKey || '',
        apiSecret: platform.apiSecret || '',
        accessToken: platform.accessToken || '',
        accessTokenSecret: platform.refreshToken || '',
      });
      const tweet = await client.postTweet(content.body);
      return {
        postId: tweet.id,
        url: `https://twitter.com/i/status/${tweet.id}`,
      };
    }

    case 'LINKEDIN': {
      const client = createLinkedInClient({
        accessToken: platform.accessToken || '',
      });
      const post = await client.createPost({
        text: content.body,
        visibility: 'PUBLIC',
      });
      return {
        postId: post.id,
        url: post.url || '',
      };
    }

    case 'FACEBOOK': {
      const client = createFacebookClient({
        accessToken: platform.accessToken || '',
        pageId: platform.config?.pageId,
      });
      const post = await client.createPost({
        message: content.body,
        link: content.canonicalUrl,
      });
      return {
        postId: post.id,
        url: `https://facebook.com/${post.id}`,
      };
    }

    case 'REDDIT': {
      const client = createRedditClient({
        clientId: platform.apiKey || '',
        clientSecret: platform.apiSecret || '',
        refreshToken: platform.refreshToken || '',
      });
      const post = await client.submitPost({
        subreddit: platform.config?.subreddit,
        title: content.title,
        text: content.body,
      });
      return {
        postId: post.id,
        url: post.url,
      };
    }

    case 'MEDIUM': {
      const client = createMediumClient({
        accessToken: platform.accessToken || '',
      });
      const post = await client.createPost({
        title: content.title,
        content: content.htmlContent,
        contentFormat: 'html',
        publishStatus: 'public',
      });
      return {
        postId: post.id,
        url: post.url,
      };
    }

    case 'GHOST': {
      const client = createGhostClient({
        url: platform.config?.url,
        adminApiKey: platform.apiKey || '',
      });
      const post = await client.createPost({
        title: content.title,
        html: content.htmlContent,
        status: 'published',
      });
      return {
        postId: post.id,
        url: post.url,
      };
    }

    case 'RESEND': {
      const client = createResendClient({
        apiKey: platform.apiKey || '',
      });
      const result = await client.sendEmail({
        from: platform.config?.fromEmail,
        to: platform.config?.defaultRecipients || [],
        subject: content.title,
        html: content.htmlContent,
      });
      return {
        postId: result.id,
        url: '',
        metadata: { messageId: result.id },
      };
    }

    case 'SENDGRID': {
      const client = createSendGridClient({
        apiKey: platform.apiKey || '',
      });
      const result = await client.sendEmail({
        from: platform.config?.fromEmail,
        to: platform.config?.defaultRecipients || [],
        subject: content.title,
        html: content.htmlContent,
      });
      return {
        postId: result.messageId,
        url: '',
        metadata: { messageId: result.messageId },
      };
    }

    case 'MAILCHIMP': {
      const client = createMailchimpClient({
        apiKey: platform.apiKey || '',
        serverPrefix: platform.config?.serverPrefix,
      });
      const campaign = await client.createCampaign({
        audienceId: platform.config?.audienceId,
        subject: content.title,
        content: content.htmlContent,
      });
      return {
        postId: campaign.id,
        url: campaign.archiveUrl || '',
      };
    }

    case 'WEBHOOK': {
      const client = createWebhookClient({
        url: platform.config?.url,
        secret: platform.apiSecret || undefined,
      });
      const result = await client.sendWebhook({
        title: content.title,
        body: content.body,
        htmlContent: content.htmlContent,
        metadata: content.metadata,
      });
      return {
        postId: result.id || Date.now().toString(),
        url: result.url || '',
      };
    }

    default:
      throw new Error(`Unsupported platform type: ${platform.type}`);
  }
}

// ============================================
// CONTENT FORMATTING
// ============================================

interface FormattedContent {
  title: string;
  body: string;
  htmlContent: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  canonicalUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Format content for specific platform
 */
async function formatContentForPlatform(
  content: {
    title: string;
    body: string;
    htmlContent: string | null;
    excerpt: string | null;
    tags: string[];
    categories: string[];
    canonicalUrl: string | null;
  },
  platformType: PlatformType
): Promise<FormattedContent> {
  const formatted: FormattedContent = {
    title: content.title,
    body: content.body,
    htmlContent: content.htmlContent || content.body,
    excerpt: content.excerpt || undefined,
    tags: content.tags,
    categories: content.categories,
    canonicalUrl: content.canonicalUrl || undefined,
  };

  // Platform-specific formatting
  switch (platformType) {
    case 'TWITTER':
      // Truncate to 280 characters
      if (formatted.body.length > 280) {
        formatted.body = formatted.body.substring(0, 277) + '...';
      }
      break;

    case 'LINKEDIN':
      // LinkedIn prefers shorter posts
      if (formatted.body.length > 3000) {
        formatted.body = formatted.body.substring(0, 2997) + '...';
      }
      break;

    case 'REDDIT':
      // Reddit formatting adjustments
      // Keep markdown formatting
      break;

    default:
      // No special formatting needed
      break;
  }

  return formatted;
}
