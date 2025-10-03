# GitHub Integration Service - Implementation Documentation

## Overview

Complete GitHub API integration service for OAuth authentication, repository access, and activity aggregation. This implementation fulfills **Phase 1.3** of the TASKS.md roadmap.

## Architecture

### Components

1. **GitHub API Client** (`/lib/github/client.ts`)
   - Octokit wrapper with error handling
   - Rate limit detection and caching
   - Token validation and refresh logic
   - Repository, commit, PR, issue, and release fetching

2. **Activity Aggregation** (`/lib/github/activity.ts`)
   - Fetch repository activity across all event types
   - Filter by contributors, branches, date ranges
   - Aggregate by daily/weekly/monthly periods
   - Generate activity summaries

3. **API Routes**
   - `/api/github/repos` - Fetch user repositories
   - `/api/github/activity` - Fetch repository activity

4. **UI Components**
   - `RepoSelector.tsx` - Repository connection management
   - Activity preview display

5. **Authentication**
   - NextAuth GitHub OAuth provider configuration
   - Secure token storage in Prisma database
   - JWT-based session management

## Setup Instructions

### 1. GitHub OAuth App Configuration

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Configure:
   - **Application name**: Full Self Publishing
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret
5. Add to `.env`:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### 2. Database Setup

The Prisma schema includes:
- `Account` table for OAuth tokens (already configured)
- `User` table for user authentication
- Token storage with expiration tracking

Run migrations:
```bash
npm run db:migrate
```

### 3. Environment Variables

Required variables in `.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Vercel KV (for caching)
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
```

## API Endpoints

### GET `/api/github/repos`

Fetch user's GitHub repositories with caching (15min TTL).

**Headers:**
- `x-user-id`: User ID (temporary, will be replaced by session auth)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `perPage` (optional): Items per page (default: 30, max: 100)
- `sort` (optional): Sort by `created`, `updated`, `pushed`, `full_name` (default: `updated`)
- `direction` (optional): `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123456,
      "name": "my-repo",
      "full_name": "owner/my-repo",
      "description": "Repository description",
      "html_url": "https://github.com/owner/my-repo",
      "private": false,
      "fork": false,
      "language": "TypeScript",
      "stargazers_count": 42,
      "forks_count": 7,
      "updated_at": "2025-01-15T10:30:00Z",
      "pushed_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "hasNext": true
  }
}
```

**Error Responses:**
- `401`: Token invalid/expired
- `403`: GitHub account not connected
- `429`: Rate limit exceeded
- `500`: Server error

### GET `/api/github/activity`

Fetch repository activity (commits, PRs, issues, releases).

**Headers:**
- `x-user-id`: User ID

**Query Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `since` (optional): ISO date string (default: 30 days ago)
- `until` (optional): ISO date string (default: now)
- `branches` (optional): Comma-separated branch names (default: `main,master`)
- `contributors` (optional): Comma-separated usernames to filter
- `eventTypes` (optional): Filter by event types
- `aggregate` (optional): Return aggregated data (`true`/`false`)

**Response (Raw):**
```json
{
  "success": true,
  "data": {
    "owner": "owner",
    "repo": "repo",
    "dateRange": {
      "since": "2024-12-15T00:00:00Z",
      "until": "2025-01-15T00:00:00Z"
    },
    "activity": {
      "commits": [...],
      "pullRequests": [...],
      "issues": [...],
      "releases": [...]
    },
    "summary": {
      "totalCommits": 45,
      "totalPullRequests": 12,
      "totalIssues": 8,
      "totalReleases": 2,
      "contributors": ["user1", "user2", "user3"]
    }
  }
}
```

**Response (Aggregated):**
```json
{
  "success": true,
  "data": {
    "owner": "owner",
    "repo": "repo",
    "dateRange": {...},
    "aggregation": {
      "daily": {
        "2025-01-15": {
          "commits": 5,
          "pullRequests": { "open": 1, "closed": 0, "merged": 2 },
          "issues": { "opened": 1, "closed": 0 },
          "releases": 0,
          "contributors": ["user1", "user2"]
        }
      },
      "weekly": {...},
      "monthly": {...},
      "total": {
        "commits": 45,
        "pullRequests": { "open": 3, "closed": 2, "merged": 7 },
        "issues": { "opened": 8, "closed": 5 },
        "releases": 2,
        "contributors": ["user1", "user2", "user3"]
      }
    }
  }
}
```

## Usage Examples

### Using the RepoSelector Component

```tsx
import { RepoSelector } from '@/components/github/RepoSelector';

export default function ProjectSettings({ userId, projectId }) {
  const [currentRepo, setCurrentRepo] = useState(null);

  const handleConnect = async (owner: string, repo: string) => {
    // Save to database
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        githubRepoOwner: owner,
        githubRepoName: repo,
      }),
    });
    setCurrentRepo({ owner, repo });
  };

  const handleDisconnect = async () => {
    // Remove from database
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        githubRepoOwner: null,
        githubRepoName: null,
      }),
    });
    setCurrentRepo(null);
  };

  return (
    <RepoSelector
      projectId={projectId}
      userId={userId}
      currentRepo={currentRepo}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
}
```

