# Inngest Background Jobs Test Suite

Comprehensive test coverage for Inngest background job processing and event-driven architecture.

## 📁 Test Files Overview

### 1. **client.test.ts** (570 lines)
Event schema validation and type safety testing.

**Coverage:**
- ✅ Client configuration validation
- ✅ Event schema structure for all 11 event types
- ✅ Type-safe event handling
- ✅ Required vs optional field validation
- ✅ Event categorization (cron, scheduled, report, export)
- ✅ Schema versioning and type exports
- ✅ Data validation patterns (IDs, timestamps, enums)
- ✅ Integration patterns (event chaining, parallel triggers)

**Key Event Types Tested:**
- `cron/content.generation`
- `cron/github.sync`
- `cron/content.publish`
- `scheduled/publish.project`
- `scheduled/publish.item`
- `scheduled/publish.manual`
- `scheduled/publish.cancel`
- `scheduled/publish.reschedule`
- `report/generate`
- `export/data`
- `report/email.send`

---

### 2. **content-generation.test.ts** (737 lines)
Content generation from GitHub activity with AI integration.

**Coverage:**
- ✅ Event triggering and handling (scheduled/manual/webhook)
- ✅ Execution record creation and tracking
- ✅ Project validation and GitHub repository configuration
- ✅ GitHub activity scanning (commits, PRs, issues)
- ✅ Activity detection and summary generation
- ✅ Content generation for multiple platforms
- ✅ Platform-specific error handling
- ✅ Execution completion with metrics
- ✅ Error handling and retry logic (max 3 retries)
- ✅ Cron job statistics updates
- ✅ Concurrency control (limit: 5 projects)
- ✅ Idempotency checks (skip when no activity)
- ✅ Job configuration and next run calculation

**Mock Dependencies:**
- Prisma (database operations)
- Octokit (GitHub API)
- Metrics collector and performance tracker

---

### 3. **scheduled-publish.test.ts** (830 lines)
Scheduled content publishing with queue management.

**Coverage:**
- ✅ Cron-triggered queue processing (every minute)
- ✅ Project-specific batch publishing (max 10 per batch)
- ✅ Individual item publishing with platform integration
- ✅ Queue status management (PENDING → PROCESSING → COMPLETED/FAILED)
- ✅ Platform publishing to 9+ platforms (Twitter, LinkedIn, etc.)
- ✅ Publish delay configuration
- ✅ Success scenarios (all platforms succeed)
- ✅ Partial success handling (some platforms fail on final retry)
- ✅ Failure and retry logic (max 3 retries)
- ✅ Manual publish triggers
- ✅ Schedule cancellation with reason tracking
- ✅ Content rescheduling
- ✅ Concurrency limits (10 projects, 5 items)
- ✅ Event schema validation

**Publishing Flow:**
1. Cron → Find pending content → Trigger project jobs
2. Project job → Dequeue items → Trigger item jobs
3. Item job → Fetch schedule → Publish to platforms → Update status

---

### 4. **report-generation.test.ts** (898 lines)
Report generation and data export with file uploads.

**Coverage:**
- ✅ Report history record creation
- ✅ Report configuration validation
- ✅ PDF report generation with branding
- ✅ CSV report generation (content performance, analytics)
- ✅ File upload to Vercel Blob storage
- ✅ Temp file cleanup after upload
- ✅ Report completion with file details
- ✅ Email notification delivery (4 report types)
- ✅ Export job processing (4 export types)
- ✅ Progress tracking (0% → 10% → 60% → 100%)
- ✅ Multiple output formats (CSV, PDF, iCal, ZIP)
- ✅ Email report subscriptions (weekly, monthly, budget, failures)
- ✅ Scheduled email reports cron (every 6 hours)
- ✅ Error handling and metrics recording
- ✅ Concurrency limits (5 reports, 3 exports)

