/**
 * Comprehensive Dry Run Engine
 *
 * Full testing system for content publishing without actual API calls
 * Uses TestRun, ValidationResult, and MockPublication models
 */

import { prisma } from '@/lib/db';
import { validateContentForPlatform } from '@/lib/validations/publishing';
import { PLATFORM_LIMITS } from '@/lib/platforms/limits';
import type { PlatformType, TestRunType, TestRunStatus } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface DryRunConfig {
  testType: TestRunType;
  name?: string;
  description?: string;
  config?: Record<string, any>;
}

export interface DryRunProgress {
  current: number;
  total: number;
  currentPlatform?: string;
  status: TestRunStatus;
}

export interface MockPublishResult {
  platformId: string;
  platformType: PlatformType;
  platformName: string;
  wouldSucceed: boolean;
  estimatedTime: number;
  estimatedCost?: number;
  errors: string[];
  warnings: string[];
  simulatedResponse: {
    platformPostId: string;
    platformUrl: string;
    publishedAt: Date;
  };
  characterAnalysis: {
    titleLength: number;
    bodyLength: number;
    exceedsLimits: boolean;
    limitPercentage: number;
  };
}

// ============================================
// MAIN DRY RUN ENGINE
// ============================================

/**
 * Execute comprehensive dry run test
 */
export async function executeDryRun(
  projectId: string,
  userId: string,
  contentId: string,
  platformIds: string[],
  config: DryRunConfig = { testType: 'DRY_RUN' }
): Promise<{
  testRunId: string;
  passed: boolean;
  results: MockPublishResult[];
  summary: {
    total: number;
    wouldSucceed: number;
    wouldFail: number;
    totalErrors: number;
    totalWarnings: number;
  };
}> {
  const startTime = Date.now();

  // Create test run record
  const testRun = await prisma.testRun.create({
    data: {
      projectId,
      userId,
      testType: config.testType,
      name: config.name,
      description: config.description,
      contentId,
      platformIds,
      status: 'RUNNING',
      startedAt: new Date(),
      config: config.config || {},
      totalChecks: platformIds.length,
    },
  });

  try {
    // Get content and platforms
    const [content, platforms] = await Promise.all([
      prisma.content.findUnique({
        where: { id: contentId },
        include: {
          images: true,
        },
      }),
      prisma.platform.findMany({
        where: { id: { in: platformIds } },
      }),
    ]);

    if (!content) {
      throw new Error('Content not found');
    }

    if (platforms.length !== platformIds.length) {
      throw new Error('Some platforms not found');
    }

    // Execute dry run for each platform
    const results: MockPublishResult[] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    for (const platform of platforms) {
      const result = await executePlatformDryRun(
        testRun.id,
        content,
        platform,
        projectId
      );

      results.push(result);

      if (result.wouldSucceed) {
        passedChecks++;
      } else {
        failedChecks++;
      }
    }

    // Calculate summary
    const duration = Date.now() - startTime;
    const summary = {
      total: results.length,
      wouldSucceed: passedChecks,
      wouldFail: failedChecks,
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    };

    const passed = failedChecks === 0;

    // Update test run record
    await prisma.testRun.update({
      where: { id: testRun.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration,
        passed,
        passedChecks,
        failedChecks,
        warnings: summary.totalWarnings,
        summary: generateTestSummary(results, summary),
        recommendations: generateRecommendations(results),
      },
    });

    return {
      testRunId: testRun.id,
      passed,
      results,
      summary,
    };
  } catch (error) {
    // Update test run with error
    await prisma.testRun.update({
      where: { id: testRun.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error instanceof Error ? { stack: error.stack } : {},
      },
    });

    throw error;
  }
}

/**
 * Execute dry run for single platform
 */
