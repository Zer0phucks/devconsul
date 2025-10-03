'use client';

/**
 * Repository Insights Dashboard
 * Comprehensive visualization of GitHub repository activity and health
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Calendar } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CommitHeatmap } from '@/components/insights/commit-heatmap';
import { ContributorLeaderboard } from '@/components/insights/contributor-leaderboard';
import { NewsworthyFeed } from '@/components/insights/newsworthy-feed';
import { HealthScoreCard } from '@/components/insights/health-score-card';
import { ActivityTimeline } from '@/components/insights/activity-timeline';

type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface InsightsData {
  id: string;
  periodStart: string;
  periodEnd: string;
  periodType: PeriodType;

  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalReleases: number;

  commitStats: any;
  prStats: any;
  issueStats: any;

  contributorCount: number;
  topContributors: any[];
  contributorDiversity: number;

  languageStats: any;
  fileChangeFrequency: any;
  hotspots: any[];
  branchStats: any;

  commitVelocity: number;
  prMergeRate: number;
  issueResolutionRate: number;

  healthScore: number;
  healthFactors: {
    activityScore: number;
    collaborationScore: number;
    qualityScore: number;
    velocityScore: number;
    maintenanceScore: number;
  };

  newsworthyItems: any[];
  heatmapData: {
    days: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }>;
    weeks: number;
    maxCount: number;
  };

  lastSyncedAt: string;
}

export default function InsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodType>('MONTHLY');
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, [resolvedParams.id, period]);

  const fetchInsights = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const url = `/api/insights/${resolvedParams.id}?period=${period}${forceRefresh ? '&refresh=true' : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInsights(true);
  };

  const formatPeriodLabel = (period: PeriodType): string => {
    switch (period) {
      case 'DAILY': return 'Last 24 Hours';
      case 'WEEKLY': return 'Last Week';
      case 'MONTHLY': return 'Last Month';
      case 'QUARTERLY': return 'Last Quarter';
      case 'YEARLY': return 'Last Year';
    }
  };

  // Transform insights data for timeline component
  const timelineEvents = insights ? [
    // Commits
    ...(insights.commitStats?.recentCommits || []).map((commit: any) => ({
      id: commit.sha,
      type: 'commit' as const,
      title: commit.message?.split('\n')[0] || 'Untitled commit',
      description: commit.message?.split('\n').slice(1).join('\n'),
      author: {
        login: commit.author?.login || 'unknown',
        name: commit.author?.name,
        avatarUrl: commit.author?.avatarUrl,
      },
      timestamp: new Date(commit.date),
      metadata: {
        sha: commit.sha,
        additions: commit.additions,
        deletions: commit.deletions,
        changedFiles: commit.changedFiles,
      },
      htmlUrl: commit.htmlUrl,
    })),
    // Pull Requests
    ...(insights.prStats?.recentPRs || []).map((pr: any) => ({
      id: pr.number.toString(),
      type: pr.merged ? 'merge' : 'pull_request' as const,
      title: pr.title,
      description: pr.body?.slice(0, 150),
      author: {
        login: pr.user?.login || 'unknown',
        name: pr.user?.name,
        avatarUrl: pr.user?.avatarUrl,
      },
      timestamp: new Date(pr.merged ? pr.merged_at : pr.created_at),
      status: pr.merged ? 'merged' : pr.state,
      metadata: {
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        labels: pr.labels?.map((l: any) => l.name),
      },
      htmlUrl: pr.html_url,
    })),
    // Issues
    ...(insights.issueStats?.recentIssues || []).map((issue: any) => ({
      id: issue.number.toString(),
      type: 'issue' as const,
      title: issue.title,
      description: issue.body?.slice(0, 150),
      author: {
        login: issue.user?.login || 'unknown',
        name: issue.user?.name,
        avatarUrl: issue.user?.avatarUrl,
      },
      timestamp: new Date(issue.created_at),
      status: issue.state,
      metadata: {
        labels: issue.labels?.map((l: any) => l.name),
      },
      htmlUrl: issue.html_url,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) : [];

  if (isLoading && !insights) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!insights) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Insights Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Unable to load repository insights. Please try again.
          </p>
          <Button onClick={() => router.push(`/dashboard/projects/${resolvedParams.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push(`/dashboard/projects/${resolvedParams.id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Repository Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Analytics and activity visualization for {formatPeriodLabel(period).toLowerCase()}
              </p>
            </div>

            <div className="flex gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Last 24 Hours</SelectItem>
                  <SelectItem value="WEEKLY">Last Week</SelectItem>
                  <SelectItem value="MONTHLY">Last Month</SelectItem>
                  <SelectItem value="QUARTERLY">Last Quarter</SelectItem>
                  <SelectItem value="YEARLY">Last Year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Commits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.totalCommits}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {insights.commitVelocity.toFixed(1)} per week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pull Requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.totalPullRequests}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(insights.prMergeRate * 100).toFixed(0)}% merge rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.totalIssues}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(insights.issueResolutionRate * 100).toFixed(0)}% resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contributors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{insights.contributorCount}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(insights.contributorDiversity * 100).toFixed(0)}% diversity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Health Score */}
          <HealthScoreCard
            overallScore={insights.healthScore}
            factors={insights.healthFactors}
          />

          {/* Newsworthy Events */}
          <NewsworthyFeed
            events={insights.newsworthyItems}
            maxDisplay={5}
          />
        </div>

        {/* Commit Heatmap */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Activity</CardTitle>
              <CardDescription>
                GitHub-style contribution graph for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommitHeatmap data={insights.heatmapData} />
            </CardContent>
          </Card>
        </div>

        {/* Contributors and Timeline */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Top Contributors */}
          <ContributorLeaderboard
            contributors={insights.topContributors}
            maxDisplay={10}
          />

          {/* Activity Timeline */}
          <ActivityTimeline
            events={timelineEvents}
            maxDisplay={20}
          />
        </div>

        {/* Last Synced Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pb-8">
          Last updated: {new Date(insights.lastSyncedAt).toLocaleString()}
        </div>
      </div>
    </AppShell>
  );
}
