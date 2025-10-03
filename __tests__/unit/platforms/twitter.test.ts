import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { TwitterClient } from '@/lib/platforms/twitter';
import { encrypt } from '@/lib/platforms/encryption';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock encryption
jest.mock('@/lib/platforms/encryption', () => ({
  encrypt: jest.fn((value: string) => `encrypted_${value}`),
  decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
}));

describe('Twitter Platform Integration', () => {
  let client: TwitterClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
      defaults: {
        headers: {
          common: {},
        },
      },
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    mockedAxios.post = jest.fn();

    client = new TwitterClient({
      accessToken: 'encrypted_test_token',
      refreshToken: 'encrypted_refresh_token',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tweet Posting', () => {
    it('should post a tweet successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1234567890',
            text: 'Test tweet',
            created_at: '2025-10-03T00:00:00Z',
          },
        },
        headers: {
          'x-rate-limit-remaining': '199',
          'x-rate-limit-reset': '1696377600',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.postTweet('Test tweet');

      expect(result).toEqual({
        id: '1234567890',
        text: 'Test tweet',
        createdAt: '2025-10-03T00:00:00Z',
        url: 'https://twitter.com/i/web/status/1234567890',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tweets', {
        text: 'Test tweet',
      });
    });

    it('should enforce character limits', async () => {
      const longTweet = 'a'.repeat(300);

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          data: {
            id: '1234567890',
            text: 'a'.repeat(279) + '…',
            created_at: '2025-10-03T00:00:00Z',
          },
        },
        headers: {},
      });

      const result = await client.postTweet(longTweet);

      expect(result.text).toHaveLength(280);
      expect(result.text).toMatch(/…$/);
    });

    it('should add media to tweet', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          data: {
            id: '1234567890',
            text: 'Tweet with media',
            created_at: '2025-10-03T00:00:00Z',
          },
        },
        headers: {},
      });

      await client.postTweet('Tweet with media', {
        mediaIds: ['media_1', 'media_2'],
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tweets', {
        text: 'Tweet with media',
        media: {
          media_ids: ['media_1', 'media_2'],
        },
      });
    });

    it('should limit media to 4 items', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          data: {
            id: '1234567890',
            text: 'Tweet with media',
          },
        },
        headers: {},
      });

      await client.postTweet('Tweet with media', {
        mediaIds: ['m1', 'm2', 'm3', 'm4', 'm5'],
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.media.media_ids).toHaveLength(4);
    });
  });

  describe('Thread Posting', () => {
    it('should post a thread of tweets', async () => {
      mockAxiosInstance.post
        .mockResolvedValueOnce({
          data: {
            data: {
              id: 'tweet1',
              text: 'First tweet\n\n🧵 1/3',
            },
          },
          headers: {},
        })
        .mockResolvedValueOnce({
          data: {
            data: {
              id: 'tweet2',
              text: 'Second tweet\n\n🧵 2/3',
            },
          },
          headers: {},
        })
        .mockResolvedValueOnce({
          data: {
            data: {
              id: 'tweet3',
              text: 'Third tweet\n\n🧵 3/3',
            },
          },
          headers: {},
        });

      const results = await client.postThread({
        tweets: ['First tweet', 'Second tweet', 'Third tweet'],
        addThreadIndicators: true,
      });

      expect(results).toHaveLength(3);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);

      // Check that second tweet replies to first
      const secondCall = mockAxiosInstance.post.mock.calls[1][1];
      expect(secondCall.reply).toEqual({
        in_reply_to_tweet_id: 'tweet1',
      });
    });

    it('should split long content into multiple tweets', async () => {
      const longContent = 'a'.repeat(500);

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          data: {
            id: 'tweet1',
            text: 'content',
          },
        },
        headers: {},
      });

      const results = await client.postThread({
        tweets: [longContent],
        addThreadIndicators: true,
      });

      expect(results.length).toBeGreaterThan(1);
    });
  });

  describe('Media Upload', () => {
    it('should upload image successfully', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      mockedAxios.post.mockResolvedValue({
        data: {
          media_id_string: 'media_123',
          media_key: 'key_123',
          expires_after_secs: 86400,
        },
      });

      const result = await client.uploadMedia(imageBuffer);

      expect(result).toEqual({
        mediaId: 'media_123',
        mediaKey: 'key_123',
        expiresAfterSecs: 86400,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('upload.twitter.com'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limits from headers', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1234567890',
            text: 'Test tweet',
          },
        },
        headers: {
          'x-rate-limit-remaining': '50',
          'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900),
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.postTweet('Test tweet');

      // Rate limit should be tracked internally
      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    it('should throw error when rate limit is exceeded', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'tweet1',
            text: 'First tweet',
          },
        },
        headers: {
          'x-rate-limit-remaining': '0',
          'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900),
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      await client.postTweet('First tweet');

      // Next request should fail due to rate limit
      await expect(client.postTweet('Second tweet')).rejects.toThrow(/Rate limit exceeded/);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token when expired', async () => {
      const clientWithRefresh = new TwitterClient({
        accessToken: 'encrypted_test_token',
        refreshToken: 'encrypted_refresh_token',
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
      });

      mockAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 401,
        },
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 7200,
        },
      });

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'tweet1',
            text: 'Test tweet',
          },
        },
        headers: {},
      });

      // This should trigger a token refresh
      const interceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      await interceptor({
        response: { status: 401 },
        config: { url: '/tweets', method: 'POST' },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.twitter.com/2/oauth2/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 403,
          data: {
            errors: [
              {
                message: 'Forbidden',
              },
            ],
          },
        },
      });

      await expect(client.postTweet('Test tweet')).rejects.toThrow(/Forbidden/);
    });

    it('should handle network errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(client.postTweet('Test tweet')).rejects.toThrow(/Network error/);
    });
  });

  describe('User Info', () => {
    it('should get user information', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          data: {
            id: 'user_123',
            username: 'testuser',
            name: 'Test User',
            public_metrics: {
              followers_count: 1000,
            },
          },
        },
      });

      const userInfo = await client.getUserInfo();

      expect(userInfo).toEqual({
        id: 'user_123',
        username: 'testuser',
        name: 'Test User',
        profileUrl: 'https://twitter.com/testuser',
        followersCount: 1000,
      });
    });
  });

  describe('Tweet Deletion', () => {
    it('should delete a tweet', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: { deleted: true },
      });

      const result = await client.deleteTweet('1234567890');

      expect(result).toBe(true);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/tweets/1234567890');
    });
  });
});