async function executePlatformDryRun(
  testRunId: string,
  content: any,
  platform: any,
  projectId: string
): Promise<MockPublishResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Run all validation checks
  await Promise.all([
    validateConnection(testRunId, platform, projectId, errors),
    validateCredentials(testRunId, platform, projectId, errors),
    validateContent(testRunId, content, platform, projectId, errors, warnings),
    validateCharacterLimits(testRunId, content, platform, projectId, errors, warnings),
    validateImages(testRunId, content, platform, projectId, errors, warnings),
  ]);

  // Calculate character analysis
  const titleLength = content.title?.length || 0;
  const bodyLength = content.body?.length || 0;
  const platformKey = getPlatformLimitKey(platform.type);
  const limits = PLATFORM_LIMITS[platformKey];

  const exceedsLimits = limits ? bodyLength > limits.characterLimit : false;
  const limitPercentage = limits ? (bodyLength / limits.characterLimit) * 100 : 0;

  // Estimate publishing time and cost
  const estimatedTime = estimatePublishTime(platform.type);
  const estimatedCost = estimateCost(platform.type, content);

  // Determine success
  const wouldSucceed = errors.length === 0;

  // Generate mock response
  const simulatedResponse = generateMockResponse(platform.type, content);

  // Create mock publication record
  await prisma.mockPublication.create({
    data: {
      testRunId,
      contentId: content.id,
      platformId: platform.id,
      projectId,
      platformType: platform.type,
      platformName: platform.name,
      simulatedTitle: content.title,
      simulatedBody: content.body,
      simulatedExcerpt: content.excerpt,
      simulatedImages: content.images?.map((img: any) => img.url) || [],
      wouldSucceed,
      estimatedTime,
      estimatedCost,
      errors,
      warnings,
      simulatedResponse,
      simulatedUrl: simulatedResponse.platformUrl,
      titleLength,
      bodyLength,
      exceedsLimits,
    },
  });

  return {
    platformId: platform.id,
    platformType: platform.type,
    platformName: platform.name,
    wouldSucceed,
    estimatedTime,
    estimatedCost,
    errors,
    warnings,
    simulatedResponse,
    characterAnalysis: {
      titleLength,
      bodyLength,
      exceedsLimits,
      limitPercentage,
    },
  };
}

// ============================================
// VALIDATION CHECKS
// ============================================

async function validateConnection(
  testRunId: string,
  platform: any,
  projectId: string,
  errors: string[]
): Promise<void> {
  const passed = platform.isConnected;

  await prisma.validationResult.create({
    data: {
      testRunId,
      projectId,
      validationType: 'PLATFORM_CONNECTION',
      platformId: platform.id,
      platformType: platform.type,
      passed,
      severity: passed ? 'INFO' : 'CRITICAL',
      checkName: 'Platform Connection',
      description: passed
        ? 'Platform is connected and ready'
        : 'Platform is not connected',
      expected: 'Platform should be connected',
      actual: platform.isConnected ? 'Connected' : 'Not connected',
      suggestion: passed ? undefined : 'Connect platform in settings',
      autoFixable: false,
    },
  });

  if (!passed) {
    errors.push('Platform is not connected');
  }
}

async function validateCredentials(
  testRunId: string,
  platform: any,
  projectId: string,
  errors: string[]
): Promise<void> {
  const hasToken = !!platform.accessToken || !!platform.apiKey;
  const notExpired = platform.tokenExpiresAt
    ? platform.tokenExpiresAt > new Date()
    : true;
  const passed = hasToken && notExpired;

  await prisma.validationResult.create({
    data: {
      testRunId,
      projectId,
      validationType: 'AUTH_TOKEN',
      platformId: platform.id,
      platformType: platform.type,
      passed,
      severity: passed ? 'INFO' : 'CRITICAL',
      checkName: 'Authentication Credentials',
      description: passed
        ? 'Valid authentication credentials'
        : notExpired
          ? 'Missing authentication credentials'
          : 'Authentication credentials expired',
      expected: 'Valid, non-expired credentials',
      actual: hasToken
        ? notExpired
          ? 'Valid'
          : `Expired at ${platform.tokenExpiresAt}`
        : 'No credentials',
      suggestion: passed
        ? undefined
        : notExpired
          ? 'Add authentication credentials'
          : 'Re-authenticate platform',
      autoFixable: false,
    },
  });

  if (!passed) {
    errors.push(
      notExpired
        ? 'Platform credentials missing'
        : 'Platform credentials expired'
    );
  }
}

async function validateContent(
  testRunId: string,
  content: any,
  platform: any,
  projectId: string,
  errors: string[],
  warnings: string[]
): Promise<void> {
  const validation = validateContentForPlatform(
    {
      title: content.title,
      body: content.body,
      excerpt: content.excerpt,
    },
    platform.type
  );

  await prisma.validationResult.create({
    data: {
      testRunId,
      projectId,
      validationType: 'CONTENT_FORMAT',
      platformId: platform.id,
      platformType: platform.type,
      contentId: content.id,
      passed: validation.valid,
      severity: validation.valid ? 'INFO' : 'ERROR',
      checkName: 'Content Format Validation',
      description: validation.valid
        ? 'Content meets platform requirements'
        : `Content validation failed: ${validation.errors.join(', ')}`,
      expected: 'Content should meet all platform requirements',
      actual: validation.valid
        ? 'All requirements met'
        : `Validation errors: ${validation.errors.length}`,
      suggestion: validation.errors[0] || undefined,
      autoFixable: false,
    },
  });

  errors.push(...validation.errors);
  warnings.push(...validation.warnings);
}

