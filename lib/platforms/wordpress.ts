/**
 * WordPress REST API v2 integration client
 * Supports both WordPress.com OAuth and self-hosted API keys
 */

import { encrypt, decrypt } from './encryption';
import { toWordPress, formatWordPressPost } from './formatters/wordpress';
import type { PublishResponse } from '@/lib/validations/blog-platforms';

const WORDPRESS_COM_OAUTH_URL = 'https://public-api.wordpress.com/oauth2/authorize';
const WORDPRESS_COM_TOKEN_URL = 'https://public-api.wordpress.com/oauth2/token';
const WORDPRESS_COM_API_BASE = 'https://public-api.wordpress.com/rest/v1.1';

export interface WordPressClient {
  type: 'oauth' | 'api_key';
  siteUrl?: string; // For self-hosted
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface WordPressPostOptions {
  status?: 'draft' | 'publish' | 'pending' | 'private';
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
  excerpt?: string;
  format?: string;
  slug?: string;
}

/**
 * Initialize OAuth flow
 */
export function getWordPressOAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.WORDPRESS_CLIENT_ID;
  if (!clientId) {
    throw new Error('WORDPRESS_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'posts:write media:write',
  });

  if (state) {
    params.append('state', state);
  }

  return `${WORDPRESS_COM_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function getWordPressAccessToken(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  blogId?: string;
  blogUrl?: string;
}> {
  const clientId = process.env.WORDPRESS_CLIENT_ID;
  const clientSecret = process.env.WORDPRESS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('WordPress OAuth credentials not configured');
  }

  const response = await fetch(WORDPRESS_COM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress OAuth failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    blogId: data.blog_id,
    blogUrl: data.blog_url,
  };
}

/**
 * Refresh access token
 */
export async function refreshWordPressToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.WORDPRESS_CLIENT_ID;
  const clientSecret = process.env.WORDPRESS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('WordPress OAuth credentials not configured');
  }

  const response = await fetch(WORDPRESS_COM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  };
}

/**
 * Create WordPress post
 */
export async function createPost(
  client: WordPressClient,
  title: string,
  content: string,
  options: WordPressPostOptions = {}
): Promise<PublishResponse> {
  try {
    // Format content for WordPress
    const formatted = await toWordPress(title, content, {
      status: options.status,
      format: options.format,
    });

    // Get API endpoint
    const apiUrl = client.type === 'oauth'
      ? `${WORDPRESS_COM_API_BASE}/sites/me/posts/new`
      : `${client.siteUrl}/wp-json/wp/v2/posts`;

    // Prepare post data
    const postData = formatWordPressPost(formatted, {
      slug: options.slug,
    });

    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${error}`);
    }

    const result = await response.json();

    return {
      success: true,
      platformPostId: String(result.ID || result.id),
      platformUrl: result.URL || result.link,
      metadata: {
        status: result.status,
        date: result.date,
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
 * Update WordPress post
 */
export async function updatePost(
  client: WordPressClient,
  postId: string,
  content: string,
  options: WordPressPostOptions = {}
): Promise<PublishResponse> {
  try {
    const apiUrl = client.type === 'oauth'
      ? `${WORDPRESS_COM_API_BASE}/sites/me/posts/${postId}`
      : `${client.siteUrl}/wp-json/wp/v2/posts/${postId}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${await response.text()}`);
    }

    const result = await response.json();

    return {
      success: true,
      platformPostId: String(result.ID || result.id),
      platformUrl: result.URL || result.link,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete WordPress post
 */
export async function deletePost(
  client: WordPressClient,
  postId: string
): Promise<PublishResponse> {
  try {
    const apiUrl = client.type === 'oauth'
      ? `${WORDPRESS_COM_API_BASE}/sites/me/posts/${postId}/delete`
      : `${client.siteUrl}/wp-json/wp/v2/posts/${postId}`;

    const response = await fetch(apiUrl, {
      method: client.type === 'oauth' ? 'POST' : 'DELETE',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${await response.text()}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload media to WordPress
 */
export async function uploadMedia(
  client: WordPressClient,
  imageUrl: string,
  filename?: string
): Promise<{ id: number; url: string } | null> {
  try {
    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }

    const imageBlob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('file', imageBlob, filename || 'image.jpg');

    const apiUrl = client.type === 'oauth'
      ? `${WORDPRESS_COM_API_BASE}/sites/me/media/new`
      : `${client.siteUrl}/wp-json/wp/v2/media`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Media upload failed: ${await response.text()}`);
    }

    const result = await response.json();

    return {
      id: result.ID || result.id,
      url: result.URL || result.source_url,
    };
  } catch (error) {
    console.error('WordPress media upload error:', error);
    return null;
  }
}

/**
 * Assign categories (create if needed)
 */
export async function assignCategories(
  client: WordPressClient,
  postId: string,
  categories: string[]
): Promise<boolean> {
  try {
    // Get or create category IDs
    const categoryIds: number[] = [];

    for (const categoryName of categories) {
      // Check if category exists
      const searchUrl = client.type === 'oauth'
        ? `${WORDPRESS_COM_API_BASE}/sites/me/categories?search=${encodeURIComponent(categoryName)}`
        : `${client.siteUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
        },
      });

      const categories = await searchResponse.json();
      let categoryId: number;

      if (categories && categories.length > 0) {
        categoryId = categories[0].ID || categories[0].id;
      } else {
        // Create category
        const createUrl = client.type === 'oauth'
          ? `${WORDPRESS_COM_API_BASE}/sites/me/categories/new`
          : `${client.siteUrl}/wp-json/wp/v2/categories`;

        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${client.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: categoryName }),
        });

        const newCategory = await createResponse.json();
        categoryId = newCategory.ID || newCategory.id;
      }

      categoryIds.push(categoryId);
    }

    // Update post with categories
    const updateUrl = client.type === 'oauth'
      ? `${WORDPRESS_COM_API_BASE}/sites/me/posts/${postId}`
      : `${client.siteUrl}/wp-json/wp/v2/posts/${postId}`;

    await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories: categoryIds }),
    });

    return true;
  } catch (error) {
    console.error('Category assignment error:', error);
    return false;
  }
}

