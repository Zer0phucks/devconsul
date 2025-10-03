# Database Migration Guide - Phase 9 Monitoring System

**Status**: Schema ready, migration pending database availability
**Date**: 2025-10-03
**Version**: 1.0.0

---

## Overview

The monitoring system schema has been successfully added to the main Prisma schema file. This document provides instructions for completing the database migration when your database server is available.

## Prerequisites

- PostgreSQL database server running and accessible
- Database credentials configured in `.env` file
- Prisma CLI installed (`npx prisma` available)

## Schema Changes

The following models have been added to `/home/noob/fullselfpublishing/prisma/schema.prisma`:

### 1. JobMetrics
**Purpose**: Track job execution metrics and performance statistics

**Fields**:
- `jobId` (unique): Identifier for the job type (e.g., "content-generation")
- `totalExecutions`: Count of total job executions
- `successCount` / `failureCount`: Success/failure tracking
- `totalDurationMs`: Cumulative execution time
- `minDurationMs` / `maxDurationMs`: Performance bounds
- `lastExecutionAt` / `lastSuccessAt` / `lastFailureAt`: Timestamps
- `metadata`: JSON field for additional metrics

### 2. PerformanceBaseline
**Purpose**: Store baseline performance metrics for regression detection

**Fields**:
- `jobId` (unique): Job identifier
- `baselineAvgMs`: Average execution time baseline
- `baselineP95Ms`: 95th percentile baseline
- `sampleSize`: Number of executions used for baseline

### 3. DeadLetterQueue
**Purpose**: Track failed jobs for retry processing

**Fields**:
- `jobId`: Job identifier
- `eventData`: Original job event data (JSON)
- `error`: Error message
- `status`: PENDING, PROCESSING, SUCCEEDED, FAILED
- `attempts`: Retry attempt counter
- `lastAttemptAt` / `processedAt`: Timing information

### 4. Alert
**Purpose**: Track system alerts and their resolution status

**Fields**:
- `type`: Alert type (system_health, job_failure, etc.)
- `severity`: CRITICAL, ERROR, WARNING, INFO
- `title` / `message`: Alert details
- `resolved` / `resolvedAt`: Resolution tracking
- `metadata`: JSON field for alert context

## Migration Steps

### Step 1: Verify Database Connection

Ensure your database is running and accessible:

```bash
# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection (should show tables)
npx prisma db pull --print
```

### Step 2: Run Migration

Execute the migration to create the monitoring tables:

```bash
npx prisma migrate dev --name add-monitoring-tables
```

**Expected Output**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database...

Applying migration `20251003_add_monitoring_tables`
The following migrations have been applied:

migrations/
  └─ 20251003_add_monitoring_tables/
     └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Step 3: Generate Prisma Client

Regenerate the Prisma Client with the new models:

```bash
npx prisma generate
```

**Expected Output**:
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### Step 4: Verify Migration

Check that all tables were created successfully:

```bash
# List all tables
npx prisma db pull --print | grep -E "(job_metrics|performance_baselines|dead_letter_queue|alerts)"

# Or use Prisma Studio to view the schema
npx prisma studio
```

You should see the following new tables:
- `job_metrics`
- `performance_baselines`
- `dead_letter_queue`
- `alerts`

## Rollback (If Needed)

If you need to rollback the migration:

```bash
# View migration history
npx prisma migrate status

# Rollback to previous migration
npx prisma migrate resolve --rolled-back add-monitoring-tables

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset
```

## Post-Migration Validation

After successful migration, validate the system:

### 1. Check Schema

```bash
# Verify schema is in sync
npx prisma validate
```

### 2. Test Prisma Client

Create a simple test script to verify the models are accessible:

```typescript
// test-monitoring-schema.ts
import { prisma } from '@/lib/db';

async function testSchema() {
  // Test JobMetrics
  const jobs = await prisma.jobMetrics.findMany();
  console.log('JobMetrics accessible:', jobs.length >= 0);

  // Test PerformanceBaseline
  const baselines = await prisma.performanceBaseline.findMany();
  console.log('PerformanceBaseline accessible:', baselines.length >= 0);

  // Test DeadLetterQueue
  const dlq = await prisma.deadLetterQueue.findMany();
  console.log('DeadLetterQueue accessible:', dlq.length >= 0);

  // Test Alert
  const alerts = await prisma.alert.findMany();
  console.log('Alert accessible:', alerts.length >= 0);

  console.log('✅ All monitoring models accessible');
}

testSchema()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the test:

```bash
npx tsx test-monitoring-schema.ts
```

### 3. Test Monitoring Endpoints

Once the database is migrated, test the monitoring system:

```bash
# Quick health check
curl http://localhost:3000/api/health?quick=true

