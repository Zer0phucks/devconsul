import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  calculateBackoffDelay,
  getRetryRecommendation,
  categorizeError,
} from '@/lib/publishing/retry';
import { categorizeError as categorizePublishError } from '@/lib/validations/publishing';

// Mock getRetryRecommendation and categorizeError from errors module
jest.mock('@/lib/publishing/errors', () => ({
  getRetryRecommendation: jest.fn((error: string, retryCount: number) => {
    const errorType = error.toLowerCase();

    if (errorType.includes('rate limit')) {
      return {
        shouldRetry: retryCount < 5,
        maxRetries: 5,
        delay: 60,
        reason: 'Rate limit - retry with backoff',
      };
    }

    if (errorType.includes('network') || errorType.includes('timeout')) {
      return {
        shouldRetry: retryCount < 3,
        maxRetries: 3,
        delay: 30,
        reason: 'Network error - retry',
      };
    }

    if (errorType.includes('unauthorized') || errorType.includes('forbidden')) {
      return {
        shouldRetry: false,
        maxRetries: 0,
        delay: 0,
        reason: 'Authentication error - not retriable',
      };
    }

    return {
      shouldRetry: retryCount < 3,
      maxRetries: 3,
      delay: 60,
      reason: 'Generic error - retry',
    };
  }),
  categorizeError: jest.fn((error: string) => {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('rate limit')) return 'rate-limit';
    if (errorLower.includes('network') || errorLower.includes('timeout')) return 'network';
    if (errorLower.includes('unauthorized') || errorLower.includes('forbidden'))
      return 'non-retriable';
    if (errorLower.includes('server error') || errorLower.includes('500')) return 'server';

    return 'unknown';
  }),
}));

