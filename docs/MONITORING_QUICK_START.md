# Monitoring System Quick Start Guide

## Setup (5 minutes)

### 1. Add Database Schema

Copy monitoring models to your `schema.prisma`:

```bash
# Open the monitoring schema file
cat prisma/schema-monitoring.prisma

# Add these models to your main prisma/schema.prisma file
# Then run migrations
npx prisma migrate dev --name add-monitoring-tables
npx prisma generate
```

### 2. Environment Variables

Add to `.env`:

```env
# Required - Already configured if Inngest is working
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=your_signing_key

# Optional - For advanced features
REDIS_URL=redis://localhost:6379
ALERT_WEBHOOK_URL=https://your-webhook.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SENDGRID_API_KEY=your_sendgrid_key
ALERT_EMAIL_RECIPIENTS=admin@example.com
```

### 3. Start Development Server

```bash
npm run dev
```

---

## Quick Test (2 minutes)

### Check System Health

```bash
# Quick health check
curl http://localhost:3000/api/health?quick=true

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-03T...",
#   "uptime": 3600000
# }
```

### View Metrics

```bash
# Get current metrics
curl http://localhost:3000/api/metrics

# Expected response includes:
# - Job metrics (success rates, execution times)
# - Queue status (pending, processing, failed)
# - System metrics (uptime, error rate)
# - Performance snapshot
```

### Access Dashboard

Open browser: `http://localhost:3000/admin/performance`

The dashboard shows:
- System health overview
- Queue status
- Job performance table
- Active alerts
- Performance trends

---

## Common Operations

### Monitor a Specific Job

```bash
# Get metrics for content generation job
curl http://localhost:3000/api/metrics?jobId=content-generation

# Response shows:
# - Total executions
# - Success/failure rate
# - Average execution time
# - P95 execution time
```

### Check Database Health

```bash
curl http://localhost:3000/api/health/database

# Response:
# {
#   "status": "healthy",
#   "responseTime": 45,
#   "details": { "connected": true }
# }
```

### View Prometheus Metrics

```bash
# Get metrics in Prometheus format
curl http://localhost:3000/api/metrics?format=prometheus

# Use with Prometheus or Grafana
```

---

## Monitoring Cron Jobs

These run automatically - **no action required**:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Dead Letter Queue | Every hour | Retry failed jobs |
| Health Check | Every 5 minutes | Check system health, send alerts |
| Performance Metrics | Every 30 minutes | Aggregate metrics, detect regressions |
| Metrics Cleanup | Daily at 2 AM | Clean up old data |

### View Cron Job Execution

Check Inngest dashboard: `https://app.inngest.com`

Look for:
- `dead-letter-queue-cron`
- `health-check-cron`
- `performance-metrics-cron`
- `metrics-cleanup-cron`

---

## Dashboard Features

### System Health Overview

Four key metrics cards:
1. **System Uptime** - How long system has been running
2. **Error Rate** - Percentage of errors (target: <1%)
3. **Queue Length** - Number of pending jobs
4. **Avg Response Time** - System responsiveness (target: <200ms)

### Queue Status

Real-time queue visualization:
- **Pending**: Jobs waiting to be queued
- **Queued**: Jobs ready for processing
- **Processing**: Jobs currently running
- **Failed**: Jobs that failed
- **Dead Letter**: Jobs in retry queue

### Job Performance Table

For each job type, shows:
- Total executions
- Success rate (green >95%, yellow >80%, red <80%)
- Average execution time
- P95 execution time (95th percentile)

### Performance Bottlenecks

Automatic detection of:
- **High severity** (red): Jobs taking >120 seconds
- **Medium severity** (yellow): Jobs taking >60 seconds
- **Low severity** (gray): Minor performance issues

Each bottleneck includes:
- Impact description
- Recommendation for optimization

### Performance Trends

Track whether metrics are:
- **Improving** ↓ (green) - Performance getting better
- **Stable** → (gray) - No significant change
- **Degrading** ↑ (red) - Performance declining

---

## Alerting

### Alert Types

The system automatically sends alerts for:

| Type | Severity | Trigger |
|------|----------|---------|
| System Health | CRITICAL | System becomes unhealthy |
| Job Failure | ERROR | >50% job failure rate |
| Queue Backlog | WARNING | >100 items in queue |
| Performance Degradation | WARNING | >10% performance regression |
| Platform API Failure | ERROR | >30% external API failures |
| Database Issue | CRITICAL | Database connectivity problems |
| High Error Rate | ERROR | >10% system error rate |

### Alert Cooldown

