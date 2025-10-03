# Performance & Monitoring System Implementation

## Overview

Comprehensive performance monitoring and job optimization system for the Full Self Publishing platform, implemented as Phase 9 of the project architecture.

## Components

### 1. Job Queue Optimization (`lib/monitoring/job-optimizer.ts`)

**Features:**
- Parallel job processing (3-5 concurrent workers per job type)
- Priority-based job routing (HIGH/MEDIUM/LOW)
- Dead letter queue for failed jobs
- Exponential backoff retry strategies
- Job deduplication using idempotency keys
- Circuit breaker pattern for external API calls

**Job Configurations:**
```typescript
{
  "content-generation": { concurrency: 5, priority: MEDIUM, retries: 3 },
  "project-scheduled-publish": { concurrency: 10, priority: HIGH, retries: 0 },
  "item-scheduled-publish": { concurrency: 5, priority: HIGH, retries: 3 },
  "generate-report": { concurrency: 5, priority: MEDIUM, retries: 3 },
  "export-data": { concurrency: 3, priority: LOW, retries: 3 }
}
```

**Circuit Breaker:**
- Failure threshold: 5 failures
- Timeout: 60 seconds (1 minute)
- States: closed, open, half-open
- Automatic recovery after timeout

### 2. Metrics Collection (`lib/monitoring/metrics-collector.ts`)

**Tracked Metrics:**
- Job success/failure rates
- Job execution time (avg, P50, P95, P99)
- Queue length by status
- Active workers count
- API response times
- Database query performance
- External API latency
- System error rates

**Storage:**
- In-memory store: Last 24 hours, 1000 points per metric
- Database persistence: Long-term aggregated metrics
- Prometheus export format support

**Key Functions:**
```typescript
recordMetric(name, type, value, labels, metadata)
recordJobExecution(jobId, success, durationMs, metadata)
getAggregatedMetrics(name, type, since)
exportPrometheusMetrics()
```

### 3. Health Checks (`lib/monitoring/health-checks.ts`)

**Health Check Endpoints:**
- `/api/health` - Overall system health
- `/api/health/database` - Database connectivity
- `/api/health/redis` - Redis connectivity (optional)
- `/api/health/jobs` - Job queue status
- `/api/health/platforms` - External platform APIs

**Health Statuses:**
- `healthy`: All checks passing, response times < thresholds
- `degraded`: Some issues detected, system operational
- `unhealthy`: Critical failures, action required

**Alert Thresholds:**
```typescript
{
  database: { responseTime: 500ms, status: degraded },
  jobs: { failureRate: 50%, stuckJobs: 10, deadLetterQueue: 100 },
  platforms: { failureRate: 30% },
  system: { errorRate: 10%, responseTime: 200ms }
}
```

### 4. Alerting System (`lib/monitoring/alerting.ts`)

**Alert Types:**
- SYSTEM_HEALTH - Critical system health issues
- JOB_FAILURE - High job failure rates
- QUEUE_BACKLOG - Queue processing delays
- PERFORMANCE_DEGRADATION - Performance regressions
- PLATFORM_API_FAILURE - External API failures
- DATABASE_ISSUE - Database connectivity/performance
- HIGH_ERROR_RATE - Elevated error rates

**Alert Severities:**
- INFO - Informational alerts
- WARNING - Non-critical issues
- ERROR - Errors requiring attention
- CRITICAL - Critical failures requiring immediate action

**Notification Channels:**
- Webhook notifications (custom endpoints)
- Email notifications (via SendGrid)
- Slack notifications (via webhooks)

**Cooldown Periods:**
- CRITICAL alerts: 5-15 minutes
- ERROR alerts: 15-30 minutes
- WARNING alerts: 30-60 minutes

### 5. Performance Tracking (`lib/monitoring/performance-tracker.ts`)

**Performance Analysis:**
- Job execution time trends
- Performance regression detection
- Bottleneck identification
- Resource usage monitoring
- Slowest operations tracking

**Bottleneck Detection:**
- Jobs taking > 60 seconds (medium severity)
- Jobs taking > 120 seconds (high severity)
- Jobs with > 25% failure rate (medium severity)
- Jobs with > 50% failure rate (high severity)

**Performance Baselines:**
- Automatic baseline creation after 10 executions
- Regression detection with 10% threshold
- Trend analysis: improving/stable/degrading
- P95/P99 percentile tracking

## API Endpoints

### Health Checks

**GET /api/health**
```bash
# Full health check
curl http://localhost:3000/api/health

# Quick health check
curl http://localhost:3000/api/health?quick=true
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "uptime": 3600000,
  "checks": {
    "database": { "status": "healthy", "responseTime": 45 },
    "redis": { "status": "healthy", "responseTime": 12 },
    "jobs": { "status": "healthy", "details": {...} },
    "platforms": { "status": "healthy", "details": {...} }
  },
  "overall": { "healthy": 4, "degraded": 0, "unhealthy": 0, "total": 4 }
}
```

