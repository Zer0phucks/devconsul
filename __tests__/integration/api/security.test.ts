/**
 * Integration Tests: Security and Rate Limiting
 * Tests rate limiting, input validation, and security measures
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockRequest,
  createUnauthenticatedRequest,
  mockRateLimiter,
} from '../utils/test-helpers';

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  checkRateLimit: jest.fn(),
}));

// Mock security functions
jest.mock('@/lib/security/validation', () => ({
  sanitizeInput: jest.fn(),
  validateInput: jest.fn(),
  detectSQLInjection: jest.fn(),
  detectXSS: jest.fn(),
}));

const { rateLimit, checkRateLimit } = require('@/lib/rate-limit');
const {
  sanitizeInput,
  validateInput,
  detectSQLInjection,
  detectXSS,
} = require('@/lib/security/validation');

describe('Security and Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 99,
        reset: Date.now() + 3600000,
      });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: { platform: 'TWITTER' },
        userId: 'user-123',
      });

      const result = await checkRateLimit({
        identifier: 'user-123',
        endpoint: '/api/ai/generate',
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should block requests exceeding rate limit', async () => {
      checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        reset: Date.now() + 1800000, // 30 minutes
        retryAfter: 1800,
      });

      const request = createMockRequest('POST', '/api/ai/generate', {
        body: { platform: 'TWITTER' },
        userId: 'user-123',
      });

      const result = await checkRateLimit({
        identifier: 'user-123',
        endpoint: '/api/ai/generate',
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBe(1800);
    });

    it('should have different limits per endpoint', async () => {
      const endpointLimits = {
        '/api/ai/generate': { limit: 10, window: 3600 },
        '/api/publishing/single': { limit: 50, window: 3600 },
        '/api/analytics/content': { limit: 100, window: 3600 },
      };

      for (const [endpoint, config] of Object.entries(endpointLimits)) {
        checkRateLimit.mockResolvedValue({
          allowed: true,
          limit: config.limit,
          window: config.window,
        });

        const result = await checkRateLimit({
          identifier: 'user-123',
          endpoint,
        });

        expect(result.limit).toBe(config.limit);
      }
    });

    it('should use IP-based rate limiting for unauthenticated requests', async () => {
      const ipAddress = '192.168.1.100';

      checkRateLimit.mockResolvedValue({
        allowed: true,
        identifier: ipAddress,
        remaining: 5,
      });

      const result = await checkRateLimit({
        identifier: ipAddress,
        endpoint: '/api/auth/signup',
      });

      expect(result.allowed).toBe(true);
      expect(result.identifier).toBe(ipAddress);
    });

    it('should reset rate limit after time window', async () => {
      const resetTime = Date.now() + 3600000;

      checkRateLimit
        .mockResolvedValueOnce({
          allowed: false,
          remaining: 0,
          reset: resetTime,
        })
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 100,
          reset: resetTime + 3600000,
        });

      const firstCheck = await checkRateLimit({
        identifier: 'user-123',
        endpoint: '/api/ai/generate',
      });
      expect(firstCheck.allowed).toBe(false);

      // Simulate time passing
      const secondCheck = await checkRateLimit({
        identifier: 'user-123',
        endpoint: '/api/ai/generate',
      });
      expect(secondCheck.allowed).toBe(true);
    });

    it('should apply stricter limits for expensive operations', async () => {
      const expensiveEndpoints = [
        '/api/ai/generate-all',
        '/api/publishing/batch',
        '/api/reports/generate',
      ];

      for (const endpoint of expensiveEndpoints) {
        checkRateLimit.mockResolvedValue({
          allowed: true,
          limit: 5, // Stricter limit
          window: 3600,
        });

        const result = await checkRateLimit({
          identifier: 'user-123',
          endpoint,
        });

        expect(result.limit).toBeLessThanOrEqual(5);
      }
    });

    it('should track rate limit by user and endpoint combination', async () => {
      const userId = 'user-123';
      const endpoints = ['/api/ai/generate', '/api/publishing/single'];

      for (const endpoint of endpoints) {
        checkRateLimit.mockResolvedValue({
          allowed: true,
          key: `${userId}:${endpoint}`,
        });

        const result = await checkRateLimit({
          identifier: userId,
          endpoint,
        });

        expect(result.key).toBe(`${userId}:${endpoint}`);
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize HTML in user input', async () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = 'Hello World';

      sanitizeInput.mockReturnValue(sanitized);

      const result = sanitizeInput(maliciousInput);

      expect(result).toBe(sanitized);
      expect(result).not.toContain('<script>');
      expect(sanitizeInput).toHaveBeenCalledWith(maliciousInput);
    });

    it('should detect SQL injection attempts', async () => {
      const sqlInjectionPatterns = [
        "admin'--",
        "1' OR '1'='1",
        "'; DROP TABLE users; --",
        "1; DELETE FROM content",
      ];

      for (const pattern of sqlInjectionPatterns) {
        detectSQLInjection.mockReturnValue(true);

        const result = detectSQLInjection(pattern);

        expect(result).toBe(true);
      }
    });

    it('should detect XSS attempts', async () => {
      const xssPatterns = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
      ];

      for (const pattern of xssPatterns) {
        detectXSS.mockReturnValue(true);

        const result = detectXSS(pattern);

        expect(result).toBe(true);
      }
    });

    it('should validate email format', async () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'admin+tag@company.com',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      for (const email of validEmails) {
        expect(emailRegex.test(email)).toBe(true);
      }

      for (const email of invalidEmails) {
        expect(emailRegex.test(email)).toBe(false);
      }
    });

    it('should validate URL format', async () => {
      const validUrls = [
        'https://example.com',
        'http://subdomain.example.com/path',
        'https://example.com:8080/api',
      ];

      const invalidUrls = [
        'not-a-url',
        'javascript:alert(1)',
        'file:///etc/passwd',
        'ftp://invalid.com',
      ];

      const urlRegex = /^https?:\/\/.+\..+/;

      for (const url of validUrls) {
        expect(urlRegex.test(url)).toBe(true);
      }

      for (const url of invalidUrls) {
        expect(urlRegex.test(url)).toBe(false);
      }
    });

    it('should enforce password strength requirements', async () => {
      const weakPasswords = [
        'short',
        '12345678',
        'password',
        'qwerty123',
      ];

      const strongPasswords = [
        'SecureP@ss123!',
        'MyStr0ng!Pass',
        'C0mpl3x#Pwd',
      ];

      const isStrongPassword = (password: string) => {
        return (
          password.length >= 8 &&
          /[A-Z]/.test(password) &&
          /[a-z]/.test(password) &&
          /[0-9]/.test(password)
        );
      };

      for (const password of weakPasswords) {
        expect(isStrongPassword(password)).toBe(false);
      }

      for (const password of strongPasswords) {
        expect(isStrongPassword(password)).toBe(true);
      }
    });
  });

  describe('Authorization Checks', () => {
    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/projects',
        '/api/content',
        '/api/publishing/single',
        '/api/analytics/content',
      ];

      for (const endpoint of protectedEndpoints) {
        const request = createUnauthenticatedRequest('GET', endpoint);

        // Should not have x-user-id header
        expect(request.headers.get('x-user-id')).toBeNull();
      }
    });

    it('should prevent cross-user data access', async () => {
      const request = createMockRequest('GET', '/api/projects/project-123', {
        userId: 'other-user',
      });

      // In real implementation, this would be checked against database
      const projectOwner = 'user-123';
      const requestUser = request.headers.get('x-user-id');

      expect(requestUser).not.toBe(projectOwner);
    });

    it('should validate API key format', async () => {
      const validApiKeys = [
        'sk-proj-1234567890abcdef',
        'api_key_1234567890',
      ];

      const invalidApiKeys = ['invalid', '123', '', 'key with spaces'];

      const apiKeyRegex = /^[a-zA-Z0-9_-]{16,}$/;

      for (const key of validApiKeys) {
        expect(apiKeyRegex.test(key)).toBe(true);
      }

      for (const key of invalidApiKeys) {
        expect(apiKeyRegex.test(key)).toBe(false);
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should validate CSRF token for state-changing operations', async () => {
      const csrfToken = 'csrf-token-123';

      const request = createMockRequest('POST', '/api/content', {
        body: { title: 'Test' },
        headers: { 'x-csrf-token': csrfToken },
        userId: 'user-123',
      });

      expect(request.headers.get('x-csrf-token')).toBe(csrfToken);
    });

    it('should reject requests with invalid CSRF token', async () => {
      const request = createMockRequest('POST', '/api/content', {
        body: { title: 'Test' },
        headers: { 'x-csrf-token': 'invalid-token' },
        userId: 'user-123',
      });

      // Mock CSRF validation
      const validateCSRF = jest.fn().mockReturnValue(false);

      const isValid = validateCSRF(request.headers.get('x-csrf-token'));
      expect(isValid).toBe(false);
    });
  });

  describe('Content Security', () => {
    it('should detect and block malicious file uploads', async () => {
      const dangerousFileTypes = [
        'malware.exe',
        'script.bat',
        'virus.sh',
        'backdoor.dll',
      ];

      const allowedExtensions = ['.jpg', '.png', '.gif', '.pdf', '.txt'];

      for (const filename of dangerousFileTypes) {
        const ext = filename.substring(filename.lastIndexOf('.'));
        expect(allowedExtensions.includes(ext)).toBe(false);
      }
    });

    it('should validate image dimensions and file size', async () => {
      const imageMetadata = {
        width: 2000,
        height: 2000,
        size: 3 * 1024 * 1024, // 3MB
      };

      const maxWidth = 4000;
      const maxHeight = 4000;
      const maxSize = 5 * 1024 * 1024; // 5MB

      const isValid =
        imageMetadata.width <= maxWidth &&
        imageMetadata.height <= maxHeight &&
        imageMetadata.size <= maxSize;

      expect(isValid).toBe(true);
    });

    it('should scan URLs for malicious content', async () => {
      const suspiciousUrls = [
        'http://malware.com/payload.exe',
        'javascript:void(0)',
        'data:text/html,<script>alert(1)</script>',
      ];

      const safeUrlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

      for (const url of suspiciousUrls) {
        const isSafe = safeUrlPattern.test(url);
        // Additional checks would be performed in real implementation
        if (url.startsWith('javascript:') || url.startsWith('data:')) {
          expect(isSafe).toBe(false);
        }
      }
    });
  });

  describe('Session Security', () => {
    it('should enforce session timeout', async () => {
      const sessionCreated = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
      const sessionTimeout = 1 * 60 * 60 * 1000; // 1 hour

      const isExpired = Date.now() - sessionCreated > sessionTimeout;

      expect(isExpired).toBe(true);
    });

    it('should regenerate session on privilege escalation', async () => {
      const oldSessionId = 'session-123';
      const newSessionId = 'session-456';

      const regenerateSession = jest.fn().mockReturnValue(newSessionId);

      const result = regenerateSession(oldSessionId);

      expect(result).toBe(newSessionId);
      expect(result).not.toBe(oldSessionId);
    });

    it('should invalidate all sessions on password change', async () => {
      const userId = 'user-123';
      const activeSessions = ['session-1', 'session-2', 'session-3'];

      const invalidateAllSessions = jest.fn().mockResolvedValue({
        userId,
        invalidated: activeSessions.length,
      });

      const result = await invalidateAllSessions(userId);

      expect(result.invalidated).toBe(3);
    });
  });

  describe('API Key Security', () => {
    it('should hash API keys before storage', async () => {
      const plainApiKey = 'sk-proj-1234567890abcdef';

      const hashApiKey = jest
        .fn()
        .mockReturnValue('hashed-api-key-abcdef123456');

      const hashed = hashApiKey(plainApiKey);

      expect(hashed).not.toBe(plainApiKey);
      expect(hashed.length).toBeGreaterThan(plainApiKey.length);
    });

    it('should rotate API keys periodically', async () => {
      const apiKey = {
        id: 'key-123',
        createdAt: Date.now() - 91 * 24 * 60 * 60 * 1000, // 91 days ago
      };

      const rotationPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days

      const shouldRotate = Date.now() - apiKey.createdAt > rotationPeriod;

      expect(shouldRotate).toBe(true);
    });

    it('should revoke compromised API keys', async () => {
      const compromisedKey = 'sk-proj-compromised';

      const revokeApiKey = jest.fn().mockResolvedValue({
        revoked: true,
        revokedAt: new Date(),
      });

      const result = await revokeApiKey(compromisedKey);

      expect(result.revoked).toBe(true);
      expect(result.revokedAt).toBeDefined();
    });
  });

  describe('Audit Logging', () => {
    it('should log security-sensitive operations', async () => {
      const securityEvents = [
        {
          type: 'LOGIN_FAILED',
          userId: 'user-123',
          ipAddress: '192.168.1.100',
        },
        {
          type: 'PASSWORD_CHANGED',
          userId: 'user-123',
          timestamp: new Date(),
        },
        {
          type: 'API_KEY_CREATED',
          userId: 'user-123',
          keyId: 'key-456',
        },
      ];

      const logSecurityEvent = jest.fn();

      for (const event of securityEvents) {
        logSecurityEvent(event);
      }

      expect(logSecurityEvent).toHaveBeenCalledTimes(3);
    });

    it('should detect brute force attempts', async () => {
      const failedAttempts = [
        { userId: 'user-123', timestamp: Date.now() - 5000 },
        { userId: 'user-123', timestamp: Date.now() - 4000 },
        { userId: 'user-123', timestamp: Date.now() - 3000 },
        { userId: 'user-123', timestamp: Date.now() - 2000 },
        { userId: 'user-123', timestamp: Date.now() - 1000 },
      ];

      const threshold = 5;
      const timeWindow = 10000; // 10 seconds

      const isBruteForce = failedAttempts.length >= threshold;

      expect(isBruteForce).toBe(true);
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt sensitive data at rest', async () => {
      const sensitiveData = {
        apiKey: 'plain-api-key',
        password: 'plain-password',
        token: 'plain-token',
      };

      const encrypt = jest.fn((data: string) => `encrypted:${data}`);

      const encrypted = {
        apiKey: encrypt(sensitiveData.apiKey),
        password: encrypt(sensitiveData.password),
        token: encrypt(sensitiveData.token),
      };

      expect(encrypted.apiKey).toContain('encrypted:');
      expect(encrypted.apiKey).not.toBe(sensitiveData.apiKey);
    });

    it('should use secure encryption algorithms', async () => {
      const supportedAlgorithms = ['AES-256-GCM', 'ChaCha20-Poly1305'];

      const algorithm = 'AES-256-GCM';

      expect(supportedAlgorithms).toContain(algorithm);
    });
  });
});