/**
 * Assign tags (create if needed)
 */
export async function assignTags(
  client: WordPressClient,
  postId: string,
  tags: string[]
): Promise<boolean> {
  try {
    // Similar logic to categories but for tags
    const tagIds: number[] = [];

    for (const tagName of tags) {
      const searchUrl = client.type === 'oauth'
        ? `${WORDPRESS_COM_API_BASE}/sites/me/tags?search=${encodeURIComponent(tagName)}`
        : `${client.siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${client.accessToken}`,
        },
      });

      const tags = await searchResponse.json();
      let tagId: number;

      if (tags && tags.length > 0) {
        tagId = tags[0].ID || tags[0].id;
      } else {
        const createUrl = client.type === 'oauth'
          ? `${WORDPRESS_COM_API_BASE}/sites/me/tags/new`
          : `${client.siteUrl}/wp-json/wp/v2/tags`;

        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${client.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: tagName }),
        });

        const newTag = await createResponse.json();
        tagId = newTag.ID || newTag.id;
      }

      tagIds.push(tagId);
    }

    const updateUrl = client.type === 'oauth'
      ? `${WORDPRESS_COM_API_BASE}/sites/me/posts/${postId}`
      : `${client.siteUrl}/wp-json/wp/v2/posts/${postId}`;

    await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags: tagIds }),
    });

    return true;
  } catch (error) {
    console.error('Tag assignment error:', error);
    return false;
  }
}
export function createWordPressClient(config: any) { throw new Error('WordPress client not implemented'); }
export async function refreshAccessToken(token: any) { throw new Error('refreshAccessToken not implemented'); }
