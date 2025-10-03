# Publishing Pipeline Test Suite

## Overview
Comprehensive unit test suite for the content publishing pipeline covering platform adapters, content transformation, scheduling, error recovery, and authentication.

## Test Coverage

### Platform Adapters (`__tests__/unit/platforms/`)

#### Twitter Integration (`twitter.test.ts`)
- ✅ Single tweet posting with character limit enforcement
- ✅ Thread posting with automatic splitting and indicators
- ✅ Media upload and attachment (max 4 items)
- ✅ Rate limit tracking and enforcement
- ✅ OAuth token refresh on 401 errors
- ✅ Reply and quote tweet functionality
- ✅ User information retrieval
- ✅ Tweet deletion
- ✅ Error handling (API errors, network failures)

#### LinkedIn Integration (`linkedin.test.ts`)
- ✅ Personal post creation with visibility settings
- ✅ Organization page posting
- ✅ Character limit enforcement (3000 chars)
- ✅ Media handling (max 9 images)
- ✅ Image upload with binary transfer
- ✅ Article publishing with metadata
- ✅ Article link sharing
- ✅ User profile retrieval
- ✅ Post deletion
- ✅ Error handling

#### Character Limits (`limits.test.ts`)
- ✅ Platform-specific limit enforcement
  - Twitter: 280 chars
  - LinkedIn: 3000 chars
  - LinkedIn Article: 110000 chars
  - Facebook: 63206 chars
  - Reddit: 40000 chars
  - Reddit Title: 300 chars
- ✅ Smart truncation with word boundary preservation
- ✅ Thread splitting with paragraph preservation
- ✅ Sentence-based splitting for long paragraphs
- ✅ Custom truncation suffixes
- ✅ Validation without modification
- ✅ Remaining character calculation
- ✅ Limit percentage calculation

#### Mock API Responses (`mock-responses.test.ts`)
- ✅ Response validation for all platforms
- ✅ Rate limit response handling
- ✅ Media upload responses
- ✅ OAuth token responses
- ✅ Error response parsing
- ✅ Content transformation validation
- ✅ Metadata extraction (IDs, URLs, timestamps)

### Publishing Operations (`__tests__/unit/publishing/`)

#### Retry Logic (`retry.test.ts`)
- ✅ Exponential backoff calculation
- ✅ Error categorization (rate-limit, network, non-retriable)
- ✅ Retry recommendations by error type
- ✅ Max retry enforcement
- ✅ Jitter implementation
- ✅ Platform-specific retry strategies
- ✅ Backoff delay capping
- ✅ Edge case handling (negative counts, zero delays)

#### Batch Publishing (`batch.test.ts`)
- ✅ Progress calculation for batches
- ✅ Concurrent publishing with limits
- ✅ Uneven batch size handling
- ✅ Single item processing
- ✅ Platform result aggregation
- ✅ Overall success determination
- ✅ Error handling with continued processing
- ✅ Partial success tracking
- ✅ Queue management with concurrency
- ✅ In-order processing within batches
- ✅ Incremental progress updates

#### Error Recovery (`error-recovery.test.ts`)
- ✅ Retriable vs non-retriable error classification
- ✅ HTTP status code categorization
- ✅ Exponential backoff with jitter
- ✅ Retry attempt limiting
- ✅ Circuit breaker pattern
  - Failure rate tracking
  - Circuit opening at threshold
  - Half-open state after timeout
- ✅ Dead Letter Queue (DLQ)
  - Failed item tracking
  - Failure reason storage
  - Reprocessing capability
- ✅ Partial failure handling
  - Platform-specific retries
  - Success aggregation
- ✅ Recovery strategies
  - Fallback content
  - Alternative platforms
  - Scheduled retries
- ✅ Error notifications
  - Severity categorization
  - User-friendly messages
  - Recovery suggestions
- ✅ Transaction rollback
- ✅ Idempotency key generation

#### Scheduling (`scheduling.test.ts`)
- ✅ Timezone conversion (UTC ↔ local)
- ✅ Daylight Saving Time handling
- ✅ IANA timezone validation
- ✅ Future date validation
- ✅ Minimum delay enforcement (5 minutes)
- ✅ Maximum schedule window (1 year)
- ✅ Recurring schedules
  - Daily, weekly, monthly intervals
  - End date handling
  - Max occurrence limits
- ✅ Conflict detection
  - Same platform/time conflicts
  - Cross-platform allowance
  - Minimum gap enforcement
- ✅ Queue management
  - Time-based ordering
  - Next item retrieval
  - Overdue identification
- ✅ Schedule modification
  - Time updates
  - Cancellation
  - Failed retry rescheduling
- ✅ Execution window validation
- ✅ Priority-based ordering
- ✅ Bulk scheduling
  - Even distribution
  - Rate limit compliance

### Authentication (`__tests__/unit/platforms/`)

