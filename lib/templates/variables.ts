/**
 * Template Variable System
 * Defines available variables for template substitution
 */

import type { GitHubActivity } from '@/lib/ai/generator';
import { format } from 'date-fns';

export interface TemplateVariables {
  // Repository information
  repository?: string;
  repositoryUrl?: string;
  repositoryOwner?: string;
  repositoryName?: string;
  repositoryDescription?: string;

  // GitHub activity data
  activity?: string;
  activityCount?: number;
  commitCount?: number;
  prCount?: number;
  issueCount?: number;
  releaseCount?: number;

  // Commit details
  latestCommit?: string;
  latestCommitAuthor?: string;
  latestCommitUrl?: string;
  allCommits?: string;

  // Pull request details
  latestPR?: string;
  latestPRAuthor?: string;
  latestPRUrl?: string;
  allPRs?: string;

  // Issue details
  latestIssue?: string;
  latestIssueUrl?: string;
  allIssues?: string;

  // Release details
  latestRelease?: string;
  latestReleaseVersion?: string;
  latestReleaseUrl?: string;
  latestReleaseNotes?: string;

  // Date/time
  date?: string;
  dateShort?: string;
  dateLong?: string;
  time?: string;
  timestamp?: string;
  weekNumber?: number;
  monthName?: string;
  year?: number;

  // Time ranges
  dateRange?: string;
  weekRange?: string;
  monthRange?: string;

  // Project/user context
  projectName?: string;
  projectDescription?: string;
  authorName?: string;
  authorEmail?: string;

  // Brand voice
  tone?: string;
  audience?: string;

  // Custom variables
  [key: string]: string | number | undefined;
}

/**
 * Extract template variables from GitHub activities and context
 */
export function extractTemplateVariables(
  activities: GitHubActivity[],
  context?: {
    projectName?: string;
    projectDescription?: string;
    repository?: {
      url?: string;
      owner?: string;
      name?: string;
      description?: string;
    };
    author?: {
      name?: string;
      email?: string;
    };
    brandVoice?: {
      tone?: string;
      audience?: string;
    };
    dateRange?: {
      start: Date;
      end: Date;
    };
  }
): TemplateVariables {
  const now = new Date();

  // Group activities by type
  const commits = activities.filter(a => a.type === 'commit');
  const prs = activities.filter(a => a.type === 'pr');
  const issues = activities.filter(a => a.type === 'issue');
  const releases = activities.filter(a => a.type === 'release');

  // Build activity summary
  const activitySummary = buildActivitySummary(activities);

  const variables: TemplateVariables = {
    // Repository
    repository: context?.repository?.name,
    repositoryUrl: context?.repository?.url,
    repositoryOwner: context?.repository?.owner,
    repositoryName: context?.repository?.name,
    repositoryDescription: context?.repository?.description,

    // Activity counts
    activity: activitySummary,
    activityCount: activities.length,
    commitCount: commits.length,
    prCount: prs.length,
    issueCount: issues.length,
    releaseCount: releases.length,

    // Latest commit
    latestCommit: commits[0]?.title,
    latestCommitAuthor: commits[0]?.author,
    latestCommitUrl: commits[0]?.url,
    allCommits: commits.map(c => `- ${c.title}`).join('\n'),

    // Latest PR
    latestPR: prs[0]?.title,
    latestPRAuthor: prs[0]?.author,
    latestPRUrl: prs[0]?.url,
    allPRs: prs.map(pr => `- ${pr.title}`).join('\n'),

    // Latest issue
    latestIssue: issues[0]?.title,
    latestIssueUrl: issues[0]?.url,
    allIssues: issues.map(i => `- ${i.title}`).join('\n'),

    // Latest release
    latestRelease: releases[0]?.title,
    latestReleaseVersion: releases[0]?.title?.match(/v?(\d+\.\d+\.\d+)/)?.[1],
    latestReleaseUrl: releases[0]?.url,
    latestReleaseNotes: releases[0]?.description,

    // Dates
    date: format(now, 'yyyy-MM-dd'),
    dateShort: format(now, 'MM/dd/yyyy'),
    dateLong: format(now, 'MMMM d, yyyy'),
    time: format(now, 'HH:mm:ss'),
    timestamp: now.toISOString(),
    weekNumber: parseInt(format(now, 'w')),
    monthName: format(now, 'MMMM'),
    year: now.getFullYear(),

    // Date ranges
    dateRange: context?.dateRange
      ? `${format(context.dateRange.start, 'MMM d')} - ${format(context.dateRange.end, 'MMM d, yyyy')}`
      : undefined,
    weekRange: `Week of ${format(now, 'MMMM d, yyyy')}`,
    monthRange: format(now, 'MMMM yyyy'),

    // Project context
    projectName: context?.projectName,
    projectDescription: context?.projectDescription,
    authorName: context?.author?.name,
    authorEmail: context?.author?.email,

    // Brand voice
    tone: context?.brandVoice?.tone,
    audience: context?.brandVoice?.audience,
  };

  return variables;
}

