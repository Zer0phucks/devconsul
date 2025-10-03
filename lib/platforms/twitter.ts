/**
 * Twitter/X Platform Integration
 * OAuth 2.0 with PKCE + Twitter API v2
 * Supports tweets, threads, media uploads, and rate limiting
 */

import axios, { AxiosInstance } from 'axios';
import { encrypt, decrypt } from './encryption';
import { enforceLimit, splitForThreading } from './limits';

const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_UPLOAD_BASE = 'https://upload.twitter.com/1.1';

// Rate limits (per 15-minute window for user context)
const RATE_LIMITS = {
  createTweet: 200, // Actually 300 per 3 hours, ~100 per 15 min
  uploadMedia: 200,
  deleteTweet: 50,
};

export interface TwitterConfig {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  clientId?: string;
  clientSecret?: string;
}

export interface TweetOptions {
  mediaIds?: string[];
  replyToTweetId?: string;
  quoteTweetId?: string;
  pollOptions?: string[];
  pollDurationMinutes?: number;
  directMessageDeepLink?: string;
  forSuperFollowersOnly?: boolean;
  replySettings?: 'everyone' | 'mentionedUsers' | 'following';
}

export interface Thread {
  tweets: string[];
  addThreadIndicators?: boolean;
}

export interface TweetResponse {
  id: string;
  text: string;
  createdAt?: string;
  url?: string;
}

export interface MediaUploadResponse {
  mediaId: string;
  mediaKey: string;
  expiresAfterSecs: number;
}

export class TwitterClient {
  private axios: AxiosInstance;
  private config: TwitterConfig;
  private rateLimitRemaining: Map<string, number> = new Map();
  private rateLimitReset: Map<string, Date> = new Map();

