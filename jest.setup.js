import '@testing-library/jest-dom'
import '@anthropic-ai/sdk/shims/node'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

// Polyfill Web APIs for Next.js before any imports
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream

// Mock Request and Response
class MockRequest {
  constructor(url, options = {}) {
    this.url = url
    this.options = options
  }
  get method() { return this.options.method || 'GET' }
  get headers() { return new Map(Object.entries(this.options.headers || {})) }
  async json() { return this.options.body ? JSON.parse(this.options.body) : {} }
  async text() { return this.options.body || '' }
}

class MockResponse {
  constructor(body, init = {}) {
    this.body = body
    this.init = init
  }
  get status() { return this.init.status || 200 }
  get headers() { return new Map(Object.entries(this.init.headers || {})) }
  async json() { return typeof this.body === 'string' ? JSON.parse(this.body) : this.body }
  async text() { return typeof this.body === 'string' ? this.body : JSON.stringify(this.body) }
  static json(data, init) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
    })
  }
}

global.Request = MockRequest
global.Response = MockResponse
global.Headers = Map

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.GITHUB_ID = 'test-github-id'
process.env.GITHUB_SECRET = 'test-github-secret'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock fetch globally
global.fetch = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    content: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}))