**Report Types:**
- Content Performance (PDF/CSV)
- Publishing Analytics (PDF/CSV)
- Data Exports (CSV/iCal/ZIP)
- Email Reports (weekly summary, monthly digest, budget alerts, publishing failures)

---

### 5. **monitoring-cron.test.ts** (704 lines)
System monitoring, health checks, and performance tracking.

**Coverage:**
- ✅ Dead letter queue processing (hourly cron)
- ✅ Failed job retry logic with max attempts
- ✅ Health check execution (every 5 minutes)
- ✅ System component monitoring (database, Redis, queue, storage)
- ✅ Health status aggregation (healthy/degraded/unhealthy)
- ✅ Alert triggering based on thresholds
- ✅ Performance metrics aggregation (every 30 minutes)
- ✅ Performance snapshot generation
- ✅ Regression detection (comparing to baselines)
- ✅ Bottleneck identification
- ✅ Metrics cleanup cron (daily at 2 AM)
- ✅ Old data deletion (>30 days for DLQ and alerts)
- ✅ Alert management (creation, severity, resolution)
- ✅ Performance tracking over time windows

**Cron Schedules:**
- Dead Letter Queue: `0 * * * *` (hourly)
- Health Check: `*/5 * * * *` (every 5 minutes)
- Performance Metrics: `*/30 * * * *` (every 30 minutes)
- Metrics Cleanup: `0 2 * * *` (daily at 2 AM)

---

## 🧪 Test Patterns and Best Practices

### Mocking Strategy
```typescript
// Mock Prisma for database operations
const mockPrisma = {
  model: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// Mock external APIs
const mockOctokit = {
  repos: { listCommits: jest.fn() },
};

// Mock monitoring services
const mockRecordJobExecution = jest.fn();
const mockTrackJobPerformance = jest.fn();
```

### Event Testing Pattern
```typescript
it('should validate event structure', () => {
  const event: InngestEvents['cron/content.generation'] = {
    data: {
      projectId: 'proj_123',
      userId: 'user_456',
      triggeredBy: 'scheduled',
    },
  };

  expect(event.data.projectId).toBe('proj_123');
});
```

### Job Execution Testing Pattern
```typescript
it('should process job successfully', async () => {
  // 1. Setup mocks
  mockPrisma.cronJob.findFirst.mockResolvedValue({ id: 'job_123' });

  // 2. Execute job logic
  const result = await processJob({ projectId: 'proj_123' });

  // 3. Assert results
  expect(result.success).toBe(true);
  expect(mockMetrics.record).toHaveBeenCalled();
});
```

### Error Handling Testing Pattern
```typescript
it('should handle errors and mark as failed', async () => {
  const error = new Error('Job failed');
  mockService.process.mockRejectedValue(error);

  await processJob().catch((e) => {
    expect(e.message).toBe('Job failed');
  });

  expect(mockPrisma.execution.update).toHaveBeenCalledWith({
    data: { status: 'FAILED', error: error.message },
  });
});
```

---

## 📊 Test Coverage Summary

| Test File | Lines | Test Cases | Coverage Areas |
|-----------|-------|------------|----------------|
| client.test.ts | 570 | 45+ | Event schemas, type safety, validation |
| content-generation.test.ts | 737 | 60+ | GitHub sync, AI generation, metrics |
| scheduled-publish.test.ts | 830 | 70+ | Queue management, platform publishing |
| report-generation.test.ts | 898 | 75+ | Reports, exports, email delivery |
| monitoring-cron.test.ts | 704 | 65+ | Health checks, performance, alerts |
| **Total** | **3,739** | **315+** | **Comprehensive Inngest testing** |

---

## 🚀 Running Tests

### Run all Inngest tests
```bash
npm run test:unit -- __tests__/unit/inngest
```

### Run specific test file
```bash
npm test __tests__/unit/inngest/content-generation.test.ts
```

### Run with coverage
```bash
npm run test:coverage -- __tests__/unit/inngest
```

