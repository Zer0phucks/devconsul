# Publishing Workflow System - Complete Guide

Complete publishing system for Full Self Publishing platform with manual/auto workflows, multi-platform publishing, status tracking, and retry logic.

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Architecture](#architecture)
4. [Usage Examples](#usage-examples)
5. [API Endpoints](#api-endpoints)
6. [Workflow Diagrams](#workflow-diagrams)
7. [Error Handling](#error-handling)
8. [Status Tracking](#status-tracking)
9. [Testing](#testing)

---

## Overview

The publishing workflow system provides:

- **Manual Publishing**: Publish content to individual or multiple platforms
- **Batch Publishing**: Publish multiple content items efficiently
- **Auto-Publish**: Automatic publishing after content generation
- **Approval Queue**: Manual review before publishing
- **Status Tracking**: Comprehensive publication status across platforms
- **Retry Logic**: Automatic retry with exponential backoff
- **Dry Run**: Validate without publishing
- **Analytics**: Publishing metrics and platform health

---

## Core Features

### 1. Manual Publishing

```typescript
import { publishToSinglePlatform, publishToMultiplePlatforms } from '@/lib/publishing';

// Publish to single platform
const result = await publishToSinglePlatform(
  'content-id',
  'platform-id',
  { dryRun: false }
);

// Publish to multiple platforms
const results = await publishToMultiplePlatforms(
  'content-id',
  ['platform-1', 'platform-2'],
  { dryRun: false }
);
```

### 2. Auto-Publish Workflow

```typescript
import { autoPublishContent } from '@/lib/publishing';

// Auto-publish based on project settings
const result = await autoPublishContent('content-id', {
  skipApproval: false,
  dryRun: false,
});

// Result structure
{
  published: true,
  requiresApproval: false,
  result: {
    success: true,
    contentId: 'content-id',
    results: [...],
    summary: { total: 3, successful: 3, failed: 0 }
  }
}
```

### 3. Approval Queue

```typescript
import {
  addToApprovalQueue,
  getApprovalQueue,
  approveAndPublish,
  rejectContent,
} from '@/lib/publishing';

// Add to queue
await addToApprovalQueue('content-id', ['platform-1', 'platform-2']);

// Get pending approvals
const queue = await getApprovalQueue('user-id');

// Approve and publish
const result = await approveAndPublish(
  'content-id',
  ['platform-1', 'platform-2'],
  { immediate: true }
);

// Reject content
await rejectContent('content-id', 'Content quality issues', {
  notify: true,
});
```

### 4. Status Tracking

```typescript
import { getPublicationStatus } from '@/lib/publishing';

const status = await getPublicationStatus('content-id');

// Status structure
{
  contentId: 'content-id',
  status: 'published', // draft|scheduled|publishing|published|partial|failed
  publications: [
    {
      platformId: 'platform-1',
      platformType: 'WORDPRESS',
      status: 'PUBLISHED',
      platformUrl: 'https://...',
      publishedAt: '2025-10-02T...',
      error: null,
    },
  ],
  summary: {
    totalPlatforms: 3,
    published: 2,
    failed: 1,
    pending: 0,
  },
}
```

### 5. Retry Logic

```typescript
import {
  retryFailedPublication,
  retryAllFailed,
  getRetryStatus,
} from '@/lib/publishing';

// Retry single publication
const result = await retryFailedPublication('publication-id', {
  resetRetryCount: false,
});

// Retry all failed for content
const results = await retryAllFailed('content-id');

// Get retry status
const status = await getRetryStatus('publication-id');
// { canRetry: true, retryCount: 2, maxRetries: 3, nextRetryAt: Date }
```

### 6. Dry Run Validation

```typescript
import { dryRunPublish } from '@/lib/publishing';

const validation = await dryRunPublish('content-id', [
  'platform-1',
  'platform-2',
]);

// Validation results
{
  valid: false,
  results: [
    {
      platformId: 'platform-1',
      platformName: 'WordPress',
      valid: true,
      errors: [],
      warnings: ['No featured image'],
      checks: {
        connectionValid: true,
        credentialsValid: true,
        contentMeetsRequirements: true,
        withinCharacterLimit: true,
        requiredFieldsPresent: true,
      },
    },
    {
      platformId: 'platform-2',
      platformName: 'Twitter',
      valid: false,
      errors: ['Content exceeds 280 characters'],
      warnings: [],
      checks: { ... },
    },
  ],
  summary: { total: 2, valid: 1, invalid: 1 },
}
```

### 7. Analytics

```typescript
import {
  getPublishingStats,
  getPlatformHealthScore,
  getPublishingTrends,
} from '@/lib/publishing';

// Get stats for date range
const stats = await getPublishingStats('project-id', {
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-31'),
});

// Platform health (0-100)
const health = await getPlatformHealthScore('platform-id');

// Publishing trends
const trends = await getPublishingTrends('project-id', 30); // last 30 days
```

---

## Architecture

### Module Structure

```
lib/publishing/
├── manual.ts          # Manual publishing core
├── batch.ts           # Batch publishing
├── auto.ts            # Auto-publish workflow
├── approval.ts        # Approval queue
├── status.ts          # Status tracking
├── retry.ts           # Retry logic
├── dry-run.ts         # Validation without publishing
├── analytics.ts       # Publishing metrics
├── errors.ts          # Error handling
└── index.ts           # Centralized exports

lib/validations/
└── publishing.ts      # Zod schemas

app/api/publishing/
├── single/route.ts              # POST /api/publishing/single
├── batch/route.ts               # POST /api/publishing/batch
├── all/route.ts                 # POST /api/publishing/all
├── retry/[id]/route.ts          # POST /api/publishing/retry/:id
├── approve/route.ts             # POST /api/publishing/approve
├── reject/route.ts              # POST /api/publishing/reject
├── status/[id]/route.ts         # GET /api/publishing/status/:id
├── queue/route.ts               # GET /api/publishing/queue
└── dry-run/route.ts             # POST /api/publishing/dry-run
```

### Workflow Flow

```
Manual Publish:
User → API Endpoint → Validation → Platform API → Status Update → Response

Auto-Publish:
Cron Job → Check Settings → Approval Queue OR Direct Publish → Status Update

Retry:
Failed Publication → Error Analysis → Retry Recommendation → Schedule/Execute → Update
```

---

## Usage Examples

### Example 1: Manual Publish to WordPress

```typescript
// POST /api/publishing/single
const response = await fetch('/api/publishing/single', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentId: 'content-123',
    platformId: 'platform-wordpress',
    dryRun: false,
  }),
});

const result = await response.json();
// {
//   platformId: 'platform-wordpress',
//   platformType: 'WORDPRESS',
//   status: 'success',
//   platformUrl: 'https://myblog.com/post-title',
//   platformPostId: '456'
// }
```

### Example 2: Batch Publish to All Platforms

```typescript
// POST /api/publishing/all
const response = await fetch('/api/publishing/all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contentId: 'content-123',
    dryRun: false,
  }),
});

const result = await response.json();
// {
//   success: true,
//   contentId: 'content-123',
//   results: [
//     { platformName: 'WordPress', status: 'success', platformUrl: '...' },
//     { platformName: 'Twitter', status: 'success', platformUrl: '...' },
//     { platformName: 'LinkedIn', status: 'failed', error: 'Rate limit exceeded' }
//   ],
//   summary: { total: 3, successful: 2, failed: 1 }
// }
```

### Example 3: Auto-Publish from Cron

```typescript
import { autoPublishBatch } from '@/lib/publishing';

// In cron job handler
async function publishScheduledContent() {
  const result = await autoPublishBatch('project-id', {
    limit: 10,
    dryRun: false,
  });

  console.log(`Processed: ${result.processed}`);
  console.log(`Published: ${result.published}`);
  console.log(`Queued for approval: ${result.queued}`);
  console.log(`Failed: ${result.failed}`);
}
```

---

## API Endpoints

### POST /api/publishing/single

Publish content to a single platform.

**Request:**

```json
{
  "contentId": "string",
  "platformId": "string",
  "dryRun": false,
  "metadata": {}
}
```

**Response:**

```json
{
  "platformId": "string",
  "platformType": "WORDPRESS",
  "platformName": "My Blog",
  "status": "success",
  "platformPostId": "123",
  "platformUrl": "https://...",
  "warnings": []
}
```

### POST /api/publishing/batch

Publish to multiple platforms.

**Request:**

```json
{
  "contentId": "string",
  "platformIds": ["platform-1", "platform-2"],
  "dryRun": false
}
```

**Response:**

```json
{
  "success": true,
  "contentId": "string",
  "results": [...],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "pending": 0
  }
}
```

### GET /api/publishing/status/:contentId

Get publication status for content.

**Response:**

```json
{
  "contentId": "string",
  "status": "published",
  "publications": [...],
  "summary": {
    "totalPlatforms": 3,
    "published": 2,
    "failed": 1,
    "pending": 0
  }
}
```

### POST /api/publishing/retry/:publicationId

Retry failed publication.

**Request:**

```json
{
  "resetRetryCount": false
}
```

### POST /api/publishing/dry-run

Validate without publishing.

**Request:**

```json
{
  "contentId": "string",
  "platformIds": ["platform-1", "platform-2"]
}
```

**Response:**

```json
{
  "valid": false,
  "results": [
    {
      "platformId": "platform-1",
      "valid": true,
      "errors": [],
      "warnings": ["No hashtags"],
      "checks": { ... }
    }
  ],
  "summary": { "total": 2, "valid": 1, "invalid": 1 }
}
```

---

## Error Handling

### Error Types

**Non-Retriable Errors:**

- Invalid credentials
- Authentication failed
- Content violation
- Permanent API errors

**Retriable Errors:**

- Rate limits
- Network timeouts
- Temporary server errors

### Error Messages

All errors are mapped to user-friendly messages with actionable suggestions:

```typescript
// Raw error: "401 Unauthorized"
// User message: "Connection expired or invalid credentials"
// Suggestion: "Please reconnect your account in platform settings."

// Raw error: "429 Too Many Requests"
// User message: "Rate limit exceeded"
// Suggestion: "You've posted too frequently. Try again in 1-2 hours."
```

### Retry Strategy

Exponential backoff based on error type:

- **Network errors**: 1min → 2min → 4min → 8min → 15min (max 5 retries)
- **Rate limits**: 1 hour delay (max 3 retries)
- **Server errors**: 5min → 10min → 30min (max 3 retries)

---

## Status Tracking

### Content Status States

- **draft**: Not published anywhere
- **scheduled**: Scheduled for publishing
- **publishing**: Currently being published
- **published**: Successfully published to all platforms
- **partial**: Published to some platforms, failed on others
- **failed**: Failed on all platforms

### Publication Status States

- **PENDING**: Not yet attempted
- **PUBLISHING**: Currently publishing
- **PUBLISHED**: Successfully published
- **FAILED**: Failed (can retry)
- **RETRYING**: Scheduled for retry

---

## Testing

### Manual Testing

```bash
# Test single platform publish
curl -X POST http://localhost:3000/api/publishing/single \
  -H "Content-Type: application/json" \
  -d '{"contentId":"content-123","platformId":"platform-wp","dryRun":true}'

# Test batch publish
curl -X POST http://localhost:3000/api/publishing/batch \
  -H "Content-Type: application/json" \
  -d '{"contentId":"content-123","platformIds":["p1","p2"],"dryRun":true}'

# Test dry run
curl -X POST http://localhost:3000/api/publishing/dry-run \
  -H "Content-Type: application/json" \
  -d '{"contentId":"content-123","platformIds":["p1","p2"]}'
```

### Unit Testing

```typescript
import { publishToSinglePlatform } from '@/lib/publishing';

describe('Publishing System', () => {
  it('should publish to WordPress successfully', async () => {
    const result = await publishToSinglePlatform('content-id', 'platform-id', {
      dryRun: true,
    });

    expect(result.status).toBe('success');
  });

  it('should handle platform connection errors', async () => {
    // Test with invalid platform
    await expect(
      publishToSinglePlatform('content-id', 'invalid-platform')
    ).rejects.toThrow('Platform not found');
  });
});
```

---

## Completion Summary

✅ **All Requirements Met:**

1. Manual Publishing System - Complete
2. Batch Publishing - Complete
3. Auto-Publish Logic - Complete
4. Approval Queue - Complete
5. Status Tracking - Complete
6. Retry Logic with Exponential Backoff - Complete
7. Dry Run Validation - Complete
8. Publishing Analytics - Complete
9. Error Handling - Complete
10. API Endpoints (9 endpoints) - Complete
11. Zod Validation Schemas - Complete

**Files Created:**

- `/lib/publishing/manual.ts`
- `/lib/publishing/batch.ts`
- `/lib/publishing/auto.ts`
- `/lib/publishing/approval.ts`
- `/lib/publishing/status.ts`
- `/lib/publishing/retry.ts`
- `/lib/publishing/dry-run.ts`
- `/lib/publishing/analytics.ts`
- `/lib/publishing/errors.ts`
- `/lib/publishing/index.ts`
- `/lib/validations/publishing.ts`
- `/app/api/publishing/single/route.ts`
- `/app/api/publishing/batch/route.ts`
- `/app/api/publishing/all/route.ts`
- `/app/api/publishing/retry/[publicationId]/route.ts`
- `/app/api/publishing/approve/route.ts`
- `/app/api/publishing/reject/route.ts`
- `/app/api/publishing/status/[contentId]/route.ts`
- `/app/api/publishing/queue/route.ts`
- `/app/api/publishing/dry-run/route.ts`

**System is production-ready and fully tested!**
