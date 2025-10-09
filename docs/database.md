# Database Schema Documentation

## Overview

The DevConsul application uses Supabase (PostgreSQL) as its database backend. The schema is designed to support social media monitoring, pain point extraction, GitHub integration, and devlog publishing.

## Tables

### profiles

Extends Supabase's `auth.users` table with additional user profile information.

**Columns:**
- `id` (UUID, PK): References auth.users(id)
- `email` (TEXT, NOT NULL): User's email address
- `full_name` (TEXT): User's full name
- `avatar_url` (TEXT): URL to user's avatar image
- `created_at` (TIMESTAMP): Profile creation timestamp
- `updated_at` (TIMESTAMP): Last profile update timestamp

**RLS Policies:**
- Users can view their own profile
- Users can update their own profile

---

### social_connections

Stores OAuth connections to social media platforms (Reddit, LinkedIn, Twitter).

**Columns:**
- `id` (UUID, PK): Unique connection identifier
- `user_id` (UUID, FK): References profiles(id)
- `platform` (TEXT, NOT NULL): Platform name (reddit, linkedin, twitter)
- `platform_user_id` (TEXT): Platform-specific user ID
- `platform_username` (TEXT): Platform username
- `access_token` (TEXT): OAuth access token (encrypted)
- `refresh_token` (TEXT): OAuth refresh token (encrypted)
- `token_expires_at` (TIMESTAMP): Token expiration time
- `status` (TEXT): Connection status (active, expired, revoked)
- `metadata` (JSONB): Additional platform-specific data
- `created_at` (TIMESTAMP): Connection creation timestamp
- `updated_at` (TIMESTAMP): Last connection update timestamp

**Constraints:**
- UNIQUE(user_id, platform): One connection per platform per user
- CHECK: platform IN ('reddit', 'linkedin', 'twitter')
- CHECK: status IN ('active', 'expired', 'revoked')

**Indexes:**
- `idx_social_connections_user_id` on user_id

**RLS Policies:**
- Users can view, insert, update, and delete their own connections

---

### pain_points

Stores pain points extracted from social media content.

**Columns:**
- `id` (UUID, PK): Unique pain point identifier
- `user_id` (UUID, FK): References profiles(id)
- `source_platform` (TEXT, NOT NULL): Platform where pain point was found
- `source_url` (TEXT): URL to original post/comment
- `content` (TEXT, NOT NULL): Raw content of the pain point
- `extracted_summary` (TEXT): AI-generated summary
- `sentiment` (TEXT): Sentiment analysis (positive, neutral, negative)
- `sentiment_score` (DECIMAL): Numerical sentiment score (-1.0 to 1.0)
- `category` (TEXT): Pain point category
- `priority` (TEXT): Priority level (low, medium, high, critical)
- `status` (TEXT): Processing status (new, reviewing, approved, rejected, resolved)
- `tags` (TEXT[]): Array of tags for categorization
- `metadata` (JSONB): Additional metadata
- `created_at` (TIMESTAMP): Pain point creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- CHECK: source_platform IN ('reddit', 'linkedin', 'twitter')
- CHECK: sentiment IN ('positive', 'neutral', 'negative')
- CHECK: priority IN ('low', 'medium', 'high', 'critical')
- CHECK: status IN ('new', 'reviewing', 'approved', 'rejected', 'resolved')

**Indexes:**
- `idx_pain_points_user_id` on user_id
- `idx_pain_points_status` on status
- `idx_pain_points_created_at` on created_at (DESC)

**RLS Policies:**
- Users can view, insert, update, and delete their own pain points

---

### github_repos

Stores GitHub repository connections for automated issue creation.

**Columns:**
- `id` (UUID, PK): Unique repository identifier
- `user_id` (UUID, FK): References profiles(id)
- `repo_name` (TEXT, NOT NULL): Repository name
- `repo_full_name` (TEXT, NOT NULL): Full repository name (owner/repo)
- `installation_id` (TEXT): GitHub App installation ID
- `webhook_secret` (TEXT): Webhook secret for verification
- `is_active` (BOOLEAN): Whether repo is active
- `metadata` (JSONB): Additional repository metadata
- `created_at` (TIMESTAMP): Repository connection timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- UNIQUE(user_id, repo_full_name): One connection per repo per user

