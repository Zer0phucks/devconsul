/**
 * GitHub Repository Insights
 * Advanced analytics and visualization for repository activity
 */

import { GitHubClient } from './client';
import type { InsightPeriod } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface RepositoryInsight {
  periodStart: Date;
  periodEnd: Date;
  periodType: InsightPeriod;

  // Activity metrics
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalReleases: number;

  // Detailed statistics
  commitStats: CommitStatistics;
  prStats: PullRequestStatistics;
  issueStats: IssueStatistics;

  // Contributor analysis
  contributorCount: number;
  topContributors: ContributorSummary[];
  contributorDiversity: number; // 0-1 score

  // Language breakdown
  languageStats: Record<string, LanguageStat>;

  // File analysis
  fileChangeFrequency: Record<string, number>;
  hotspots: FileHotspot[];

  // Branch activity
  branchStats: BranchStat[];

  // Velocity metrics
  commitVelocity: number; // Commits per week
  prMergeRate: number; // PRs merged per week
  issueResolutionRate: number; // Issues closed per week

  // Health metrics
  healthScore: number; // 0-100
  healthFactors: HealthFactors;

  // Visualization data
  heatmapData: HeatmapData;
}

export interface CommitStatistics {
  total: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  avgCommitSize: number;
  commitsByDay: Record<string, number>;
  commitsByHour: Record<number, number>;
}

export interface PullRequestStatistics {
  total: number;
  merged: number;
  closed: number;
  draft: number;
  open: number;
  avgMergeTime: number; // Hours
  avgReviewTime: number; // Hours
  mergeRate: number; // Percentage
}

export interface IssueStatistics {
  total: number;
  opened: number;
  closed: number;
  stale: number;
  avgCloseTime: number; // Hours
  closeRate: number; // Percentage
}

export interface ContributorSummary {
  login: string;
  name?: string;
  avatarUrl?: string;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  linesAdded: number;
  linesDeleted: number;
  impactScore: number; // 0-100
}

export interface LanguageStat {
  lines: number;
  percentage: number;
  files: number;
}

export interface FileHotspot {
  filename: string;
  changeCount: number;
  contributors: number;
  lastChanged: Date;
  impact: 'high' | 'medium' | 'low';
}

export interface BranchStat {
  name: string;
  commitCount: number;
  lastActivity: Date;
  isActive: boolean;
}

export interface HealthFactors {
  activityScore: number; // 0-100
  collaborationScore: number; // 0-100
  qualityScore: number; // 0-100
  velocityScore: number; // 0-100
  maintenanceScore: number; // 0-100
}

export interface HeatmapData {
  days: Array<{
    date: string; // ISO date
    count: number;
    level: 0 | 1 | 2 | 3 | 4; // GitHub-style intensity levels
  }>;
  weeks: number;
  maxCount: number;
}

// ============================================
// INSIGHTS GENERATION
// ============================================

/**
 * Generate comprehensive repository insights for a time period
 */
export async function generateRepositoryInsights(
  client: GitHubClient,
  owner: string,
  repo: string,
  options: {
    periodStart: Date;
    periodEnd: Date;
    periodType?: InsightPeriod;
    branches?: string[];
  }
): Promise<RepositoryInsight> {
  const { periodStart, periodEnd, periodType = 'MONTHLY', branches = ['main', 'master'] } = options;

  // Fetch all activity data in parallel
  const [commits, pullRequests, issues, releases] = await Promise.all([
    fetchAllCommits(client, owner, repo, periodStart, periodEnd, branches),
    client.getPullRequests(owner, repo, { state: 'all', since: periodStart }),
    client.getIssues(owner, repo, { state: 'all', since: periodStart }),
    client.getReleases(owner, repo, {}),
  ]);

  // Filter releases by date range
  const filteredReleases = releases.filter(r => {
    const releaseDate = r.published_at || r.created_at;
    return releaseDate >= periodStart && releaseDate <= periodEnd;
  });

  // Generate all statistics
  const commitStats = calculateCommitStatistics(commits, periodStart, periodEnd);
  const prStats = calculatePRStatistics(pullRequests, periodStart, periodEnd);
  const issueStats = calculateIssueStatistics(issues, periodStart, periodEnd);
  const contributorData = analyzeContributors(commits, pullRequests, issues);
  const languageStats = await analyzeLanguages(client, owner, repo);
  const fileAnalysis = analyzeFileChanges(commits);
  const branchStats = analyzeBranches(commits);
  const velocityMetrics = calculateVelocityMetrics(commitStats, prStats, issueStats);
  const healthMetrics = calculateHealthScore(commitStats, prStats, issueStats, contributorData);
  const heatmapData = generateHeatmapData(commits, periodStart, periodEnd);

  return {
    periodStart,
    periodEnd,
    periodType,

    totalCommits: commits.length,
    totalPullRequests: pullRequests.length,
    totalIssues: issues.length,
    totalReleases: filteredReleases.length,

    commitStats,
    prStats,
    issueStats,

    contributorCount: contributorData.contributors.size,
    topContributors: contributorData.topContributors,
    contributorDiversity: contributorData.diversity,

    languageStats,

    fileChangeFrequency: fileAnalysis.frequency,
    hotspots: fileAnalysis.hotspots,

    branchStats,

    commitVelocity: velocityMetrics.commitVelocity,
    prMergeRate: velocityMetrics.prMergeRate,
    issueResolutionRate: velocityMetrics.issueResolutionRate,

    healthScore: healthMetrics.overallScore,
    healthFactors: healthMetrics.factors,

    heatmapData,
  };
}