### Metrics Collection

**GET /api/metrics**
```bash
# JSON format (default)
curl http://localhost:3000/api/metrics

# Prometheus format
curl http://localhost:3000/api/metrics?format=prometheus

# Filter by job
curl http://localhost:3000/api/metrics?jobId=content-generation
```

**Response (JSON):**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "jobs": [
    {
      "jobId": "content-generation",
      "totalExecutions": 150,
      "successRate": 96.7,
      "avgExecutionTime": 25000,
      "p95ExecutionTime": 45000
    }
  ],
  "queue": {
    "pending": 5,
    "queued": 2,
    "processing": 3,
    "failed": 1,
    "deadLetter": 0
  },
  "system": {
    "uptime": 3600000,
    "errorRate": 2.5,
    "avgResponseTime": 150,
    "p95ResponseTime": 280
  },
  "performance": {
    "snapshot": {...},
    "trends": [...],
    "slowest": [...]
  },
  "alerts": {
    "active": 0,
    "items": []
  }
}
```

## Monitoring Cron Jobs

### Dead Letter Queue Processing
- **Schedule**: Every hour (`0 * * * *`)
- **Function**: Retries failed jobs from dead letter queue
- **Max Retries**: 5 attempts per item
- **Auto-cleanup**: Items > 30 days old

### Health Check and Alerting
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Function**: Checks system health and triggers alerts
- **Alert Cooldown**: Prevents alert spam
- **Multi-channel**: Webhook, Email, Slack

### Performance Metrics Aggregation
- **Schedule**: Every 30 minutes (`*/30 * * * *`)
- **Function**: Aggregates performance metrics
- **Regression Detection**: Identifies performance degradation
- **Bottleneck Analysis**: Finds slow operations

### Metrics Cleanup
- **Schedule**: Daily at 2 AM (`0 2 * * *`)
- **Function**: Cleans up old metrics data
- **Retention**: 30 days for resolved items
- **Targets**: Dead letter queue, resolved alerts

## Performance Dashboard

**Component:** `components/admin/performance-dashboard.tsx`

**Features:**
- Real-time metrics display (30-second auto-refresh)
- System health overview
- Queue status visualization
- Job performance table
- Bottleneck alerts
- Performance trend graphs
- Resource usage monitoring
- Active alerts display

**Usage:**
```tsx
import { PerformanceDashboard } from "@/components/admin/performance-dashboard";

export default function AdminDashboardPage() {
  return <PerformanceDashboard />;
}
```

## Database Schema

Add the following models to your `schema.prisma`:

```prisma
// Job performance metrics
model JobMetrics {
  id               String   @id @default(cuid())
  jobId            String   @unique
  totalExecutions  Int      @default(0)
  successCount     Int      @default(0)
  failureCount     Int      @default(0)
  totalDurationMs  BigInt   @default(0)
  minDurationMs    Int      @default(0)
  maxDurationMs    Int      @default(0)
  lastExecutionAt  DateTime?
  lastSuccessAt    DateTime?
  lastFailureAt    DateTime?
  metadata         Json     @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([jobId])
  @@index([lastExecutionAt])
}

// Performance baselines
model PerformanceBaseline {
  id             String   @id @default(cuid())
  jobId          String   @unique
  baselineAvgMs  Float
  baselineP95Ms  Float
  sampleSize     Int
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([jobId])
}

// Dead letter queue
model DeadLetterQueue {
  id             String   @id @default(cuid())
  jobId          String
  eventData      Json
  error          String
  metadata       Json     @default("{}")
  status         String   @default("PENDING")
  attempts       Int      @default(0)
  lastAttemptAt  DateTime?
  processedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([jobId])
  @@index([status])
  @@index([createdAt])
}

// Alerts
model Alert {
  id         String   @id @default(cuid())
  type       String
  severity   String
  title      String
  message    String   @db.Text
  metadata   Json     @default("{}")
  resolved   Boolean  @default(false)
  resolvedAt DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([type])
  @@index([severity])
  @@index([resolved])
  @@index([createdAt])
}
```

## Environment Variables

```env
# Inngest Configuration
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key

# Optional: Redis for caching (if using Redis)
REDIS_URL=redis://localhost:6379

