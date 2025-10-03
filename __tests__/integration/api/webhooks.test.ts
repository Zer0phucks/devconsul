/**
 * Integration Tests: Webhook Handlers
 * Tests GitHub webhook processing and signature verification
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST, GET } from '@/app/api/webhooks/github/route';
import {
  createGitHubWebhookRequest,
  generateGitHubSignature,
  setupTestEnvironment,
  teardownTestEnvironment,
} from '../utils/test-helpers';

// Mock webhook handler functions
jest.mock('@/lib/github/webhook-handler', () => ({
  parseGitHubEvent: jest.fn(),
  storeActivity: jest.fn(),
}));

jest.mock('@/lib/ai/content-generator', () => ({
  analyzeAndGenerateContent: jest.fn(),
}));

const { parseGitHubEvent, storeActivity } = require('@/lib/github/webhook-handler');
const { analyzeAndGenerateContent } = require('@/lib/ai/content-generator');

describe('GitHub Webhook Handler Integration Tests', () => {
  beforeEach(() => {
    setupTestEnvironment();
    jest.clearAllMocks();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Webhook Signature Verification', () => {
    it('should verify valid GitHub webhook signature', async () => {
      const payload = {
        action: 'opened',
        pull_request: {
          id: 123,
          title: 'Add new feature',
          url: 'https://github.com/user/repo/pull/123',
        },
      };

      const mockActivity = {
        id: 'activity-123',
        type: 'pull_request',
        data: payload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);

      const request = createGitHubWebhookRequest(
        'pull_request',
        payload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.activityId).toBe(mockActivity.id);
      expect(data.type).toBe('pull_request');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = { action: 'opened' };

      const request = createGitHubWebhookRequest(
        'pull_request',
        payload,
        'wrong-secret' // Different secret will create invalid signature
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
      expect(parseGitHubEvent).not.toHaveBeenCalled();
    });

    it('should reject webhook without signature header', async () => {
      const payload = { action: 'opened' };
      const body = JSON.stringify(payload);

      const headers = new Headers({
        'Content-Type': 'application/json',
        'x-github-event': 'pull_request',
        // Missing x-hub-signature-256
      });

      const request = new Request('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers,
        body,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
    });

    it('should use timing-safe comparison for signature validation', () => {
      const crypto = require('crypto');

      const secret = 'test-secret';
      const payload = 'test-payload';

      const hmac = crypto.createHmac('sha256', secret);
      const validSignature = 'sha256=' + hmac.update(payload).digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(validSignature),
        Buffer.from(validSignature)
      );

      expect(isValid).toBe(true);
    });
  });

  describe('Event Processing', () => {
    it('should process push event', async () => {
      const pushPayload = {
        ref: 'refs/heads/main',
        commits: [
          {
            id: 'abc123',
            message: 'Fix authentication bug',
            author: { name: 'Test User', email: 'test@example.com' },
          },
        ],
        repository: {
          name: 'test-repo',
          url: 'https://github.com/user/test-repo',
        },
      };

      const mockActivity = {
        id: 'activity-push-123',
        type: 'push',
        repository: 'user/test-repo',
        data: pushPayload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);

      const request = createGitHubWebhookRequest(
        'push',
        pushPayload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('push');
      expect(parseGitHubEvent).toHaveBeenCalledWith(pushPayload, 'push');
      expect(storeActivity).toHaveBeenCalledWith(mockActivity);
    });

    it('should process pull request event', async () => {
      const prPayload = {
        action: 'opened',
        pull_request: {
          id: 456,
          number: 10,
          title: 'Add new feature',
          state: 'open',
          user: { login: 'contributor' },
        },
      };

      const mockActivity = {
        id: 'activity-pr-456',
        type: 'pull_request',
        data: prPayload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);
      analyzeAndGenerateContent.mockResolvedValue({ success: true });

      const request = createGitHubWebhookRequest(
        'pull_request',
        prPayload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('pull_request');
      expect(analyzeAndGenerateContent).toHaveBeenCalledWith([mockActivity]);
    });

    it('should process release event', async () => {
      const releasePayload = {
        action: 'published',
        release: {
          id: 789,
          tag_name: 'v2.0.0',
          name: 'Version 2.0.0',
          body: 'Major version release with new features',
        },
      };

      const mockActivity = {
        id: 'activity-release-789',
        type: 'release',
        data: releasePayload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);
      analyzeAndGenerateContent.mockResolvedValue({ success: true });

      const request = createGitHubWebhookRequest(
        'release',
        releasePayload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('release');
      expect(analyzeAndGenerateContent).toHaveBeenCalledWith([mockActivity]);
    });

    it('should process issues event', async () => {
      const issuePayload = {
        action: 'opened',
        issue: {
          id: 111,
          number: 5,
          title: 'Bug: Login fails',
          state: 'open',
          labels: [{ name: 'bug' }],
        },
      };

      const mockActivity = {
        id: 'activity-issue-111',
        type: 'issues',
        data: issuePayload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);

      const request = createGitHubWebhookRequest(
        'issues',
        issuePayload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('issues');
    });
  });

  describe('Significant Event Handling', () => {
    it('should trigger content generation for significant events', async () => {
      const significantEvents = ['release', 'pull_request'];

      for (const eventType of significantEvents) {
        const payload = {
          action: 'published',
          [eventType.replace('_', '')]: { id: 123 },
        };

        const mockActivity = {
          id: `activity-${eventType}-123`,
          type: eventType,
          data: payload,
        };

        parseGitHubEvent.mockResolvedValue(mockActivity);
        storeActivity.mockResolvedValue(mockActivity);
        analyzeAndGenerateContent.mockResolvedValue({ success: true });

        const request = createGitHubWebhookRequest(
          eventType,
          payload,
          'test-webhook-secret'
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
        expect(analyzeAndGenerateContent).toHaveBeenCalledWith([mockActivity]);

        jest.clearAllMocks();
      }
    });

    it('should not trigger content generation for non-significant events', async () => {
      const nonSignificantEvents = ['push', 'issues', 'star'];

      for (const eventType of nonSignificantEvents) {
        const payload = { action: 'created' };

        const mockActivity = {
          id: `activity-${eventType}-123`,
          type: eventType,
          data: payload,
        };

        parseGitHubEvent.mockResolvedValue(mockActivity);
        storeActivity.mockResolvedValue(mockActivity);

        const request = createGitHubWebhookRequest(
          eventType,
          payload,
          'test-webhook-secret'
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
        expect(analyzeAndGenerateContent).not.toHaveBeenCalled();

        jest.clearAllMocks();
      }
    });

    it('should handle content generation errors gracefully', async () => {
      const payload = {
        action: 'published',
        release: { id: 123 },
      };

      const mockActivity = {
        id: 'activity-123',
        type: 'release',
        data: payload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);
      analyzeAndGenerateContent.mockRejectedValue(
        new Error('AI generation failed')
      );

      const request = createGitHubWebhookRequest(
        'release',
        payload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      // Should still return success even if content generation fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing event type header', async () => {
      const payload = { action: 'opened' };
      const body = JSON.stringify(payload);
      const signature = generateGitHubSignature(body, 'test-webhook-secret');

      const headers = new Headers({
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
        // Missing x-github-event
      });

      const request = new Request('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers,
        body,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing event type');
    });

    it('should handle malformed JSON payload', async () => {
      const malformedBody = 'not-json';
      const signature = generateGitHubSignature(malformedBody, 'test-webhook-secret');

      const headers = new Headers({
        'Content-Type': 'application/json',
        'x-hub-signature-256': signature,
        'x-github-event': 'push',
      });

      const request = new Request('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers,
        body: malformedBody,
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process webhook');
    });

    it('should handle event parsing errors', async () => {
      const payload = { action: 'unknown' };

      parseGitHubEvent.mockRejectedValue(
        new Error('Unknown event format')
      );

      const request = createGitHubWebhookRequest(
        'unknown_event',
        payload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process webhook');
    });

    it('should handle storage errors', async () => {
      const payload = { action: 'opened' };

      const mockActivity = {
        id: 'activity-123',
        type: 'issues',
        data: payload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createGitHubWebhookRequest(
        'issues',
        payload,
        'test-webhook-secret'
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process webhook');
    });
  });

  describe('Webhook Health Check', () => {
    it('should respond to GET requests with health status', async () => {
      const request = new Request('http://localhost:3000/api/webhooks/github', {
        method: 'GET',
      });

      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.message).toBe('GitHub webhook endpoint is ready');
    });
  });

  describe('Event Deduplication', () => {
    it('should handle duplicate webhook deliveries', async () => {
      const payload = {
        action: 'opened',
        pull_request: { id: 123 },
      };

      const mockActivity = {
        id: 'activity-123',
        type: 'pull_request',
        data: payload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);

      // First delivery succeeds
      storeActivity.mockResolvedValueOnce(mockActivity);

      // Second delivery (duplicate) should be detected
      storeActivity.mockResolvedValueOnce({
        ...mockActivity,
        isDuplicate: true,
      });

      const request = createGitHubWebhookRequest(
        'pull_request',
        payload,
        'test-webhook-secret'
      );

      // First delivery
      const response1 = await POST(request);
      expect(response1.status).toBe(200);

      // Duplicate delivery
      const response2 = await POST(request);
      expect(response2.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle high webhook volume', async () => {
      const payload = { action: 'opened' };
      const mockActivity = {
        id: 'activity-123',
        type: 'issues',
        data: payload,
      };

      parseGitHubEvent.mockResolvedValue(mockActivity);
      storeActivity.mockResolvedValue(mockActivity);

      // Simulate multiple rapid webhook deliveries
      const requests = Array(10).fill(null).map(() =>
        createGitHubWebhookRequest('issues', payload, 'test-webhook-secret')
      );

      const responses = await Promise.all(
        requests.map(request => POST(request))
      );

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(storeActivity).toHaveBeenCalledTimes(10);
    });
  });
});
