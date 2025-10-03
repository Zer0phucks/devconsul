/**
 * Content Transformation API Route
 * POST /api/transformation/transform
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  ContentTransformationEngine,
  transformToMultiplePlatforms,
  type TransformationSource,
  type TransformationTarget,
} from '@/lib/transformation/engine';
import { injectHashtags, generateHashtagsFromContent } from '@/lib/utils/hashtag-injector';
import {
  replaceUrlsWithShortened,
  createTrackingUrl,
  type LinkShortenerConfig,
} from '@/lib/utils/link-shortener';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      content,
      sourceFormat,
      targetPlatforms,
      settings = {},
    } = body;

    // Validate input
    if (!content || !sourceFormat || !targetPlatforms || targetPlatforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: content, sourceFormat, targetPlatforms' },
        { status: 400 }
      );
    }

    // Transform content to multiple platforms
    const transformedResults = await transformToMultiplePlatforms(
      content,
      sourceFormat as TransformationSource,
      targetPlatforms as TransformationTarget[],
      {
        tone: settings.tone,
        aiProvider: settings.aiProvider || 'openai',
      }
    );

    // Post-process each platform result
    const processedResults: Record<string, any> = {};

    for (const [platform, result] of Object.entries(transformedResults)) {
      let processedContent = result.content;
      const metadata: any = { ...result.metadata };

      // Add hashtags if enabled
      if (settings.addHashtags) {
        let hashtags = settings.hashtags || [];

        // Generate hashtags from content if enabled
        if (settings.generateHashtags) {
          const generated = generateHashtagsFromContent(processedContent, 3);
          hashtags = [...hashtags, ...generated];
        }

        if (hashtags.length > 0) {
          const hashtagResult = injectHashtags(processedContent, hashtags, {
            platform: platform as any,
            placement: 'smart',
          });
          processedContent = hashtagResult.content;
          metadata.hashtags = hashtagResult.hashtags;
        }
      }

      // Shorten links if enabled
      if (settings.shortenLinks) {
        const shortenerConfig: LinkShortenerConfig = {
          provider: settings.linkShortener || 'tinyurl',
          apiKey: process.env.BITLY_API_KEY,
          customEndpoint: settings.customShortenerEndpoint,
        };

        const shortened = await replaceUrlsWithShortened(
          processedContent,
          shortenerConfig
        );
        processedContent = shortened.content;
        metadata.shortenedLinks = shortened.shortenedLinks;
      }

      // Add UTM parameters if enabled
      if (settings.addUTM && settings.utmSource) {
        // This would be applied to links in the content
        // For now, we'll store the UTM settings in metadata
        metadata.utmTracking = {
          source: settings.utmSource,
          campaign: settings.utmCampaign,
        };
      }

      processedResults[platform] = {
        content: processedContent,
        metadata,
        warnings: result.warnings,
      };
    }

    return NextResponse.json({
      success: true,
      results: processedResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Transformation error:', error);
    return NextResponse.json(
      { error: error.message || 'Transformation failed' },
      { status: 500 }
    );
  }
}
