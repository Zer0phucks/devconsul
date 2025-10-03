# Cron Job System Documentation

**Phase 2.2**: Automated Content Generation Infrastructure

## Overview

Robust cron job system built with Inngest for automated content generation, GitHub activity scanning, and scheduled publishing. Features comprehensive scheduling, queue management, execution tracking, and notification system.

## Architecture

### Components

1. **Inngest Client** (`/lib/inngest/client.ts`)
   - Event-driven job queue
   - Type-safe event schemas
   - Production-ready configuration

2. **Frequency Manager** (`/lib/cron/frequency.ts`)
   - Daily, weekly, monthly schedules
   - Timezone support (IANA timezones)
   - Cron expression generation
   - Next run calculation

3. **Scheduler** (`/lib/cron/scheduler.ts`)
   - Job creation/update/deletion
   - Execution scheduling
   - Statistics tracking
   - Manual job triggering

4. **Job Functions** (`/lib/inngest/functions/`)
   - Content generation job
   - GitHub activity scanning
   - AI content generation integration
   - Execution tracking

5. **API Endpoints** (`/app/api/cron/`)
   - Schedule management
   - Execution history
   - Manual triggers
   - Statistics

6. **Notification System** (`/lib/notifications/cron.ts`)
   - Email notifications (Resend)
   - In-app notifications
   - Success/failure/partial alerts

## Technology Stack

- **Queue**: Inngest 3.x (TypeScript-first, built-in retries)
- **Database**: Prisma + PostgreSQL
- **Validation**: Zod
- **Email**: Resend (optional)
- **GitHub**: Octokit REST API
- **Timezone**: date-fns-tz

## Setup

### 1. Environment Variables

```env
# GitHub API Token
GITHUB_TOKEN="ghp_your_personal_access_token"

# Inngest Configuration
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# Email Notifications (Optional)
RESEND_API_KEY="re_your_resend_api_key"
```

### 2. Inngest Setup

1. Sign up at https://www.inngest.com
2. Create new app
3. Get Event Key and Signing Key
4. Add webhook endpoint: `https://yourdomain.com/api/inngest`

### 3. GitHub Token

Create personal access token with:
- `repo` (full repository access)
- `read:org` (read organization data)

### 4. Database Migration

Cron tables already exist in schema:
- `CronJob` - Job configurations
- `CronExecution` - Execution history

## Usage Examples

### Create Daily Content Generation Job

```typescript
import { createCronJob } from "@/lib/cron/scheduler";
import { CronFrequency } from "@/lib/cron/frequency";

const job = await createCronJob({
  projectId: "project_123",
  type: "GENERATE_CONTENT",
  name: "Daily Content Generation",
  description: "Generate content from GitHub activity",
  frequency: CronFrequency.DAILY,
  timeConfig: {
    hour: 9,
    minute: 0,
    timezone: "America/New_York", // 9am EST
  },
  isEnabled: true,
  maxRetries: 3,
  retryDelay: 300,
});
```

### Create Weekly Job (Monday 9am UTC)

```typescript
const job = await createCronJob({
  projectId: "project_123",
  type: "GENERATE_CONTENT",
  name: "Weekly Content Summary",
  frequency: CronFrequency.WEEKLY,
  timeConfig: {
    hour: 9,
    minute: 0,
    dayOfWeek: 1, // Monday
    timezone: "UTC",
  },
});
```

### Create Monthly Job (1st of month)

```typescript
const job = await createCronJob({
  projectId: "project_123",
  type: "GENERATE_CONTENT",
  name: "Monthly Newsletter",
  frequency: CronFrequency.MONTHLY,
  timeConfig: {
    hour: 10,
    minute: 30,
    dayOfMonth: 1,
    timezone: "UTC",
  },
});
```

### Update Job Schedule

```typescript
import { updateCronJob } from "@/lib/cron/scheduler";

const updated = await updateCronJob(jobId, {
  frequency: CronFrequency.DAILY,
  timeConfig: {
    hour: 14,
    minute: 0,
    timezone: "Europe/London", // 2pm GMT
  },
});
```

### Enable/Disable Job

```typescript
import { toggleCronJob } from "@/lib/cron/scheduler";

await toggleCronJob(jobId, false); // Disable
await toggleCronJob(jobId, true);  // Enable
```

### Manually Trigger Job