# Alert Webhooks (optional)
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Configuration (for alerts)
SENDGRID_API_KEY=your_sendgrid_key
ALERT_EMAIL_RECIPIENTS=admin@example.com,ops@example.com
```

## Performance Benchmarks

### Target Metrics
- Average job completion time: < 30 seconds
- Job failure rate: < 5%
- P95 response time: < 200ms
- Error rate: < 1%
- Dead letter queue processing: Every 1 hour
- Queue backlog: < 100 items
- System uptime: > 99.9%

### Optimization Strategies
1. **Parallel Processing**: 3-5 concurrent workers per job type
2. **Priority Routing**: High-priority jobs processed first
3. **Batch Processing**: Process multiple items efficiently
4. **Circuit Breakers**: Prevent cascade failures
5. **Dead Letter Queue**: Automatic retry with exponential backoff
6. **Deduplication**: Prevent duplicate job execution
7. **Performance Baselines**: Detect regressions automatically

## Integration Guide

### 1. Add Monitoring to Existing Jobs

```typescript
import { recordJobExecution } from "@/lib/monitoring/metrics-collector";
import { trackJobPerformance } from "@/lib/monitoring/performance-tracker";

export const myJob = inngest.createFunction(
  { id: "my-job", name: "My Job" },
  { event: "my/event" },
  async ({ event, step }) => {
    const startTime = Date.now();

    try {
      // Your job logic here
      const result = await doWork();

      // Record success
      const duration = Date.now() - startTime;
      await recordJobExecution("my-job", true, duration);
      await trackJobPerformance("my-job", duration, true);

      return result;
    } catch (error) {
      // Record failure
      const duration = Date.now() - startTime;
      await recordJobExecution("my-job", false, duration, { error: error.message });
      await trackJobPerformance("my-job", false, duration);

      throw error;
    }
  }
);
```

### 2. Use Optimized Function Wrapper

```typescript
import { createOptimizedFunction } from "@/lib/inngest/optimized-functions";

export const myOptimizedJob = createOptimizedFunction({
  id: "my-optimized-job",
  name: "My Optimized Job",
  eventName: "my/optimized/event",
  handler: async ({ event, step }) => {
    // Your job logic
    // Monitoring, deduplication, circuit breakers handled automatically
    return { success: true };
  },
});
```

### 3. Configure Alerts

```typescript
import { triggerAlert, DEFAULT_ALERT_CONFIGS } from "@/lib/monitoring/alerting";

// Trigger custom alert
await triggerAlert(
  DEFAULT_ALERT_CONFIGS.find(c => c.type === AlertType.JOB_FAILURE)!,
  "Job Failed",
  "Content generation job failed after 3 retries",
  { jobId: "content-generation", error: "Timeout" }
);
```

## Testing

### Health Check Tests
```bash
# Test main health endpoint
curl http://localhost:3000/api/health

# Test database health
curl http://localhost:3000/api/health/database

# Test job queue health
curl http://localhost:3000/api/health/jobs
```

### Metrics Tests
```bash
# Get all metrics
curl http://localhost:3000/api/metrics

# Get Prometheus format
curl http://localhost:3000/api/metrics?format=prometheus

# Filter by job
curl http://localhost:3000/api/metrics?jobId=content-generation
```

### Performance Tests
```bash
# Trigger test job
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{"name": "cron/content.generation", "data": {...}}'

# Check metrics after execution
curl http://localhost:3000/api/metrics?jobId=content-generation
```

## Troubleshooting

### High Job Failure Rate
1. Check `/api/health/jobs` for queue status
2. Review dead letter queue: Check `DeadLetterQueue` table
3. Examine job metrics: `/api/metrics?jobId=<job-id>`
4. Check circuit breaker status in metrics
5. Review error logs in job execution metadata

### Performance Degradation
1. Check performance trends: `/api/metrics`
2. Review bottlenecks in dashboard
3. Examine slowest operations
4. Check database query times
5. Review external API latency

### Alert Spam
1. Verify cooldown periods are configured
2. Check alert thresholds in `health-checks.ts`
3. Review alert frequency in database
4. Adjust alert configurations in `alerting.ts`

### Database Connection Issues
1. Check database health: `/api/health/database`
2. Verify connection pool settings
3. Review database query performance
4. Check for connection leaks
5. Monitor active connections

## Maintenance

### Daily Tasks
- Review active alerts in dashboard
- Check dead letter queue size
- Monitor job failure rates
- Verify system health status

### Weekly Tasks
- Analyze performance trends
- Review bottleneck recommendations
- Check circuit breaker status
- Validate alert configurations

### Monthly Tasks
- Review and optimize job configurations
- Analyze long-term performance trends
- Update performance baselines
- Archive old metrics data

## Future Enhancements

1. **Custom Dashboards**: Per-project performance dashboards
2. **Advanced Analytics**: ML-based anomaly detection
3. **Cost Tracking**: Resource usage cost analysis
4. **SLA Monitoring**: Service level agreement tracking
5. **Distributed Tracing**: Request flow visualization
6. **Log Aggregation**: Centralized logging system
7. **Capacity Planning**: Predictive scaling recommendations
8. **A/B Testing**: Performance comparison tools

## Support

For issues or questions:
1. Check health endpoints for system status
2. Review metrics for performance data
3. Examine alerts for specific issues
4. Consult this documentation for guidance
5. Contact development team for assistance
