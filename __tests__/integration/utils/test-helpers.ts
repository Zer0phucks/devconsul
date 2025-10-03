/**
 * Test Helper Utilities
 * Provides common utilities for integration testing
 */

import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock Prisma Client
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  content: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  platform: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contentPublication: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  contentApproval: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  scheduledContent: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contentMetrics: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  platformMetrics: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock NextAuth session
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Create mock request with auth headers
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    userId?: string;
  } = {}
): NextRequest {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-user-id': options.userId || 'test-user-id',
    ...options.headers,
  });

  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    requestInit.body = JSON.stringify(options.body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

// Create mock unauthenticated request
export function createUnauthenticatedRequest(
  method: string,
  url: string,
  body?: any
): NextRequest {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

// Mock GitHub webhook signature
export function generateGitHubSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  return 'sha256=' + hmac.update(payload).digest('hex');
}

// Create mock GitHub webhook request
export function createGitHubWebhookRequest(
  eventType: string,
  payload: any,
  secret: string = 'test-secret'
): NextRequest {
  const body = JSON.stringify(payload);
  const signature = generateGitHubSignature(body, secret);

  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-github-event': eventType,
    'x-hub-signature-256': signature,
  });

  return new NextRequest(new URL('http://localhost:3000/api/webhooks/github'), {
    method: 'POST',
    headers,
    body,
  });
}

// Test data factories
export const testDataFactories = {
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  project: (overrides = {}) => ({
    id: 'project-123',
    name: 'Test Project',
    repository: 'https://github.com/test/repo',
    description: 'Test project description',
    status: 'ACTIVE',
    userId: 'user-123',
    websiteUrl: 'https://example.com',
    deploymentUrl: 'https://app.example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  content: (overrides = {}) => ({
    id: 'content-123',
    title: 'Test Content',
    content: 'Test content body',
    platform: 'TWITTER',
    status: 'DRAFT',
    projectId: 'project-123',
    userId: 'user-123',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  platform: (overrides = {}) => ({
    id: 'platform-123',
    type: 'TWITTER',
    userId: 'user-123',
    projectId: 'project-123',
    credentials: { apiKey: 'test-key' },
    connected: true,
    connectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  scheduledContent: (overrides = {}) => ({
    id: 'schedule-123',
    contentId: 'content-123',
    projectId: 'project-123',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
    timezone: 'UTC',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  contentApproval: (overrides = {}) => ({
    id: 'approval-123',
    contentId: 'content-123',
    status: 'PENDING',
    requestedBy: 'user-123',
    assignedTo: 'approver-456',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  contentPublication: (overrides = {}) => ({
    id: 'publication-123',
    contentId: 'content-123',
    platformId: 'platform-123',
    status: 'PUBLISHED',
    platformPostId: 'post-123456',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  contentMetrics: (overrides = {}) => ({
    id: 'metrics-123',
    contentId: 'content-123',
    impressions: 1000,
    clicks: 50,
    shares: 10,
    likes: 25,
    comments: 5,
    engagementRate: 0.09,
    recordedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  }),
};

// Assertion helpers
export const assertValidationError = (response: Response, field?: string) => {
  expect(response.status).toBe(400);
  return response.json().then((data) => {
    expect(data.error).toBeDefined();
    if (field) {
      expect(data.error).toContain(field);
    }
  });
};

export const assertUnauthorized = (response: Response) => {
  expect(response.status).toBe(401);
  return response.json().then((data) => {
    expect(data.error).toBeDefined();
  });
};

export const assertNotFound = (response: Response) => {
  expect(response.status).toBe(404);
  return response.json().then((data) => {
    expect(data.error).toBeDefined();
  });
};

export const assertSuccess = (response: Response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
};

// Rate limiting mock
export const mockRateLimiter = {
  check: jest.fn().mockResolvedValue({ success: true }),
  reset: jest.fn(),
};

// Cleanup utilities
export async function cleanupTestData(prisma: PrismaClient) {
  // Clean up in reverse dependency order
  await prisma.contentMetrics.deleteMany({});
  await prisma.platformMetrics.deleteMany({});
  await prisma.contentPublication.deleteMany({});
  await prisma.contentApproval.deleteMany({});
  await prisma.scheduledContent.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.platform.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
}

// Environment setup
export function setupTestEnvironment() {
  process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
}

export function teardownTestEnvironment() {
  delete process.env.GITHUB_WEBHOOK_SECRET;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.NEXTAUTH_SECRET;
}