```typescript
import { triggerJobManually } from "@/lib/cron/scheduler";

await triggerJobManually(jobId, userId);
```

### Get Execution History

```typescript
import { getJobExecutionHistory, getJobStatistics } from "@/lib/cron/scheduler";

const history = await getJobExecutionHistory(jobId, 50);
const stats = await getJobStatistics(jobId);

console.log(stats);
// {
//   totalRuns: 45,
//   totalSuccess: 42,
//   totalFailures: 3,
//   successRate: "93.33",
//   avgDuration: 4523,
//   lastRun: 2025-10-02T08:00:00Z,
//   recentExecutions: [...]
// }
```

## API Endpoints

### POST /api/cron/schedule

Create new cron schedule.

**Request:**
```json
{
  "projectId": "clxxx123",
  "type": "GENERATE_CONTENT",
  "name": "Daily Content Generation",
  "frequency": "DAILY",
  "timeConfig": {
    "hour": 9,
    "minute": 0,
    "timezone": "UTC"
  },
  "isEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cron_abc123",
    "projectId": "clxxx123",
    "name": "Daily Content Generation",
    "schedule": "0 9 * * *",
    "nextRunAt": "2025-10-03T09:00:00Z",
    "isEnabled": true,
    ...
  }
}
```

### PATCH /api/cron/schedule

Update existing schedule.

**Request:**
```json
{
  "jobId": "cron_abc123",
  "frequency": "WEEKLY",
  "timeConfig": {
    "hour": 10,
    "minute": 30,
    "dayOfWeek": 1,
    "timezone": "UTC"
  }
}
```

### GET /api/cron/schedules

List all user's cron schedules.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### DELETE /api/cron/schedules/[id]

Cancel cron schedule.

### PATCH /api/cron/schedules/[id]

Toggle schedule (enable/disable).

**Request:**
```json
{
  "isEnabled": false
}
```

### POST /api/cron/trigger

Manually trigger job execution.

**Request:**
```json
{
  "jobId": "cron_abc123"
}
```

### GET /api/cron/executions

Fetch execution history.

**Query Params:**
- `jobId` (optional) - Specific job ID
- `limit` (default: 50) - Max results
- `stats` (default: false) - Include statistics

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exec_123",
      "jobId": "cron_abc123",
      "status": "COMPLETED",
      "startedAt": "2025-10-02T09:00:00Z",
      "completedAt": "2025-10-02T09:00:15Z",
      "duration": 15000,
      "itemsProcessed": 3,
      "itemsSuccess": 3,
      "itemsFailed": 0,
      ...
    }
  ],
  "statistics": {
    "totalRuns": 45,
    "successRate": "93.33",
    ...
  }
}
```

## Job Execution Flow

### Content Generation Job

1. **Create Execution Record**
   - Find active cron job
   - Create execution entry with RUNNING status

2. **Fetch Project Settings**
   - Get project configuration
   - Verify GitHub repo configured
   - Get enabled platforms

3. **Scan GitHub Activity**
   - Fetch commits since last sync
   - Fetch merged PRs
   - Fetch closed issues
   - Generate activity summary

4. **Check Activity**
   - If no activity → Mark complete, skip generation
   - If activity found → Proceed to generation

5. **Generate Content**
   - For each enabled platform:
     - Call AI generation (Phase 2.1)
     - Store generated content
     - Track success/failure

6. **Update Timestamps**
   - Update project lastSyncedAt
   - Calculate next run time

7. **Mark Execution Complete**
   - Update execution status
   - Store results and metadata
   - Update job statistics

8. **Send Notifications** (Optional)
   - Email notification
   - In-app notification badge

## Error Handling

### Automatic Retries

Inngest provides automatic retries:
- **Max retries**: 3 (configurable per job)
- **Retry delay**: 300s (5 minutes, configurable)
- **Backoff**: Exponential

### Non-Retriable Errors

Use `NonRetriableError` for:
- Missing project
- No GitHub repo configured
- Invalid configuration
- Authorization failures

### Partial Success

Job marks as COMPLETED even if some platforms fail:
- `itemsProcessed`: Total platforms attempted
- `itemsSuccess`: Successful generations
- `itemsFailed`: Failed generations

## Monitoring & Observability

### Job Statistics

```typescript
{
  totalRuns: 100,
  totalSuccess: 95,
  totalFailures: 5,
  successRate: "95.00",
  avgDuration: 8500, // milliseconds
  lastRun: Date,
  lastSuccess: Date,
  lastFailure: Date,
  nextRun: Date,
  recentExecutions: [...]
}
```

### Execution Tracking

Every execution records:
- Start/completion timestamps
- Duration (milliseconds)
- Status (RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT)
- Error message and stack trace
- Items processed/success/failed
- Output metadata

### Performance Metrics

Track in execution metadata:
- GitHub API calls
- AI token usage
- Content generation time
- Database queries

## Notifications

### Email Notifications

Powered by Resend (optional):
- Job completion (success/failure/partial)
- Professional HTML templates
- Execution details and links
- Error messages

### In-App Notifications

Stored in user preferences:
- Notification badge count
- Last 50 notifications
- Read/unread status
- Links to execution details

### Notification Preferences

Configure in project settings:
```typescript
{
  emailNotifications: true,
  notificationEvents: [
    "job_success",
    "job_failure",
    "job_partial"
  ]
}
```

## Timezone Support

All schedules support IANA timezones:
- Store in UTC in database
- Display in user's timezone
- Calculate next run correctly
- Handle DST transitions

**Examples:**
- `America/New_York` (EST/EDT)
- `Europe/London` (GMT/BST)
- `Asia/Tokyo` (JST)
- `UTC` (default)

## Frequency Options

### Daily
Runs every day at specified time.

**Cron**: `minute hour * * *`

### Weekly
Runs on specific day of week.

**Cron**: `minute hour * * dayOfWeek`

Days: 0 (Sunday) - 6 (Saturday)

### Monthly
Runs on specific day of month.

**Cron**: `minute hour dayOfMonth * *`

Days: 1-31 (handles month-end edge cases)

### Custom
Advanced users can provide custom cron expressions.

**Format**: Standard 5-part cron syntax

## Security

### Authentication
- All API endpoints require authentication
- User must own project to manage jobs
- Job triggers verify project ownership

### Authorization
- Per-project cron job management
- User can only access own jobs
- Execution history scoped to user

### API Keys
- GitHub token secured in environment
- Inngest signing key validates webhooks
- Resend API key for emails only

## Testing

### Manual Job Trigger

```bash
curl -X POST http://localhost:3000/api/cron/trigger \
  -H "Content-Type: application/json" \
  -d '{"jobId": "cron_abc123"}'
