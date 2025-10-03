/**
 * Reddit Platform Integration
 * OAuth 2.0 + Reddit API
 * Supports text posts, link posts, image posts, flair selection, and editing
 */

import axios, { AxiosInstance } from 'axios';
import { encrypt, decrypt } from './encryption';
import { enforceLimit } from './limits';

const REDDIT_API_BASE = 'https://oauth.reddit.com';
const REDDIT_AUTH_BASE = 'https://www.reddit.com/api/v1';

export interface RedditConfig {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  clientId: string;
  clientSecret: string;
  userAgent: string; // Required by Reddit API
  username?: string;
}

export interface SubmitOptions {
  flairId?: string;
  flairText?: string;
  nsfw?: boolean;
  spoiler?: boolean;
  sendReplies?: boolean; // Receive inbox notifications for replies
  resubmit?: boolean; // Allow resubmitting to same subreddit
}

export interface PostResponse {
  id: string;
  name: string; // Reddit's fullname (e.g., t3_abc123)
  url: string;
  permalink: string;
  createdAt: string;
}

export interface Flair {
  id: string;
  text: string;
  cssClass?: string;
  textEditable: boolean;
}

export class RedditClient {
  private axios: AxiosInstance;
  private config: RedditConfig;
  private lastRequestTime: number = 0;
  private readonly REQUEST_DELAY = 2000; // 2 seconds between requests

