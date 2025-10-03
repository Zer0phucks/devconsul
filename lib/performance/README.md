# Performance & Scalability Module

Comprehensive database optimization and caching strategy for the Full Self Publishing platform.

## 📦 Components

### 1. **Cache Manager** (`cache-manager.ts`)
- Redis-based caching with Vercel KV
- Automatic cache key generation
- Hit/miss tracking
- Batch operations
- TTL management

### 2. **Rate Limiter** (`rate-limiter.ts`)
- Multi-tier rate limiting (Free/Pro/Enterprise)
- Per-user and per-IP limits
- GitHub API rate tracking
- Platform API quota management
- Standard rate limit headers (X-RateLimit-*)

### 3. **Database Optimization** (`database-optimization.ts`)
- Query result caching
- N+1 query prevention
- Optimized Prisma queries
- Cursor-based pagination
- Performance tracking

### 4. **Connection Pool** (`connection-pool.ts`)
- Optimized Prisma connection pooling
- Read replica preparation
- Connection health monitoring
- Graceful shutdown handlers

### 5. **Query Monitor** (`query-monitor.ts`)
- Real-time query logging
- Slow query detection
- Performance recommendations
- Query statistics

### 6. **Performance Metrics** (`performance-metrics.ts`)
- Comprehensive metrics collection
- Performance scoring (0-100)
- Health checks
- Dashboard data

## 🚀 Quick Start

### 1. Environment Setup

Add to `.env`:

```bash
# Redis (Vercel KV - already configured)
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token

# Performance Monitoring
ENABLE_QUERY_MONITORING=true

# Database Connection Pool
DATABASE_CONNECTION_LIMIT=10
DATABASE_POOL_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=15000

# Optional: Read Replica
DATABASE_READ_REPLICA_URL=postgresql://...
```

### 2. Initialize Performance Monitoring

In your `app/layout.tsx` or main server entry:

```typescript
import {
  initializePerformanceMonitoring,
  enableQueryMonitoring,
} from '@/lib/performance';

// Initialize on server startup
initializePerformanceMonitoring();
enableQueryMonitoring();
```

### 3. Use Caching in API Routes

```typescript
import { getCached, CACHE_KEYS } from '@/lib/performance';

export async function GET(request: Request) {
  const projectId = 'your-project-id';

  // Automatic caching with 15-minute TTL
  const githubActivity = await getCached(
    'GITHUB_ACTIVITY',
    projectId,
    async () => {
      // This only runs on cache miss
      return await fetchGitHubActivity(projectId);
    },
    900 // 15 minutes
  );

  return Response.json(githubActivity);
}
```

### 4. Add Rate Limiting

```typescript
import { rateLimitMiddleware } from '@/lib/performance';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const userId = await getUserId(request); // Your auth logic

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(request, userId);
  if (rateLimitResponse) return rateLimitResponse;

  // Your API logic here
  return Response.json({ success: true });
}
```

### 5. Optimize Database Queries

```typescript
import { executeWithCache, getProjectWithStats } from '@/lib/performance';

// Use pre-optimized queries
const project = await getProjectWithStats(projectId);

// Or create custom cached queries
const data = await executeWithCache(
  'QUERY_CACHE',
  ['custom', id],
  async () => {
    return prisma.yourModel.findMany({
      where: { id },
      include: { relations: true },
    });
  },
  {
    ttl: 300,
    queryName: 'getCustomData',
  }
);
```

## 📊 Performance Targets

### Database Performance
- ✅ Query execution time: <100ms for 95% of queries
- ✅ Connection pool utilization: <80%
- ✅ Zero N+1 query problems
- ✅ Proper index usage on all filtered columns

### Caching Effectiveness
- ✅ Cache hit rate: >70% for GitHub API responses
- ✅ Cache hit rate: >80% for session data
- ✅ Average response time reduction: 50%+ on cached data
- ✅ Clear cache invalidation on updates

### Rate Limiting
- ✅ Graceful degradation with 429 status codes
- ✅ Standard rate limit headers in all responses
- ✅ No API quota exhaustion for external services
- ✅ Per-plan enforcement (Free: 100/min, Pro: 1000/min)

## 🔧 Configuration

### Cache TTL Settings

```typescript
export const CACHE_TTL = {
  SESSION: 60 * 60 * 24,           // 24 hours
  GITHUB_API: 60 * 15,             // 15 minutes
  GENERATED_CONTENT: 60 * 60,      // 1 hour
  PLATFORM_METADATA: 60 * 60 * 24, // 24 hours
  USER_QUOTA: 60 * 60,             // 1 hour
  QUERY_RESULTS: 60 * 5,           // 5 minutes
};
```

### Rate Limit Tiers