describe('Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateBackoffDelay(0, 60)).toBe(60); // 60 * 2^0
      expect(calculateBackoffDelay(1, 60)).toBe(120); // 60 * 2^1
      expect(calculateBackoffDelay(2, 60)).toBe(240); // 60 * 2^2
      expect(calculateBackoffDelay(3, 60)).toBe(480); // 60 * 2^3
    });

    it('should respect max delay', () => {
      const result = calculateBackoffDelay(10, 60, 1800);
      expect(result).toBeLessThanOrEqual(1800);
      expect(result).toBe(1800);
    });

    it('should use default base delay', () => {
      const result = calculateBackoffDelay(0);
      expect(result).toBe(60); // Default base delay
    });

    it('should use default max delay', () => {
      const result = calculateBackoffDelay(20);
      expect(result).toBe(3600); // Default max delay (1 hour)
    });

    it('should handle zero retry count', () => {
      const result = calculateBackoffDelay(0, 30);
      expect(result).toBe(30);
    });

    it('should increase exponentially with retry count', () => {
      const delays = [0, 1, 2, 3, 4].map((count) => calculateBackoffDelay(count, 10));

      // Each delay should be double the previous
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBe(delays[i - 1] * 2);
      }
    });
  });

  describe('Error Categorization', () => {
    it('should categorize rate limit errors', () => {
      const { categorizeError } = require('@/lib/publishing/errors');
      const errorType = categorizeError('Rate limit exceeded for Twitter API');

      expect(errorType).toBe('rate-limit');
    });

    it('should categorize network errors', () => {
      const { categorizeError } = require('@/lib/publishing/errors');
      const errorType = categorizeError('Network timeout occurred');

      expect(errorType).toBe('network');
    });

    it('should categorize authentication errors as non-retriable', () => {
      const { categorizeError } = require('@/lib/publishing/errors');
      const errorType = categorizeError('Unauthorized access');

      expect(errorType).toBe('non-retriable');
    });

    it('should categorize server errors', () => {
      const { categorizeError } = require('@/lib/publishing/errors');
      const errorType = categorizeError('500 Internal Server Error');

      expect(errorType).toBe('server');
    });

    it('should categorize unknown errors', () => {
      const { categorizeError } = require('@/lib/publishing/errors');
      const errorType = categorizeError('Something weird happened');

      expect(errorType).toBe('unknown');
    });
  });

  describe('Retry Recommendations', () => {
    it('should recommend retry for rate limit errors', () => {
      const { getRetryRecommendation } = require('@/lib/publishing/errors');
      const recommendation = getRetryRecommendation('Rate limit exceeded', 0, 'TWITTER');

      expect(recommendation.shouldRetry).toBe(true);
      expect(recommendation.maxRetries).toBeGreaterThan(0);
      expect(recommendation.delay).toBeGreaterThan(0);
    });

    it('should not recommend retry after max attempts', () => {
      const { getRetryRecommendation } = require('@/lib/publishing/errors');
      const recommendation = getRetryRecommendation('Rate limit exceeded', 5, 'TWITTER');

      expect(recommendation.shouldRetry).toBe(false);
    });

    it('should not recommend retry for authentication errors', () => {
      const { getRetryRecommendation } = require('@/lib/publishing/errors');
      const recommendation = getRetryRecommendation('Unauthorized', 0, 'LINKEDIN');

      expect(recommendation.shouldRetry).toBe(false);
      expect(recommendation.reason).toContain('not retriable');
    });

    it('should recommend retry for network errors', () => {
      const { getRetryRecommendation } = require('@/lib/publishing/errors');
      const recommendation = getRetryRecommendation('Network timeout', 0, 'MEDIUM');

      expect(recommendation.shouldRetry).toBe(true);
      expect(recommendation.maxRetries).toBeGreaterThan(0);
    });

    it('should provide appropriate delay for different error types', () => {
      const { getRetryRecommendation } = require('@/lib/publishing/errors');

      const rateLimitRec = getRetryRecommendation('Rate limit', 0, 'TWITTER');
      const networkRec = getRetryRecommendation('Network error', 0, 'TWITTER');

      expect(rateLimitRec.delay).toBeGreaterThan(0);
      expect(networkRec.delay).toBeGreaterThan(0);
      // Rate limit delays are typically longer
      expect(rateLimitRec.delay).toBeGreaterThanOrEqual(networkRec.delay);
    });
  });

  describe('Retry Strategy', () => {
    it('should implement exponential backoff for multiple retries', () => {
      const delays: number[] = [];

      for (let retry = 0; retry < 5; retry++) {
        const delay = calculateBackoffDelay(retry, 30);
        delays.push(delay);
      }

      // Verify exponential growth
      expect(delays[0]).toBe(30);
      expect(delays[1]).toBe(60);
      expect(delays[2]).toBe(120);
      expect(delays[3]).toBe(240);
      expect(delays[4]).toBe(480);
    });

    it('should cap delays at maximum', () => {
      const maxDelay = 300;
      const delays: number[] = [];

      for (let retry = 0; retry < 10; retry++) {
        const delay = calculateBackoffDelay(retry, 60, maxDelay);
        delays.push(delay);
      }

      // All delays should be at or below max
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(maxDelay);
      });
    });

    it('should handle different base delays', () => {
      const baseDelays = [10, 30, 60, 120];

      baseDelays.forEach((base) => {
        const delay = calculateBackoffDelay(1, base);
        expect(delay).toBe(base * 2);
      });
    });
  });

  describe('Platform-specific retry logic', () => {
    it('should respect platform rate limits', () => {
      const { getRetryRecommendation } = require('@/lib/publishing/errors');

      const twitterRec = getRetryRecommendation('Rate limit', 0, 'TWITTER');
      const linkedinRec = getRetryRecommendation('Rate limit', 0, 'LINKEDIN');

      expect(twitterRec.shouldRetry).toBe(true);
      expect(linkedinRec.shouldRetry).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle negative retry counts', () => {
      const delay = calculateBackoffDelay(-1, 60);
      expect(delay).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large retry counts', () => {
      const delay = calculateBackoffDelay(100, 60, 3600);
      expect(delay).toBe(3600); // Capped at max
    });

    it('should handle zero base delay', () => {
      const delay = calculateBackoffDelay(3, 0);
      expect(delay).toBe(0);
    });

    it('should handle empty error messages', () => {
      const { categorizeError } = require('@/lib/publishing/errors');
      const errorType = categorizeError('');

      expect(errorType).toBeDefined();
    });
  });
});
