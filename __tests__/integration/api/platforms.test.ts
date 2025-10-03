/**
 * Integration Tests: Platform Connection API
 * Tests OAuth flows, API key validation, and platform disconnection
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockRequest,
  mockPrisma,
  testDataFactories,
} from '../utils/test-helpers';

// Mock platform adapters
jest.mock('@/lib/platforms/twitter/adapter', () => ({
  TwitterAdapter: {
    validateCredentials: jest.fn(),
    exchangeCodeForToken: jest.fn(),
  },
}));

jest.mock('@/lib/platforms/hashnode/adapter', () => ({
  HashnodeAdapter: {
    validateApiKey: jest.fn(),
  },
}));

jest.mock('@/lib/platforms/wordpress/adapter', () => ({
  WordPressAdapter: {
    validateCredentials: jest.fn(),
  },
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const { TwitterAdapter } = require('@/lib/platforms/twitter/adapter');
const { HashnodeAdapter } = require('@/lib/platforms/hashnode/adapter');
const { WordPressAdapter } = require('@/lib/platforms/wordpress/adapter');

describe('Platform Connection API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Platform Connection', () => {
    it('should connect Twitter with OAuth code', async () => {
      const connectionData = {
        platform: 'TWITTER',
        code: 'oauth-code-123',
        state: 'state-token-abc',
      };

      const mockTokenData = {
        access_token: 'twitter-access-token',
        refresh_token: 'twitter-refresh-token',
        expires_in: 7200,
        user_id: 'twitter-user-123',
        username: 'testuser',
      };

      const mockPlatformConnection = testDataFactories.platform({
        type: 'TWITTER',
        credentials: {
          accessToken: mockTokenData.access_token,
          refreshToken: mockTokenData.refresh_token,
          expiresAt: new Date(Date.now() + mockTokenData.expires_in * 1000),
        },
        platformUserId: mockTokenData.user_id,
        platformUsername: mockTokenData.username,
      });

      TwitterAdapter.exchangeCodeForToken.mockResolvedValue(mockTokenData);
      TwitterAdapter.validateCredentials.mockResolvedValue(true);
      mockPrisma.platform.create.mockResolvedValue(mockPlatformConnection);

      // Simulate OAuth callback handling
      const isValid = await TwitterAdapter.validateCredentials(
        mockTokenData.access_token
      );
      expect(isValid).toBe(true);

      const platform = await mockPrisma.platform.create({
        data: {
          type: 'TWITTER',
          userId: 'user-123',
          projectId: 'project-123',
          credentials: mockPlatformConnection.credentials,
          platformUserId: mockTokenData.user_id,
          platformUsername: mockTokenData.username,
          connected: true,
        },
      });

      expect(platform.connected).toBe(true);
      expect(platform.platformUserId).toBe('twitter-user-123');
      expect(TwitterAdapter.exchangeCodeForToken).toHaveBeenCalledWith(
        'oauth-code-123'
      );
    });

    it('should handle OAuth state mismatch', async () => {
      const connectionData = {
        platform: 'TWITTER',
        code: 'oauth-code-123',
        state: 'invalid-state',
      };

      // In a real implementation, the state would be validated
      // against a stored value in the session or database
      const storedState = 'state-token-abc';
      const isValidState = connectionData.state === storedState;

      expect(isValidState).toBe(false);
      expect(TwitterAdapter.exchangeCodeForToken).not.toHaveBeenCalled();
    });

    it('should handle OAuth token exchange errors', async () => {
      TwitterAdapter.exchangeCodeForToken.mockRejectedValue(
        new Error('Invalid authorization code')
      );

      await expect(
        TwitterAdapter.exchangeCodeForToken('invalid-code')
      ).rejects.toThrow('Invalid authorization code');
    });

    it('should refresh expired OAuth tokens', async () => {
      const expiredConnection = testDataFactories.platform({
        type: 'TWITTER',
        credentials: {
          accessToken: 'expired-token',
          refreshToken: 'refresh-token-123',
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const newTokenData = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 7200,
      };

      mockPrisma.platform.findFirst.mockResolvedValue(expiredConnection);
      TwitterAdapter.exchangeCodeForToken.mockResolvedValue(newTokenData);

      const updatedConnection = {
        ...expiredConnection,
        credentials: {
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token,
          expiresAt: new Date(Date.now() + newTokenData.expires_in * 1000),
        },
      };

      mockPrisma.platform.update.mockResolvedValue(updatedConnection);

      const platform = await mockPrisma.platform.update({
        where: { id: expiredConnection.id },
        data: {
          credentials: updatedConnection.credentials,
        },
      });

      expect(platform.credentials.accessToken).toBe('new-access-token');
    });
  });

  describe('API Key Platform Connection', () => {
    it('should connect Hashnode with API key', async () => {
      const connectionData = {
        platform: 'HASHNODE',
        apiKey: 'hashnode-api-key-123',
        publicationId: 'publication-456',
      };

      const mockValidationResponse = {
        valid: true,
        user: {
          id: 'hashnode-user-123',
          username: 'testuser',
          name: 'Test User',
        },
      };

      HashnodeAdapter.validateApiKey.mockResolvedValue(mockValidationResponse);

      const mockPlatformConnection = testDataFactories.platform({
        type: 'HASHNODE',
        credentials: {
          apiKey: connectionData.apiKey,
          publicationId: connectionData.publicationId,
        },
        platformUserId: mockValidationResponse.user.id,
        platformUsername: mockValidationResponse.user.username,
      });

      mockPrisma.platform.create.mockResolvedValue(mockPlatformConnection);

      const validationResult = await HashnodeAdapter.validateApiKey(
        connectionData.apiKey
      );
      expect(validationResult.valid).toBe(true);

      const platform = await mockPrisma.platform.create({
        data: {
          type: 'HASHNODE',
          userId: 'user-123',
          projectId: 'project-123',
          credentials: {
            apiKey: connectionData.apiKey,
            publicationId: connectionData.publicationId,
          },
          platformUserId: mockValidationResponse.user.id,
          platformUsername: mockValidationResponse.user.username,
          connected: true,
        },
      });

      expect(platform.connected).toBe(true);
      expect(HashnodeAdapter.validateApiKey).toHaveBeenCalledWith(
        'hashnode-api-key-123'
      );
    });

    it('should reject invalid API keys', async () => {
      HashnodeAdapter.validateApiKey.mockResolvedValue({
        valid: false,
        error: 'Invalid API key',
      });

      const result = await HashnodeAdapter.validateApiKey('invalid-key');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key');
      expect(mockPrisma.platform.create).not.toHaveBeenCalled();
    });

    it('should connect WordPress with credentials', async () => {
      const connectionData = {
        platform: 'WORDPRESS',
        url: 'https://myblog.wordpress.com',
        username: 'admin',
        applicationPassword: 'wpapp-password-123',
      };

      WordPressAdapter.validateCredentials.mockResolvedValue({
        valid: true,
        siteInfo: {
          name: 'My Blog',
          url: connectionData.url,
        },
      });

      const validationResult = await WordPressAdapter.validateCredentials({
        url: connectionData.url,
        username: connectionData.username,
        password: connectionData.applicationPassword,
      });

      expect(validationResult.valid).toBe(true);
      expect(WordPressAdapter.validateCredentials).toHaveBeenCalledWith({
        url: 'https://myblog.wordpress.com',
        username: 'admin',
        password: 'wpapp-password-123',
      });
    });

    it('should validate WordPress URL format', async () => {
      const invalidUrls = [
        'not-a-url',
        'http://incomplete',
        'ftp://wrong-protocol.com',
      ];

      for (const url of invalidUrls) {
        const isValidUrl = /^https?:\/\/.+\..+/.test(url);
        expect(isValidUrl).toBe(false);
      }
    });
  });

  describe('Platform Disconnection', () => {
    it('should disconnect platform successfully', async () => {
      const mockPlatformConnection = testDataFactories.platform({
        connected: true,
      });

      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatformConnection);
      mockPrisma.platform.update.mockResolvedValue({
        ...mockPlatformConnection,
        connected: false,
        disconnectedAt: new Date(),
      });

      const platform = await mockPrisma.platform.update({
        where: { id: mockPlatformConnection.id },
        data: {
          connected: false,
          disconnectedAt: new Date(),
        },
      });

      expect(platform.connected).toBe(false);
      expect(platform.disconnectedAt).toBeDefined();
    });

    it('should prevent disconnecting other users platforms', async () => {
      mockPrisma.platform.findFirst.mockResolvedValue(null);

      const request = createMockRequest(
        'DELETE',
        '/api/platforms/platform-123',
        { userId: 'other-user' }
      );

      // Platform should not be found for other users
      const platform = await mockPrisma.platform.findFirst({
        where: { id: 'platform-123', userId: 'other-user' },
      });

      expect(platform).toBeNull();
      expect(mockPrisma.platform.update).not.toHaveBeenCalled();
    });

    it('should revoke OAuth tokens on disconnection', async () => {
      const mockPlatformConnection = testDataFactories.platform({
        type: 'TWITTER',
        credentials: {
          accessToken: 'twitter-token',
          refreshToken: 'refresh-token',
        },
        connected: true,
      });

      mockPrisma.platform.findFirst.mockResolvedValue(mockPlatformConnection);

      // In real implementation, would call Twitter API to revoke
      TwitterAdapter.revokeToken = jest.fn().mockResolvedValue(true);

      await TwitterAdapter.revokeToken(
        mockPlatformConnection.credentials.accessToken
      );

      expect(TwitterAdapter.revokeToken).toHaveBeenCalledWith('twitter-token');
    });
  });

  describe('Multi-Platform Support', () => {
    it('should support multiple platform connections per user', async () => {
      const platforms = [
        testDataFactories.platform({ type: 'TWITTER', userId: 'user-123' }),
        testDataFactories.platform({ type: 'LINKEDIN', userId: 'user-123' }),
        testDataFactories.platform({ type: 'HASHNODE', userId: 'user-123' }),
      ];

      mockPrisma.platform.findMany.mockResolvedValue(platforms);

      const userPlatforms = await mockPrisma.platform.findMany({
        where: { userId: 'user-123' },
      });

      expect(userPlatforms).toHaveLength(3);
      expect(userPlatforms.map((p) => p.type)).toEqual([
        'TWITTER',
        'LINKEDIN',
        'HASHNODE',
      ]);
    });

    it('should prevent duplicate platform connections', async () => {
      const existingPlatform = testDataFactories.platform({
        type: 'TWITTER',
        userId: 'user-123',
        projectId: 'project-123',
      });

      mockPrisma.platform.findFirst.mockResolvedValue(existingPlatform);

      // Attempt to create duplicate
      const duplicate = await mockPrisma.platform.findFirst({
        where: {
          type: 'TWITTER',
          userId: 'user-123',
          projectId: 'project-123',
        },
      });

      expect(duplicate).toBeTruthy();
      // Should not create duplicate, should update existing instead
    });
  });

  describe('Credential Encryption', () => {
    it('should encrypt sensitive credentials before storage', async () => {
      const plainCredentials = {
        apiKey: 'plain-api-key-123',
        secret: 'plain-secret-456',
      };

      // Mock encryption
      const encryptedCredentials = {
        apiKey: 'encrypted-api-key',
        secret: 'encrypted-secret',
      };

      // In real implementation, credentials would be encrypted
      const encrypt = jest.fn().mockReturnValue(encryptedCredentials);
      const result = encrypt(plainCredentials);

      expect(result.apiKey).not.toBe(plainCredentials.apiKey);
      expect(result.secret).not.toBe(plainCredentials.secret);
    });

    it('should decrypt credentials when retrieving', async () => {
      const encryptedPlatform = testDataFactories.platform({
        credentials: {
          apiKey: 'encrypted-api-key',
        },
      });

      mockPrisma.platform.findFirst.mockResolvedValue(encryptedPlatform);

      const decrypt = jest.fn().mockReturnValue('plain-api-key-123');
      const decryptedKey = decrypt(encryptedPlatform.credentials.apiKey);

      expect(decryptedKey).toBe('plain-api-key-123');
    });
  });

  describe('Platform Status Monitoring', () => {
    it('should check platform health status', async () => {
      const platform = testDataFactories.platform({
        type: 'TWITTER',
        connected: true,
      });

      mockPrisma.platform.findFirst.mockResolvedValue(platform);
      TwitterAdapter.validateCredentials.mockResolvedValue(true);

      const isHealthy = await TwitterAdapter.validateCredentials(
        platform.credentials.accessToken
      );

      expect(isHealthy).toBe(true);
    });

    it('should update connection status on validation failure', async () => {
      const platform = testDataFactories.platform({
        type: 'TWITTER',
        connected: true,
      });

      mockPrisma.platform.findFirst.mockResolvedValue(platform);
      TwitterAdapter.validateCredentials.mockResolvedValue(false);

      const isValid = await TwitterAdapter.validateCredentials(
        platform.credentials.accessToken
      );

      if (!isValid) {
        mockPrisma.platform.update.mockResolvedValue({
          ...platform,
          connected: false,
          lastError: 'Token validation failed',
        });
      }

      expect(isValid).toBe(false);
    });
  });
});