#### OAuth and API Keys (`oauth.test.ts`)
- ✅ OAuth authorization URL generation
- ✅ State parameter CSRF protection
- ✅ Authorization code exchange
- ✅ Token expiration calculation
- ✅ Expired token detection
- ✅ Proactive token refresh
- ✅ Refresh token flow
- ✅ Token storage updates
- ✅ Token encryption/decryption
- ✅ Round-trip encryption validation
- ✅ API key format validation
- ✅ Multiple auth header formats (Bearer, Basic, Custom)
- ✅ Platform-specific OAuth
  - Twitter OAuth 2.0 with PKCE
  - LinkedIn OAuth 2.0
  - Medium OAuth
  - Ghost Admin API Key
  - WordPress OAuth
- ✅ Error handling
  - OAuth error responses
  - Token refresh failures
  - API key auth failures
- ✅ Security measures
  - Token redaction in logs
  - Redirect URI validation
  - Open redirect prevention
  - PKCE implementation
- ✅ Token storage security
- ✅ Scope management
  - Required scope validation
  - Missing scope detection

## Test Execution

### Run All Tests
```bash
npm run test
```

### Run Specific Test Suites
```bash
# Platform tests
npm test __tests__/unit/platforms/

# Publishing tests
npm test __tests__/unit/publishing/

# Specific platform
npm test __tests__/unit/platforms/twitter.test.ts
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Patterns

### Mocking Strategy
- **Axios**: Mocked for all HTTP requests
- **Encryption**: Mocked for token security tests
- **Date Functions**: Use `date-fns` and `date-fns-tz` for deterministic testing

### Test Structure
```typescript
describe('Feature Area', () => {
  describe('Specific Functionality', () => {
    it('should perform expected behavior', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toMatchExpectedOutput();
    });
  });
});
```

### Assertions
- Use `.toBe()` for primitive equality
- Use `.toEqual()` for object/array deep equality
- Use `.toContain()` for substring/array inclusion
- Use `.toThrow()` for error testing
- Use `.toBeGreaterThan()` / `.toBeLessThan()` for numeric comparisons

## Key Test Scenarios

### Platform Publishing Flow
1. Content validation → Character limit check
2. Authentication → Token validation/refresh
3. Content transformation → Platform-specific formatting
4. API request → With retry logic
5. Response handling → Success/error processing
6. Metadata extraction → Platform ID, URL, timestamp

### Error Recovery Flow
1. Error detection → Categorization (retriable/non-retriable)
2. Retry decision → Based on error type and attempt count
3. Backoff calculation → Exponential with jitter
4. Retry execution → With updated state
5. DLQ movement → After max retries exceeded

### Scheduling Flow
1. Date validation → Future date, minimum delay
2. Timezone conversion → User timezone → UTC
3. Conflict detection → Platform/time overlap check
4. Queue insertion → Time-ordered placement
5. Execution window → Check if ready to publish
6. Status update → SCHEDULED → PUBLISHING → PUBLISHED

## Coverage Goals
- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

## Integration Points

### Database (Prisma)
Tests use mocked Prisma client to avoid database dependencies.

### External APIs
All external API calls are mocked to ensure:
- Test isolation
- Deterministic results
- Fast execution
- No rate limiting

### Environment Variables
Tests should not rely on actual environment variables. Use test-specific configs.

## Future Test Areas

### Not Yet Covered
- [ ] Dev.to platform integration
- [ ] Hashnode platform integration
- [ ] WordPress full integration tests
- [ ] Ghost full integration tests
- [ ] Content safety checks
- [ ] SEO metadata optimization
- [ ] Image processing and optimization
- [ ] Webhook delivery
- [ ] Analytics tracking
- [ ] Report generation

### Recommended Additions
- Integration tests with test database
- E2E tests with Playwright for UI flows
- Performance tests for batch operations
- Load tests for scheduling system
- Security penetration tests

## Maintenance

### Adding New Platform Tests
1. Create `__tests__/unit/platforms/{platform}.test.ts`
2. Mock HTTP client (axios)
3. Test authentication flow
4. Test content posting
5. Test media upload
6. Test error handling
7. Test rate limiting
8. Add platform to limits test if character limits apply

### Updating Tests
- Keep tests in sync with implementation changes
- Update mocks when API responses change
- Maintain backward compatibility where possible
- Document breaking changes in test comments

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

### Quality Gates
- All tests must pass before merge
- Coverage must not decrease
- No new linting errors

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Ensure mocks are properly configured

**Mock not working:**
- Verify mock is defined before imports
- Check mock factory function
- Clear mocks between tests with `jest.clearAllMocks()`

**Date/timezone tests failing:**
- Use deterministic dates, not `new Date()`
- Mock date functions if needed
- Be aware of system timezone in CI

**Coverage not updating:**
- Clear Jest cache: `npm test -- --clearCache`
- Check `collectCoverageFrom` in jest.config.js
- Ensure files are in coverage paths