```typescript
export const RATE_LIMITS = {
  FREE: 100,         // 100 requests/minute
  PRO: 1000,         // 1000 requests/minute
  ENTERPRISE: 10000, // 10000 requests/minute
  ANONYMOUS: 20,     // 20 requests/minute
};
```

## 📈 Monitoring & Metrics

### Get Performance Dashboard

```typescript
import { getPerformanceDashboard } from '@/lib/performance';

const dashboard = await getPerformanceDashboard();
console.log(dashboard);

// Output:
// {
//   status: 'excellent',
//   score: 92.5,
//   cache: { hitRate: 78.2, health: 'healthy', totalOperations: 1523 },
//   database: { avgQueryTime: 45.3, slowQueries: 2, totalQueries: 248 },
//   recommendations: [],
//   timestamp: '2025-10-03T...'
// }
```

### Generate Performance Report

```typescript
import { generatePerformanceReport } from '@/lib/performance';

const report = await generatePerformanceReport();
console.log(report);

// Creates comprehensive text report with:
// - Overall performance score
// - Cache hit rates
// - Database query statistics
// - System metrics
// - Optimization recommendations
```

### Check Performance Degradation

```typescript
import { isPerformanceDegraded } from '@/lib/performance';

const { degraded, reasons } = await isPerformanceDegraded();

if (degraded) {
  console.warn('Performance degradation detected:', reasons);
  // Send alerts, scale resources, etc.
}
```

## 🔍 Query Optimization

### Pre-Optimized Queries

```typescript
// Get user with projects (prevents N+1)
const user = await getUserWithProjects(userId);

// Get project with stats (prevents N+1)
const project = await getProjectWithStats(projectId);

// Get content with publications (prevents N+1)
const content = await getContentWithPublications(projectId);

// Get platform metrics with aggregations
const metrics = await getPlatformMetrics(projectId, { from, to });
```

### Cursor-Based Pagination

```typescript
import { getContentCursorPaginated } from '@/lib/performance';

// More efficient than offset pagination
const content = await getContentCursorPaginated(projectId, cursor, 20);
```

## 🛡️ Best Practices

### 1. Always Cache External API Calls

```typescript
// ✅ Good: Cache GitHub API calls (15 min TTL)
const activity = await getCached(
  'GITHUB_ACTIVITY',
  [projectId, 'recent'],
  () => octokit.repos.listCommits({ owner, repo }),
  900
);

// ❌ Bad: Direct API call on every request
const activity = await octokit.repos.listCommits({ owner, repo });
```

### 2. Use Batch Operations

```typescript
// ✅ Good: Batch fetch from cache
const results = await getBatchCached('PLATFORM_META', platformIds);

// ❌ Bad: Individual cache calls in loop
for (const id of platformIds) {
  await getCached('PLATFORM_META', id, ...);
}
```

### 3. Cache Invalidation

```typescript
// Invalidate specific cache
await deleteCached('GITHUB_ACTIVITY', projectId);

// Invalidate pattern
await invalidatePattern('GITHUB_ACTIVITY', `${projectId}:*`);
```

### 4. Monitor Slow Queries

```typescript
import { getSlowQueries, queryMonitor } from '@/lib/performance';

// Get slow queries
const slowQueries = getSlowQueries(10);

// Get query statistics
const stats = queryMonitor.getStatistics();
```

## 📝 Database Indexes

The schema already includes 25+ strategic indexes. Additional performance-critical indexes to consider:

```prisma
// Content search optimization
@@index([projectId, status, publishedAt])
@@index([projectId, tags])

// Platform metrics aggregation
@@index([projectId, platformType, periodStart])

// Analytics queries
@@index([projectId, createdAt, status])

// Repository insights
@@index([projectId, periodStart, periodEnd])
```

## 🔄 Cache Warming

Pre-populate cache with common queries:

```typescript
import { warmCache } from '@/lib/performance';

await warmCache([
  {
    prefix: 'PLATFORM_META',
    identifier: 'global-config',
    value: platformConfig,
    ttl: 86400,
  },
  {
    prefix: 'USER_QUOTA',
    identifier: userId,
    value: userQuota,
    ttl: 3600,
  },
]);
```

## 🚨 Error Handling

All performance utilities use fail-open approach:
- Cache errors: Fall back to database
- Rate limit errors: Allow request
- Redis connection errors: Log and continue

## 📚 API Reference

See individual module files for detailed API documentation:
- `cache-manager.ts` - Cache operations
- `rate-limiter.ts` - Rate limiting
- `database-optimization.ts` - Query optimization
- `query-monitor.ts` - Query monitoring
- `performance-metrics.ts` - Metrics collection

## 🔗 Integration Examples

See `index.ts` for complete integration examples and setup guide.