// ============================================
// COMMIT ANALYSIS
// ============================================

async function fetchAllCommits(
  client: GitHubClient,
  owner: string,
  repo: string,
  since: Date,
  until: Date,
  branches: string[]
): Promise<any[]> {
  const commitPromises = branches.map(branch =>
    client.getCommits(owner, repo, { since, until, sha: branch, perPage: 100 })
      .catch(() => []) // Ignore errors for non-existent branches
  );

  const commitArrays = await Promise.all(commitPromises);
  const allCommits = commitArrays.flat();

  // Deduplicate commits by SHA
  const uniqueCommits = Array.from(
    new Map(allCommits.map(c => [c.sha, c])).values()
  );

  return uniqueCommits;
}

function calculateCommitStatistics(
  commits: any[],
  periodStart: Date,
  periodEnd: Date
): CommitStatistics {
  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalChangedFiles = 0;

  const commitsByDay: Record<string, number> = {};
  const commitsByHour: Record<number, number> = {};

  commits.forEach(commit => {
    // Aggregate code changes
    if (commit.stats) {
      totalAdditions += commit.stats.additions || 0;
      totalDeletions += commit.stats.deletions || 0;
    }
    if (commit.files) {
      totalChangedFiles += commit.files.length;
    }

    // Track commits by day
    const dayKey = commit.date.toISOString().split('T')[0];
    commitsByDay[dayKey] = (commitsByDay[dayKey] || 0) + 1;

    // Track commits by hour
    const hour = commit.date.getHours();
    commitsByHour[hour] = (commitsByHour[hour] || 0) + 1;
  });

  const avgCommitSize = commits.length > 0
    ? (totalAdditions + totalDeletions) / commits.length
    : 0;

  return {
    total: commits.length,
    additions: totalAdditions,
    deletions: totalDeletions,
    changedFiles: totalChangedFiles,
    avgCommitSize: Math.round(avgCommitSize),
    commitsByDay,
    commitsByHour,
  };
}

// ============================================
// PULL REQUEST ANALYSIS
// ============================================

function calculatePRStatistics(
  pullRequests: any[],
  periodStart: Date,
  periodEnd: Date
): PullRequestStatistics {
  const merged = pullRequests.filter(pr => pr.merged);
  const closed = pullRequests.filter(pr => pr.state === 'closed' && !pr.merged);
  const draft = pullRequests.filter(pr => pr.draft);
  const open = pullRequests.filter(pr => pr.state === 'open');

  // Calculate average merge time (creation to merge)
  const mergeTimes = merged
    .filter(pr => pr.merged_at && pr.created_at)
    .map(pr => (pr.merged_at.getTime() - pr.created_at.getTime()) / (1000 * 60 * 60)); // Hours

  const avgMergeTime = mergeTimes.length > 0
    ? mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length
    : 0;

  // Calculate average review time (creation to first meaningful update)
  const reviewTimes = pullRequests
    .filter(pr => pr.created_at && pr.updated_at && pr.created_at < pr.updated_at)
    .map(pr => (pr.updated_at.getTime() - pr.created_at.getTime()) / (1000 * 60 * 60)); // Hours

  const avgReviewTime = reviewTimes.length > 0
    ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
    : 0;

  const mergeRate = pullRequests.length > 0
    ? (merged.length / pullRequests.length) * 100
    : 0;

  return {
    total: pullRequests.length,
    merged: merged.length,
    closed: closed.length,
    draft: draft.length,
    open: open.length,
    avgMergeTime: Math.round(avgMergeTime * 10) / 10,
    avgReviewTime: Math.round(avgReviewTime * 10) / 10,
    mergeRate: Math.round(mergeRate * 10) / 10,
  };
}

