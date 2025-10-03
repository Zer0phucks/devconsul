import { GitHubClient } from './client';
import type { GitHubActivity } from '@/lib/types';

export interface ActivityFilter {
  eventTypes?: GitHubActivity['type'][];
  contributors?: string[];
  branches?: string[];
  since?: Date;
  until?: Date;
}

export interface ActivityAggregation {
  daily: Map<string, ActivitySummary>;
  weekly: Map<string, ActivitySummary>;
  monthly: Map<string, ActivitySummary>;
  total: ActivitySummary;
}

export interface ActivitySummary {
  commits: number;
  pullRequests: { open: number; closed: number; merged: number };
  issues: { opened: number; closed: number };
  releases: number;
  contributors: Set<string>;
  dateRange: { start: Date; end: Date };
}

/**
 * Fetch all activity for a repository within a date range
 */
export async function fetchRepositoryActivity(
  client: GitHubClient,
  owner: string,
  repo: string,
  options: {
    since?: Date;
    until?: Date;
    branches?: string[];
  } = {}
): Promise<{
  commits: any[];
  pullRequests: any[];
  issues: any[];
  releases: any[];
}> {
  const { since, until, branches = ['main', 'master'] } = options;

  // Default to last 30 days if no date range specified
  const sinceDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const untilDate = until || new Date();

  // Fetch activity in parallel for efficiency
  const [commitsData, pullRequestsData, issuesData, releasesData] = await Promise.all([
    // Fetch commits for all specified branches
    Promise.all(
      branches.map(branch =>
        client
          .getCommits(owner, repo, {
            since: sinceDate,
            until: untilDate,
            sha: branch,
            perPage: 100,
          })
          .catch(() => []) // Ignore errors for branches that don't exist
      )
    ).then(results => results.flat()),

    // Fetch pull requests
    client.getPullRequests(owner, repo, {
      state: 'all',
      since: sinceDate,
      perPage: 100,
    }),

    // Fetch issues
    client.getIssues(owner, repo, {
      state: 'all',
      since: sinceDate,
      perPage: 100,
    }),

    // Fetch releases
    client.getReleases(owner, repo, { perPage: 100 }),
  ]);

  // Filter releases by date
  const releases = releasesData.filter(release => {
    const releaseDate = release.published_at || release.created_at;
    return releaseDate >= sinceDate && releaseDate <= untilDate;
  });

  return {
    commits: commitsData,
    pullRequests: pullRequestsData,
    issues: issuesData,
    releases,
  };
}

/**
 * Filter activity based on specified criteria
 */
export function filterActivity(
  activity: {
    commits: any[];
    pullRequests: any[];
    issues: any[];
    releases: any[];
  },
  filter: ActivityFilter
): {
  commits: any[];
  pullRequests: any[];
  issues: any[];
  releases: any[];
} {
  let { commits, pullRequests, issues, releases } = activity;

  // Filter by contributors
  if (filter.contributors && filter.contributors.length > 0) {
    const contributorSet = new Set(filter.contributors);
    commits = commits.filter(c => contributorSet.has(c.author.login));
    pullRequests = pullRequests.filter(pr => contributorSet.has(pr.user.login));
    issues = issues.filter(i => contributorSet.has(i.user.login));
    releases = releases.filter(r => contributorSet.has(r.author.login));
  }

  // Filter by date range
  if (filter.since) {
    commits = commits.filter(c => c.date >= filter.since!);
    pullRequests = pullRequests.filter(pr => pr.created_at >= filter.since!);
    issues = issues.filter(i => i.created_at >= filter.since!);
    releases = releases.filter(r => (r.published_at || r.created_at) >= filter.since!);
  }

  if (filter.until) {
    commits = commits.filter(c => c.date <= filter.until!);
    pullRequests = pullRequests.filter(pr => pr.created_at <= filter.until!);
    issues = issues.filter(i => i.created_at <= filter.until!);
    releases = releases.filter(r => (r.published_at || r.created_at) <= filter.until!);
  }

  return { commits, pullRequests, issues, releases };
}

/**
 * Aggregate activity by time period (daily, weekly, monthly)
 */