  constructor(config: RedditConfig) {
    this.config = {
      ...config,
      accessToken: decrypt(config.accessToken),
      refreshToken: config.refreshToken ? decrypt(config.refreshToken) : undefined,
    };

    this.axios = axios.create({
      baseURL: REDDIT_API_BASE,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'User-Agent': this.config.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Add response interceptor for token refresh
    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.config.refreshToken) {
          await this.refreshAccessToken();
          return this.axios.request(error.config);
        }
        throw error;
      }
    );
  }

  /**
   * Submit a text post to a subreddit
   */
  async submitTextPost(subreddit: string, title: string, content: string, options: SubmitOptions = {}): Promise<PostResponse> {
    // Enforce character limits
    const titleEnforcement = enforceLimit(title, 'redditTitle', { forceTruncate: true });
    const contentEnforcement = enforceLimit(content, 'reddit', { forceTruncate: true });

    if (titleEnforcement.truncated || contentEnforcement.truncated) {
      console.warn('Reddit post truncated:', {
        title: titleEnforcement.warning,
        content: contentEnforcement.warning,
      });
    }

    await this.respectRateLimit();

    const params = new URLSearchParams({
      sr: subreddit,
      kind: 'self',
      title: titleEnforcement.text,
      text: contentEnforcement.text,
      nsfw: options.nsfw ? 'true' : 'false',
      spoiler: options.spoiler ? 'true' : 'false',
      sendreplies: options.sendReplies !== false ? 'true' : 'false',
      resubmit: options.resubmit ? 'true' : 'false',
    });

    if (options.flairId) {
      params.append('flair_id', options.flairId);
    }

    if (options.flairText) {
      params.append('flair_text', options.flairText);
    }

    try {
      const response = await this.axios.post('/api/submit', params.toString());
      const data = response.data.json.data;

      return {
        id: data.id,
        name: data.name,
        url: data.url,
        permalink: `https://reddit.com${data.url}`,
        createdAt: new Date(data.created_utc * 1000).toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to submit text post');
    }
  }

  /**
   * Submit a link post to a subreddit
   */
  async submitLinkPost(subreddit: string, title: string, url: string, options: SubmitOptions = {}): Promise<PostResponse> {
    const titleEnforcement = enforceLimit(title, 'redditTitle', { forceTruncate: true });

    await this.respectRateLimit();

    const params = new URLSearchParams({
      sr: subreddit,
      kind: 'link',
      title: titleEnforcement.text,
      url: url,
      nsfw: options.nsfw ? 'true' : 'false',
      spoiler: options.spoiler ? 'true' : 'false',
      sendreplies: options.sendReplies !== false ? 'true' : 'false',
      resubmit: options.resubmit ? 'true' : 'false',
    });

    if (options.flairId) {
      params.append('flair_id', options.flairId);
    }

    if (options.flairText) {
      params.append('flair_text', options.flairText);
    }

    try {
      const response = await this.axios.post('/api/submit', params.toString());
      const data = response.data.json.data;

      return {
        id: data.id,
        name: data.name,
        url: data.url,
        permalink: `https://reddit.com${data.url}`,
        createdAt: new Date(data.created_utc * 1000).toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to submit link post');
    }
  }

  /**
   * Submit an image post to a subreddit
   */
  async submitImagePost(subreddit: string, title: string, imageUrl: string, options: SubmitOptions = {}): Promise<PostResponse> {
    const titleEnforcement = enforceLimit(title, 'redditTitle', { forceTruncate: true });

    await this.respectRateLimit();

    const params = new URLSearchParams({
      sr: subreddit,
      kind: 'image',
      title: titleEnforcement.text,
      url: imageUrl,
      nsfw: options.nsfw ? 'true' : 'false',
      spoiler: options.spoiler ? 'true' : 'false',
      sendreplies: options.sendReplies !== false ? 'true' : 'false',
      resubmit: options.resubmit ? 'true' : 'false',
    });

    if (options.flairId) {
      params.append('flair_id', options.flairId);
    }

    try {
      const response = await this.axios.post('/api/submit', params.toString());
      const data = response.data.json.data;

      return {
        id: data.id,
        name: data.name,
        url: data.url,
        permalink: `https://reddit.com${data.url}`,
        createdAt: new Date(data.created_utc * 1000).toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to submit image post');
    }
  }

  /**
   * Get available post flairs for a subreddit
   */
  async getPostFlairs(subreddit: string): Promise<Flair[]> {
    await this.respectRateLimit();

    try {
      const response = await this.axios.get(`/r/${subreddit}/api/link_flair_v2`);

      return response.data.map((flair: any) => ({
        id: flair.id,
        text: flair.text,
        cssClass: flair.css_class,
        textEditable: flair.text_editable,
      }));
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get post flairs');
    }
  }

  /**
   * Select flair for a post
   */
  async selectFlair(subreddit: string, postId: string, flairId: string, flairText?: string): Promise<boolean> {
    await this.respectRateLimit();

    const params = new URLSearchParams({
      link: `t3_${postId}`,
      flair_template_id: flairId,
    });

    if (flairText) {
      params.append('text', flairText);
    }

    try {
      await this.axios.post(`/r/${subreddit}/api/selectflair`, params.toString());
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to select flair');
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    await this.respectRateLimit();

    const params = new URLSearchParams({
      id: `t3_${postId}`,
    });

    try {
      await this.axios.post('/api/del', params.toString());
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete post');
    }
  }

  /**
   * Edit a text post
   */
  async editPost(postId: string, newContent: string): Promise<boolean> {
    const contentEnforcement = enforceLimit(newContent, 'reddit', { forceTruncate: true });

    await this.respectRateLimit();

    const params = new URLSearchParams({
      thing_id: `t3_${postId}`,
      text: contentEnforcement.text,
    });

    try {
      await this.axios.post('/api/editusertext', params.toString());
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to edit post');
    }
  }

  /**
   * Validate subreddit exists and is accessible
   */
  async validateSubreddit(subreddit: string): Promise<{
    exists: boolean;
    canPost: boolean;
    name: string;
    subscribers?: number;
  }> {
    await this.respectRateLimit();

    try {
      const response = await this.axios.get(`/r/${subreddit}/about`);
      const data = response.data.data;

      return {
        exists: true,
        canPost: !data.submit_text_label?.includes('disabled'),
        name: data.display_name,
        subscribers: data.subscribers,
      };
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        return {
          exists: error.response.status !== 404,
          canPost: false,
          name: subreddit,
        };
      }
      throw this.handleError(error, 'Failed to validate subreddit');
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{
    username: string;
    id: string;
    linkKarma: number;
    commentKarma: number;
    created: Date;
  }> {
    await this.respectRateLimit();

    try {
      const response = await this.axios.get('/api/v1/me');
      const user = response.data;

      return {
        username: user.name,
        id: user.id,
        linkKarma: user.link_karma,
        commentKarma: user.comment_karma,
        created: new Date(user.created_utc * 1000),
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get user info');
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.config.refreshToken,
    });

    try {
      const response = await axios.post(`${REDDIT_AUTH_BASE}/access_token`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.config.userAgent,
          Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
        },
      });

      this.config.accessToken = response.data.access_token;
      this.config.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      // Update axios instance
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${this.config.accessToken}`;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to refresh access token');
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
   * Respect Reddit's rate limiting (2 seconds between requests)
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Error handler
   */
  private handleError(error: any, message: string): Error {
    if (error.response) {
      const redditError = error.response.data;
      const errorMessage = redditError.message || redditError.error || 'Unknown error';

      // Handle common Reddit errors
      if (error.response.status === 429) {
        return new Error(`${message}: Rate limit exceeded. Please wait before trying again.`);
      }

      return new Error(`${message}: ${errorMessage} (Status: ${error.response.status})`);
    }

    return new Error(`${message}: ${error.message}`);
  }
}

/**
 * Initialize Reddit client from platform config
 */
export function createRedditClient(config: RedditConfig): RedditClient {
  return new RedditClient(config);
}
