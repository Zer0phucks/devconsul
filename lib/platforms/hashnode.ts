/**
 * Hashnode GraphQL API integration client
 * Uses OAuth 2.0 and Personal Access Token authentication
 * API Documentation: https://api.hashnode.com/
 */

import { toHashnode, formatHashnodePost } from './formatters/hashnode';
import type { PublishResponse } from '@/lib/validations/blog-platforms';

const HASHNODE_API_URL = 'https://gql.hashnode.com';
const HASHNODE_OAUTH_URL = 'https://hashnode.com/oauth/authorize';
const HASHNODE_TOKEN_URL = 'https://hashnode.com/oauth/token';

export interface HashnodeClient {
  accessToken: string;
}

export interface HashnodePostOptions {
  publicationId?: string;
  tags?: { id: string; name: string; slug: string }[];
  coverImageUrl?: string;
  slug?: string;
  subtitle?: string;
  disableComments?: boolean;
  contentMarkdown?: string;
  metaTags?: {
    title?: string;
    description?: string;
    image?: string;
  };
  seriesId?: string;
  originalArticleURL?: string; // For canonical URL
  publishStatus?: 'draft' | 'published';
}

/**
 * Initialize OAuth flow
 */
export function getHashnodeOAuthUrl(
  redirectUri: string,
  state?: string,
  scope: string = 'read_user write_article'
): string {
  const clientId = process.env.HASHNODE_CLIENT_ID;
  if (!clientId) {
    throw new Error('HASHNODE_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state: state || 'random_state',
  });

  return `${HASHNODE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function getHashnodeAccessToken(
  code: string,
  redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
}> {
  const clientId = process.env.HASHNODE_CLIENT_ID;
  const clientSecret = process.env.HASHNODE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Hashnode OAuth credentials not configured');
  }

  const response = await fetch(HASHNODE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hashnode OAuth failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/**
 * Make GraphQL request to Hashnode API
 */
async function hashnodeGraphQLRequest(
  client: HashnodeClient,
  query: string,
  variables?: Record<string, any>
): Promise<any> {
  const response = await fetch(HASHNODE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': client.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hashnode API error: ${error}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Hashnode GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Get authenticated user info
 */
export async function getUserInfo(client: HashnodeClient): Promise<{
  id: string;
  username: string;
  name: string;
  publicationDomain?: string;
}> {
  const query = `
    query Me {
      me {
        id
        username
        name
        publicationDomain
      }
    }
  `;

  const data = await hashnodeGraphQLRequest(client, query);
  return data.me;
}

/**
 * Create Hashnode article
 */
export async function createArticle(
  client: HashnodeClient,
  title: string,
  content: string,
  options: HashnodePostOptions = {}
): Promise<PublishResponse> {
  try {
    // Get user info if publicationId not provided
    let publicationId = options.publicationId;
    if (!publicationId) {
      const userInfo = await getUserInfo(client);
      if (!userInfo.publicationDomain) {
        throw new Error('No publication found for user. Please provide publicationId.');
      }
      // Get publication ID from domain
      const publication = await getPublicationByDomain(client, userInfo.publicationDomain);
      publicationId = publication.id;
    }

    // Format content for Hashnode
    const formatted = toHashnode(title, content, {
      coverImageUrl: options.coverImageUrl,
      tags: options.tags,
      subtitle: options.subtitle,
      slug: options.slug,
    });

    // Prepare article input
    const articleInput = formatHashnodePost(formatted, {
      publicationId,
      disableComments: options.disableComments,
      metaTags: options.metaTags,
      seriesId: options.seriesId,
      originalArticleURL: options.originalArticleURL,
    });

    const mutation = `
      mutation CreatePublicationStory($input: CreateStoryInput!) {
        createPublicationStory(input: $input) {
          code
          success
          message
          post {
            id
            slug
            title
            url
            coverImage {
              url
            }
            publishedAt
          }
        }
      }
    `;

    const data = await hashnodeGraphQLRequest(client, mutation, {
      input: articleInput,
    });

    const response = data.createPublicationStory;

    if (!response.success) {
      throw new Error(response.message || 'Failed to create article');
    }

    const post = response.post;

    return {
      success: true,
      platformPostId: post.id,
      platformUrl: post.url,
      metadata: {
        slug: post.slug,
        publishedAt: post.publishedAt,
        coverImage: post.coverImage?.url,
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
 * Update Hashnode article
 */
export async function updateArticle(
  client: HashnodeClient,
  postId: string,
  title: string,
  content: string,
  options: HashnodePostOptions = {}
): Promise<PublishResponse> {
  try {
    const formatted = toHashnode(title, content, options);

    const mutation = `
      mutation UpdateStory($input: UpdateStoryInput!) {
        updateStory(input: $input) {
          code
          success
          message
          post {
            id
            slug
            url
            publishedAt
          }
        }
      }
    `;

    const data = await hashnodeGraphQLRequest(client, mutation, {
      input: {
        postId,
        ...formatted,
      },
    });

    const response = data.updateStory;

    if (!response.success) {
      throw new Error(response.message || 'Failed to update article');
    }

    const post = response.post;

    return {
      success: true,
      platformPostId: post.id,
      platformUrl: post.url,
      metadata: {
        slug: post.slug,
        publishedAt: post.publishedAt,
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
 * Get publication by domain
 */
export async function getPublicationByDomain(
  client: HashnodeClient,
  domain: string
): Promise<{ id: string; name: string; domain: string }> {
  const query = `
    query Publication($host: String!) {
      publication(host: $host) {
        id
        title
        domain
      }
    }
  `;

  const data = await hashnodeGraphQLRequest(client, query, {
    host: domain,
  });

  if (!data.publication) {
    throw new Error(`Publication not found for domain: ${domain}`);
  }

  return {
    id: data.publication.id,
    name: data.publication.title,
    domain: data.publication.domain,
  };
}

/**
 * Get user's publications
 */
export async function getPublications(
  client: HashnodeClient
): Promise<Array<{ id: string; name: string; domain: string }>> {
  try {
    const userInfo = await getUserInfo(client);

    const query = `
      query UserPublications($username: String!) {
        user(username: $username) {
          publications {
            edges {
              node {
                id
                title
                domain
              }
            }
          }
        }
      }
    `;

    const data = await hashnodeGraphQLRequest(client, query, {
      username: userInfo.username,
    });

    const publications = data.user?.publications?.edges || [];

    return publications.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.title,
      domain: edge.node.domain,
    }));
  } catch (error) {
    console.error('Get publications error:', error);
    return [];
  }
}

/**
 * Delete article
 */
export async function deleteArticle(
  client: HashnodeClient,
  postId: string
): Promise<PublishResponse> {
  try {
    const mutation = `
      mutation RemovePost($input: RemovePostInput!) {
        removePost(input: $input) {
          code
          success
          message
        }
      }
    `;

    const data = await hashnodeGraphQLRequest(client, mutation, {
      input: { id: postId },
    });

    const response = data.removePost;

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete article');
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
 * Test Hashnode connection
 */
export async function testConnection(client: HashnodeClient): Promise<boolean> {
  try {
    await getUserInfo(client);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create Hashnode client
 */
export function createHashnodeClient(config: { accessToken: string }): HashnodeClient {
  if (!config.accessToken) {
    throw new Error('Hashnode access token is required');
  }

  return {
    accessToken: config.accessToken,
  };
}
