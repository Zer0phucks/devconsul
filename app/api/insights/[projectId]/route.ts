/**
 * Repository Insights API
 * GET /api/insights/[projectId] - Fetch repository insights
 * POST /api/insights/[projectId]/refresh - Regenerate insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from "@/lib/auth";
import { prisma } from '@/lib/db';
import { createGitHubClient } from '@/lib/github/client';
import { generateRepositoryInsights } from '@/lib/github/insights';
import { detectNewsworthyEvents, rescoreEvents } from '@/lib/ai/newsworthy';

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000;

/**
 * GET /api/insights/[projectId]
 * Fetch repository insights (cached or generate new)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const { searchParams } = new URL(request.url);
    const periodType = (searchParams.get('period') || 'MONTHLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.githubRepoOwner || !project.githubRepoName) {
      return NextResponse.json(
        { error: 'Project has no GitHub repository configured' },
        { status: 400 }
      );
    }

    // Check for cached insights
    if (!forceRefresh) {
      const cached = await getCachedInsights(projectId, periodType);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Get GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'github',
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: 'GitHub account not connected' },
        { status: 400 }
      );
    }

    // Generate new insights
    const insights = await generateInsights(
      account.access_token,
      project.githubRepoOwner,
      project.githubRepoName,
      projectId,
      periodType
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/insights/[projectId]/refresh
 * Force refresh of repository insights
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const body = await request.json();
    const periodType = (body.period || 'MONTHLY') as 'DAILY' | 'WEEKLY' | 'MONTHLY';

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.githubRepoOwner || !project.githubRepoName) {
      return NextResponse.json(
        { error: 'Project has no GitHub repository configured' },
        { status: 400 }
      );
    }

    // Get GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'github',
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: 'GitHub account not connected' },
        { status: 400 }
      );
    }

    // Clear cached insights
    await clearCachedInsights(projectId, periodType);

    // Generate new insights
    const insights = await generateInsights(
      account.access_token,
      project.githubRepoOwner,
      project.githubRepoName,
      projectId,
      periodType
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Insights refresh error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh insights' },
      { status: 500 }
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getCachedInsights(projectId: string, periodType: string) {
  const now = new Date();

  const cached = await prisma.repositoryInsights.findFirst({
    where: {
      projectId,
      periodType: periodType as any,
      cacheExpiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return cached || null;
}

async function clearCachedInsights(projectId: string, periodType: string) {
  await prisma.repositoryInsights.deleteMany({
    where: {
      projectId,
      periodType: periodType as any,
    },
  });
}

async function generateInsights(
  accessToken: string,
  owner: string,
  repo: string,
  projectId: string,
  periodType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
) {
  // Calculate period range
  const { periodStart, periodEnd } = calculatePeriodRange(periodType);

  // Create GitHub client
  const client = await createGitHubClient(accessToken);

  // Generate comprehensive insights
  const insights = await generateRepositoryInsights(client, owner, repo, {
    periodStart,
    periodEnd,
    periodType,
  });

  // Detect newsworthy events
  const [commits, pullRequests, issues, releases] = await Promise.all([
    client.getCommits(owner, repo, { since: periodStart, until: periodEnd }),
    client.getPullRequests(owner, repo, { state: 'all', since: periodStart }),
    client.getIssues(owner, repo, { state: 'all', since: periodStart }),
    client.getReleases(owner, repo, {}),
  ]);

  const newsworthyEvents = await detectNewsworthyEvents({
    commits,
    pullRequests,
    issues,
    releases: releases.filter(r => {
      const releaseDate = r.published_at || r.created_at;
      return releaseDate >= periodStart && releaseDate <= periodEnd;
    }),
    threshold: 0.6,
  });

  // Score events with repository context
  const scoredEvents = rescoreEvents(newsworthyEvents, {
    repositoryAge: Math.floor((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24)),
    averageCommitsPerWeek: insights.commitVelocity,
  });

  // Save to database
  const saved = await prisma.repositoryInsights.create({
    data: {
      projectId,
      periodStart,
      periodEnd,
      periodType,

      totalCommits: insights.totalCommits,
      totalPullRequests: insights.totalPullRequests,
      totalIssues: insights.totalIssues,
      totalReleases: insights.totalReleases,

      commitStats: insights.commitStats as any,
      prStats: insights.prStats as any,
      issueStats: insights.issueStats as any,

      contributorCount: insights.contributorCount,
      topContributors: insights.topContributors as any,
      contributorDiversity: insights.contributorDiversity,

      languageStats: insights.languageStats as any,
      fileChangeFrequency: insights.fileChangeFrequency as any,
      hotspots: insights.hotspots as any,
      branchStats: insights.branchStats as any,

      commitVelocity: insights.commitVelocity,
      prMergeRate: insights.prMergeRate,
      issueResolutionRate: insights.issueResolutionRate,

      healthScore: insights.healthScore,
      healthFactors: insights.healthFactors as any,

      newsworthyItems: scoredEvents as any,
      heatmapData: insights.heatmapData as any,

      cacheExpiresAt: new Date(Date.now() + CACHE_DURATION_MS),
      lastSyncedAt: new Date(),
    },
  });

  // Also save newsworthy events
  for (const event of scoredEvents.slice(0, 20)) {
    await prisma.newsworthyEvent.create({
      data: {
        projectId,
        eventType: event.type,
        eventDate: event.date,
        title: event.title,
        description: event.description,
        htmlUrl: event.htmlUrl,
        eventData: event.data as any,
        newsworthinessScore: event.score,
        aiReasoning: event.reasoning,
        aiModel: 'claude-3-5-sonnet-20241022',
        category: event.category,
        impact: event.impact,
        tags: event.tags,
      },
    }).catch(err => {
      console.error('Failed to save newsworthy event:', err);
    });
  }

  return saved;
}

function calculatePeriodRange(periodType: string): { periodStart: Date; periodEnd: Date } {
  const now = new Date();
  const periodEnd = new Date(now);
  let periodStart = new Date(now);

  switch (periodType) {
    case 'DAILY':
      periodStart.setDate(periodStart.getDate() - 1);
      break;
    case 'WEEKLY':
      periodStart.setDate(periodStart.getDate() - 7);
      break;
    case 'MONTHLY':
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
    case 'QUARTERLY':
      periodStart.setMonth(periodStart.getMonth() - 3);
      break;
    case 'YEARLY':
      periodStart.setFullYear(periodStart.getFullYear() - 1);
      break;
    default:
      periodStart.setMonth(periodStart.getMonth() - 1);
  }

  return { periodStart, periodEnd };
}
