# Integration Tests - Quick Start Guide

## 🚀 Running Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test File
```bash
npm test __tests__/integration/api/auth.test.ts
npm test __tests__/integration/api/projects.test.ts
npm test __tests__/integration/api/publishing.test.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Validate Test Structure
```bash
npm run validate:tests
```

## 📁 Test File Locations

```
__tests__/integration/
├── api/
│   ├── auth.test.ts              # Authentication endpoints
│   ├── projects.test.ts          # Project CRUD operations
│   ├── content-generation.test.ts # AI content generation
│   ├── platforms.test.ts         # Platform connections
│   ├── publishing.test.ts        # Publishing workflows
│   ├── analytics.test.ts         # Analytics & metrics
│   ├── webhooks.test.ts          # GitHub webhooks
│   ├── approval-workflow.test.ts # Approval workflows
│   └── security.test.ts          # Security & rate limiting
├── utils/
│   └── test-helpers.ts           # Shared utilities
└── jest.setup.ts                 # Test configuration
```

## 🧪 Test Examples

### Basic Test Structure
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockRequest, testDataFactories } from '../utils/test-helpers';

describe('Feature Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle success case', async () => {
    const mockData = testDataFactories.user();
    // Test implementation
  });
});
```

### Making Mock Requests
```typescript
// Authenticated request
const request = createMockRequest('POST', '/api/endpoint', {
  body: { data: 'value' },
  userId: 'user-123'
});

// Unauthenticated request
const request = createUnauthenticatedRequest('POST', '/api/auth/signup', {
  email: 'test@example.com',
  password: 'SecurePass123!'
});
```

### Using Test Data Factories
```typescript
const user = testDataFactories.user({ email: 'custom@email.com' });
const project = testDataFactories.project({ name: 'My Project' });
const content = testDataFactories.content({ platform: 'TWITTER' });
```

### Mocking Database Operations
```typescript
import { mockPrisma } from '../utils/test-helpers';

mockPrisma.user.findUnique.mockResolvedValue(mockUser);
mockPrisma.project.create.mockResolvedValue(mockProject);
mockPrisma.content.update.mockResolvedValue(mockContent);
```

## ✅ Common Test Patterns

### Testing Success Response
```typescript
const response = await handler(request);
const data = await response.json();

expect(response.status).toBe(200);
expect(data.success).toBe(true);
expect(data.result).toBeDefined();
```

### Testing Validation Error
```typescript
const response = await handler(invalidRequest);
const data = await response.json();

expect(response.status).toBe(400);
expect(data.error).toContain('validation');
```

### Testing Authorization
```typescript
const response = await handler(unauthorizedRequest);
const data = await response.json();

expect(response.status).toBe(401);
expect(data.error).toBeDefined();
```

### Testing Not Found
```typescript
mockPrisma.entity.findFirst.mockResolvedValue(null);

const response = await handler(request);
expect(response.status).toBe(404);
```

## 🔍 Debugging Tests

### Run Single Test with Verbose Output
```bash
npm test -- --verbose __tests__/integration/api/auth.test.ts
```

### Run Specific Test Case
```bash
npm test -- -t "should create user with valid data"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest __tests__/integration/api/auth.test.ts
```

### View Detailed Error Output
```bash
npm test -- --no-coverage
```

## 📊 Understanding Coverage Reports

After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

Coverage metrics:
- **Statements**: % of code statements executed
- **Branches**: % of conditional branches tested
- **Functions**: % of functions called
- **Lines**: % of code lines executed

Target: **70%+** for all metrics

## 🛠️ Common Issues & Solutions

### Issue: Mock not working
```typescript
// ❌ Wrong: Mock after import
const { service } = require('@/lib/service');
jest.mock('@/lib/service');

// ✅ Correct: Mock before import
jest.mock('@/lib/service', () => ({
  service: jest.fn(),
}));
const { service } = require('@/lib/service');
```

### Issue: Async test failures
```typescript
// ❌ Wrong: Not awaiting
const response = handler(request);
const data = response.json();

// ✅ Correct: Await async operations
const response = await handler(request);
const data = await response.json();
```

