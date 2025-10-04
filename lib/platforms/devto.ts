/**
 * Dev.to (Forem) API integration client
 * Uses API key authentication
 * API Documentation: https://developers.forem.com/api/v1
 */

import { toDevTo, formatDevToPost } from './formatters/devto';
import type { PublishResponse } from '@/lib/validations/blog-platforms';

const DEVTO_API_BASE = 'https://dev.to/api';

export interface DevToClient {
  apiKey: string;
}

export interface DevToPostOptions {
  published?: boolean;
  series?: string;
  mainImage?: string;
  canonicalUrl?: string;
  description?: string;
  tags?: string[];
  organizationId?: number;
}

/**
 * Make authenticated request to Dev.to API
 */
async function devToApiRequest(
  client: DevToClient,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${DEVTO_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'api-key': client.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Get authenticated user info
 */
export async function getUserInfo(client: DevToClient): Promise<{
  id: number;
  username: string;
  name: string;
  profileImage: string;
}> {
  const response = await devToApiRequest(client, '/users/me');

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${await response.text()}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    username: data.username,
    name: data.name,
    profileImage: data.profile_image,
  };
}

/**
 * Create Dev.to article
 */
export async function createArticle(
  client: DevToClient,
  title: string,
  content: string,
  options: DevToPostOptions = {}
): Promise<PublishResponse> {
  try {
    // Format content for Dev.to
    const formatted = toDevTo(title, content, {
      published: options.published ?? false,
      tags: options.tags,
      series: options.series,
      mainImage: options.mainImage,
      canonicalUrl: options.canonicalUrl,
      description: options.description,
    });

    // Prepare article data
    const articleData = formatDevToPost(formatted, {
      organizationId: options.organizationId,
    });

    // Create article
    const response = await devToApiRequest(client, '/articles', {
      method: 'POST',
      body: JSON.stringify({ article: articleData }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dev.to API error: ${error}`);
    }

    const article = await response.json();

    return {
      success: true,
      platformPostId: article.id.toString(),
      platformUrl: article.url,
      metadata: {
        published: article.published,
        slug: article.slug,
        publishedAt: article.published_at,
        tags: article.tag_list,
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
 * Update Dev.to article
 */
export async function updateArticle(
  client: DevToClient,
  articleId: string,
  title: string,
  content: string,
  options: DevToPostOptions = {}
): Promise<PublishResponse> {
  try {
    const formatted = toDevTo(title, content, options);
    const articleData = formatDevToPost(formatted, {
      organizationId: options.organizationId,
    });

    const response = await devToApiRequest(client, `/articles/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify({ article: articleData }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Update failed: ${error}`);
    }

    const article = await response.json();

    return {
      success: true,
      platformPostId: article.id.toString(),
      platformUrl: article.url,
      metadata: {
        published: article.published,
        slug: article.slug,
        publishedAt: article.published_at,
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
 * Get user's articles
 */
export async function getArticles(
  client: DevToClient,
  options: {
    page?: number;
    perPage?: number;
  } = {}
): Promise<Array<{
  id: number;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}>> {
  try {
    const params = new URLSearchParams({
      page: (options.page || 1).toString(),
      per_page: (options.perPage || 30).toString(),
    });

    const response = await devToApiRequest(client, `/articles/me?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Failed to get articles: ${await response.text()}`);
    }

    const articles = await response.json();

    return articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.published_at,
    }));
  } catch (error) {
    console.error('Get articles error:', error);
    return [];
  }
}

/**
 * Get user's organizations
 */
export async function getOrganizations(
  client: DevToClient
): Promise<Array<{
  id: number;
  name: string;
  username: string;
  slug: string;
  profileImage: string;
}>> {
  try {
    const userInfo = await getUserInfo(client);

    const response = await devToApiRequest(
      client,
      `/users/${userInfo.id}/organizations`
    );

    if (!response.ok) {
      throw new Error(`Failed to get organizations: ${await response.text()}`);
    }

    const orgs = await response.json();

    return orgs.map((org: any) => ({
      id: org.id,
      name: org.name,
      username: org.username,
      slug: org.slug,
      profileImage: org.profile_image,
    }));
  } catch (error) {
    console.error('Get organizations error:', error);
    return [];
  }
}

/**
 * Publish draft article
 */
export async function publishArticle(
  client: DevToClient,
  articleId: string
): Promise<PublishResponse> {
  try {
    const response = await devToApiRequest(client, `/articles/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify({
        article: {
          published: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Publish failed: ${error}`);
    }

    const article = await response.json();

    return {
      success: true,
      platformPostId: article.id.toString(),
      platformUrl: article.url,
      metadata: {
        published: article.published,
        publishedAt: article.published_at,
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
 * Unpublish article (convert to draft)
 */
export async function unpublishArticle(
  client: DevToClient,
  articleId: string
): Promise<PublishResponse> {
  try {
    const response = await devToApiRequest(client, `/articles/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify({
        article: {
          published: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Unpublish failed: ${error}`);
    }

    const article = await response.json();

    return {
      success: true,
      platformPostId: article.id.toString(),
      metadata: {
        published: article.published,
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
 * Get article by ID
 */
export async function getArticle(
  client: DevToClient,
  articleId: string
): Promise<{
  id: number;
  title: string;
  description: string;
  bodyMarkdown: string;
  url: string;
  published: boolean;
  tags: string[];
} | null> {
  try {
    const response = await devToApiRequest(client, `/articles/${articleId}`);

    if (!response.ok) {
      throw new Error(`Failed to get article: ${await response.text()}`);
    }

    const article = await response.json();

    return {
      id: article.id,
      title: article.title,
      description: article.description,
      bodyMarkdown: article.body_markdown,
      url: article.url,
      published: article.published,
      tags: article.tag_list,
    };
  } catch (error) {
    console.error('Get article error:', error);
    return null;
  }
}

/**
 * Upload image to Dev.to
 */
export async function uploadImage(
  client: DevToClient,
  imageFile: File | Blob
): Promise<{ url: string } | null> {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${DEVTO_API_BASE}/images`, {
      method: 'POST',
      headers: {
        'api-key': client.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${await response.text()}`);
    }

    const result = await response.json();

    return {
      url: result.url,
    };
  } catch (error) {
    console.error('Dev.to image upload error:', error);
    return null;
  }
}

/**
 * Test Dev.to connection
 */
export async function testConnection(client: DevToClient): Promise<boolean> {
  try {
    const response = await devToApiRequest(client, '/users/me');
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Create Dev.to client
 */
export function createDevToClient(config: { apiKey: string }): DevToClient {
  if (!config.apiKey) {
    throw new Error('Dev.to API key is required');
  }

  return {
    apiKey: config.apiKey,
  };
}
