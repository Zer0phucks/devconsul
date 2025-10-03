/**
 * Mock GitHub activities for testing
 */

import type { GitHubActivity } from '@/lib/types';

export const mockPushActivity: GitHubActivity = {
  id: 'push-1',
  type: 'push',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  actor: {
    login: 'testuser',
    avatar_url: 'https://github.com/testuser.png',
    html_url: 'https://github.com/testuser',
  },
  repo: {
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    html_url: 'https://github.com/testuser/test-repo',
  },
  payload: {
    commits: [
      { message: 'feat: Add new authentication feature' },
      { message: 'fix: Resolve login bug' },
      { message: 'docs: Update README' },
    ],
  },
};

export const mockPullRequestActivity: GitHubActivity = {
  id: 'pr-1',
  type: 'pull_request',
  action: 'closed',
  timestamp: new Date('2024-01-15T12:00:00Z'),
  actor: {
    login: 'testuser',
    html_url: 'https://github.com/testuser',
  },
  repo: {
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    html_url: 'https://github.com/testuser/test-repo',
  },
  payload: {
    pull_request: {
      number: 42,
      title: 'Add OAuth integration',
      state: 'closed',
      merged: true,
    },
  },
};

export const mockIssueActivity: GitHubActivity = {
  id: 'issue-1',
  type: 'issues',
  action: 'opened',
  timestamp: new Date('2024-01-15T14:00:00Z'),
  actor: {
    login: 'testuser',
    html_url: 'https://github.com/testuser',
  },
  repo: {
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    html_url: 'https://github.com/testuser/test-repo',
  },
  payload: {
    issue: {
      number: 10,
      title: 'Improve error handling',
      state: 'open',
    },
  },
};

export const mockReleaseActivity: GitHubActivity = {
  id: 'release-1',
  type: 'release',
  timestamp: new Date('2024-01-15T16:00:00Z'),
  actor: {
    login: 'testuser',
    html_url: 'https://github.com/testuser',
  },
  repo: {
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    html_url: 'https://github.com/testuser/test-repo',
  },
  payload: {
    release: {
      name: 'v1.2.0',
      tag_name: 'v1.2.0',
      body: 'Major update with new features and bug fixes',
    },
  },
};

export const mockActivitiesBatch: GitHubActivity[] = [
  mockPushActivity,
  mockPullRequestActivity,
  mockIssueActivity,
  mockReleaseActivity,
];

export const mockMultiplePushActivities: GitHubActivity[] = Array.from(
  { length: 6 },
  (_, i) => ({
    ...mockPushActivity,
    id: `push-${i + 1}`,
    timestamp: new Date(`2024-01-${15 + i}T10:00:00Z`),
    payload: {
      commits: [
        { message: `feat: Feature ${i + 1}` },
        { message: `fix: Bug fix ${i + 1}` },
      ],
    },
  })
);
