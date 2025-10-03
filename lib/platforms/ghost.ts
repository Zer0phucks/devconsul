/**
 * Ghost Admin API v5 integration client
 * Uses API key authentication (no OAuth)
 */

import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { toGhost, formatGhostPost, generateSlug } from './formatters/ghost';
import type { PublishResponse } from '@/lib/validations/blog-platforms';

export interface GhostClient {
  apiUrl: string; // e.g., https://yourblog.com
  adminApiKey: string; // Format: id:secret
}

export interface GhostPostOptions {
  status?: 'draft' | 'published' | 'scheduled';
  publishAt?: string;
  featured?: boolean;
  visibility?: 'public' | 'members' | 'paid';
  authors?: string[];
  tags?: string[];
  customExcerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  twitterImage?: string;
  codeinjectionHead?: string;
  codeinjectionFoot?: string;
  slug?: string;
}

/**
 * Generate JWT token for Ghost Admin API
 */
function generateGhostToken(apiKey: string): string {
  const [id, secret] = apiKey.split(':');

  if (!id || !secret) {
    throw new Error('Invalid Ghost API key format. Expected: id:secret');
  }

  // Create token with 5 minute expiry
  const token = jwt.sign(
    {
      aud: '/admin/',
    },
    Buffer.from(secret, 'hex'),
    {
      keyid: id,
      algorithm: 'HS256',
      expiresIn: '5m',
    }
  );

  return token;
}

/**
 * Make authenticated request to Ghost Admin API
 */
async function ghostApiRequest(
  client: GhostClient,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = generateGhostToken(client.adminApiKey);
  const url = `${client.apiUrl}/ghost/api/admin${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Ghost ${token}`,
      'Content-Type': 'application/json',
      'Accept-Version': 'v5.0',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Create Ghost post
 */
export async function createPost(
  client: GhostClient,
  title: string,
  content: string,
  options: GhostPostOptions = {}
): Promise<PublishResponse> {
  try {
    // Format content for Ghost
    const formatted = await toGhost(title, content, {
      status: options.status,
      visibility: options.visibility,
      featured: options.featured,
      publishAt: options.publishAt,
      tags: options.tags,
      authors: options.authors,
    });

    // Generate slug if not provided
    const slug = options.slug || generateSlug(title);

    // Prepare post data
    const postData = formatGhostPost(formatted, {
      slug,
      metaTitle: options.metaTitle,
      metaDescription: options.metaDescription,
      ogImage: options.ogImage,
      twitterImage: options.twitterImage,
      codeinjectionHead: options.codeinjectionHead,
      codeinjectionFoot: options.codeinjectionFoot,
    });

    // Create post
    const response = await ghostApiRequest(client, '/posts/', {
      method: 'POST',
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ghost API error: ${error}`);
    }

    const result = await response.json();
    const post = result.posts[0];

    return {
      success: true,
      platformPostId: post.id,
      platformUrl: post.url,
      metadata: {
        status: post.status,
        slug: post.slug,
        publishedAt: post.published_at,
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
 * Update Ghost post
 */
export async function updatePost(
  client: GhostClient,
  postId: string,
  content: string,
  options: GhostPostOptions = {}
): Promise<PublishResponse> {
  try {
    const response = await ghostApiRequest(client, `/posts/${postId}/`, {
      method: 'PUT',
      body: JSON.stringify({
        posts: [
          {
            html: content,
            updated_at: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${await response.text()}`);
    }

    const result = await response.json();
    const post = result.posts[0];

    return {
      success: true,
      platformPostId: post.id,
      platformUrl: post.url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete Ghost post
 */
export async function deletePost(
  client: GhostClient,
  postId: string
): Promise<PublishResponse> {
  try {
    const response = await ghostApiRequest(client, `/posts/${postId}/`, {
      method: 'DELETE',
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
 * Upload image to Ghost
 */
export async function uploadImage(
  client: GhostClient,
  imageUrl: string,
  filename?: string
): Promise<{ url: string } | null> {
  try {
    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download image');
    }

    const imageBlob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('file', imageBlob, filename || 'image.jpg');
    formData.append('purpose', 'image');

    const token = generateGhostToken(client.adminApiKey);
    const url = `${client.apiUrl}/ghost/api/admin/images/upload/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Ghost ${token}`,
        'Accept-Version': 'v5.0',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image upload failed: ${await response.text()}`);
    }

    const result = await response.json();

    return {
      url: result.images[0].url,
    };
  } catch (error) {
    console.error('Ghost image upload error:', error);
    return null;
  }
}

/**
 * Schedule post for publication
 */
export async function schedulePost(
  client: GhostClient,
  postId: string,
  publishAt: string
): Promise<PublishResponse> {
  try {
    const response = await ghostApiRequest(client, `/posts/${postId}/`, {
      method: 'PUT',
      body: JSON.stringify({
        posts: [
          {
            status: 'scheduled',
            published_at: publishAt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Schedule failed: ${await response.text()}`);
    }

    const result = await response.json();
    const post = result.posts[0];

    return {
      success: true,
      platformPostId: post.id,
      metadata: {
        status: post.status,
        publishedAt: post.published_at,
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
 * Publish draft post
 */
export async function publishPost(
  client: GhostClient,
  postId: string
): Promise<PublishResponse> {
  try {
    const response = await ghostApiRequest(client, `/posts/${postId}/`, {
      method: 'PUT',
      body: JSON.stringify({
        posts: [
          {
            status: 'published',
            published_at: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Publish failed: ${await response.text()}`);
    }

    const result = await response.json();
    const post = result.posts[0];

    return {
      success: true,
      platformPostId: post.id,
      platformUrl: post.url,
      metadata: {
        status: post.status,
        publishedAt: post.published_at,
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
 * Test Ghost connection
 */
export async function testConnection(client: GhostClient): Promise<boolean> {
  try {
    const response = await ghostApiRequest(client, '/site/');

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return !!result.site;
  } catch (error) {
    return false;
  }
}
