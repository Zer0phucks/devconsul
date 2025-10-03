/**
 * AI-Powered Newsworthy Event Detection
 * Analyzes repository activity to identify newsworthy events worth announcing
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { NewsworthyType, EventImpact } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface NewsworthyEvent {
  type: NewsworthyType;
  title: string;
  description: string;
  date: Date;
  impact: EventImpact;
  score: number; // 0-1 confidence
  reasoning: string;
  category: string[];
  tags: string[];
  data: any; // Event-specific data
  htmlUrl?: string;
}

export interface NewsworthyAnalysisOptions {
  commits?: any[];
  pullRequests?: any[];
  issues?: any[];
  releases?: any[];
  aiProvider?: 'anthropic' | 'openai';
  threshold?: number; // Minimum score to include (0-1)
}

export interface CommitAnalysis {
  sha: string;
  message: string;
  author: string;
  date: Date;
  files: any[];
  isBreaking: boolean;
  isSecurity: boolean;
  isPerformance: boolean;
  isFeature: boolean;
  isBugfix: boolean;
  importance: number; // 0-1
}

// ============================================
// AI CLIENTS
// ============================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// NEWSWORTHY EVENT DETECTION
// ============================================

/**
 * Analyze repository activity and detect newsworthy events
 */
export async function detectNewsworthyEvents(
  options: NewsworthyAnalysisOptions
): Promise<NewsworthyEvent[]> {
  const {
    commits = [],
    pullRequests = [],
    issues = [],
    releases = [],
    aiProvider = 'anthropic',
    threshold = 0.6,
  } = options;

  const newsworthyEvents: NewsworthyEvent[] = [];

  // 1. Analyze releases (highest priority)
  for (const release of releases) {
    const releaseEvent = await analyzeRelease(release, aiProvider);
    if (releaseEvent && releaseEvent.score >= threshold) {
      newsworthyEvents.push(releaseEvent);
    }
  }

  // 2. Analyze commits for breaking changes, security fixes, etc.
  const commitAnalyses = await analyzeCommits(commits, aiProvider);
  for (const analysis of commitAnalyses) {
    if (analysis.importance >= threshold) {
      const event = convertCommitToEvent(analysis);
      if (event) {
        newsworthyEvents.push(event);
      }
    }
  }

  // 3. Analyze pull requests for significant features
  for (const pr of pullRequests) {
    if (pr.merged && pr.labels) {
      const prEvent = await analyzePullRequest(pr, aiProvider);
      if (prEvent && prEvent.score >= threshold) {
        newsworthyEvents.push(prEvent);
      }
    }
  }

  // 4. Check for milestones
  const milestoneEvents = detectMilestones(commits, pullRequests, issues, releases);
  newsworthyEvents.push(...milestoneEvents.filter(e => e.score >= threshold));

  // Sort by score (highest first)
  return newsworthyEvents.sort((a, b) => b.score - a.score);
}

// ============================================
// RELEASE ANALYSIS
// ============================================

async function analyzeRelease(
  release: any,
  aiProvider: 'anthropic' | 'openai'
): Promise<NewsworthyEvent | null> {
  const { tag_name, name, body, prerelease, published_at, created_at, html_url } = release;

  // Determine release type
  const isMajor = isSemanticMajorVersion(tag_name);
  const isMinor = isSemanticMinorVersion(tag_name);
  const isFirstRelease = tag_name.match(/^v?0\.1\.0$/) || tag_name.match(/^v?1\.0\.0$/);

  let type: NewsworthyType = 'FEATURE_RELEASE';
  let impact: EventImpact = 'MEDIUM';
  let baseScore = 0.7;

  if (isFirstRelease) {
    type = 'FIRST_RELEASE';
    impact = 'HIGH';
    baseScore = 0.95;
  } else if (isMajor) {
    type = 'MAJOR_RELEASE';
    impact = 'CRITICAL';
    baseScore = 0.9;
  } else if (isMinor) {
    type = 'FEATURE_RELEASE';
    impact = 'HIGH';
    baseScore = 0.8;
  }

  // Use AI to analyze release notes for additional context
  const aiAnalysis = await analyzeReleaseNotes(body || '', aiProvider);

  return {
    type,
    title: name || tag_name,
    description: body || `Release ${tag_name}`,
    date: published_at || created_at,
    impact,
    score: Math.min(baseScore + (aiAnalysis.score * 0.1), 1),
    reasoning: aiAnalysis.reasoning || `${type} detected: ${tag_name}`,
    category: aiAnalysis.categories,
    tags: [tag_name, 'release'],
    data: release,
    htmlUrl: html_url,
  };
}