/**
 * Build a human-readable activity summary
 */
function buildActivitySummary(activities: GitHubActivity[]): string {
  if (!activities || activities.length === 0) {
    return 'No recent activity';
  }

  const grouped = activities.reduce((acc, activity) => {
    acc[activity.type] = acc[activity.type] || [];
    acc[activity.type].push(activity);
    return acc;
  }, {} as Record<string, GitHubActivity[]>);

  const parts: string[] = [];

  if (grouped.commit) {
    parts.push(`${grouped.commit.length} commit${grouped.commit.length > 1 ? 's' : ''}`);
  }
  if (grouped.pr) {
    parts.push(`${grouped.pr.length} pull request${grouped.pr.length > 1 ? 's' : ''}`);
  }
  if (grouped.issue) {
    parts.push(`${grouped.issue.length} issue${grouped.issue.length > 1 ? 's' : ''}`);
  }
  if (grouped.release) {
    parts.push(`${grouped.release.length} release${grouped.release.length > 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}

/**
 * Get list of all available template variables with descriptions
 */
export const AVAILABLE_VARIABLES = [
  {
    name: 'repository',
    description: 'Repository name',
    example: 'my-awesome-project',
    category: 'Repository',
  },
  {
    name: 'repositoryUrl',
    description: 'Full repository URL',
    example: 'https://github.com/owner/repo',
    category: 'Repository',
  },
  {
    name: 'repositoryOwner',
    description: 'Repository owner username',
    example: 'johndoe',
    category: 'Repository',
  },
  {
    name: 'activity',
    description: 'Summary of all GitHub activity',
    example: '3 commits, 1 pull request, 2 issues',
    category: 'Activity',
  },
  {
    name: 'commitCount',
    description: 'Number of commits',
    example: '5',
    category: 'Activity',
  },
  {
    name: 'latestCommit',
    description: 'Title of most recent commit',
    example: 'Fix authentication bug',
    category: 'Commits',
  },
  {
    name: 'allCommits',
    description: 'List of all commit titles',
    example: '- Fix bug\n- Add feature\n- Update docs',
    category: 'Commits',
  },
  {
    name: 'latestPR',
    description: 'Title of most recent pull request',
    example: 'Feature: Add user dashboard',
    category: 'Pull Requests',
  },
  {
    name: 'latestRelease',
    description: 'Title of most recent release',
    example: 'v1.2.0',
    category: 'Releases',
  },
  {
    name: 'latestReleaseNotes',
    description: 'Release notes from latest release',
    example: '## Features\n- New dashboard\n- Bug fixes',
    category: 'Releases',
  },
  {
    name: 'date',
    description: 'Current date (YYYY-MM-DD)',
    example: '2024-01-15',
    category: 'Date/Time',
  },
  {
    name: 'dateLong',
    description: 'Current date (long format)',
    example: 'January 15, 2024',
    category: 'Date/Time',
  },
  {
    name: 'monthName',
    description: 'Current month name',
    example: 'January',
    category: 'Date/Time',
  },
  {
    name: 'weekRange',
    description: 'Current week range',
    example: 'Week of January 15, 2024',
    category: 'Date/Time',
  },
  {
    name: 'projectName',
    description: 'Project name',
    example: 'My SaaS Platform',
    category: 'Project',
  },
  {
    name: 'authorName',
    description: 'Content author name',
    example: 'John Doe',
    category: 'Author',
  },
  {
    name: 'tone',
    description: 'Brand voice tone',
    example: 'professional',
    category: 'Brand',
  },
  {
    name: 'audience',
    description: 'Target audience',
    example: 'developers',
    category: 'Brand',
  },
] as const;

/**
 * Get variables by category
 */
export function getVariablesByCategory() {
  return AVAILABLE_VARIABLES.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_VARIABLES[number][]>);
}