  constructor(config: TwitterConfig) {
    this.config = {
      ...config,
      accessToken: decrypt(config.accessToken),
      refreshToken: config.refreshToken ? decrypt(config.refreshToken) : undefined,
    };

    this.axios = axios.create({
      baseURL: TWITTER_API_BASE,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for rate limiting
    this.axios.interceptors.response.use(
      (response) => {
        this.updateRateLimits(response.headers);
        return response;
      },
      async (error) => {
        if (error.response?.status === 401 && this.config.refreshToken) {
          // Token expired - refresh it
          await this.refreshAccessToken();
          // Retry the request
          return this.axios.request(error.config);
        }
        throw error;
      }
    );
  }

  /**
   * Post a single tweet
   */
  async postTweet(text: string, options: TweetOptions = {}): Promise<TweetResponse> {
    // Enforce character limit
    const enforcement = enforceLimit(text, 'twitter', { forceTruncate: true });
    if (enforcement.truncated) {
      console.warn(`Tweet truncated: ${enforcement.warning}`);
    }

    await this.checkRateLimit('createTweet');

    const payload: any = {
      text: enforcement.text,
    };

    // Add optional fields
    if (options.mediaIds && options.mediaIds.length > 0) {
      payload.media = {
        media_ids: options.mediaIds.slice(0, 4), // Max 4 media per tweet
      };
    }

    if (options.replyToTweetId) {
      payload.reply = {
        in_reply_to_tweet_id: options.replyToTweetId,
      };
    }

    if (options.quoteTweetId) {
      payload.quote_tweet_id = options.quoteTweetId;
    }

    if (options.pollOptions && options.pollOptions.length >= 2) {
      payload.poll = {
        options: options.pollOptions.slice(0, 4), // Max 4 poll options
        duration_minutes: options.pollDurationMinutes || 1440, // Default 24 hours
      };
    }

    if (options.replySettings) {
      payload.reply_settings = options.replySettings;
    }

    if (options.forSuperFollowersOnly) {
      payload.for_super_followers_only = true;
    }

    try {
      const response = await this.axios.post('/tweets', payload);
      const tweet = response.data.data;

      return {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        url: `https://twitter.com/i/web/status/${tweet.id}`,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to post tweet');
    }
  }

  /**
   * Post a tweet thread (series of connected tweets)
   */
  async postThread(thread: Thread): Promise<TweetResponse[]> {
    const { tweets, addThreadIndicators = true } = thread;

    if (tweets.length === 0) {
      throw new Error('Thread must contain at least one tweet');
    }

    // Split long tweets if needed
    let allTweets = tweets.flatMap((tweet) =>
      splitForThreading(tweet, 'twitter', {
        threadIndicator: addThreadIndicators,
        preserveParagraphs: true,
      })
    );

    const responses: TweetResponse[] = [];
    let previousTweetId: string | undefined;

    for (let i = 0; i < allTweets.length; i++) {
      const tweet = allTweets[i];

      // Add thread indicator if enabled and not already present
      let text = tweet;
      if (addThreadIndicators && !tweet.includes('/')) {
        text = `${tweet}\n\n🧵 ${i + 1}/${allTweets.length}`;
      }

      const response = await this.postTweet(text, {
        replyToTweetId: previousTweetId,
      });

      responses.push(response);
      previousTweetId = response.id;

      // Small delay between tweets to avoid rate limits
      if (i < allTweets.length - 1) {
        await this.delay(2000); // 2 second delay
      }
    }

    return responses;
  }

  /**
   * Upload media (image) for tweets
   */
  async uploadMedia(imageBuffer: Buffer, mediaType: string = 'image/png'): Promise<MediaUploadResponse> {
    await this.checkRateLimit('uploadMedia');

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mediaType });
    formData.append('media', blob);

    try {
      const response = await axios.post(
        `${TWITTER_UPLOAD_BASE}/media/upload.json`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        }
      );

      return {
        mediaId: response.data.media_id_string,
        mediaKey: response.data.media_key,
        expiresAfterSecs: response.data.expires_after_secs || 86400,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to upload media');
    }
  }

  /**
   * Reply to a specific tweet
   */
  async replyToTweet(tweetId: string, text: string, options: Omit<TweetOptions, 'replyToTweetId'> = {}): Promise<TweetResponse> {
    return this.postTweet(text, {
      ...options,
      replyToTweetId: tweetId,
    });
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<boolean> {
    await this.checkRateLimit('deleteTweet');

    try {
      await this.axios.delete(`/tweets/${tweetId}`);
      return true;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete tweet');
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<{
    id: string;
    username: string;
    name: string;
    profileUrl: string;
    followersCount?: number;
  }> {
    try {
      const response = await this.axios.get('/users/me', {
        params: {
          'user.fields': 'id,username,name,public_metrics',
        },
      });

      const user = response.data.data;
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        profileUrl: `https://twitter.com/${user.username}`,
        followersCount: user.public_metrics?.followers_count,
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get user info');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('Cannot refresh token: missing refresh token or client credentials');
    }

    try {
      const response = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`,
          },
        }
      );

      // Update tokens
      this.config.accessToken = response.data.access_token;
      this.config.refreshToken = response.data.refresh_token;
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
   * Check and enforce rate limits
   */
  private async checkRateLimit(endpoint: keyof typeof RATE_LIMITS): Promise<void> {
    const remaining = this.rateLimitRemaining.get(endpoint) ?? RATE_LIMITS[endpoint];
    const reset = this.rateLimitReset.get(endpoint);

    if (remaining <= 0 && reset && reset > new Date()) {
      const waitTime = reset.getTime() - Date.now();
      throw new Error(`Rate limit exceeded. Reset in ${Math.ceil(waitTime / 1000)} seconds`);
    }
  }

  /**
   * Update rate limit tracking from response headers
   */
  private updateRateLimits(headers: any): void {
    const remaining = headers['x-rate-limit-remaining'];
    const reset = headers['x-rate-limit-reset'];

    if (remaining !== undefined) {
      // Extract endpoint from request
      const endpoint = 'createTweet'; // Default for now
      this.rateLimitRemaining.set(endpoint, parseInt(remaining));
    }

    if (reset !== undefined) {
      const endpoint = 'createTweet';
      this.rateLimitReset.set(endpoint, new Date(parseInt(reset) * 1000));
    }
  }

  /**
   * Delay helper for thread posting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Error handler
   */
  private handleError(error: any, message: string): Error {
    if (error.response) {
      const twitterError = error.response.data;
      const errorDetails = twitterError.errors?.[0] || twitterError.error;

      return new Error(
        `${message}: ${errorDetails?.message || errorDetails || 'Unknown error'} (Status: ${error.response.status})`
      );
    }

    return new Error(`${message}: ${error.message}`);
  }
}

/**
 * Initialize Twitter client from platform config
 */
export function createTwitterClient(config: TwitterConfig): TwitterClient {
  return new TwitterClient(config);
}