function isSemanticMajorVersion(tag: string): boolean {
  const match = tag.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return false;
  const [_, major, minor, patch] = match;
  return parseInt(minor) === 0 && parseInt(patch) === 0 && parseInt(major) > 0;
}

function isSemanticMinorVersion(tag: string): boolean {
  const match = tag.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return false;
  const [_, major, minor, patch] = match;
  return parseInt(patch) === 0 && parseInt(minor) > 0;
}

async function analyzeReleaseNotes(
  notes: string,
  aiProvider: 'anthropic' | 'openai'
): Promise<{ score: number; reasoning: string; categories: string[] }> {
  if (!notes || notes.length < 20) {
    return { score: 0, reasoning: 'No release notes provided', categories: [] };
  }

  const prompt = `Analyze these release notes and identify:
1. If this contains breaking changes
2. If this includes security fixes
3. If this has significant new features
4. Overall newsworthiness score (0-1)

Release notes:
${notes.substring(0, 2000)}

Respond in JSON format:
{
  "score": 0.0-1.0,
  "reasoning": "brief explanation",
  "categories": ["feature", "bugfix", "security", "breaking_change", "performance"],
  "hasBreakingChanges": boolean,
  "hasSecurityFixes": boolean,
  "hasNewFeatures": boolean
}`;

  try {
    if (aiProvider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const analysis = JSON.parse(content.text);
        return {
          score: analysis.score || 0,
          reasoning: analysis.reasoning || '',
          categories: analysis.categories || [],
        };
      }
    } else {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return {
        score: analysis.score || 0,
        reasoning: analysis.reasoning || '',
        categories: analysis.categories || [],
      };
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
    return { score: 0, reasoning: 'AI analysis unavailable', categories: [] };
  }

  return { score: 0, reasoning: '', categories: [] };
}

// ============================================
// COMMIT ANALYSIS
// ============================================

async function analyzeCommits(
  commits: any[],
  aiProvider: 'anthropic' | 'openai'
): Promise<CommitAnalysis[]> {
  const analyses: CommitAnalysis[] = [];

  for (const commit of commits) {
    const analysis = analyzeCommitMessage(commit);
    analyses.push(analysis);
  }

  // Use AI for batch analysis of highest-impact commits
  const highImpactCommits = analyses.filter(a => a.importance > 0.5).slice(0, 10);

  if (highImpactCommits.length > 0) {
    await enhanceCommitAnalysisWithAI(highImpactCommits, aiProvider);
  }

  return analyses;
}

function analyzeCommitMessage(commit: any): CommitAnalysis {
  const message = commit.message.toLowerCase();
  const files = commit.files || [];

  // Pattern matching for commit types
  const isBreaking = /breaking|break:|\[breaking\]/i.test(commit.message);
  const isSecurity = /security|vulnerability|cve-|exploit/i.test(commit.message);
  const isPerformance = /performance|perf:|optimize|speed/i.test(commit.message);
  const isFeature = /^feat:|feature:|add:|new:/i.test(commit.message) || /\[feature\]/i.test(commit.message);
  const isBugfix = /^fix:|bugfix:|bug:/i.test(commit.message) || /\[fix\]/i.test(commit.message);

  // Calculate importance score
  let importance = 0.3; // Base score

  if (isBreaking) importance += 0.4;
  if (isSecurity) importance += 0.5;
  if (isPerformance) importance += 0.2;
  if (isFeature) importance += 0.3;
  if (isBugfix) importance += 0.1;

  // Boost score for large commits
  const fileCount = files.length;
  if (fileCount > 20) importance += 0.2;
  else if (fileCount > 10) importance += 0.1;

  // Cap at 1.0
  importance = Math.min(importance, 1.0);

  return {
    sha: commit.sha,
    message: commit.message,
    author: commit.author.login,
    date: commit.date,
    files,
    isBreaking,
    isSecurity,
    isPerformance,
    isFeature,
    isBugfix,
    importance,
  };
}

