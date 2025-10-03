/**
 * Content Validation API Route
 * POST /api/transformation/validate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { validateLength, PLATFORM_LIMITS } from '@/lib/platforms/limits';
import { validateHashtags, calculateHashtagScore } from '@/lib/utils/hashtag-injector';
import { extractUrls, isValidUrl } from '@/lib/utils/link-shortener';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, platform, hashtags } = body;

    if (!content || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: content, platform' },
        { status: 400 }
      );
    }

    const validationResults: any = {
      platform,
      content: {
        length: content.length,
      },
      issues: [],
      warnings: [],
      suggestions: [],
    };

    // Validate character length
    const platformKey = platform as keyof typeof PLATFORM_LIMITS;
    if (PLATFORM_LIMITS[platformKey]) {
      const lengthValidation = validateLength(content, platformKey);
      validationResults.content.lengthValidation = lengthValidation;

      if (!lengthValidation.valid) {
        validationResults.issues.push(
          `Content exceeds ${platform} character limit (${lengthValidation.length}/${lengthValidation.limit})`
        );
      }

      if (lengthValidation.warning) {
        validationResults.warnings.push(lengthValidation.warning);
      }
    }

    // Validate hashtags if provided
    if (hashtags && hashtags.length > 0) {
      const hashtagValidation = validateHashtags(hashtags);
      const hashtagScore = calculateHashtagScore(hashtags, platform);

      validationResults.hashtags = {
        valid: hashtagValidation.valid,
        invalid: hashtagValidation.invalid,
        warnings: hashtagValidation.warnings,
        score: hashtagScore,
      };

      if (hashtagValidation.invalid.length > 0) {
        validationResults.issues.push(
          `${hashtagValidation.invalid.length} invalid hashtag(s)`
        );
      }

      if (hashtagScore < 60) {
        validationResults.warnings.push(
          'Hashtag usage could be improved for better engagement'
        );
      }
    }

    // Validate URLs in content
    const urls = extractUrls(content);
    if (urls.length > 0) {
      const invalidUrls = urls.filter((url) => !isValidUrl(url));
      if (invalidUrls.length > 0) {
        validationResults.issues.push(
          `${invalidUrls.length} invalid URL(s) detected`
        );
        validationResults.invalidUrls = invalidUrls;
      }

      validationResults.content.urlCount = urls.length;
    }

    // Platform-specific validations
    switch (platform) {
      case 'twitter':
        // Check for @ mentions
        const mentions = content.match(/@\w+/g);
        if (mentions && mentions.length > 5) {
          validationResults.warnings.push('Too many mentions may reduce engagement');
        }

        // Check if content can be split into thread
        if (content.length > 280) {
          const threadCount = Math.ceil(content.length / 270);
          validationResults.suggestions.push(
            `Consider splitting into ${threadCount}-tweet thread`
          );
        }
        break;

      case 'linkedin':
        // LinkedIn prefers longer content
        if (content.length < 1300) {
          validationResults.suggestions.push(
            'LinkedIn posts perform better with 1300+ characters'
          );
        }
        break;

      case 'email':
        // Check for spam triggers
        const spamWords = ['free', 'winner', 'click here', 'buy now', 'urgent'];
        const foundSpam = spamWords.filter((word) =>
          content.toLowerCase().includes(word)
        );
        if (foundSpam.length > 0) {
          validationResults.warnings.push(
            `Potential spam triggers found: ${foundSpam.join(', ')}`
          );
        }
        break;
    }

    // Overall quality score
    let qualityScore = 100;
    qualityScore -= validationResults.issues.length * 20;
    qualityScore -= validationResults.warnings.length * 10;
    qualityScore = Math.max(0, qualityScore);

    validationResults.qualityScore = qualityScore;
    validationResults.isValid = validationResults.issues.length === 0;

    return NextResponse.json({
      success: true,
      validation: validationResults,
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Validation failed' },
      { status: 500 }
    );
  }
}
