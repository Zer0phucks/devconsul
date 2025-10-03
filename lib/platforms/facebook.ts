/**
 * Facebook Platform Integration
 * OAuth 2.0 + Facebook Graph API v18+
 * Supports page posts, group posts, photo uploads, and post scheduling
 */

import axios, { AxiosInstance } from 'axios';
import { encrypt, decrypt } from './encryption';
import { enforceLimit } from './limits';

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

export interface FacebookConfig {
  accessToken: string; // Page access token
  refreshToken?: string;
  tokenExpiresAt?: Date;
  pageId?: string; // Facebook page ID
  userId?: string; // User ID
}

export interface PagePostOptions {
  link?: string;
  published?: boolean; // False for draft/scheduled
  scheduledPublishTime?: number; // Unix timestamp
  targetingCountries?: string[]; // Country codes for targeting
  feedTargeting?: {
    age_min?: number;
    age_max?: number;
    genders?: number[]; // 1=male, 2=female
    locales?: string[];
  };
}

export interface PhotoPostOptions {
  caption?: string;
  published?: boolean;
  scheduledPublishTime?: number;
  noStory?: boolean; // Don't publish to story
}

export interface PostResponse {
  id: string;
  url?: string;
  createdAt?: string;
}

export interface PhotoResponse {
  id: string;
  url?: string;
  postId?: string;
}

export class FacebookClient {
  private axios: AxiosInstance;
  private config: FacebookConfig;

  constructor(config: FacebookConfig) {
    this.config = {
      ...config,
      accessToken: decrypt(config.accessToken),
      refreshToken: config.refreshToken ? decrypt(config.refreshToken) : undefined,
    };

    this.axios = axios.create({
      baseURL: FACEBOOK_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Post to Facebook page
   */
  async postToPage(pageId: string, content: string, options: PagePostOptions = {}): Promise<PostResponse> {
    // Enforce character limit (recommended max)
    const enforcement = enforceLimit(content, 'facebook', { forceTruncate: true });
    if (enforcement.truncated) {
      console.warn(`Facebook post truncated: ${enforcement.warning}`);
    }

    const params: any = {
      message: enforcement.text,
      access_token: this.config.accessToken,
    };

    // Add link if provided
    if (options.link) {
      params.link = options.link;
    }

    // Set published status
    if (options.published === false) {
      params.published = false;
    }

    // Schedule post if time provided
    if (options.scheduledPublishTime) {
      params.published = false;
      params.scheduled_publish_time = options.scheduledPublishTime;
    }

    // Add targeting if provided
    if (options.targetingCountries && options.targetingCountries.length > 0) {
      params.targeting = JSON.stringify({
        geo_locations: {
          countries: options.targetingCountries,
        },
      });
    }

    // Add feed targeting
    if (options.feedTargeting) {
      params.feed_targeting = JSON.stringify(options.feedTargeting);
    }

    try {
      const response = await this.axios.post(`/${pageId}/feed`, null, { params });
      const postId = response.data.id;

      return {
        id: postId,
        url: `https://www.facebook.com/${postId.replace('_', '/posts/')}`,
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to post to Facebook page');
    }
  }

  /**
   * Post to Facebook group
   */
  async postToGroup(groupId: string, content: string, options: { link?: string } = {}): Promise<PostResponse> {
    // Enforce character limit
    const enforcement = enforceLimit(content, 'facebook', { forceTruncate: true });
    if (enforcement.truncated) {
      console.warn(`Facebook group post truncated: ${enforcement.warning}`);
    }

    const params: any = {
      message: enforcement.text,
      access_token: this.config.accessToken,
    };

    if (options.link) {
      params.link = options.link;
    }

    try {
      const response = await this.axios.post(`/${groupId}/feed`, null, { params });
      const postId = response.data.id;

      return {
        id: postId,
        url: `https://www.facebook.com/groups/${groupId}/permalink/${postId.split('_')[1]}`,
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to post to Facebook group');
    }
  }

  /**
   * Upload photo to page
   */
  async uploadPhoto(pageId: string, imageBuffer: Buffer, options: PhotoPostOptions = {}): Promise<PhotoResponse> {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('source', blob);

    if (options.caption) {
      const enforcement = enforceLimit(options.caption, 'facebook', { forceTruncate: true });
      formData.append('message', enforcement.text);
    }

    if (options.published === false) {
      formData.append('published', 'false');
    }

    if (options.scheduledPublishTime) {
      formData.append('published', 'false');
      formData.append('scheduled_publish_time', options.scheduledPublishTime.toString());
    }

    if (options.noStory) {
      formData.append('no_story', 'true');
    }

    formData.append('access_token', this.config.accessToken);

    try {
      const response = await axios.post(`${FACEBOOK_API_BASE}/${pageId}/photos`, formData);

      return {
        id: response.data.id,
        url: response.data.permalink_url,
        postId: response.data.post_id,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to upload photo');
    }
  }

  /**
   * Schedule a post for later publishing
   */
  async schedulePost(pageId: string, content: string, publishTime: Date, options: Omit<PagePostOptions, 'scheduledPublishTime'> = {}): Promise<PostResponse> {
    const unixTime = Math.floor(publishTime.getTime() / 1000);

    // Must be at least 10 minutes in the future and max 75 days
    const now = Math.floor(Date.now() / 1000);
    const tenMinutes = 10 * 60;
    const seventyFiveDays = 75 * 24 * 60 * 60;

    if (unixTime < now + tenMinutes) {
      throw new Error('Scheduled time must be at least 10 minutes in the future');
    }

    if (unixTime > now + seventyFiveDays) {
      throw new Error('Scheduled time cannot be more than 75 days in the future');
    }

    return this.postToPage(pageId, content, {
      ...options,
      scheduledPublishTime: unixTime,
    });
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.axios.delete(`/${postId}`, {
        params: { access_token: this.config.accessToken },
      });
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete post');
    }
  }

  /**
   * Get page information
   */
  async getPageInfo(pageId: string): Promise<{
    id: string;
    name: string;
    username?: string;
    followersCount?: number;
    link: string;
  }> {
    try {
      const response = await this.axios.get(`/${pageId}`, {
        params: {
          fields: 'id,name,username,followers_count,link',
          access_token: this.config.accessToken,
        },
      });

      const page = response.data;
      return {
        id: page.id,
        name: page.name,
        username: page.username,
        followersCount: page.followers_count,
        link: page.link,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get page info');
    }
  }

  /**
   * Get user's pages (for page selection)
   */
  async getUserPages(): Promise<
    Array<{
      id: string;
      name: string;
      accessToken: string;
    }>
  > {
    try {
      const response = await this.axios.get('/me/accounts', {
        params: {
          access_token: this.config.accessToken,
        },
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
      }));
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get user pages');
    }
  }

  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(appId: string, appSecret: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await this.axios.get('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: this.config.accessToken,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to exchange token');
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
      const fbError = error.response.data?.error;
      const errorMessage = fbError?.message || fbError?.error_user_msg || 'Unknown error';

      return new Error(`${message}: ${errorMessage} (Code: ${fbError?.code || error.response.status})`);
    }

    return new Error(`${message}: ${error.message}`);
  }
}

/**
 * Initialize Facebook client from platform config
 */
export function createFacebookClient(config: FacebookConfig): FacebookClient {
  return new FacebookClient(config);
}
