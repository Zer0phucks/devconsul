/**
 * POST /api/publishing/dry-run
 *
 * Test publish without actually publishing
 * Supports both legacy and comprehensive testing modes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dryRunPublish, executeDryRun } from '@/lib/publishing';
import { dryRunPublishSchema } from '@/lib/validations/publishing';
import { z } from 'zod';

// Enhanced schema with test configuration
const comprehensiveDryRunSchema = dryRunPublishSchema.extend({
  projectId: z.string().cuid('Invalid project ID'),
  useComprehensive: z.boolean().optional().default(false),
  testType: z.enum(['DRY_RUN', 'VALIDATION_ONLY', 'CONNECTIVITY', 'FULL_FLOW']).optional(),
  testName: z.string().optional(),
  testDescription: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = comprehensiveDryRunSchema.parse(body);

    // Use comprehensive testing if requested
    if (validated.useComprehensive) {
      const result = await executeDryRun(
        validated.projectId,
        session.user.id,
        validated.contentId,
        validated.platformIds,
        {
          testType: validated.testType || 'DRY_RUN',
          name: validated.testName,
          description: validated.testDescription,
        }
      );

      return NextResponse.json({
        testRunId: result.testRunId,
        passed: result.passed,
        results: result.results,
        summary: result.summary,
        comprehensive: true,
      });
    }

    // Legacy dry run (backward compatible)
    const result = await dryRunPublish(
      validated.contentId,
      validated.platformIds
    );

    return NextResponse.json({
      ...result,
      comprehensive: false,
    });
  } catch (error) {
    console.error('Dry run error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dry run failed' },
      { status: 500 }
    );
  }
}