### Issue: Test timeout
```typescript
// Increase timeout for slow tests
it('slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Issue: Type errors
```typescript
// Cast types when necessary
const request = new NextRequest(...) as NextRequest;
const params = Promise.resolve({ id: '123' });
```

## 📝 Writing New Tests

### Step 1: Create test file
```bash
touch __tests__/integration/api/my-feature.test.ts
```

### Step 2: Set up test structure
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockRequest } from '../utils/test-helpers';

describe('My Feature Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work correctly', async () => {
    // Test implementation
  });
});
```

### Step 3: Add mocks
```typescript
jest.mock('@/lib/my-service', () => ({
  myFunction: jest.fn(),
}));
```

### Step 4: Run tests
```bash
npm test __tests__/integration/api/my-feature.test.ts
```

## 🔐 Environment Variables

Required for tests (automatically set in jest.setup.ts):
```bash
NODE_ENV=test
GITHUB_WEBHOOK_SECRET=test-webhook-secret
OPENAI_API_KEY=test-openai-key
ANTHROPIC_API_KEY=test-anthropic-key
NEXTAUTH_SECRET=test-nextauth-secret
DATABASE_URL=postgresql://test:test@localhost:5432/test
```

## 📚 Available Test Utilities

### Request Builders
- `createMockRequest(method, url, options)`
- `createUnauthenticatedRequest(method, url, body)`
- `createGitHubWebhookRequest(eventType, payload, secret)`

### Test Data Factories
- `testDataFactories.user(overrides)`
- `testDataFactories.project(overrides)`
- `testDataFactories.content(overrides)`
- `testDataFactories.platform(overrides)`
- `testDataFactories.scheduledContent(overrides)`
- `testDataFactories.contentApproval(overrides)`
- `testDataFactories.contentPublication(overrides)`
- `testDataFactories.contentMetrics(overrides)`

### Assertion Helpers
- `assertValidationError(response, field?)`
- `assertUnauthorized(response)`
- `assertNotFound(response)`
- `assertSuccess(response, expectedStatus?)`

### Mocks
- `mockPrisma` - Full Prisma client mock
- `mockSession` - NextAuth session mock
- `mockRateLimiter` - Rate limiter mock

## 📖 Documentation

- **Full Documentation**: `__tests__/integration/README.md`
- **Test Summary**: `__tests__/integration/TEST_SUMMARY.md`
- **Implementation Report**: `__tests__/integration/IMPLEMENTATION_REPORT.md`

## 🎯 Test Coverage by API

| API Endpoint | Test File | Test Count |
|--------------|-----------|------------|
| `/api/auth/*` | `auth.test.ts` | 10 |
| `/api/projects/*` | `projects.test.ts` | 15 |
| `/api/ai/generate` | `content-generation.test.ts` | 16 |
| `/api/platforms/*` | `platforms.test.ts` | 18 |
| `/api/publishing/*` | `publishing.test.ts` | 20 |
| `/api/analytics/*` | `analytics.test.ts` | 22 |
| `/api/webhooks/github` | `webhooks.test.ts` | 18 |
| `/api/approval/*` | `approval-workflow.test.ts` | 20 |
| Security & Rate Limiting | `security.test.ts` | 32 |
| **TOTAL** | **9 files** | **171** |

## 🚨 Getting Help

1. Check test file for examples
2. Review `test-helpers.ts` for utilities
3. Read full documentation in `README.md`
4. Check `TEST_SUMMARY.md` for detailed breakdown
5. Review implementation patterns in existing tests

## ✨ Best Practices

- ✅ Always clear mocks in `beforeEach`
- ✅ Use test data factories for consistency
- ✅ Test both success and failure paths
- ✅ Validate security and authorization
- ✅ Keep tests isolated and independent
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Assert on both response and side effects

---

**Quick Commands Reference:**

```bash
npm run test:integration          # Run all tests
npm run test:watch               # Watch mode
npm run test:coverage            # Coverage report
npm test <file>                  # Run specific file
npm test -- -t "test name"       # Run specific test
npm test -- --verbose            # Verbose output
```