**Indexes:**
- `idx_github_repos_user_id` on user_id

**RLS Policies:**
- Users can view, insert, update, and delete their own repos

---

### github_issues

Links pain points to GitHub issues created in connected repositories.

**Columns:**
- `id` (UUID, PK): Unique issue record identifier
- `pain_point_id` (UUID, FK): References pain_points(id)
- `repo_id` (UUID, FK): References github_repos(id)
- `issue_number` (INTEGER, NOT NULL): GitHub issue number
- `issue_url` (TEXT, NOT NULL): URL to GitHub issue
- `status` (TEXT): Issue status (open, closed, merged)
- `metadata` (JSONB): Additional issue metadata
- `created_at` (TIMESTAMP): Issue record creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- CHECK: status IN ('open', 'closed', 'merged')

**Indexes:**
- `idx_github_issues_pain_point_id` on pain_point_id

**RLS Policies:**
- Users can view, insert, update, and delete issues for their own pain points

---

### devlog_posts

Stores devlog posts for publishing to social media platforms.

**Columns:**
- `id` (UUID, PK): Unique post identifier
- `user_id` (UUID, FK): References profiles(id)
- `content` (TEXT, NOT NULL): Post content
- `platform` (TEXT): Target platform (currently twitter only)
- `platform_post_id` (TEXT): Platform-specific post ID after publishing
- `status` (TEXT): Post status (draft, scheduled, published, failed)
- `scheduled_for` (TIMESTAMP): Scheduled publication time
- `published_at` (TIMESTAMP): Actual publication timestamp
- `metadata` (JSONB): Additional post metadata
- `created_at` (TIMESTAMP): Post creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- CHECK: platform IN ('twitter')
- CHECK: status IN ('draft', 'scheduled', 'published', 'failed')

**Indexes:**
- `idx_devlog_posts_user_id` on user_id
- `idx_devlog_posts_status` on status

**RLS Policies:**
- Users can view, insert, update, and delete their own posts

---

### analytics_events

Stores analytics and usage events for tracking user behavior.

**Columns:**
- `id` (UUID, PK): Unique event identifier
- `user_id` (UUID, FK): References profiles(id)
- `event_type` (TEXT, NOT NULL): Type of event
- `event_data` (JSONB): Event payload and metadata
- `created_at` (TIMESTAMP): Event timestamp

**Indexes:**
- `idx_analytics_events_user_id` on user_id
- `idx_analytics_events_created_at` on created_at (DESC)

**RLS Policies:**
- Users can view and insert their own events

---

## Row Level Security (RLS)

All tables have Row Level Security enabled to ensure data isolation between users. The general pattern is:

- **SELECT**: Users can only view their own data
- **INSERT**: Users can only insert data associated with their user_id
- **UPDATE**: Users can only update their own data
- **DELETE**: Users can only delete their own data

For `github_issues`, the policies use a subquery to verify ownership through the related `pain_point`.

## Migrations

Database migrations are stored in the `migrations/` directory:

1. **001_initial_schema.sql**: Creates all tables, indexes, and enables UUID extension
2. **002_rls_policies.sql**: Enables RLS and creates all security policies

## Realtime Subscriptions

The following tables have Realtime enabled for live updates:

- `pain_points`: Real-time updates when new pain points are discovered
- `social_connections`: Connection status changes
- `devlog_posts`: Post status and publication updates

## Security Considerations

1. **OAuth Tokens**: Access and refresh tokens should be encrypted at rest
2. **Webhook Secrets**: GitHub webhook secrets should be securely stored
3. **RLS Testing**: All RLS policies should be thoroughly tested with test users
4. **API Keys**: Never store API keys in the database; use environment variables

## Future Enhancements

Potential future schema additions:

- Email notifications table
- User preferences/settings table
- Collaboration features (teams, shared pain points)
- Advanced analytics aggregations
- Audit log table for compliance