```

### Verify Execution

```bash
curl http://localhost:3000/api/cron/executions?jobId=cron_abc123&stats=true
```

### Test Notification

Execute job and check email/in-app notification.

## Future Enhancements

**Phase 2.3+:**
- GitHub webhook integration for real-time triggers
- Publish content job (PUBLISH_CONTENT)
- GitHub sync job (SYNC_GITHUB)
- Analytics generation job (ANALYTICS)
- Custom job types
- Webhook triggers
- Slack/Discord notifications
- Advanced retry strategies
- Job dependencies (job A → job B)
- Conditional execution (run only if conditions met)

## Troubleshooting

### Job Not Running

1. Check `isEnabled` status
2. Verify Inngest webhook configured
3. Check `nextRunAt` timestamp
4. Review execution history for errors

### GitHub Activity Not Detected

1. Verify `GITHUB_TOKEN` configured
2. Check token permissions (repo access)
3. Verify `githubRepoOwner` and `githubRepoName`
4. Check `lastSyncedAt` timestamp

### Notifications Not Sending

1. Verify `RESEND_API_KEY` configured
2. Check email notification enabled in settings
3. Review notification events configuration
4. Check Resend dashboard for delivery status

### Execution Failures

1. Check execution error message
2. Review stack trace
3. Verify AI generation service available
4. Check platform connections

## Production Deployment

1. **Environment Variables**
   - Set all required env vars
   - Use production Inngest keys
   - Configure production email domain

2. **Inngest Webhook**
   - Add webhook URL in Inngest dashboard
   - Verify signing key matches

3. **Database**
   - Run migrations (`prisma migrate deploy`)
   - Verify indexes for performance

4. **Monitoring**
   - Set up Inngest dashboard monitoring
   - Configure error alerts
   - Track execution success rates

5. **Testing**
   - Create test job with daily schedule
   - Trigger manually to verify
   - Check notification delivery

## Support

For issues or questions:
- Review execution history and error logs
- Check Inngest dashboard for event delivery
- Verify environment configuration
- Test with manual trigger first
