# API Integration Tests

Comprehensive integration test suite for the DevConsul API endpoints.

## Test Coverage

### Core API Endpoints

1. **Authentication API** (`api/auth.test.ts`)
   - User signup with validation
   - Email format validation
   - Password strength requirements
   - Duplicate user handling
   - Security measures (XSS, SQL injection prevention)

2. **Projects API** (`api/projects.test.ts`)
   - Project CRUD operations (Create, Read, Update, Delete)
   - Authorization checks
   - Data validation with Zod schemas
   - Cross-user access prevention
   - Database error handling

3. **Content Generation API** (`api/content-generation.test.ts`)
   - AI content generation for multiple platforms
   - Provider selection (OpenAI, Anthropic)
   - Custom prompts and brand voice
   - Content validation
   - Token usage tracking
   - Error handling and timeouts

4. **Platform Connections API** (`api/platforms.test.ts`)
   - OAuth flow (Twitter, LinkedIn)
   - API key validation (Hashnode, WordPress)
   - Credential encryption
   - Platform disconnection
   - Multi-platform support
   - Health monitoring

5. **Publishing API** (`api/publishing.test.ts`)
   - Single platform publishing
   - Batch publishing
   - Retry mechanism with exponential backoff
   - Dry-run mode
   - Publishing metrics
   - Platform-specific validation

6. **Analytics & Metrics API** (`api/analytics.test.ts`)
   - Content metrics aggregation
   - Platform-specific analytics
   - Cost tracking (AI usage)
   - Time series data
   - Export functionality (CSV, JSON, PDF)
   - Real-time metrics

7. **Webhook Handlers** (`api/webhooks.test.ts`)
   - GitHub webhook signature verification
   - Event processing (push, PR, release, issues)
   - Significant event handling
   - Content generation triggers
   - Error handling
   - Deduplication

8. **Approval Workflow API** (`api/approval-workflow.test.ts`)
   - Approval submission
   - Approve/reject operations
   - Status tracking
   - Reassignment
   - Bulk operations
   - Notifications

9. **Security & Rate Limiting** (`api/security.test.ts`)
   - Rate limiting (per user, per endpoint)
   - Input validation and sanitization
   - SQL injection detection
   - XSS prevention
   - CSRF protection
   - Session security
   - API key management
   - Audit logging

## Test Utilities

### Helper Functions (`utils/test-helpers.ts`)

- **Mock Prisma Client**: Database mocking for all models
- **Request Builders**: Create authenticated/unauthenticated requests
- **Test Data Factories**: Generate consistent test data
- **Assertion Helpers**: Common validation assertions
- **Environment Setup**: Test environment configuration

### Test Data Factories

```typescript
testDataFactories.user()
testDataFactories.project()
testDataFactories.content()
testDataFactories.platform()
testDataFactories.scheduledContent()
testDataFactories.contentApproval()
testDataFactories.contentPublication()
testDataFactories.contentMetrics()
```

## Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Test File
```bash
npm run test __tests__/integration/api/auth.test.ts
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Patterns

### Mocking Strategy

1. **Database Operations**: Mock Prisma client for all database interactions
2. **External Services**: Mock AI providers (OpenAI, Anthropic), platform adapters
3. **Authentication**: Mock NextAuth sessions and user context
4. **Rate Limiting**: Mock rate limiter for consistent test execution

### Request Testing

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

// GitHub webhook request
const request = createGitHubWebhookRequest('push', payload, 'webhook-secret');
```

### Assertion Patterns

```typescript
// Success assertion
expect(response.status).toBe(200);
expect(data.success).toBe(true);

// Validation error
expect(response.status).toBe(400);
expect(data.error).toContain('validation');

// Authentication error
expect(response.status).toBe(401);
expect(data.error).toBeDefined();

// Not found
expect(response.status).toBe(404);
```

## Best Practices

### Test Structure

1. **Arrange**: Set up test data and mocks
2. **Act**: Execute the API call
3. **Assert**: Validate response and side effects

### Mock Management

- Clear all mocks in `beforeEach`
- Use specific mock implementations per test
- Verify mock calls with correct arguments

### Error Testing

- Test both success and failure paths
- Cover edge cases and boundary conditions
- Validate error messages and status codes

### Security Testing

- Test authentication/authorization
- Validate input sanitization
- Check rate limiting behavior
- Verify CSRF protection

## Coverage Goals

- **Statements**: 70%+
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+

## Common Issues

### Mock Not Working

```typescript
// Ensure mock is defined before import
jest.mock('@/lib/service', () => ({
  serviceFunction: jest.fn(),
}));

const { serviceFunction } = require('@/lib/service');
```

### Async Test Failures

```typescript
// Always await async operations
const response = await handler(request);
const data = await response.json();
```

### Type Errors

```typescript
// Cast types when necessary
const request = new NextRequest(...) as NextRequest;
```

## Maintenance

### Adding New Tests

1. Create test file in appropriate directory
2. Import test helpers and utilities
3. Follow existing patterns and structure
4. Update this README with coverage information

### Updating Mocks

1. Keep mocks in sync with actual implementations
2. Update test data factories for new models
3. Adjust mock responses for API changes

### Debugging Tests

```bash
# Run single test with verbose output
npm run test -- --verbose __tests__/integration/api/auth.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest __tests__/integration/api/auth.test.ts
```

## CI/CD Integration

Tests are automatically run on:
- Pull request creation
- Push to main branch
- Pre-deployment validation

### GitHub Actions Workflow

```yaml
- name: Run Integration Tests
  run: npm run test:integration
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    GITHUB_WEBHOOK_SECRET: ${{ secrets.TEST_WEBHOOK_SECRET }}
```

## Contributing

1. Write tests for all new API endpoints
2. Maintain existing test coverage
3. Follow naming conventions
4. Document complex test scenarios
5. Keep test data realistic and consistent