// ============================================
// ISSUE ANALYSIS
// ============================================

function calculateIssueStatistics(
  issues: any[],
  periodStart: Date,
  periodEnd: Date
): IssueStatistics {
  const opened = issues.filter(i => i.created_at >= periodStart && i.created_at <= periodEnd);
  const closed = issues.filter(i => i.state === 'closed');

  // Stale issues: open for more than 30 days with no updates
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stale = issues.filter(i =>
    i.state === 'open' &&
    i.updated_at < thirtyDaysAgo
  );

  // Calculate average close time
  const closeTimes = closed
    .filter(i => i.closed_at && i.created_at)
    .map(i => (i.closed_at.getTime() - i.created_at.getTime()) / (1000 * 60 * 60)); // Hours

  const avgCloseTime = closeTimes.length > 0
    ? closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length
    : 0;

  const closeRate = issues.length > 0
    ? (closed.length / issues.length) * 100
    : 0;

  return {
    total: issues.length,
    opened: opened.length,
    closed: closed.length,
    stale: stale.length,
    avgCloseTime: Math.round(avgCloseTime * 10) / 10,
    closeRate: Math.round(closeRate * 10) / 10,
  };
}

// ============================================
// CONTRIBUTOR ANALYSIS
// ============================================

function analyzeContributors(
  commits: any[],
  pullRequests: any[],
  issues: any[]
): {
  contributors: Set<string>;
  topContributors: ContributorSummary[];
  diversity: number;
} {
  const contributorMap = new Map<string, ContributorSummary>();

  // Process commits
  commits.forEach(commit => {
    const login = commit.author.login;
    if (!contributorMap.has(login)) {
      contributorMap.set(login, {
        login,
        name: commit.author.name,
        avatarUrl: commit.author.avatar_url,
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
        linesAdded: 0,
        linesDeleted: 0,
        impactScore: 0,
      });
    }

    const contributor = contributorMap.get(login)!;
    contributor.commits++;
    if (commit.stats) {
      contributor.linesAdded += commit.stats.additions || 0;
      contributor.linesDeleted += commit.stats.deletions || 0;
    }
  });

  // Process pull requests
  pullRequests.forEach(pr => {
    const login = pr.user.login;
    if (contributorMap.has(login)) {
      contributorMap.get(login)!.pullRequests++;
    }
  });

  // Process issues
  issues.forEach(issue => {
    const login = issue.user.login;
    if (contributorMap.has(login)) {
      contributorMap.get(login)!.issues++;
    }
  });

  // Calculate impact scores
  contributorMap.forEach(contributor => {
    const commitScore = Math.min(contributor.commits / 10, 1) * 30;
    const prScore = Math.min(contributor.pullRequests / 5, 1) * 25;
    const issueScore = Math.min(contributor.issues / 5, 1) * 15;
    const codeScore = Math.min((contributor.linesAdded + contributor.linesDeleted) / 1000, 1) * 30;

    contributor.impactScore = Math.round(commitScore + prScore + issueScore + codeScore);
  });

  // Sort by impact score
  const topContributors = Array.from(contributorMap.values())
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 10);

  // Calculate diversity (Gini coefficient approximation)
  const totalCommits = commits.length;
  const commitCounts = Array.from(contributorMap.values()).map(c => c.commits);
  const diversity = calculateDiversityScore(commitCounts, totalCommits);

  return {
    contributors: new Set(contributorMap.keys()),
    topContributors,
    diversity,
  };
}

function calculateDiversityScore(contributions: number[], total: number): number {
  if (contributions.length === 0) return 0;
  if (contributions.length === 1) return 0; // No diversity with single contributor

  // Simple diversity metric: 1 - (top contributor % / 100)
  // Score of 1 = perfectly distributed, 0 = one person does everything
  const maxContribution = Math.max(...contributions);
  const topContributorPct = (maxContribution / total) * 100;

  return Math.max(0, Math.min(1, 1 - (topContributorPct / 100)));
}

// ============================================
// LANGUAGE ANALYSIS
// ============================================

async function analyzeLanguages(
  client: GitHubClient,
  owner: string,
  repo: string
): Promise<Record<string, LanguageStat>> {
  try {
    // Note: This would require additional GitHub API call
    // For now, return empty object. Can be enhanced with actual API call.
    return {};
  } catch (error) {
    console.error('Failed to analyze languages:', error);
    return {};
  }
}

// ============================================
// FILE CHANGE ANALYSIS
// ============================================

