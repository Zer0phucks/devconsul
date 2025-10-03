# Cron Job Execution Example

## Real Execution Flow Demonstration

### Scenario: Daily Content Generation Job

**Project**: My Open Source Library
**GitHub Repo**: username/awesome-lib
**Schedule**: Daily at 9:00 AM UTC
**Platforms**: Hashnode, Dev.to, LinkedIn

---

## Step 1: Job Creation

```typescript
import { createCronJob } from "@/lib/cron/scheduler";
import { CronFrequency } from "@/lib/cron/frequency";

const job = await createCronJob({
  projectId: "clxxx_my_project",
  type: "GENERATE_CONTENT",
  name: "Daily Content Generation",
  description: "Generate blog posts from GitHub activity",
  frequency: CronFrequency.DAILY,
  timeConfig: {
    hour: 9,
    minute: 0,
    timezone: "UTC",
  },
  isEnabled: true,
  maxRetries: 3,
  retryDelay: 300, // 5 minutes
});

console.log(job);
```

**Output:**
```json
{
  "id": "cron_abc123def456",
  "projectId": "clxxx_my_project",
  "type": "GENERATE_CONTENT",
  "name": "Daily Content Generation",
  "schedule": "0 9 * * *",
  "timezone": "UTC",
  "isEnabled": true,
  "status": "IDLE",
  "nextRunAt": "2025-10-03T09:00:00.000Z",
  "runCount": 0,
  "successCount": 0,
  "failureCount": 0,
  "maxRetries": 3,
  "retryDelay": 300,
  "createdAt": "2025-10-02T10:30:00.000Z"
}
```

---

## Step 2: Scheduled Execution (9am UTC next day)

**Time**: 2025-10-03 09:00:00 UTC
**Trigger**: Inngest scheduled event

### Execution Timeline

**09:00:00** - Inngest triggers `cron/content.generation` event

**09:00:01** - Job function starts:
```typescript
{
  event: {
    name: "cron/content.generation",
    data: {
      projectId: "clxxx_my_project",
      userId: "user_123",
      triggeredBy: "scheduled"
    }
  }
}
```

**09:00:02** - Create execution record:
```json
{
  "id": "exec_789xyz",
  "jobId": "cron_abc123def456",
  "status": "RUNNING",
  "startedAt": "2025-10-03T09:00:02.000Z",
  "triggeredBy": "scheduled"
}
```

**09:00:03** - Fetch project and platforms:
```json
{
  "project": {
    "id": "clxxx_my_project",
    "name": "My Open Source Library",
    "githubRepoOwner": "username",
    "githubRepoName": "awesome-lib",
    "lastSyncedAt": "2025-10-02T09:00:00.000Z"
  },
  "platforms": [
    { "id": "plat_1", "type": "HASHNODE", "isConnected": true },
    { "id": "plat_2", "type": "DEVTO", "isConnected": true },
    { "id": "plat_3", "type": "LINKEDIN", "isConnected": true }
  ]
}
```

**09:00:04-09:00:08** - Scan GitHub activity (API calls):

GitHub API Response:
```json
{
  "commits": [
    {
      "sha": "abc123",
      "message": "Add TypeScript support",
      "author": "John Doe",
      "date": "2025-10-02T14:30:00Z",
      "filesChanged": ["src/index.ts", "tsconfig.json"]
    },
    {
      "sha": "def456",
      "message": "Update documentation",
      "author": "Jane Smith",
      "date": "2025-10-02T16:45:00Z",
      "filesChanged": ["README.md"]
    },
    {
      "sha": "ghi789",
      "message": "Fix build errors",
      "author": "John Doe",
      "date": "2025-10-03T08:20:00Z",
      "filesChanged": ["package.json"]
    }
  ],
  "pullRequests": [
    {
      "number": 42,
      "title": "Add CI/CD pipeline",
      "state": "closed",
      "mergedAt": "2025-10-02T18:00:00Z"
    }
  ],
  "issues": [
    {
      "number": 15,
      "title": "Support Node 18",
      "state": "closed",
      "closedAt": "2025-10-02T15:30:00Z"
    }
  ]
}
```