### Watch mode
```bash
npm run test:watch -- __tests__/unit/inngest
```

---

## 🔧 Key Testing Areas

### 1. **Event-Driven Architecture**
- Type-safe event schemas
- Event triggering and handling
- Event chaining and parallel execution
- Conditional routing

### 2. **Job Execution Flow**
- Execution record creation
- Status tracking (PENDING → RUNNING → COMPLETED/FAILED)
- Duration and metrics recording
- Error handling and retry logic

### 3. **Queue Management**
- Dequeuing with batch limits
- Status transitions (PENDING → QUEUED → PROCESSING → COMPLETED)
- Priority handling
- Concurrency control

### 4. **Integration Points**
- GitHub API (Octokit)
- Vercel Blob storage
- Email services (Resend, SendGrid)
- Platform APIs (Twitter, LinkedIn, etc.)
- Prisma database operations

### 5. **Performance & Monitoring**
- Metrics collection and aggregation
- Performance regression detection
- Health check execution
- Alert management
- Dead letter queue processing

### 6. **Retry & Error Handling**
- Configurable retry limits (0-3 retries)
- NonRetriableError for permanent failures
- Dead letter queue for failed jobs
- Error logging and stack traces
- Partial success handling

### 7. **Concurrency & Throttling**
- Job-level concurrency limits
- Project/item batching
- Rate limiting considerations
- Parallel vs sequential execution

---

## 🎯 Test Quality Standards

### ✅ Comprehensive Coverage
- All job functions have dedicated test suites
- Edge cases and error scenarios covered
- Integration patterns validated
- Type safety enforced

### ✅ Isolation & Mocking
- All external dependencies mocked
- No real API calls in unit tests
- Database operations mocked with Prisma
- Deterministic test execution

### ✅ Clear Test Structure
- Descriptive test names
- Logical grouping with describe blocks
- Consistent patterns across files
- Well-documented expectations

### ✅ Real-World Scenarios
- Production-like error handling
- Actual retry logic validation
- Queue management workflows
- Multi-platform publishing flows

---

## 📝 Additional Notes

### NonRetriableError Usage
Jobs throw `NonRetriableError` for permanent failures that shouldn't be retried:
- Missing configuration (project/schedule not found)
- Invalid state transitions (already completed)
- Unsupported operations (invalid platform type)

### Metrics & Performance Tracking
All jobs record execution metrics:
```typescript
await recordJobExecution(jobId, success, duration, metadata);
await trackJobPerformance(jobId, duration, success);
```

### Idempotency
Jobs check for duplicate execution:
- Content generation skips if no GitHub activity
- Scheduled publish validates queue status
- Report generation checks for recent runs

### Event Schemas
All events are type-safe with strong TypeScript typing:
```typescript
type InngestEvents = {
  'event/name': {
    data: {
      field1: string;
      field2?: number;
    };
  };
};
```

---

## 🔗 Related Documentation

- **Job Functions**: `lib/inngest/functions/`
- **Client Configuration**: `lib/inngest/client.ts`
- **Queue Management**: `lib/scheduling/queue.ts`
- **Monitoring**: `lib/monitoring/`
- **Platform Adapters**: `lib/platforms/`

---

## 🐛 Common Issues & Solutions

### Issue: Mock not being called
**Solution**: Ensure mock is cleared between tests with `jest.clearAllMocks()` in `beforeEach`

### Issue: Type errors with event schemas
**Solution**: Import `InngestEvents` type from `@/lib/inngest/client` for type-safe event validation

### Issue: Async test timeout
**Solution**: Use `async/await` properly and ensure all promises are resolved/rejected

### Issue: Database mock not returning expected data
**Solution**: Verify mock setup matches the actual Prisma query structure

---

**Last Updated**: 2025-10-03
**Total Test Files**: 5
**Total Test Cases**: 315+
**Total Lines of Code**: 3,739
