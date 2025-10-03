# Database Schema Documentation

## Overview

Full Self Publishing platform uses PostgreSQL with Prisma ORM for type-safe database operations.

## Schema Structure

### Core Models

#### User Management
- **User**: User accounts with authentication and preferences
- **Account**: OAuth provider accounts (NextAuth)
- **Session**: User sessions (NextAuth)
- **VerificationToken**: Email verification tokens

#### Project Management
- **Project**: GitHub-connected projects with sync configuration
- **Platform**: Publishing platform integrations (Hashnode, Dev.to, Medium, etc.)
- **Settings**: User and project-level configuration

#### Content Management
- **Content**: Blog posts and content with versioning support
- **ContentPublication**: Many-to-many relationship tracking content published to platforms

#### Automation
- **CronJob**: Scheduled job definitions (sync, publish, generate)
- **CronExecution**: Job execution logs and metrics

#### Analytics
- **AuditLog**: System-wide audit trail for all actions

## Database Setup

### Prerequisites

- PostgreSQL 14+ (local, Supabase, or Neon)
- Node.js 18+
- npm or yarn

### Environment Configuration

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/fullselfpublishing?schema=public"

# For Supabase
# DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# For Neon
# DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/neondb"
```

### Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations (when database is available)
npm run db:migrate

# Seed development data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset

# Validate schema and connection
npx tsx scripts/validate-db.ts
```

## Schema Features

### Multi-tenancy
All data is isolated by `userId` to ensure proper multi-tenant support.

### Indexes
Optimized indexes on:
- Foreign keys (userId, projectId, platformId, etc.)
- Status fields for filtering
- Timestamps for sorting and filtering
- Composite indexes for common query patterns

### Relationships
- **Cascade Deletes**: Deleting a user/project removes all related data
- **Version Control**: Content supports parent-child versioning
- **Many-to-Many**: Content-Platform relationships via ContentPublication

### Data Types
- **JSON**: Flexible configuration storage (preferences, metadata, settings)
- **Text**: Large content fields (body, rawContent, htmlContent)
- **Arrays**: Tags, categories, notification events
- **Enums**: Type-safe status and type fields

## Common Queries

### Get user with projects
```typescript
const user = await db.user.findUnique({
  where: { email: 'user@example.com' },
  include: {
    projects: {
      include: {
        platforms: true,
        content: true,
      },
    },
  },
});
```

### Get published content for a project
```typescript
const content = await db.content.findMany({
  where: {
    projectId: 'project-id',
    status: 'PUBLISHED',
  },
  include: {
    publications: {
      include: {
        platform: true,
      },
    },
  },
  orderBy: {
    publishedAt: 'desc',
  },
});
```

### Get platform connection status
```typescript
const platforms = await db.platform.findMany({
  where: {
    projectId: 'project-id',
    isConnected: true,
  },
  select: {
    id: true,
    type: true,
    name: true,
    lastConnectedAt: true,
    totalPublished: true,
  },
});
```

### Create content with transaction
```typescript
import { executeTransaction } from '@/lib/db';

const result = await executeTransaction(async (tx) => {
  const content = await tx.content.create({
    data: {
      projectId: 'project-id',
      title: 'My Post',
      body: 'Content...',
      rawContent: 'Content...',
      sourceType: 'MANUAL',
      status: 'DRAFT',
    },
  });

  await tx.auditLog.create({
    data: {
      userId: 'user-id',
      action: 'create',
      resource: 'CONTENT',
      resourceId: content.id,
      newValues: { title: content.title },
    },
  });

  return content;
});
```

## Performance Optimization

### Connection Pooling
The database client (`lib/db.ts`) implements singleton pattern to prevent connection exhaustion.

### Query Optimization
- Use `select` to fetch only needed fields
- Use `include` judiciously to avoid N+1 queries
- Leverage indexes for filtered queries
- Use cursor-based pagination for large datasets

### Caching Strategy
- Cache frequently accessed data (user settings, platform configs)
- Invalidate cache on mutations
- Use Vercel KV or Redis for session cache

## Migration Strategy

### Development
```bash
# Create new migration
npx prisma migrate dev --name feature-name

# Reset and apply all migrations
npx prisma migrate reset
```

### Production
```bash
# Deploy migrations (no prompts)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Seed Data

The seed script (`prisma/seed.ts`) creates:
- 2 test users (demo@fullselfpublishing.com / test@example.com)
- 3 projects with GitHub integration
- 4 platform connections (Hashnode, Dev.to, Medium, Newsletter)
- 4 content items (published, scheduled, draft, AI-generated)
- Settings and cron jobs with execution history

**Default password**: `password123`

## Database Client Usage

```typescript
import { db } from '@/lib/db';

// Simple query
const users = await db.user.findMany();

// With transaction retry
import { executeTransaction } from '@/lib/db';

await executeTransaction(async (tx) => {
  // Your transactional operations
});

// Health check
import { checkDbConnection } from '@/lib/db';

const health = await checkDbConnection();
```

## Security Considerations

### Credentials
- Never commit `.env` file
- Use environment variables for all sensitive data
- Rotate API keys and tokens regularly

### Data Protection
- Encrypt API tokens and secrets in production
- Use SSL/TLS for database connections
- Implement row-level security (RLS) for Supabase

### Audit Trail
All mutations are tracked in `AuditLog` with:
- User identification
- Action type and resource
- Before/after values
- Timestamp and context

## Troubleshooting

### Connection Issues
```bash
# Test connection
npx tsx scripts/validate-db.ts

# Check Prisma status
npx prisma db pull
```

### Schema Drift
```bash
# Compare schema with database
npx prisma db pull

# Generate new migration if needed
npx prisma migrate dev
```

### Type Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in your IDE
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [NextAuth.js with Prisma](https://next-auth.js.org/adapters/prisma)