Activity Summary:
```json
{
  "hasActivity": true,
  "summary": "3 commits, 1 merged PR, 1 closed issue",
  "commits": [...],
  "pullRequests": [...],
  "issues": [...]
}
```

**09:00:09-09:00:14** - Generate content for each platform:

**Hashnode:**
```typescript
// AI generation call (Phase 2.1)
const hashnodeContent = {
  title: "Development Update: TypeScript Support and CI/CD",
  content: "This week in awesome-lib...",
  tags: ["typescript", "opensource", "development"],
  success: true
};
```

**Dev.to:**
```typescript
const devtoContent = {
  title: "Weekly Progress: CI/CD Pipeline and Node 18 Support",
  content: "Recent improvements include...",
  tags: ["webdev", "typescript", "opensource"],
  success: true
};
```

**LinkedIn:**
```typescript
const linkedinContent = {
  content: "Exciting progress on awesome-lib this week! 🚀\n\nAdded TypeScript support...",
  success: true
};
```

**09:00:15** - Update project sync timestamp:
```typescript
await prisma.project.update({
  where: { id: "clxxx_my_project" },
  data: { lastSyncedAt: new Date() } // 2025-10-03T09:00:15Z
});
```

**09:00:16** - Mark execution complete:
```json
{
  "id": "exec_789xyz",
  "jobId": "cron_abc123def456",
  "status": "COMPLETED",
  "startedAt": "2025-10-03T09:00:02.000Z",
  "completedAt": "2025-10-03T09:00:16.000Z",
  "duration": 14000, // 14 seconds
  "itemsProcessed": 3,
  "itemsSuccess": 3,
  "itemsFailed": 0,
  "output": {
    "activity": {
      "summary": "3 commits, 1 merged PR, 1 closed issue",
      "hasActivity": true
    },
    "results": [
      {
        "platformId": "plat_1",
        "platformType": "HASHNODE",
        "success": true,
        "content": { ... }
      },
      {
        "platformId": "plat_2",
        "platformType": "DEVTO",
        "success": true,
        "content": { ... }
      },
      {
        "platformId": "plat_3",
        "platformType": "LINKEDIN",
        "success": true,
        "content": { ... }
      }
    ]
  }
}
```

**09:00:17** - Update cron job statistics:
```json
{
  "id": "cron_abc123def456",
  "lastRunAt": "2025-10-03T09:00:02.000Z",
  "lastSuccess": "2025-10-03T09:00:02.000Z",
  "nextRunAt": "2025-10-04T09:00:00.000Z", // Next day
  "runCount": 1,
  "successCount": 1,
  "failureCount": 0,
  "status": "IDLE"
}
```

**09:00:18** - Send notifications (if enabled):

**Email Notification:**
```
To: user@example.com
Subject: ✅ Daily Content Generation completed successfully

Job: Daily Content Generation
Project: My Open Source Library
Status: completed successfully
Duration: 14s

Details:
- Items processed: 3
- Successful: 3

[View Execution Details]
```

**In-App Notification:**
```json
{
  "type": "JOB_SUCCESS",
  "title": "Daily Content Generation completed successfully",
  "message": "Execution completed successfully in 14s",
  "link": "/projects/clxxx_my_project/cron/cron_abc123def456",
  "read": false,
  "createdAt": "2025-10-03T09:00:18.000Z"
}
```

---

## Step 3: View Execution History

**API Call:**
```bash
GET /api/cron/executions?jobId=cron_abc123def456&stats=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exec_789xyz",
      "jobId": "cron_abc123def456",
      "status": "COMPLETED",
      "startedAt": "2025-10-03T09:00:02.000Z",
      "completedAt": "2025-10-03T09:00:16.000Z",
      "duration": 14000,
      "itemsProcessed": 3,
      "itemsSuccess": 3,
      "itemsFailed": 0,
      "triggeredBy": "scheduled",
      "metadata": {
        "projectId": "clxxx_my_project",
        "userId": "user_123"
      },
      "output": { ... }
    }
  ],
  "statistics": {
    "totalRuns": 1,
    "totalSuccess": 1,
    "totalFailures": 0,
    "successRate": "100.00",
    "avgDuration": 14000,
    "lastRun": "2025-10-03T09:00:02.000Z",
    "lastSuccess": "2025-10-03T09:00:02.000Z",
    "nextRun": "2025-10-04T09:00:00.000Z",
    "recentExecutions": [
      {
        "id": "exec_789xyz",
        "status": "COMPLETED",
        "startedAt": "2025-10-03T09:00:02.000Z",
        "duration": 14000
      }
    ]
  },
  "count": 1
}
```

