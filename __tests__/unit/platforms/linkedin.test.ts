import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { LinkedInClient } from '@/lib/platforms/linkedin';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@/lib/platforms/encryption', () => ({
  encrypt: jest.fn((value: string) => `encrypted_${value}`),
  decrypt: jest.fn((value: string) => value.replace('encrypted_', '')),
}));

describe('LinkedIn Platform Integration', () => {
  let client: LinkedInClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    mockedAxios.put = jest.fn();

    client = new LinkedInClient({
      accessToken: 'encrypted_test_token',
      personId: 'person_123',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Post Creation', () => {
    it('should create a post successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          id: 'post_123',
          created: {
            time: 1696377600000,
          },
        },
      });

      const result = await client.createPost('Test LinkedIn post');

      expect(result).toEqual({
        id: 'post_123',
        url: 'https://www.linkedin.com/feed/update/post_123',
        createdAt: expect.any(String),
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/ugcPosts',
        expect.objectContaining({
          author: 'urn:li:person:person_123',
          lifecycleState: 'PUBLISHED',
        })
      );
    });

    it('should enforce character limits', async () => {
      const longPost = 'a'.repeat(3500);

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          id: 'post_123',
        },
      });

      const result = await client.createPost(longPost);

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const postText = callArgs.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text;

      expect(postText.length).toBeLessThanOrEqual(3000);
    });

    it('should set visibility to public by default', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { id: 'post_123' },
      });

      await client.createPost('Test post');

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe('PUBLIC');
    });

    it('should support connections-only visibility', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { id: 'post_123' },
      });

      await client.createPost('Test post', { visibility: 'CONNECTIONS' });

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe('CONNECTIONS');
    });
  });

  describe('Media Handling', () => {
    it('should add media URLs to post', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { id: 'post_123' },
      });

      await client.createPost('Post with media', {
        mediaUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const content = callArgs.specificContent['com.linkedin.ugc.ShareContent'];

      expect(content.shareMediaCategory).toBe('IMAGE');
      expect(content.media).toHaveLength(2);
      expect(content.media[0].media).toBe('https://example.com/image1.jpg');
    });

    it('should limit media to 9 items', async () => {
      const mediaUrls = Array(12)
        .fill(0)
        .map((_, i) => `https://example.com/image${i}.jpg`);

      mockAxiosInstance.post.mockResolvedValue({
        data: { id: 'post_123' },
      });

      await client.createPost('Post with media', { mediaUrls });

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const media = callArgs.specificContent['com.linkedin.ugc.ShareContent'].media;

      expect(media).toHaveLength(9);
    });

    it('should upload image successfully', async () => {
      const imageBuffer = Buffer.from('fake-image-data');

      // Mock person ID fetch
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 'person_123',
          localizedFirstName: 'Test',
          localizedLastName: 'User',
        },
      });

      // Mock register upload
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: {
          value: {
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://upload.linkedin.com/upload',
              },
            },
            asset: 'urn:li:digitalmediaAsset:asset_123',
          },
        },
      });

      // Mock binary upload
      mockedAxios.put.mockResolvedValue({ status: 201 });

      const result = await client.uploadImage(imageBuffer);

      expect(result).toBe('urn:li:digitalmediaAsset:asset_123');
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://upload.linkedin.com/upload',
        imageBuffer,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/octet-stream',
          }),
        })
      );
    });
  });

  describe('Organization Posts', () => {
    it('should create organization post', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          id: 'org_post_123',
        },
      });

      const result = await client.createOrganizationPost('org_456', 'Organization announcement');

      expect(result.id).toBe('org_post_123');

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.author).toBe('urn:li:organization:org_456');
      expect(callArgs.visibility['com.linkedin.ugc.MemberNetworkVisibility']).toBe('PUBLIC');
    });
  });

  describe('Article Publishing', () => {
    it('should create an article', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          id: 'article_123',
          created: {
            time: 1696377600000,
          },
        },
      });

      const result = await client.createArticle({
        title: 'Test Article',
        content: 'This is the article content',
        canonicalUrl: 'https://example.com/article',
      });

      expect(result.id).toBe('article_123');

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const content = callArgs.specificContent['com.linkedin.ugc.ShareContent'];

      expect(content.shareMediaCategory).toBe('ARTICLE');
      expect(content.shareCommentary.text).toBe('Test Article');
    });

    it('should enforce article character limits', async () => {
      const longContent = 'a'.repeat(120000);

      mockAxiosInstance.post.mockResolvedValue({
        data: { id: 'article_123' },
      });

      await client.createArticle({
        title: 'Test Article',
        content: longContent,
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const description = callArgs.specificContent['com.linkedin.ugc.ShareContent'].media[0].description.text;

      expect(description.length).toBeLessThanOrEqual(256);
    });
  });

  describe('User Information', () => {
    it('should get user profile', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 'person_123',
          localizedFirstName: 'Test',
          localizedLastName: 'User',
          vanityName: 'testuser',
        },
      });

      const userInfo = await client.getUserInfo();

      expect(userInfo).toEqual({
        id: 'person_123',
        firstName: 'Test',
        lastName: 'User',
        profileUrl: 'https://www.linkedin.com/in/testuser',
      });
    });

    it('should handle missing vanity name', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 'person_123',
          localizedFirstName: 'Test',
          localizedLastName: 'User',
        },
      });

      const userInfo = await client.getUserInfo();

      expect(userInfo.profileUrl).toBe('https://www.linkedin.com/in/person_123');
    });
  });

  describe('Post Deletion', () => {
    it('should delete a post', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

      const result = await client.deletePost('post_123');

      expect(result).toBe(true);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/ugcPosts/post_123');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      mockAxiosInstance.post.mockRejectedValue({
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      });

      await expect(client.createPost('Test post')).rejects.toThrow(/Unauthorized/);
    });

    it('should handle network errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      await expect(client.createPost('Test post')).rejects.toThrow(/Network error/);
    });
  });

  describe('Article Link Sharing', () => {
    it('should share article link', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { id: 'post_123' },
      });

      await client.createPost('Check out this article', {
        articleLink: 'https://example.com/article',
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      const content = callArgs.specificContent['com.linkedin.ugc.ShareContent'];

      expect(content.shareMediaCategory).toBe('ARTICLE');
      expect(content.media[0].originalUrl).toBe('https://example.com/article');
    });
  });
});
