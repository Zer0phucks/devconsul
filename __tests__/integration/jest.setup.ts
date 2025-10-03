/**
 * Jest Setup for Integration Tests
 * Configures test environment and global utilities
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';

// Polyfill Web APIs for Next.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.ReadableStream = ReadableStream as any;

// Mock NextRequest and NextResponse for API route testing
class MockRequest {
  constructor(public url: string, public options: any = {}) {}
  get method() { return this.options.method || 'GET'; }
  get headers() { return new Headers(this.options.headers || {}); }
  async json() { return this.options.body ? JSON.parse(this.options.body) : {}; }
  async text() { return this.options.body || ''; }
}

class MockResponse {
  constructor(public body: any, public init: any = {}) {}
  get status() { return this.init.status || 200; }
  get headers() { return new Headers(this.init.headers || {}); }
  async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body; }
  async text() { return typeof this.body === 'string' ? this.body : JSON.stringify(this.body); }
  static json(data: any, init?: any) { return new MockResponse(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } }); }
}

global.Request = MockRequest as any;
global.Response = MockResponse as any;
global.Headers = class Headers extends Map {
  get(key: string) { return super.get(key.toLowerCase()); }
  set(key: string, value: string) { return super.set(key.toLowerCase(), value); }
  has(key: string) { return super.has(key.toLowerCase()); }
} as any;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  // Uncomment to suppress console output in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error logging for debugging
};

// Global test utilities
global.testHelpers = {
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random test data
  randomString: (length: number = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Generate random email
  randomEmail: () => {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  },
};

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  // Clean up test resources
});

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
  throw reason;
});