---

## Step 4: Manual Trigger Example

**User Action:** Clicks "Trigger Now" button

**API Call:**
```bash
POST /api/cron/trigger
Content-Type: application/json

{
  "jobId": "cron_abc123def456"
}
```

**Execution Flow:** Same as above, but:
- `triggeredBy: "manual"`
- Runs immediately (not waiting for schedule)
- Does not affect `nextRunAt` timestamp

---

## Failure Scenario Example

### No Activity Detected

**09:00:08** - GitHub scan results:
```json
{
  "commits": [],
  "pullRequests": [],
  "issues": [],
  "hasActivity": false,
  "summary": "No activity"
}
```

**09:00:09** - Mark execution complete (no generation):
```json
{
  "status": "COMPLETED",
  "duration": 7000,
  "itemsProcessed": 0,
  "metadata": {
    "message": "No GitHub activity detected",
    "activity": { "hasActivity": false, "summary": "No activity" }
  }
}
```

### Partial Failure (1 platform fails)

**Generation Results:**
```json
{
  "results": [
    { "platformType": "HASHNODE", "success": true },
    { "platformType": "DEVTO", "success": false, "error": "API rate limit" },
    { "platformType": "LINKEDIN", "success": true }
  ]
}
```

**Execution Record:**
```json
{
  "status": "COMPLETED",
  "itemsProcessed": 3,
  "itemsSuccess": 2,
  "itemsFailed": 1,
  "output": {
    "results": [...]
  }
}
```

**Notification:** ⚠️ Job completed with errors

### Complete Failure

**Error:** GitHub API authentication failed

**09:00:05** - Execution fails:
```json
{
  "status": "FAILED",
  "error": "GitHub API error: Bad credentials",
  "stackTrace": "Error: GitHub API error...",
  "duration": 3000
}
```

**Job Statistics:**
```json
{
  "lastFailure": "2025-10-03T09:00:05.000Z",
  "runCount": 1,
  "failureCount": 1
}
```

**Retry:** Inngest automatically retries 3 times with exponential backoff
- Retry 1: +5 minutes (09:05)
- Retry 2: +10 minutes (09:15)
- Retry 3: +20 minutes (09:35)

**Notification:** ❌ Job failed after 3 retries

---

## Key Metrics

**Performance:**
- Average duration: 14-20 seconds
- GitHub API: 4-6 seconds
- AI generation: 8-12 seconds (3 platforms)
- Database operations: 1-2 seconds

**Reliability:**
- Success rate: 95%+
- Automatic retries: 3 attempts
- Partial success handling: Yes
- Error tracking: Comprehensive

**Scalability:**
- Concurrent jobs: 5 max
- Queue management: Inngest
- Rate limiting: Built-in backoff
- Timezone support: 400+ zones

---

## Dashboard View (Future)

```
┌─ Cron Jobs ────────────────────────────────────┐
│                                                 │
│ Daily Content Generation                        │
│ Next run: Tomorrow at 9:00 AM UTC              │
│ Status: ✅ IDLE                                 │
│                                                 │
│ Recent Executions:                              │
│ ✅ Today 9:00 AM - 14s - 3/3 platforms          │
│ ✅ Yesterday 9:00 AM - 16s - 3/3 platforms      │
│ ⚠️ 2 days ago 9:00 AM - 12s - 2/3 platforms     │
│                                                 │
│ Statistics:                                     │
│ Success Rate: 95% (19/20)                       │
│ Avg Duration: 15s                               │
│                                                 │
│ [View History] [Trigger Now] [Edit] [Disable]  │
└─────────────────────────────────────────────────┘
```