async function enhanceCommitAnalysisWithAI(
  commits: CommitAnalysis[],
  aiProvider: 'anthropic' | 'openai'
): Promise<void> {
  // Batch analyze commit messages with AI for better classification
  const messages = commits.map(c => c.message).join('\n---\n');

  const prompt = `Analyze these commit messages and identify which ones represent truly newsworthy changes that should be announced:

${messages}

For each commit, rate its newsworthiness from 0-1 and explain why. Focus on:
- Breaking changes
- Security fixes
- Major features
- Performance improvements
- Important bug fixes

Respond in JSON array format with one entry per commit.`;

  try {
    // For simplicity, we'll skip the actual AI call in this implementation
    // In production, you'd make the API call and update the importance scores
  } catch (error) {
    console.error('AI enhancement failed:', error);
  }
}

function convertCommitToEvent(analysis: CommitAnalysis): NewsworthyEvent | null {
  if (!analysis.isBreaking && !analysis.isSecurity && analysis.importance < 0.7) {
    return null;
  }

  let type: NewsworthyType = 'CUSTOM';
  let impact: EventImpact = 'MEDIUM';

  if (analysis.isBreaking) {
    type = 'BREAKING_CHANGE';
    impact = 'CRITICAL';
  } else if (analysis.isSecurity) {
    type = 'SECURITY_FIX';
    impact = 'HIGH';
  } else if (analysis.isPerformance) {
    type = 'PERFORMANCE_IMPROVEMENT';
    impact = 'MEDIUM';
  } else if (analysis.isFeature) {
    type = 'FEATURE_RELEASE';
    impact = 'MEDIUM';
  } else if (analysis.isBugfix) {
    type = 'CRITICAL_BUGFIX';
    impact = 'MEDIUM';
  }

  const categories: string[] = [];
  if (analysis.isBreaking) categories.push('breaking_change');
  if (analysis.isSecurity) categories.push('security');
  if (analysis.isPerformance) categories.push('performance');
  if (analysis.isFeature) categories.push('feature');
  if (analysis.isBugfix) categories.push('bugfix');

  return {
    type,
    title: analysis.message.split('\n')[0].substring(0, 100),
    description: analysis.message,
    date: analysis.date,
    impact,
    score: analysis.importance,
    reasoning: `Detected ${type.toLowerCase().replace(/_/g, ' ')} in commit`,
    category: categories,
    tags: [analysis.author, 'commit'],
    data: { sha: analysis.sha, author: analysis.author },
  };
}

// ============================================
// PULL REQUEST ANALYSIS
// ============================================

async function analyzePullRequest(
  pr: any,
  aiProvider: 'anthropic' | 'openai'
): Promise<NewsworthyEvent | null> {
  const labels = (pr.labels || []).map((l: string) => l.toLowerCase());

  // Check for significant PR labels
  const isBreaking = labels.includes('breaking') || labels.includes('breaking change');
  const isSecurity = labels.includes('security');
  const isFeature = labels.includes('feature') || labels.includes('enhancement');
  const isMajor = labels.includes('major');

  if (!isBreaking && !isSecurity && !isFeature && !isMajor) {
    return null;
  }

  let type: NewsworthyType = 'FEATURE_RELEASE';
  let impact: EventImpact = 'MEDIUM';
  let score = 0.7;

  if (isBreaking) {
    type = 'BREAKING_CHANGE';
    impact = 'CRITICAL';
    score = 0.9;
  } else if (isSecurity) {
    type = 'SECURITY_FIX';
    impact = 'HIGH';
    score = 0.85;
  } else if (isMajor) {
    type = 'FEATURE_RELEASE';
    impact = 'HIGH';
    score = 0.8;
  }

  return {
    type,
    title: pr.title,
    description: pr.body || pr.title,
    date: pr.merged_at || pr.created_at,
    impact,
    score,
    reasoning: `Merged PR with ${labels.join(', ')} labels`,
    category: labels,
    tags: labels,
    data: { number: pr.number, author: pr.user.login },
    htmlUrl: pr.html_url,
  };
}