Prevents alert spam:
- **CRITICAL**: 5-15 minutes between alerts
- **ERROR**: 15-30 minutes between alerts
- **WARNING**: 30-60 minutes between alerts

### Alert Channels

Alerts are sent to (if configured):
1. **Webhook**: Custom endpoint for integrations
2. **Email**: Via SendGrid to configured recipients
3. **Slack**: Via webhook to your Slack channel

---

## Performance Baselines

The system automatically creates performance baselines after 10 executions of each job.

### Regression Detection

- **Threshold**: 10% slower than baseline
- **Action**: Automatic alert with degrading trend
- **Resolution**: Investigate bottlenecks, optimize job

### View Baselines

```bash
# Query database for baselines
# (Requires database client or Prisma Studio)
npx prisma studio
# Navigate to PerformanceBaseline model
```

---

## Troubleshooting

### No Metrics Appearing

1. Check database migration completed:
   ```bash
   npx prisma migrate status
   ```

2. Verify jobs are executing:
   ```bash
   curl http://localhost:3000/api/health/jobs
   ```

3. Check Inngest dashboard for job execution

### Dashboard Not Loading

1. Verify API endpoint works:
   ```bash
   curl http://localhost:3000/api/metrics
   ```

2. Check browser console for errors

3. Verify dashboard route is configured

### Alerts Not Sending

1. Check environment variables are set:
   ```bash
   echo $ALERT_WEBHOOK_URL
   echo $SLACK_WEBHOOK_URL
   echo $SENDGRID_API_KEY
   ```

2. Verify system is unhealthy enough to trigger alert:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. Check alert cooldown hasn't suppressed notification

### High Queue Length

1. Check queue status:
   ```bash
   curl http://localhost:3000/api/health/jobs
   ```

2. View dead letter queue size:
   ```bash
   # Query database
   # Check DeadLetterQueue model
   ```

3. Manually trigger dead letter queue processing:
   ```bash
   # Via Inngest dashboard or API
   # Send event: cron.dead-letter-queue
   ```

---

## Performance Optimization

### If Jobs Are Slow

1. **Check Bottlenecks**: View dashboard performance section
2. **Review Recommendations**: Each bottleneck has optimization tips
3. **Adjust Concurrency**: Modify job configs in `job-optimizer.ts`
4. **Add Caching**: Use Redis for frequently accessed data

### If Failure Rate is High

1. **Check Alerts**: View active alerts on dashboard
2. **Review Dead Letter Queue**: Identify failing jobs
3. **Check External APIs**: View platform health endpoint
4. **Increase Retries**: Modify job configs if needed

### If System is Degraded

1. **Check Database**: Verify database response time
2. **Check Memory**: View resource usage on dashboard
3. **Check External Services**: Review platform API health
4. **Scale Resources**: Increase server capacity if needed

---

## Best Practices

### Daily Monitoring

- ✅ Check dashboard for active alerts
- ✅ Review queue status
- ✅ Monitor job failure rates
- ✅ Verify system health is green

### Weekly Review

- ✅ Analyze performance trends
- ✅ Review bottleneck recommendations
- ✅ Check dead letter queue size
- ✅ Validate alert configurations

### Monthly Maintenance

- ✅ Review and optimize job configs
- ✅ Analyze long-term performance trends
- ✅ Update performance baselines if needed
- ✅ Archive old metrics (automatic)

---

## Quick Reference

### API Endpoints

```bash
# Health
GET /api/health                    # Full system health
GET /api/health?quick=true         # Quick health check
GET /api/health/database           # Database health
GET /api/health/redis              # Redis health
GET /api/health/jobs               # Job queue health
GET /api/health/platforms          # Platform API health

# Metrics
GET /api/metrics                   # All metrics (JSON)
GET /api/metrics?format=prometheus # Prometheus format
GET /api/metrics?jobId=<job-id>    # Job-specific metrics
```

### Job IDs

```
content-generation
project-scheduled-publish
item-scheduled-publish
generate-report
export-data
```

### Health Statuses

- `healthy`: All systems operational
- `degraded`: Some issues detected, system functional
- `unhealthy`: Critical failures, action required

---

## Support

### Documentation

- **Full Guide**: `/docs/MONITORING_IMPLEMENTATION.md`
- **Implementation Summary**: `/docs/PHASE9_IMPLEMENTATION_SUMMARY.md`
- **Quick Start**: `/docs/MONITORING_QUICK_START.md` (this file)

### Getting Help

1. Check troubleshooting section above
2. Review health endpoints for specific issues
3. Check Inngest dashboard for job execution details
4. Review alerts for specific error messages

---

**Last Updated**: 2025-10-03
**Version**: 1.0.0
**Status**: Production Ready