async function validateCharacterLimits(
  testRunId: string,
  content: any,
  platform: any,
  projectId: string,
  errors: string[],
  warnings: string[]
): Promise<void> {
  const platformKey = getPlatformLimitKey(platform.type);
  const limits = PLATFORM_LIMITS[platformKey];

  if (!limits) {
    return;
  }

  const bodyLength = content.body?.length || 0;
  const titleLength = content.title?.length || 0;
  const withinLimit = bodyLength <= limits.characterLimit;
  const withinRecommended = bodyLength <= (limits.recommendedLimit || limits.characterLimit);

  await prisma.validationResult.create({
    data: {
      testRunId,
      projectId,
      validationType: 'CHARACTER_LIMITS',
      platformId: platform.id,
      platformType: platform.type,
      contentId: content.id,
      passed: withinLimit,
      severity: withinLimit ? (withinRecommended ? 'INFO' : 'WARNING') : 'ERROR',
      checkName: 'Character Limit Check',
      description: withinLimit
        ? withinRecommended
          ? 'Content within recommended limits'
          : 'Content approaching character limit'
        : 'Content exceeds character limit',
      expected: `Body: ${limits.characterLimit} chars (recommended: ${limits.recommendedLimit})`,
      actual: `Body: ${bodyLength} chars, Title: ${titleLength} chars`,
      suggestion: withinLimit
        ? withinRecommended
          ? undefined
          : 'Consider shortening content to stay within recommended limit'
        : `Reduce content by ${bodyLength - limits.characterLimit} characters`,
      autoFixable: false,
    },
  });

  if (!withinLimit) {
    errors.push(
      `Content exceeds ${limits.name} limit (${bodyLength}/${limits.characterLimit} characters)`
    );
  } else if (!withinRecommended) {
    warnings.push(
      `Content approaching ${limits.name} limit (${bodyLength}/${limits.recommendedLimit} recommended)`
    );
  }
}