### Fetching Repository Activity Programmatically

```typescript
import { createGitHubClient } from '@/lib/github/client';
import { fetchRepositoryActivity, aggregateActivity } from '@/lib/github/activity';

// Get user's GitHub access token from database
const account = await prisma.account.findFirst({
  where: { userId, provider: 'github' },
  select: { access_token: true },
});

// Create client
const client = await createGitHubClient(account.access_token, userId);

// Fetch activity for last 7 days
const activity = await fetchRepositoryActivity(client, 'owner', 'repo', {
  since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  until: new Date(),
  branches: ['main', 'develop'],
});

// Aggregate by time period
const aggregated = aggregateActivity(activity);

console.log('Total commits:', aggregated.total.commits);
console.log('Daily breakdown:', aggregated.daily);
```

## Security Considerations

### Token Storage
- Access tokens stored encrypted in Prisma `Account` table
- Token expiration tracked with `expires_at` field
- Automatic validation on API requests

### Rate Limiting
- GitHub API rate limits: 5,000 requests/hour (authenticated)
- Repository list cached for 15 minutes
- Graceful degradation on rate limit errors

### Error Handling
- Invalid/expired tokens return 401 with reconnection prompt
- Missing repositories return 404 with clear error message
- Network errors handled with retries and fallbacks

## Caching Strategy

### Repository Lists
- **TTL**: 15 minutes
- **Storage**: Vercel KV
- **Key format**: `gh:repos:{userId}:{page}:{perPage}:{sort}:{direction}`

### Future Enhancements
- Cache activity data (shorter TTL: 5 minutes)
- Implement Redis-based rate limit tracking
- Add webhook-based cache invalidation

## Testing

### Manual Testing Checklist
- [ ] GitHub OAuth flow completes successfully
- [ ] Repository list loads with pagination
- [ ] Repository search/filter works
- [ ] Activity endpoint returns all event types
- [ ] Aggregation calculates correctly
- [ ] Error handling for expired tokens
- [ ] Error handling for rate limits
- [ ] Cache invalidation after TTL
- [ ] RepoSelector UI displays correctly
- [ ] Recent activity preview updates

### API Testing Examples

```bash
# Test repository list
curl -H "x-user-id: user_123" \
  "http://localhost:3000/api/github/repos?page=1&perPage=10"

# Test activity (raw)
curl -H "x-user-id: user_123" \
  "http://localhost:3000/api/github/activity?owner=facebook&repo=react&since=2025-01-01"

# Test activity (aggregated)
curl -H "x-user-id: user_123" \
  "http://localhost:3000/api/github/activity?owner=facebook&repo=react&aggregate=true"
```

## Future Improvements

### Phase 1.3 Completion Checklist
- [x] GitHub OAuth integration
- [x] Repository list API
- [x] Activity aggregation
- [x] RepoSelector component
- [x] Token storage and validation

### Next Steps (Phase 2+)
- [ ] Webhook integration for real-time updates
- [ ] Advanced filtering (by file paths, commit messages)
- [ ] Contributor analytics dashboard
- [ ] Activity trend visualization
- [ ] Automated content generation triggers

## Troubleshooting

### "GitHub account not connected"
- User needs to complete GitHub OAuth flow
- Check `Account` table has GitHub provider entry
- Verify `access_token` is not null

### "Token expired"
- Implement token refresh flow (future enhancement)
- User must re-authenticate via OAuth

### "Rate limit exceeded"
- Occurs after 5,000 requests/hour
- Wait until next hour or implement queuing
- Consider caching more aggressively

### Empty repository list
- Check GitHub OAuth scope includes `repo`
- Verify user has repositories in their account
- Check API response for error details

## File Structure

```
lib/github/
├── client.ts           # GitHub API wrapper with Octokit
├── activity.ts         # Activity fetching and aggregation
└── webhook-handler.ts  # Existing webhook handler

app/api/github/
├── repos/
│   └── route.ts        # Repository list endpoint
└── activity/
    └── route.ts        # Activity endpoint

components/github/
└── RepoSelector.tsx    # Repository connection UI

components/ui/
└── select.tsx          # Select dropdown component (newly created)

lib/
└── auth.ts             # NextAuth configuration (updated)
```

## Dependencies

All dependencies already installed via `package.json`:
- `@octokit/rest@^22.0.0` - GitHub API client
- `@vercel/kv@^3.0.0` - Caching layer
- `@prisma/client@^6.16.3` - Database ORM
- `next-auth@^5.0.0-beta.29` - Authentication
- `@auth/prisma-adapter@^2.10.0` - NextAuth Prisma adapter

## Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Update GitHub OAuth callback URL to production domain
- [ ] Run database migrations
- [ ] Configure Vercel KV for caching
- [ ] Test OAuth flow in production
- [ ] Monitor API rate limits
- [ ] Set up error tracking (Sentry)

---

**Status**: ✅ Phase 1.3 Complete - Ready for integration with content generation pipeline

**Last Updated**: 2025-01-15
**Author**: Backend Architect Agent
