/**
 * Medium API v1 integration client
 * Uses OAuth 2.0 authentication
 */

import { toMedium, formatMediumPost, validateMediumTags } from './formatters/medium';
import type { PublishResponse } from '@/lib/validations/blog-platforms';

const MEDIUM_OAUTH_URL = 'https://medium.com/m/oauth/authorize';
const MEDIUM_TOKEN_URL = 'https://medium.com/v1/tokens';
const MEDIUM_API_BASE = 'https://api.medium.com/v1';

export interface MediumClient {
  accessToken: string;
}

export interface MediumStoryOptions {
  publishStatus?: 'draft' | 'public' | 'unlisted';
  canonicalUrl?: string;
  tags?: string[];
  license?: string;
  notifyFollowers?: boolean;
  publicationId?: string; // For publishing to a publication
}

/**
 * Initialize OAuth flow
 */
export function getMediumOAuthUrl(
  redirectUri: string,
  state?: string,
  scope: string = 'basicProfile,publishPost'
): string {
  const clientId = process.env.MEDIUM_CLIENT_ID;
  if (!clientId) {
    throw new Error('MEDIUM_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    state: state || 'random_state',
    response_type: 'code',
    redirect_uri: redirectUri,
  });

  return `${MEDIUM_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function getMediumAccessToken(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string[];
}> {
  const clientId = process.env.MEDIUM_CLIENT_ID;
  const clientSecret = process.env.MEDIUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Medium OAuth credentials not configured');
  }

  const response = await fetch(MEDIUM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Medium OAuth failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    scope: data.scope,
  };
}

/**
 * Get authenticated user info
 */
export async function getUserId(client: MediumClient): Promise<string> {
  const response = await fetch(`${MEDIUM_API_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${client.accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${await response.text()}`);
  }

  const data = await response.json();
  return data.data.id;
}

/**
 * Create Medium story
 */
export async function createStory(
  client: MediumClient,
  title: string,
  content: string,
  options: MediumStoryOptions = {}
): Promise<PublishResponse> {
  try {
    // Get user ID
    const userId = await getUserId(client);

    // Validate tags if provided
    if (options.tags && options.tags.length > 0) {
      const validation = validateMediumTags(options.tags);
      if (!validation.valid) {
        throw new Error(`Tag validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Format content for Medium
    const formatted = toMedium(title, content, {
      canonicalUrl: options.canonicalUrl,
      tags: options.tags,
      publishStatus: options.publishStatus,
      license: options.license,
      notifyFollowers: options.notifyFollowers,
    });

    // Prepare story data
    const storyData = formatMediumPost(formatted);

    // Determine endpoint (user or publication)
    const endpoint = options.publicationId
      ? `/publications/${options.publicationId}/posts`
      : `/users/${userId}/posts`;

    // Create story
    const response = await fetch(`${MEDIUM_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(storyData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Medium API error: ${error}`);
    }

    const result = await response.json();
    const story = result.data;

    return {
      success: true,
      platformPostId: story.id,
      platformUrl: story.url,
      metadata: {
        publishStatus: story.publishStatus,
        publishedAt: story.publishedAt,
        license: story.license,
        tags: story.tags,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's publications
 */
export async function getPublications(
  client: MediumClient
): Promise<Array<{ id: string; name: string; description: string; url: string }>> {
  try {
    const userId = await getUserId(client);

    const response = await fetch(`${MEDIUM_API_BASE}/users/${userId}/publications`, {
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get publications: ${await response.text()}`);
    }

    const result = await response.json();

    return result.data.map((pub: any) => ({
      id: pub.id,
      name: pub.name,
      description: pub.description,
      url: pub.url,
    }));
  } catch (error) {
    console.error('Get publications error:', error);
    return [];
  }
}

/**
 * Publish to a specific publication
 */
export async function publishToPublication(
  client: MediumClient,
  publicationId: string,
  title: string,
  content: string,
  options: Omit<MediumStoryOptions, 'publicationId'> = {}
): Promise<PublishResponse> {
  return createStory(client, title, content, {
    ...options,
    publicationId,
  });
}

/**
 * Test Medium connection
 */
export async function testConnection(client: MediumClient): Promise<boolean> {
  try {
    const response = await fetch(`${MEDIUM_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Accept': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
