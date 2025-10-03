import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github/client';
import {
  fetchRepositoryActivity,
  filterActivity,
  aggregateActivity,
  serializeAggregation,
  type ActivityFilter,
} from '@/lib/github/activity';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/github/activity
 * Fetch repository activity (commits, PRs, issues, releases)
 *
 * Query params:
 * - owner: string (required) - Repository owner
 * - repo: string (required) - Repository name
 * - since: ISO date string (optional, default: 30 days ago)
 * - until: ISO date string (optional, default: now)
 * - branches: comma-separated string (optional, default: 'main,master')
 * - contributors: comma-separated usernames (optional)
 * - eventTypes: comma-separated event types (optional, e.g., 'commits,pull_requests,issues,releases')
 * - aggregate: boolean (optional, default: false) - Return aggregated data
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with proper NextAuth session when auth is implemented
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Parse required params
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'Both "owner" and "repo" parameters are required',
        },
        { status: 400 }
      );
    }

    // Get GitHub access token from database
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'github',
      },
      select: {
        access_token: true,
        expires_at: true,
      },
    });

    if (!account || !account.access_token) {
      return NextResponse.json(
        {
          error: 'GitHub account not connected',
          message: 'Please connect your GitHub account to access repository activity',
        },
        { status: 403 }
      );
    }

    // Check if token is expired
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      return NextResponse.json(
        {
          error: 'GitHub token expired',
          message: 'Please reconnect your GitHub account',
        },
        { status: 401 }
      );
    }

    // Parse date range (default to last 30 days)
    const defaultSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : defaultSince;
    const until = searchParams.get('until') ? new Date(searchParams.get('until')!) : new Date();

    // Parse optional filters
    const branches = searchParams.get('branches')?.split(',') || ['main', 'master'];
    const contributors = searchParams.get('contributors')?.split(',').filter(Boolean);
    const eventTypes = searchParams.get('eventTypes')?.split(',').filter(Boolean);
    const shouldAggregate = searchParams.get('aggregate') === 'true';

    // Validate dates
    if (isNaN(since.getTime()) || isNaN(until.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          message: 'Date parameters must be valid ISO 8601 date strings',
        },
        { status: 400 }
      );
    }

    if (since > until) {
      return NextResponse.json(
        {
          error: 'Invalid date range',
          message: '"since" date must be before "until" date',
        },
        { status: 400 }
      );
    }

    // Create GitHub client and fetch activity
    const client = await createGitHubClient(account.access_token, userId);
    let activity = await fetchRepositoryActivity(client, owner, repo, {
      since,
      until,
      branches,
    });

    // Apply filters if specified
    const filter: ActivityFilter = {
      since,
      until,
      contributors,
    };

    if (eventTypes && eventTypes.length > 0) {
      // Note: eventTypes filter is not implemented in filterActivity yet
      // This would filter by event type (commits, pull_requests, etc.)
    }

    activity = filterActivity(activity, filter);

    // Return aggregated or raw data
    if (shouldAggregate) {
      const aggregation = aggregateActivity(activity);
      const serialized = serializeAggregation(aggregation);

      return NextResponse.json({
        success: true,
        data: {
          owner,
          repo,
          dateRange: { since, until },
          aggregation: serialized,
        },
      });
    }

    // Return raw activity data
    return NextResponse.json({
      success: true,
      data: {
        owner,
        repo,
        dateRange: { since, until },
        activity: {
          commits: activity.commits,
          pullRequests: activity.pullRequests,
          issues: activity.issues,
          releases: activity.releases,
        },
        summary: {
          totalCommits: activity.commits.length,
          totalPullRequests: activity.pullRequests.length,
          totalIssues: activity.issues.length,
          totalReleases: activity.releases.length,
          contributors: Array.from(
            new Set([
              ...activity.commits.map(c => c.author.login),
              ...activity.pullRequests.map(pr => pr.user.login),
              ...activity.issues.map(i => i.user.login),
              ...activity.releases.map(r => r.author.login),
            ])
          ),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching GitHub activity:', error);

    // Handle specific error types
    if (error.message.includes('not found or not accessible')) {
      return NextResponse.json(
        {
          error: 'Repository not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (error.message.includes('invalid or expired')) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: error.message,
        },
        { status: 401 }
      );
    }

    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'GitHub API rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch repository activity',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