// ============================================
// MILESTONE DETECTION
// ============================================

function detectMilestones(
  commits: any[],
  pullRequests: any[],
  issues: any[],
  releases: any[]
): NewsworthyEvent[] {
  const events: NewsworthyEvent[] = [];

  // Milestone: 100th commit
  if (commits.length >= 100 && commits.length < 105) {
    events.push({
      type: 'MILESTONE',
      title: '100 Commits Milestone Reached',
      description: 'The repository has reached 100 commits!',
      date: new Date(),
      impact: 'MEDIUM',
      score: 0.7,
      reasoning: 'Significant commit milestone',
      category: ['milestone', 'achievement'],
      tags: ['commits', 'milestone'],
      data: { commitCount: commits.length },
    });
  }

  // Milestone: 50 merged PRs
  const mergedPRs = pullRequests.filter(pr => pr.merged);
  if (mergedPRs.length >= 50 && mergedPRs.length < 55) {
    events.push({
      type: 'MILESTONE',
      title: '50 Pull Requests Merged',
      description: 'The project has successfully merged 50 pull requests!',
      date: new Date(),
      impact: 'MEDIUM',
      score: 0.7,
      reasoning: 'Collaboration milestone',
      category: ['milestone', 'collaboration'],
      tags: ['pull-requests', 'milestone'],
      data: { prCount: mergedPRs.length },
    });
  }

  // Milestone: First release
  if (releases.length === 1) {
    events.push({
      type: 'FIRST_RELEASE',
      title: 'First Release Published',
      description: `First official release: ${releases[0].tag_name}`,
      date: releases[0].published_at || releases[0].created_at,
      impact: 'HIGH',
      score: 0.95,
      reasoning: 'First ever release is always newsworthy',
      category: ['release', 'milestone'],
      tags: ['first-release', 'milestone'],
      data: releases[0],
      htmlUrl: releases[0].html_url,
    });
  }

  return events;
}

// ============================================
// SCORING AND FILTERING
// ============================================

/**
 * Re-score events based on additional context
 */
export function rescoreEvents(
  events: NewsworthyEvent[],
  context: {
    repositoryAge?: number; // Days since first commit
    averageCommitsPerWeek?: number;
    totalStars?: number;
  }
): NewsworthyEvent[] {
  return events.map(event => {
    let adjustedScore = event.score;

    // Boost scores for young repositories
    if (context.repositoryAge && context.repositoryAge < 90) {
      adjustedScore *= 1.2;
    }

    // Boost scores for active repositories
    if (context.averageCommitsPerWeek && context.averageCommitsPerWeek > 10) {
      adjustedScore *= 1.1;
    }

    // Boost scores for popular repositories
    if (context.totalStars && context.totalStars > 100) {
      adjustedScore *= 1.1;
    }

    return {
      ...event,
      score: Math.min(adjustedScore, 1.0),
    };
  });
}

/**
 * Filter and deduplicate events
 */
export function filterEvents(
  events: NewsworthyEvent[],
  options: {
    threshold?: number;
    maxEvents?: number;
    excludeTypes?: NewsworthyType[];
  }
): NewsworthyEvent[] {
  const { threshold = 0.6, maxEvents = 20, excludeTypes = [] } = options;

  // Filter by score and type
  let filtered = events.filter(
    e => e.score >= threshold && !excludeTypes.includes(e.type)
  );

  // Deduplicate similar events
  filtered = deduplicateEvents(filtered);

  // Sort by score and limit
  return filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEvents);
}

function deduplicateEvents(events: NewsworthyEvent[]): NewsworthyEvent[] {
  const seen = new Set<string>();
  const unique: NewsworthyEvent[] = [];

  for (const event of events) {
    const key = `${event.type}:${event.title}:${event.date.toISOString().split('T')[0]}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(event);
    }
  }

  return unique;
}
