# Cron Job System - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies ✅

Already installed:
- `inngest@^3.44.0`
- `date-fns-tz@^3.2.0`

### 2. Configure Environment

Add to `.env`:

```env
# GitHub Token (required)
GITHUB_TOKEN="ghp_your_token_here"

# Inngest (required)
INNGEST_EVENT_KEY="your_event_key"
INNGEST_SIGNING_KEY="your_signing_key"

# Resend (optional - for email notifications)
RESEND_API_KEY="re_your_key"
```

### 3. Setup Inngest

1. Go to https://www.inngest.com
2. Create account → New app
3. Get keys from dashboard
4. Add webhook: `https://yourdomain.com/api/inngest`

### 4. Test Locally

```bash
# Start dev server
npm run dev

# In another terminal, trigger Inngest dev server
npx inngest-cli dev
```

## Basic Usage

### Create Daily Job

```typescript
import { createCronJob } from "@/lib/cron/scheduler";
import { CronFrequency } from "@/lib/cron/frequency";

const job = await createCronJob({
  projectId: projectId,
  type: "GENERATE_CONTENT",
  name: "Daily Content Generation",
  frequency: CronFrequency.DAILY,
  timeConfig: {
    hour: 9,
    minute: 0,
    timezone: "UTC",
  },
});

console.log("Job created:", job.id);
console.log("Next run:", job.nextRunAt);
```

### API Example

```bash
# Create schedule
curl -X POST http://localhost:3000/api/cron/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "clxxx123",
    "type": "GENERATE_CONTENT",
    "name": "Daily Content",
    "frequency": "DAILY",
    "timeConfig": {
      "hour": 9,
      "minute": 0,
      "timezone": "UTC"
    }
  }'

# Trigger manually
curl -X POST http://localhost:3000/api/cron/trigger \
  -H "Content-Type: application/json" \
  -d '{"jobId": "cron_abc123"}'

# Get executions
curl http://localhost:3000/api/cron/executions?jobId=cron_abc123
```

## Job Types

| Type | Description | Status |
|------|-------------|--------|
| `GENERATE_CONTENT` | AI content from GitHub activity | ✅ Implemented |
| `SYNC_GITHUB` | Sync GitHub content | 🚧 Future |
| `PUBLISH_CONTENT` | Auto-publish scheduled content | 🚧 Future |
| `CLEANUP` | Database cleanup | 🚧 Future |
| `ANALYTICS` | Generate analytics | 🚧 Future |

## Frequency Examples

### Daily at 9am UTC
```typescript
frequency: CronFrequency.DAILY,
timeConfig: {
  hour: 9,
  minute: 0,
  timezone: "UTC"
}
```

### Every Monday at 10am EST
```typescript
frequency: CronFrequency.WEEKLY,
timeConfig: {
  hour: 10,
  minute: 0,
  dayOfWeek: 1, // Monday
  timezone: "America/New_York"
}
```

### 1st of every month at 8am GMT
```typescript
frequency: CronFrequency.MONTHLY,
timeConfig: {
  hour: 8,
  minute: 0,
  dayOfMonth: 1,
  timezone: "Europe/London"
}
```

## Monitoring

### Check Job Status

```typescript
import { getJobStatistics } from "@/lib/cron/scheduler";

const stats = await getJobStatistics(jobId);
console.log(`Success Rate: ${stats.successRate}%`);
console.log(`Avg Duration: ${stats.avgDuration}ms`);
```

### View Recent Executions

```typescript
import { getJobExecutionHistory } from "@/lib/cron/scheduler";

const executions = await getJobExecutionHistory(jobId, 10);
executions.forEach(exec => {
  console.log(`${exec.status}: ${exec.duration}ms`);
});
```

## Troubleshooting

### Job Not Running

**Check:**
1. `isEnabled === true`
2. Inngest webhook configured
3. `nextRunAt` is in the future
4. No errors in last execution

**Fix:**
```typescript
await toggleCronJob(jobId, true); // Enable
```

### GitHub Activity Not Detected

**Check:**
1. `GITHUB_TOKEN` is set
2. Token has `repo` permission
3. `githubRepoOwner` and `githubRepoName` configured
4. Repository has recent activity

**Fix:**
```bash
# Test GitHub token
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo/commits
```

### Notifications Not Sending

**Check:**
1. `RESEND_API_KEY` is set
2. Email notifications enabled in settings
3. Notification events configured

**Fix:**
```typescript
// Update project settings
await prisma.settings.update({
  where: { projectId },
  data: {
    emailNotifications: true,
    notificationEvents: ["job_success", "job_failure"]
  }
});
```

## Next Steps

1. ✅ Create first cron job
2. ✅ Test manual trigger
3. ✅ Verify execution tracking
4. 🚧 Configure notifications
5. 🚧 Set up production Inngest
6. 🚧 Deploy webhook endpoint

## Integration with Phase 2.1 (AI Agent)

The content generation job calls:
```typescript
await generateContentForPlatform(
  platform.type,
  activity,
  project
);
```

**Expected from AI Agent:**
- Accept GitHub activity context
- Generate platform-specific content
- Return structured content object
- Handle errors gracefully

## Files Created

```
lib/
├── inngest/
│   ├── client.ts                    # Inngest client config
│   └── functions/
│       └── content-generation.ts    # Job implementation
├── cron/
│   ├── frequency.ts                 # Schedule management
│   └── scheduler.ts                 # Job orchestration
├── notifications/
│   └── cron.ts                      # Notification system
└── validations/
    └── cron.ts                      # Zod schemas

app/api/
├── inngest/
│   └── route.ts                     # Webhook handler
└── cron/
    ├── schedule/route.ts            # Create/update
    ├── schedules/
    │   ├── route.ts                 # List all
    │   └── [id]/route.ts            # Delete/toggle
    ├── trigger/route.ts             # Manual trigger
    └── executions/route.ts          # History
```

## Resources

- **Inngest Docs**: https://www.inngest.com/docs
- **Cron Expression**: https://crontab.guru
- **Timezone List**: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
- **GitHub API**: https://docs.github.com/en/rest
- **Resend Docs**: https://resend.com/docs
