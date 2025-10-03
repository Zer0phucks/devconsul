import { Webhooks } from '@octokit/webhooks';
import { kv } from '@/lib/supabase/kv';
import type { GitHubActivity } from '@/lib/types';

// Lazy-initialize webhook handler to avoid build-time errors
let _webhooks: Webhooks | null = null;

export function getWebhooks(): Webhooks {
  if (!_webhooks) {
    _webhooks = new Webhooks({
      secret: process.env.GITHUB_WEBHOOK_SECRET || 'default-build-secret',
    });
  }
  return _webhooks;
}

export const webhooks = getWebhooks();

// Parse GitHub webhook event into our activity format
export async function parseGitHubEvent(event: any, eventType: string): Promise<GitHubActivity> {
  const activity: GitHubActivity = {
    id: `${eventType}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    type: mapEventType(eventType),
    timestamp: new Date(),
    actor: {
      login: event.sender?.login || 'unknown',
      avatar_url: event.sender?.avatar_url,
      html_url: event.sender?.html_url || '',
    },
    repo: {
      name: event.repository?.name || '',
      full_name: event.repository?.full_name || '',
      html_url: event.repository?.html_url || '',
    },
    payload: event,
    processed: false,
  };

  // Add action for certain event types
  if (event.action) {
    activity.action = event.action;
  }

  return activity;
}

// Map GitHub event types to our simplified types
function mapEventType(githubEventType: string): GitHubActivity['type'] {
  const typeMap: Record<string, GitHubActivity['type']> = {
    'push': 'push',
    'pull_request': 'pull_request',
    'issues': 'issues',
    'release': 'release',
    'watch': 'star',
    'fork': 'fork',
  };

  return typeMap[githubEventType] || 'push';
}

// Store activity in Vercel KV
export async function storeActivity(activity: GitHubActivity): Promise<void> {
  try {
    // Store in KV with expiration (30 days)
    await kv.set(`activity:${activity.id}`, activity, { ex: 30 * 24 * 60 * 60 });

    // Add to activity list for chronological access
    await kv.zadd('activities:timeline', {
      score: activity.timestamp.getTime(),
      member: activity.id,
    });

    // Store by type for filtering
    await kv.zadd(`activities:type:${activity.type}`, {
      score: activity.timestamp.getTime(),
      member: activity.id,
    });
  } catch (error) {
    console.error('Failed to store activity:', error);
    throw error;
  }
}

// Get recent activities from KV
export async function getRecentActivities(
  limit = 20,
  type?: GitHubActivity['type']
): Promise<GitHubActivity[]> {
  try {
    const key = type ? `activities:type:${type}` : 'activities:timeline';
    const activityIds = await kv.zrange(key, -limit, -1, { rev: true });

    if (!activityIds || activityIds.length === 0) {
      return [];
    }

    const activities = await Promise.all(
      activityIds.map(async (id) => {
        const activity = await kv.get<GitHubActivity>(`activity:${id}`);
        return activity;
      })
    );

    return activities.filter(Boolean) as GitHubActivity[];
  } catch (error) {
    console.error('Failed to get recent activities:', error);
    return [];
  }
}

// Get unprocessed activities for blog generation
export async function getUnprocessedActivities(): Promise<GitHubActivity[]> {
  const activities = await getRecentActivities(100);
  return activities.filter(activity => !activity.processed);
}

// Mark activities as processed
export async function markActivitiesAsProcessed(activityIds: string[]): Promise<void> {
  await Promise.all(
    activityIds.map(async (id) => {
      const activity = await kv.get<GitHubActivity>(`activity:${id}`);
      if (activity) {
        activity.processed = true;
        await kv.set(`activity:${id}`, activity, { ex: 30 * 24 * 60 * 60 });
      }
    })
  );
}