function analyzeFileChanges(commits: any[]): {
  frequency: Record<string, number>;
  hotspots: FileHotspot[];
} {
  const fileChanges = new Map<string, {
    count: number;
    contributors: Set<string>;
    lastChanged: Date;
  }>();

  commits.forEach(commit => {
    if (!commit.files) return;

    commit.files.forEach((file: any) => {
      if (!fileChanges.has(file.filename)) {
        fileChanges.set(file.filename, {
          count: 0,
          contributors: new Set(),
          lastChanged: commit.date,
        });
      }

      const fileData = fileChanges.get(file.filename)!;
      fileData.count++;
      fileData.contributors.add(commit.author.login);
      if (commit.date > fileData.lastChanged) {
        fileData.lastChanged = commit.date;
      }
    });
  });

  // Convert to frequency map
  const frequency: Record<string, number> = {};
  fileChanges.forEach((data, filename) => {
    frequency[filename] = data.count;
  });

  // Identify hotspots (frequently changed files)
  const hotspots: FileHotspot[] = Array.from(fileChanges.entries())
    .map(([filename, data]) => ({
      filename,
      changeCount: data.count,
      contributors: data.contributors.size,
      lastChanged: data.lastChanged,
      impact: data.count > 20 ? 'high' : data.count > 10 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
    }))
    .sort((a, b) => b.changeCount - a.changeCount)
    .slice(0, 20);

  return { frequency, hotspots };
}

// ============================================
// BRANCH ANALYSIS
// ============================================

function analyzeBranches(commits: any[]): BranchStat[] {
  // Note: This requires branch information from commits
  // Currently GitHub client doesn't include branch info in commit data
  // This would need enhancement to track which branch each commit belongs to
  return [];
}

// ============================================
// VELOCITY METRICS
// ============================================

function calculateVelocityMetrics(
  commitStats: CommitStatistics,
  prStats: PullRequestStatistics,
  issueStats: IssueStatistics
): {
  commitVelocity: number;
  prMergeRate: number;
  issueResolutionRate: number;
} {
  // These are simplified calculations
  // In production, would calculate based on actual time period
  return {
    commitVelocity: commitStats.total / 4, // Assume monthly period = 4 weeks
    prMergeRate: prStats.merged / 4,
    issueResolutionRate: issueStats.closed / 4,
  };
}

// ============================================
// HEALTH SCORE CALCULATION
// ============================================

function calculateHealthScore(
  commitStats: CommitStatistics,
  prStats: PullRequestStatistics,
  issueStats: IssueStatistics,
  contributorData: any
): {
  overallScore: number;
  factors: HealthFactors;
} {
  // Activity score: based on commit frequency
  const activityScore = Math.min((commitStats.total / 50) * 100, 100);

  // Collaboration score: based on PR merge rate and contributor diversity
  const collaborationScore = (prStats.mergeRate * 0.5) + (contributorData.diversity * 50);

  // Quality score: based on PR review time and issue close rate
  const qualityScore = Math.max(100 - (prStats.avgReviewTime / 48 * 50), 0) + (issueStats.closeRate * 0.5);

  // Velocity score: based on commit and PR velocity
  const velocityScore = Math.min((commitStats.total / 30) * 100, 100);

  // Maintenance score: based on stale issues
  const maintenanceScore = Math.max(100 - (issueStats.stale / issueStats.total * 100), 0);

  const factors: HealthFactors = {
    activityScore: Math.round(activityScore),
    collaborationScore: Math.round(collaborationScore),
    qualityScore: Math.round(qualityScore),
    velocityScore: Math.round(velocityScore),
    maintenanceScore: Math.round(maintenanceScore),
  };

  // Overall score is weighted average
  const overallScore = Math.round(
    activityScore * 0.25 +
    collaborationScore * 0.20 +
    qualityScore * 0.25 +
    velocityScore * 0.15 +
    maintenanceScore * 0.15
  );

  return {
    overallScore,
    factors,
  };
}

// ============================================
// HEATMAP GENERATION
// ============================================

function generateHeatmapData(
  commits: any[],
  periodStart: Date,
  periodEnd: Date
): HeatmapData {
  const dayMap = new Map<string, number>();

  // Count commits per day
  commits.forEach(commit => {
    const dayKey = commit.date.toISOString().split('T')[0];
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
  });

  const maxCount = Math.max(...Array.from(dayMap.values()), 0);

  // Generate all days in period
  const days: HeatmapData['days'] = [];
  const currentDate = new Date(periodStart);

  while (currentDate <= periodEnd) {
    const dayKey = currentDate.toISOString().split('T')[0];
    const count = dayMap.get(dayKey) || 0;

    // Calculate GitHub-style intensity level (0-4)
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    days.push({ date: dayKey, count, level });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const weeks = Math.ceil(days.length / 7);

  return { days, weeks, maxCount };
}
