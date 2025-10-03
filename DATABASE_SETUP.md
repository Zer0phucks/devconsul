# Database Setup - Quick Start Guide

## Phase 1.1: Database Schema & ORM Setup ✅

### What Was Implemented

#### 1. Complete Prisma Schema (`/prisma/schema.prisma`)
- **User Management**: Users, Accounts, Sessions, VerificationTokens (NextAuth compatible)
- **Projects**: GitHub repository connections with sync configuration
- **Platforms**: OAuth integrations for 7 platforms (Hashnode, Dev.to, Medium, LinkedIn, Twitter, RSS, Newsletter)
- **Content**: Blog posts with versioning, AI generation support, and multi-platform publishing
- **Settings**: User and project-level configuration with cron scheduling
- **Automation**: CronJobs and execution tracking for scheduled tasks
- **Analytics**: Audit logs for complete system activity tracking

#### 2. Database Client (`/lib/db.ts`)
- Singleton pattern for connection pooling
- Production-ready configuration
- Health check utilities
- Transaction helpers with automatic retry logic
- Graceful shutdown handling

#### 3. Seed Data (`/prisma/seed.ts`)
- 2 test users with sample credentials
- 3 projects (2 with GitHub integration)
- 4 platform connections across different types
- 4 content items (published, scheduled, draft, AI-generated)
- Content publications to multiple platforms
- Settings with cron configuration
- 3 cron jobs with execution history
- Audit logs for tracking

#### 4. Validation Script (`/scripts/validate-db.ts`)
- Connection testing
- Schema structure validation
- Index verification
- Relationship testing
- Enum validation

#### 5. Documentation
- Comprehensive schema documentation (`/prisma/README.md`)
- Common query examples
- Performance optimization guidelines
- Security best practices

### Key Features

#### Multi-Tenancy Support
- All data isolated by `userId`
- Cascade deletes for data cleanup
- Row-level security ready

#### Performance Optimizations
- 25+ strategic indexes on foreign keys, status fields, and timestamps
- Connection pooling via singleton pattern
- Optimized for read-heavy workloads

#### Type Safety
- Full TypeScript types generated from schema
- Enum types for status fields
- Strict relationship definitions

#### Scalability
- JSON fields for flexible configuration
- Version control for content
- Audit trail for all actions
- Execution logs for debugging

## Quick Start

### 1. Database Setup (when database is available)

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 2. Validate Setup

```bash
# Run validation script
npm run db:validate

# Open Prisma Studio (database GUI)
npm run db:studio
```

### 3. Test Credentials

```
Email: demo@fullselfpublishing.com
Password: password123
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Populate database with test data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database (⚠️ deletes all data) |
| `npm run db:validate` | Test schema and connection |

## File Structure

```
/prisma/
  ├── schema.prisma           # Complete database schema
  ├── seed.ts                 # Development seed data
  ├── README.md              # Detailed documentation
  └── migrations/            # Migration history (when run)

/lib/
  └── db.ts                  # Database client with utilities

/scripts/
  └── validate-db.ts         # Schema validation script
```

## Database Schema Overview

### Tables (14 total)

1. **users** - User accounts and preferences
2. **accounts** - OAuth provider accounts
3. **sessions** - User sessions
4. **verification_tokens** - Email verification
5. **projects** - GitHub-connected projects
6. **platforms** - Publishing platform integrations
7. **content** - Blog posts and articles
8. **content_publications** - Content-to-platform mapping
9. **settings** - Configuration and preferences
10. **cron_jobs** - Scheduled automation tasks
11. **cron_executions** - Job execution logs
12. **audit_logs** - System activity tracking

### Enums (10 total)

- ProjectStatus: ACTIVE, PAUSED, ARCHIVED, DELETED
- Visibility: PUBLIC, PRIVATE, UNLISTED
- PlatformType: HASHNODE, DEVTO, MEDIUM, LINKEDIN, TWITTER, RSS_FEED, NEWSLETTER
- ContentSourceType: GITHUB_MARKDOWN, GITHUB_MDX, AI_GENERATED, MANUAL, IMPORT
- ContentStatus: DRAFT, SCHEDULED, PUBLISHED, FAILED, ARCHIVED
- PublicationStatus: PENDING, PUBLISHING, PUBLISHED, FAILED, RETRYING
- SettingsScope: USER, PROJECT, PLATFORM
- CronJobType: SYNC_GITHUB, PUBLISH_CONTENT, GENERATE_CONTENT, CLEANUP, ANALYTICS, CUSTOM
- CronJobStatus: IDLE, RUNNING, COMPLETED, FAILED, DISABLED
- ExecutionStatus: RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT
- AuditResource: USER, PROJECT, PLATFORM, CONTENT, SETTINGS, CRON_JOB

## Usage Examples

### Basic Queries

```typescript
import { db } from '@/lib/db';

// Get user with projects
const user = await db.user.findUnique({
  where: { email: 'demo@fullselfpublishing.com' },
  include: { projects: true },
});

// Get published content
const content = await db.content.findMany({
  where: {
    projectId: 'project-id',
    status: 'PUBLISHED'
  },
  orderBy: { publishedAt: 'desc' },
});

// Get platform connections
const platforms = await db.platform.findMany({
  where: {
    projectId: 'project-id',
    isConnected: true
  },
});
```

### Transactions

```typescript
import { executeTransaction } from '@/lib/db';

const result = await executeTransaction(async (tx) => {
  const content = await tx.content.create({
    data: { /* ... */ },
  });

  await tx.auditLog.create({
    data: {
      action: 'create',
      resource: 'CONTENT',
      resourceId: content.id,
    },
  });

  return content;
});
```

## Next Steps

1. **Start database server** (Prisma Postgres, Supabase, or Neon)
2. **Run migrations**: `npm run db:migrate`
3. **Seed data**: `npm run db:seed`
4. **Validate setup**: `npm run db:validate`
5. **Begin Phase 1.2**: Authentication implementation

## Support

- See `/prisma/README.md` for detailed documentation
- Check `/scripts/validate-db.ts` for connection testing
- Use `npm run db:studio` to browse data visually

## Production Deployment

### Environment Variables Required

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Deployment Steps

```bash
# Generate client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

### Security Checklist

- ✅ Encrypt API tokens and secrets
- ✅ Use SSL/TLS for database connections
- ✅ Implement row-level security (if using Supabase)
- ✅ Rotate credentials regularly
- ✅ Never commit `.env` file
- ✅ Use connection pooling
- ✅ Enable audit logging

---

**Status**: ✅ Phase 1.1 Complete - Ready for Phase 1.2 (Authentication)
