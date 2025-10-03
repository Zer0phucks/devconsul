/**
 * Dry Run Mode
 *
 * Test publishing without actually publishing - validation only
 * Legacy API - use dry-run-engine.ts for new comprehensive testing
 */

import { prisma } from '@/lib/db';
import { validateContentForPlatform } from '@/lib/validations/publishing';
import { executeDryRun as executeComprehensiveDryRun } from './dry-run-engine';
import type { DryRunResult } from '@/lib/validations/publishing';

// ============================================
// DRY RUN VALIDATION (LEGACY)
// ============================================

/**
 * Perform dry run validation for content and platforms
 */
export async function dryRunPublish(
  contentId: string,
  platformIds: string[]
): Promise<{
  valid: boolean;
  results: DryRunResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}> {
  // Get content
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error('Content not found');
  }

  // Get platforms
  const platforms = await prisma.platform.findMany({
    where: {
      id: { in: platformIds },
    },
  });

  if (platforms.length !== platformIds.length) {
    throw new Error('Some platforms not found');
  }

  // Validate each platform
  const results: DryRunResult[] = [];

  for (const platform of platforms) {
    const result = await validatePlatformPublish(
      content,
      platform
    );
    results.push(result);
  }

  // Calculate summary
  const summary = {
    total: results.length,
    valid: results.filter((r) => r.valid).length,
    invalid: results.filter((r) => !r.valid).length,
  };

  return {
    valid: summary.invalid === 0,
    results,
    summary,
  };
}

/**
 * Validate single platform publish
 */
async function validatePlatformPublish(
  content: {
    title: string;
    body: string;
    excerpt: string | null;
  },
  platform: {
    id: string;
    type: any;
    name: string;
    isConnected: boolean;
    tokenExpiresAt: Date | null;
    accessToken: string | null;
    apiKey: string | null;
  }
): Promise<DryRunResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Platform connection
  const connectionValid = platform.isConnected;
  if (!connectionValid) {
    errors.push('Platform is not connected');
  }

  // Check 2: Credentials valid (not expired)
  const credentialsValid = platform.tokenExpiresAt
    ? platform.tokenExpiresAt > new Date()
    : true;
  if (!credentialsValid) {
    errors.push('Platform credentials expired');
  }

  // Check 3: Content validation
  const contentValidation = validateContentForPlatform(
    {
      title: content.title,
      body: content.body,
      excerpt: content.excerpt || undefined,
    },
    platform.type
  );

  const contentMeetsRequirements = contentValidation.valid;
  if (!contentMeetsRequirements) {
    errors.push(...contentValidation.errors);
  }
  warnings.push(...contentValidation.warnings);

  // Check 4: Character limits
  const withinCharacterLimit = !contentValidation.errors.some((e) =>
    e.toLowerCase().includes('exceeds') ||
    e.toLowerCase().includes('too long')
  );

  // Check 5: Required fields
  const requiredFieldsPresent =
    content.title.trim().length > 0 &&
    content.body.trim().length > 0;

  if (!requiredFieldsPresent) {
    errors.push('Missing required fields (title or body)');
  }

  return {
    platformId: platform.id,
    platformType: platform.type,
    platformName: platform.name,
    valid: errors.length === 0,
    errors,
    warnings,
    checks: {
      connectionValid,
      credentialsValid,
      contentMeetsRequirements,
      withinCharacterLimit,
      requiredFieldsPresent,
    },
  };
}

/**
 * Validate content across all enabled platforms
 */
export async function validateAllPlatforms(
  contentId: string
): Promise<{
  valid: boolean;
  results: DryRunResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}> {
  // Get content with platforms
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      project: {
        include: {
          platforms: {
            where: { isConnected: true },
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
      valid: false,
      results: [],
      summary: { total: 0, valid: 0, invalid: 0 },
    };
  }

  return dryRunPublish(contentId, platformIds);
}

/**
 * Generate validation report
 */
export function generateValidationReport(
  results: DryRunResult[]
): string {
  let report = '# Publishing Validation Report\n\n';

  // Summary
  const valid = results.filter((r) => r.valid).length;
  const invalid = results.length - valid;

  report += `## Summary\n`;
  report += `- Total Platforms: ${results.length}\n`;
  report += `- ✅ Ready to Publish: ${valid}\n`;
  report += `- ❌ Requires Fixes: ${invalid}\n\n`;

  // Platform details
  report += `## Platform Details\n\n`;

  for (const result of results) {
    report += `### ${result.platformName}\n`;
    report += `Status: ${result.valid ? '✅ Ready' : '❌ Not Ready'}\n\n`;

    if (result.errors.length > 0) {
      report += `**Errors:**\n`;
      result.errors.forEach((error) => {
        report += `- ${error}\n`;
      });
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += `**Warnings:**\n`;
      result.warnings.forEach((warning) => {
        report += `- ${warning}\n`;
      });
      report += '\n';
    }

    report += `**Validation Checks:**\n`;
    report += `- Connection: ${result.checks.connectionValid ? '✅' : '❌'}\n`;
    report += `- Credentials: ${result.checks.credentialsValid ? '✅' : '❌'}\n`;
    report += `- Content Requirements: ${result.checks.contentMeetsRequirements ? '✅' : '❌'}\n`;
    report += `- Character Limits: ${result.checks.withinCharacterLimit ? '✅' : '❌'}\n`;
    report += `- Required Fields: ${result.checks.requiredFieldsPresent ? '✅' : '❌'}\n\n`;
  }

  return report;
}

// ============================================
// NEW COMPREHENSIVE DRY RUN API
// ============================================

/**
 * Execute comprehensive dry run with full test tracking
 * Uses new TestRun and ValidationResult models
 */
export async function executeDryRunWithTracking(
  projectId: string,
  userId: string,
  contentId: string,
  platformIds: string[],
  options: {
    testType?: 'DRY_RUN' | 'VALIDATION_ONLY' | 'CONNECTIVITY' | 'FULL_FLOW';
    name?: string;
    description?: string;
  } = {}
) {
  return executeComprehensiveDryRun(
    projectId,
    userId,
    contentId,
    platformIds,
    {
      testType: options.testType || 'DRY_RUN',
      name: options.name,
      description: options.description,
    }
  );
}

/**
 * Export comprehensive dry run for external use
 */
export { executeDryRun } from './dry-run-engine';