async function validateImages(
  testRunId: string,
  content: any,
  platform: any,
  projectId: string,
  errors: string[],
  warnings: string[]
): Promise<void> {
  const images = content.images || [];
  const maxImages = getMaxImages(platform.type);
  const hasImages = images.length > 0;
  const withinLimit = images.length <= maxImages;

  await prisma.validationResult.create({
    data: {
      testRunId,
      projectId,
      validationType: 'IMAGE_SIZE',
      platformId: platform.id,
      platformType: platform.type,
      contentId: content.id,
      passed: withinLimit || !hasImages,
      severity: withinLimit || !hasImages ? 'INFO' : 'WARNING',
      checkName: 'Image Validation',
      description: !hasImages
        ? 'No images attached'
        : withinLimit
          ? `${images.length} image(s) within platform limit`
          : `Too many images (${images.length}/${maxImages})`,
      expected: `Maximum ${maxImages} images`,
      actual: `${images.length} images attached`,
      suggestion: withinLimit
        ? undefined
        : `Remove ${images.length - maxImages} image(s)`,
      autoFixable: false,
    },
  });

  if (hasImages && !withinLimit) {
    warnings.push(
      `Too many images for ${platform.name} (${images.length}/${maxImages}). Extra images will be ignored.`
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPlatformLimitKey(platformType: PlatformType): keyof typeof PLATFORM_LIMITS {
  const mapping: Record<PlatformType, keyof typeof PLATFORM_LIMITS> = {
    TWITTER: 'twitter',
    LINKEDIN: 'linkedin',
    FACEBOOK: 'facebook',
    REDDIT: 'reddit',
    HASHNODE: 'linkedin', // Use linkedin as proxy for blog platforms
    DEVTO: 'linkedin',
    MEDIUM: 'linkedin',
    WORDPRESS: 'facebook',
    GHOST: 'facebook',
    NEWSLETTER: 'facebook',
    RESEND: 'facebook',
    SENDGRID: 'facebook',
    MAILCHIMP: 'facebook',
    RSS_FEED: 'facebook',
    WEBHOOK: 'facebook',
  };

  return mapping[platformType];
}

function getMaxImages(platformType: PlatformType): number {
  const limits: Record<PlatformType, number> = {
    TWITTER: 4,
    LINKEDIN: 9,
    FACEBOOK: 10,
    REDDIT: 1,
    HASHNODE: 10,
    DEVTO: 10,
    MEDIUM: 10,
    WORDPRESS: 10,
    GHOST: 10,
    NEWSLETTER: 10,
    RESEND: 10,
    SENDGRID: 10,
    MAILCHIMP: 10,
    RSS_FEED: 1,
    WEBHOOK: 0,
  };

  return limits[platformType];
}

function estimatePublishTime(platformType: PlatformType): number {
  // Estimated time in milliseconds
  const times: Record<PlatformType, number> = {
    TWITTER: 500,
    LINKEDIN: 1000,
    FACEBOOK: 1500,
    REDDIT: 2000,
    HASHNODE: 3000,
    DEVTO: 2500,
    MEDIUM: 3000,
    WORDPRESS: 2000,
    GHOST: 2000,
    NEWSLETTER: 5000,
    RESEND: 1000,
    SENDGRID: 1000,
    MAILCHIMP: 3000,
    RSS_FEED: 500,
    WEBHOOK: 300,
  };

  return times[platformType];
}

function estimateCost(platformType: PlatformType, content: any): number | undefined {
  // Only email platforms have costs
  const emailPlatforms: PlatformType[] = ['RESEND', 'SENDGRID', 'MAILCHIMP', 'NEWSLETTER'];

  if (!emailPlatforms.includes(platformType)) {
    return undefined;
  }

  // Rough cost per email (in cents)
  const costPerEmail: Record<string, number> = {
    RESEND: 0.01,
    SENDGRID: 0.02,
    MAILCHIMP: 0.03,
    NEWSLETTER: 0.01,
  };

  // Assume 100 subscribers for estimation
  const estimatedSubscribers = 100;
  return (costPerEmail[platformType] || 0.01) * estimatedSubscribers;
}

function generateMockResponse(
  platformType: PlatformType,
  content: any
): {
  platformPostId: string;
  platformUrl: string;
  publishedAt: Date;
} {
  const mockId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const publishedAt = new Date();

  const urls: Record<PlatformType, string> = {
    TWITTER: `https://twitter.com/user/status/${mockId}`,
    LINKEDIN: `https://www.linkedin.com/feed/update/${mockId}`,
    FACEBOOK: `https://www.facebook.com/user/posts/${mockId}`,
    REDDIT: `https://www.reddit.com/r/subreddit/comments/${mockId}`,
    HASHNODE: `https://hashnode.com/@user/${content.slug || mockId}`,
    DEVTO: `https://dev.to/user/${content.slug || mockId}`,
    MEDIUM: `https://medium.com/@user/${content.slug || mockId}`,
    WORDPRESS: `https://example.com/${content.slug || mockId}`,
    GHOST: `https://example.com/${content.slug || mockId}`,
    NEWSLETTER: `https://example.com/newsletter/${mockId}`,
    RESEND: `https://resend.com/emails/${mockId}`,
    SENDGRID: `https://sendgrid.com/emails/${mockId}`,
    MAILCHIMP: `https://mailchimp.com/campaigns/${mockId}`,
    RSS_FEED: `https://example.com/feed/${mockId}`,
    WEBHOOK: `https://example.com/webhook/${mockId}`,
  };

  return {
    platformPostId: mockId,
    platformUrl: urls[platformType],
    publishedAt,
  };
}

function generateTestSummary(
  results: MockPublishResult[],
  summary: any
): string {
  const lines = [
    `Dry Run Test Summary`,
    `Total Platforms Tested: ${summary.total}`,
    `Would Succeed: ${summary.wouldSucceed}`,
    `Would Fail: ${summary.wouldFail}`,
    `Total Errors: ${summary.totalErrors}`,
    `Total Warnings: ${summary.totalWarnings}`,
    '',
    'Platform Results:',
  ];

  for (const result of results) {
    lines.push(
      `  ${result.platformName}: ${result.wouldSucceed ? 'PASS' : 'FAIL'} (${result.errors.length} errors, ${result.warnings.length} warnings)`
    );
  }

  return lines.join('\n');
}

function generateRecommendations(results: MockPublishResult[]): string[] {
  const recommendations: string[] = [];

  // Analyze failures
  const failures = results.filter((r) => !r.wouldSucceed);
  if (failures.length > 0) {
    recommendations.push(
      `Fix ${failures.length} platform(s) before publishing: ${failures.map((f) => f.platformName).join(', ')}`
    );
  }

  // Analyze warnings
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  if (totalWarnings > 0) {
    recommendations.push(
      `Review ${totalWarnings} warning(s) across all platforms`
    );
  }

  // Character limit recommendations
  const nearLimit = results.filter(
    (r) => r.characterAnalysis.limitPercentage > 80 && r.characterAnalysis.limitPercentage <= 100
  );
  if (nearLimit.length > 0) {
    recommendations.push(
      `Content approaching character limits on: ${nearLimit.map((r) => r.platformName).join(', ')}`
    );
  }

  // Success
  if (recommendations.length === 0) {
    recommendations.push('All platforms ready for publishing!');
  }

  return recommendations;
}

// ============================================
// EXPORTS
// ============================================

export {
  executePlatformDryRun,
  validateConnection,
  validateCredentials,
  validateContent,
  validateCharacterLimits,
  validateImages,
};