export function aggregateActivity(
  activity: {
    commits: any[];
    pullRequests: any[];
    issues: any[];
    releases: any[];
  },
  timezone = 'UTC'
): ActivityAggregation {
  const daily = new Map<string, ActivitySummary>();
  const weekly = new Map<string, ActivitySummary>();
  const monthly = new Map<string, ActivitySummary>();

  const totalSummary: ActivitySummary = {
    commits: 0,
    pullRequests: { open: 0, closed: 0, merged: 0 },
    issues: { opened: 0, closed: 0 },
    releases: 0,
    contributors: new Set<string>(),
    dateRange: {
      start: new Date(),
      end: new Date(0),
    },
  };

  // Helper to get date keys
  const getDayKey = (date: Date) => date.toISOString().split('T')[0];
  const getWeekKey = (date: Date) => {
    const week = getWeekNumber(date);
    return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  };
  const getMonthKey = (date: Date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

  // Process commits
  activity.commits.forEach(commit => {
    const date = commit.date;
    updateDateRange(totalSummary.dateRange, date);

    const dayKey = getDayKey(date);
    const weekKey = getWeekKey(date);
    const monthKey = getMonthKey(date);

    ensureSummary(daily, dayKey, date);
    ensureSummary(weekly, weekKey, date);
    ensureSummary(monthly, monthKey, date);

    daily.get(dayKey)!.commits++;
    weekly.get(weekKey)!.commits++;
    monthly.get(monthKey)!.commits++;
    totalSummary.commits++;

    const author = commit.author.login;
    daily.get(dayKey)!.contributors.add(author);
    weekly.get(weekKey)!.contributors.add(author);
    monthly.get(monthKey)!.contributors.add(author);
    totalSummary.contributors.add(author);
  });

  // Process pull requests
  activity.pullRequests.forEach(pr => {
    const date = pr.created_at;
    updateDateRange(totalSummary.dateRange, date);

    const dayKey = getDayKey(date);
    const weekKey = getWeekKey(date);
    const monthKey = getMonthKey(date);

    ensureSummary(daily, dayKey, date);
    ensureSummary(weekly, weekKey, date);
    ensureSummary(monthly, monthKey, date);

    const incrementPR = (summary: ActivitySummary) => {
      if (pr.state === 'open') {
        summary.pullRequests.open++;
        totalSummary.pullRequests.open++;
      } else if (pr.merged) {
        summary.pullRequests.merged++;
        totalSummary.pullRequests.merged++;
      } else {
        summary.pullRequests.closed++;
        totalSummary.pullRequests.closed++;
      }
    };

    incrementPR(daily.get(dayKey)!);
    incrementPR(weekly.get(weekKey)!);
    incrementPR(monthly.get(monthKey)!);

    const author = pr.user.login;
    daily.get(dayKey)!.contributors.add(author);
    weekly.get(weekKey)!.contributors.add(author);
    monthly.get(monthKey)!.contributors.add(author);
    totalSummary.contributors.add(author);
  });

  // Process issues
  activity.issues.forEach(issue => {
    const date = issue.created_at;
    updateDateRange(totalSummary.dateRange, date);

    const dayKey = getDayKey(date);
    const weekKey = getWeekKey(date);
    const monthKey = getMonthKey(date);

    ensureSummary(daily, dayKey, date);
    ensureSummary(weekly, weekKey, date);
    ensureSummary(monthly, monthKey, date);

    daily.get(dayKey)!.issues.opened++;
    weekly.get(weekKey)!.issues.opened++;
    monthly.get(monthKey)!.issues.opened++;
    totalSummary.issues.opened++;

    if (issue.state === 'closed') {
      daily.get(dayKey)!.issues.closed++;
      weekly.get(weekKey)!.issues.closed++;
      monthly.get(monthKey)!.issues.closed++;
      totalSummary.issues.closed++;
    }

    const author = issue.user.login;
    daily.get(dayKey)!.contributors.add(author);
    weekly.get(weekKey)!.contributors.add(author);
    monthly.get(monthKey)!.contributors.add(author);
    totalSummary.contributors.add(author);
  });

  // Process releases
  activity.releases.forEach(release => {
    const date = release.published_at || release.created_at;
    updateDateRange(totalSummary.dateRange, date);

    const dayKey = getDayKey(date);
    const weekKey = getWeekKey(date);
    const monthKey = getMonthKey(date);

    ensureSummary(daily, dayKey, date);
    ensureSummary(weekly, weekKey, date);
    ensureSummary(monthly, monthKey, date);

    daily.get(dayKey)!.releases++;
    weekly.get(weekKey)!.releases++;
    monthly.get(monthKey)!.releases++;
    totalSummary.releases++;

    const author = release.author.login;
    daily.get(dayKey)!.contributors.add(author);
    weekly.get(weekKey)!.contributors.add(author);
    monthly.get(monthKey)!.contributors.add(author);
    totalSummary.contributors.add(author);
  });

  return {
    daily,
    weekly,
    monthly,
    total: totalSummary,
  };
}

/**
 * Helper functions
 */

function ensureSummary(map: Map<string, ActivitySummary>, key: string, date: Date) {
  if (!map.has(key)) {
    map.set(key, {
      commits: 0,
      pullRequests: { open: 0, closed: 0, merged: 0 },
      issues: { opened: 0, closed: 0 },
      releases: 0,
      contributors: new Set<string>(),
      dateRange: { start: date, end: date },
    });
  }
}

function updateDateRange(range: { start: Date; end: Date }, date: Date) {
  if (date < range.start) range.start = date;
  if (date > range.end) range.end = date;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Convert aggregation data to serializable format (for API responses)
 */
export function serializeAggregation(aggregation: ActivityAggregation) {
  const serializeMap = (map: Map<string, ActivitySummary>) => {
    const result: Record<string, any> = {};
    map.forEach((value, key) => {
      result[key] = {
        ...value,
        contributors: Array.from(value.contributors),
      };
    });
    return result;
  };

  return {
    daily: serializeMap(aggregation.daily),
    weekly: serializeMap(aggregation.weekly),
    monthly: serializeMap(aggregation.monthly),
    total: {
      ...aggregation.total,
      contributors: Array.from(aggregation.total.contributors),
    },
  };
}