# Full metrics
curl http://localhost:3000/api/metrics

# Job-specific metrics
curl http://localhost:3000/api/metrics?jobId=content-generation
```

## Common Issues and Solutions

### Issue 1: Database Connection Error
**Error**: `Can't reach database server at localhost:5432`

**Solutions**:
1. Ensure PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Docker
2. Verify DATABASE_URL in `.env` is correct
3. Check firewall allows connection to port 5432
4. For Docker: `docker-compose up -d postgres`

### Issue 2: Migration Conflict
**Error**: `Migration already applied`

**Solution**:
```bash
# Mark migration as applied without running
npx prisma migrate resolve --applied add-monitoring-tables
```

### Issue 3: Schema Out of Sync
**Error**: `Database schema is not in sync`

**Solution**:
```bash
# Pull current schema and compare
npx prisma db pull

# Push schema changes
npx prisma db push
```

### Issue 4: Prisma Client Generation Fails
**Error**: `Unable to generate Prisma Client`

**Solution**:
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstall and regenerate
npm install @prisma/client
npx prisma generate
```

## Migration File

The migration will create the following SQL file at:
`/home/noob/fullselfpublishing/prisma/migrations/YYYYMMDDHHMMSS_add_monitoring_tables/migration.sql`

**Contents** (approximate):

```sql
-- CreateTable
CREATE TABLE "job_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "totalDurationMs" BIGINT NOT NULL DEFAULT 0,
    "minDurationMs" INTEGER NOT NULL DEFAULT 0,
    "maxDurationMs" INTEGER NOT NULL DEFAULT 0,
    "lastExecutionAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "baselineAvgMs" DOUBLE PRECISION NOT NULL,
    "baselineP95Ms" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "dead_letter_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "job_metrics_jobId_key" ON "job_metrics"("jobId");
CREATE INDEX "job_metrics_jobId_idx" ON "job_metrics"("jobId");
CREATE INDEX "job_metrics_lastExecutionAt_idx" ON "job_metrics"("lastExecutionAt");

CREATE UNIQUE INDEX "performance_baselines_jobId_key" ON "performance_baselines"("jobId");
CREATE INDEX "performance_baselines_jobId_idx" ON "performance_baselines"("jobId");

CREATE INDEX "dead_letter_queue_jobId_idx" ON "dead_letter_queue"("jobId");
CREATE INDEX "dead_letter_queue_status_idx" ON "dead_letter_queue"("status");
CREATE INDEX "dead_letter_queue_createdAt_idx" ON "dead_letter_queue"("createdAt");

CREATE INDEX "alerts_type_idx" ON "alerts"("type");
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");
CREATE INDEX "alerts_resolved_idx" ON "alerts"("resolved");
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");
```

## Next Steps After Migration

Once the database migration is complete:

1. **Start Development Server**: `npm run dev`

2. **Test Health Endpoints**:
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/health/database
   curl http://localhost:3000/api/health/jobs
   ```

3. **View Performance Dashboard**: Navigate to `http://localhost:3000/admin/performance`

4. **Trigger Test Jobs**: Execute some jobs to generate initial metrics

5. **Verify Monitoring**: Check that metrics are being collected and displayed

6. **Configure Alerts**: Set up alert channels (webhook, email, Slack) in `.env`

## Environment Variables for Alerts

After migration, configure alert channels:

```env
# Alert Webhooks
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
ALERT_EMAIL_RECIPIENTS=admin@example.com,ops@example.com
```

## Support and Documentation

- **Full Implementation Guide**: `/docs/MONITORING_IMPLEMENTATION.md`
- **Quick Start Guide**: `/docs/MONITORING_QUICK_START.md`
- **Implementation Summary**: `/docs/PHASE9_IMPLEMENTATION_SUMMARY.md`

---

**Migration Prepared**: 2025-10-03
**Schema Version**: 1.0.0
**Status**: Ready for execution when database is available
