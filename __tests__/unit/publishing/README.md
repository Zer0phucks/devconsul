# Publishing Pipeline Tests - Quick Reference

## Test Files Created

### Platform Adapters (`/platforms/`)
- `twitter.test.ts` - Twitter API integration tests
- `linkedin.test.ts` - LinkedIn API integration tests
- `limits.test.ts` - Character limit enforcement
- `oauth.test.ts` - OAuth & API key authentication
- `mock-responses.test.ts` - Platform API response handling

### Publishing Operations (`/publishing/`)
- `batch.test.ts` - Batch publishing operations
- `retry.test.ts` - Retry logic & exponential backoff
- `error-recovery.test.ts` - Error handling & recovery
- `scheduling.test.ts` - Scheduling & timezone support

## Quick Commands

```bash
# Run all unit tests
npm run test:unit

# Run platform tests only
npm test __tests__/unit/platforms/

# Run publishing tests only
npm test __tests__/unit/publishing/

# Run specific test file
npm test twitter.test.ts

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Coverage Summary

### Platform Integration
- ✅ Twitter: posting, threads, media, rate limits, OAuth
- ✅ LinkedIn: posts, articles, media, organizations
- ✅ Character limits: all platforms with smart truncation
- ✅ OAuth flows: Twitter, LinkedIn, Medium, WordPress, Ghost
- ✅ API responses: validation, error handling, metadata extraction

### Publishing Features
- ✅ Batch operations: concurrency, progress tracking, aggregation
- ✅ Retry logic: exponential backoff, categorization, max attempts
- ✅ Error recovery: circuit breaker, DLQ, partial failures
- ✅ Scheduling: timezones, recurring, conflicts, queue management

## Test Patterns

### Basic Test Structure
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform expected behavior', () => {
    // Arrange
    const input = setupData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expected);
  });
});
```

### Mocking HTTP Requests
```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

mockAxiosInstance.post.mockResolvedValue({
  data: { id: '123', success: true }
});
```

### Testing Async Functions
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Errors
```typescript
it('should throw on invalid input', () => {
  expect(() => {
    functionThatThrows();
  }).toThrow('Expected error message');
});

it('should reject promise', async () => {
  await expect(asyncFunctionThatFails()).rejects.toThrow();
});
```

## Common Test Scenarios

### Platform Publishing
```typescript
// 1. Setup mock client
const client = new TwitterClient({ accessToken: 'test_token' });

// 2. Mock API response
mockAxios.post.mockResolvedValue({ data: { id: '123' } });

// 3. Test posting
const result = await client.postTweet('Test content');

// 4. Verify
expect(result.id).toBe('123');
expect(mockAxios.post).toHaveBeenCalledWith('/tweets', expect.any(Object));
```

### Error Handling
```typescript
// 1. Mock error response
mockAxios.post.mockRejectedValue({
  response: { status: 429, data: { error: 'Rate limit' } }
});

// 2. Test error handling
await expect(client.postTweet('Test')).rejects.toThrow(/Rate limit/);

// 3. Verify retry logic
const shouldRetry = categorizeError('Rate limit exceeded');
expect(shouldRetry).toBe('rate-limit');
```

### Scheduling
```typescript
// 1. Create schedule
const scheduled = {
  contentId: 'c1',
  scheduledFor: addHours(new Date(), 2),
  timezone: 'America/New_York'
};

// 2. Validate timing
expect(isAfter(scheduled.scheduledFor, new Date())).toBe(true);

// 3. Test timezone conversion
const utcDate = fromZonedTime(scheduled.scheduledFor, scheduled.timezone);
expect(utcDate.toISOString()).toBeTruthy();
```

## Debugging Tests

### Enable Detailed Logging
```bash
# Run with verbose output
npm test -- --verbose

# Run single test with logs
npm test -- twitter.test.ts --verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Common Issues

**Mock not working:**
```typescript
// Ensure mock is BEFORE imports
jest.mock('axios');
import axios from 'axios';

// Clear mocks between tests
afterEach(() => jest.clearAllMocks());
```

**Async test timeout:**
```typescript
// Increase timeout
jest.setTimeout(10000);

// Or per test
it('slow test', async () => {
  // test code
}, 10000);
```

**Date/timezone failures:**
```typescript
// Use deterministic dates
const fixedDate = new Date('2025-10-03T00:00:00Z');

// Or mock Date
jest.useFakeTimers();
jest.setSystemTime(fixedDate);
```

## Adding New Tests

### 1. Create Test File
```bash
# Platform test
touch __tests__/unit/platforms/new-platform.test.ts

# Publishing test
touch __tests__/unit/publishing/new-feature.test.ts
```

### 2. Import Test Framework
```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
```

### 3. Follow Existing Patterns
- Look at similar tests for structure
- Use consistent naming conventions
- Include setup/teardown in beforeEach/afterEach
- Group related tests in describe blocks

### 4. Run and Verify
```bash
npm test new-platform.test.ts
```

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 70%+ | Run `npm run test:coverage` |
| Functions | 70%+ | Check coverage report |
| Branches | 70%+ | Focus on error paths |
| Statements | 70%+ | Core logic coverage |

## CI/CD Integration

Tests run automatically on:
- Every push to feature branches
- Pull request creation/updates
- Before deployment to staging/production

Pipeline will fail if:
- Any test fails
- Coverage drops below threshold
- Linting errors exist

## Next Steps

### Immediate
- [ ] Run tests: `npm run test:unit`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Fix any failures

### Future Enhancements
- [ ] Add Dev.to platform tests
- [ ] Add Hashnode platform tests
- [ ] Add content safety check tests
- [ ] Add SEO optimization tests
- [ ] Add integration tests with test DB
- [ ] Add E2E tests with Playwright

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Test Summary](./TEST_SUMMARY.md) - Detailed coverage documentation
- [Project CLAUDE.md](../../../CLAUDE.md) - Project-specific test requirements
