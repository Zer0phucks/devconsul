/**
 * LinkedIn Platform Integration
 * OAuth 2.0 + LinkedIn API v2
 * Supports personal posts, organization posts, articles, and media uploads
 */

import axios, { AxiosInstance } from 'axios';
import { encrypt, decrypt } from './encryption';
import { enforceLimit } from './limits';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

export interface LinkedInConfig {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  personId?: string; // LinkedIn person URN
  organizationId?: string; // Optional organization URN
}

export interface PostOptions {
  visibility?: 'PUBLIC' | 'CONNECTIONS';
  mediaUrls?: string[];
  articleLink?: string;
  commentingDisabled?: boolean;
}

export interface ArticleOptions {
  title: string;
  content: string;
  thumbnail?: string;
  canonicalUrl?: string;
}

export interface PostResponse {
  id: string;
  url?: string;
  createdAt?: string;
}

export interface ArticleResponse {
  id: string;
  url?: string;
  createdAt?: string;
}

export class LinkedInClient {
  private axios: AxiosInstance;
  private config: LinkedInConfig;

  constructor(config: LinkedInConfig) {
    this.config = {
      ...config,
      accessToken: decrypt(config.accessToken),
      refreshToken: config.refreshToken ? decrypt(config.refreshToken) : undefined,
    };

    this.axios = axios.create({
      baseURL: LINKEDIN_API_BASE,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
  }

  /**
   * Create a post on personal profile
   */
  async createPost(content: string, options: PostOptions = {}): Promise<PostResponse> {
    if (!this.config.personId) {
      // Fetch person ID if not provided
      const userInfo = await this.getUserInfo();
      this.config.personId = userInfo.id;
    }

    // Enforce character limit
    const enforcement = enforceLimit(content, 'linkedin', { forceTruncate: true });
    if (enforcement.truncated) {
      console.warn(`LinkedIn post truncated: ${enforcement.warning}`);
    }

    const payload: any = {
      author: `urn:li:person:${this.config.personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: enforcement.text,
          },
          shareMediaCategory: options.mediaUrls && options.mediaUrls.length > 0 ? 'IMAGE' : options.articleLink ? 'ARTICLE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': options.visibility || 'PUBLIC',
      },
    };

    // Add media if provided
    if (options.mediaUrls && options.mediaUrls.length > 0) {
      payload.specificContent['com.linkedin.ugc.ShareContent'].media = options.mediaUrls.slice(0, 9).map((url) => ({
        status: 'READY',
        description: {
          text: '',
        },
        media: url,
        title: {
          text: '',
        },
      }));
    }

    // Add article link if provided
    if (options.articleLink) {
      payload.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: options.articleLink,
        },
      ];
    }

    try {
      const response = await this.axios.post('/ugcPosts', payload);
      const postId = response.data.id;

      return {
        id: postId,
        url: `https://www.linkedin.com/feed/update/${postId}`,
        createdAt: response.data.created?.time ? new Date(response.data.created.time).toISOString() : undefined,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create LinkedIn post');
    }
  }

  /**
   * Create a post on organization page
   */
  async createOrganizationPost(orgId: string, content: string, options: PostOptions = {}): Promise<PostResponse> {
    // Enforce character limit
    const enforcement = enforceLimit(content, 'linkedin', { forceTruncate: true });
    if (enforcement.truncated) {
      console.warn(`LinkedIn organization post truncated: ${enforcement.warning}`);
    }

    const payload: any = {
      author: `urn:li:organization:${orgId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: enforcement.text,
          },
          shareMediaCategory: options.mediaUrls && options.mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add media if provided
    if (options.mediaUrls && options.mediaUrls.length > 0) {
      payload.specificContent['com.linkedin.ugc.ShareContent'].media = options.mediaUrls.slice(0, 9).map((url) => ({
        status: 'READY',
        description: {
          text: '',
        },
        media: url,
        title: {
          text: '',
        },
      }));
    }

    try {
      const response = await this.axios.post('/ugcPosts', payload);
      const postId = response.data.id;

      return {
        id: postId,
        url: `https://www.linkedin.com/feed/update/${postId}`,
        createdAt: response.data.created?.time ? new Date(response.data.created.time).toISOString() : undefined,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create organization post');
    }
  }

  /**
   * Upload an image to LinkedIn
   */
  async uploadImage(imageBuffer: Buffer): Promise<string> {
    if (!this.config.personId) {
      const userInfo = await this.getUserInfo();
      this.config.personId = userInfo.id;
    }

    try {
      // Step 1: Register upload
      const registerResponse = await this.axios.post('/assets?action=registerUpload', {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${this.config.personId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      });

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload binary image
      await axios.put(uploadUrl, imageBuffer, {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
      });

      return asset;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to upload image');
    }
  }

  /**
   * Publish a LinkedIn article
   */
  async createArticle(options: ArticleOptions): Promise<ArticleResponse> {
    if (!this.config.personId) {
      const userInfo = await this.getUserInfo();
      this.config.personId = userInfo.id;
    }

    // Enforce character limits
    const contentEnforcement = enforceLimit(options.content, 'linkedinArticle', { forceTruncate: true });
    if (contentEnforcement.truncated) {
      console.warn(`LinkedIn article truncated: ${contentEnforcement.warning}`);
    }

    const payload: any = {
      author: `urn:li:person:${this.config.personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: options.title,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              description: {
                text: contentEnforcement.text.substring(0, 256), // Summary
              },
              originalUrl: options.canonicalUrl || '',
              title: {
                text: options.title,
              },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Note: LinkedIn's article publishing API is limited
    // Full article creation requires using the Publishing Platform API
    // This creates a share with article metadata

    try {
      const response = await this.axios.post('/ugcPosts', payload);
      const postId = response.data.id;

      return {
        id: postId,
        url: `https://www.linkedin.com/feed/update/${postId}`,
        createdAt: response.data.created?.time ? new Date(response.data.created.time).toISOString() : undefined,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create article');
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.axios.delete(`/ugcPosts/${postId}`);
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete post');
    }
  }

  /**
   * Get user profile information
   */
  async getUserInfo(): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    profileUrl: string;
  }> {
    try {
      const response = await this.axios.get('/me');
      const profile = response.data;

      return {
        id: profile.id,
        firstName: profile.localizedFirstName || profile.firstName?.localized?.en_US || '',
        lastName: profile.localizedLastName || profile.lastName?.localized?.en_US || '',
        profileUrl: `https://www.linkedin.com/in/${profile.vanityName || profile.id}`,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get user info');
    }
  }

  /**
   * Get encrypted tokens for storage
   */
  getEncryptedTokens(): {
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
  } {
    return {
      accessToken: encrypt(this.config.accessToken),
      refreshToken: this.config.refreshToken ? encrypt(this.config.refreshToken) : undefined,
      tokenExpiresAt: this.config.tokenExpiresAt,
    };
  }

  /**
   * Error handler
   */
  private handleError(error: any, message: string): Error {
    if (error.response) {
      const linkedinError = error.response.data;
      const errorMessage = linkedinError.message || linkedinError.error_description || 'Unknown error';

      return new Error(`${message}: ${errorMessage} (Status: ${error.response.status})`);
    }

    return new Error(`${message}: ${error.message}`);
  }
}

/**
 * Initialize LinkedIn client from platform config
 */
export function createLinkedInClient(config: LinkedInConfig): LinkedInClient {
  return new LinkedInClient(config);
}
