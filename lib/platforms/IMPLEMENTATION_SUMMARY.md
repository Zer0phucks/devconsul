# Blog Platform Integrations - Implementation Summary

## Overview

Complete implementation of blog platform integrations for WordPress, Ghost CMS, Medium, and generic webhooks with OAuth 2.0 authentication, API key support, content formatters, and comprehensive API endpoints.

## Components Implemented

### 1. Core Libraries

#### Encryption (`/lib/platforms/encryption.ts`)
- **AES-256-GCM** authenticated encryption for credential storage
- Functions: `encrypt()`, `decrypt()`, `generateEncryptionKey()`
- Requires `ENCRYPTION_KEY` environment variable (64 hex chars)
- Prevents tampering with auth tag validation

#### Content Formatters
- **Markdown to HTML** (`/lib/platforms/formatters/markdown-to-html.ts`)
  - Uses `remark` and `remark-html` for conversion
  - Extract excerpts and images

- **WordPress Formatter** (`/lib/platforms/formatters/wordpress.ts`)
  - Converts markdown to WordPress HTML
  - Handles categories, tags, featured images

- **Ghost Formatter** (`/lib/platforms/formatters/ghost.ts`)
  - Creates Lexical format (primary) and Mobiledoc (legacy)
  - Generates SEO-friendly slugs

- **Medium Formatter** (`/lib/platforms/formatters/medium.ts`)
  - Medium-specific markdown formatting
  - 5-tag limit validation
  - Canonical URL support

### 2. Platform Clients

#### WordPress (`/lib/platforms/wordpress.ts`)
- **OAuth 2.0** for WordPress.com
- **API Key/Application Password** for self-hosted sites
- WordPress REST API v2 support
- Functions:
  - `getWordPressOAuthUrl()` - OAuth initiation
  - `getWordPressAccessToken()` - Token exchange
  - `refreshAccessToken()` - Token refresh
  - `createPost()` - Publish posts
  - `uploadMedia()` - Upload images
  - `assignCategories()` - Category management
  - `assignTags()` - Tag management
  - `testConnection()` - Connection validation

#### Ghost CMS (`/lib/platforms/ghost.ts`)
- **JWT Authentication** with Admin API v5
- API key format: `id:secret`
- Functions:
  - `generateGhostToken()` - JWT generation with HS256
  - `createPost()` - Create posts
  - `updatePost()` - Update existing posts
  - `deletePost()` - Delete posts
  - `uploadImage()` - Image uploads
  - `schedulePost()` - Schedule publication
  - `publishPost()` - Publish drafts
  - `testConnection()` - Connection validation
- **Note**: Requires `jsonwebtoken` package (not yet installed)

#### Medium (`/lib/platforms/medium.ts`)
- **OAuth 2.0** authentication
- Medium API v1 support
- Functions:
  - `getMediumOAuthUrl()` - OAuth initiation
  - `getMediumAccessToken()` - Token exchange
  - `getUserId()` - Get authenticated user
  - `createStory()` - Publish stories
  - `getPublications()` - List publications
  - `publishToPublication()` - Publish to specific publication
  - `testConnection()` - Connection validation

#### Webhook (`/lib/platforms/webhook.ts`)
- **HMAC-SHA256** request signing
- Custom payload templates with variable substitution
- Exponential backoff retry logic
- Functions:
  - `sendWebhook()` - Send webhook with retry
  - `testWebhook()` - Validate configuration
  - `verifyWebhookSignature()` - Verify incoming webhooks
  - `validatePayloadTemplate()` - Template validation
  - `createDefaultPayloadTemplate()` - Default template

### 3. Validation Schemas (`/lib/validations/blog-platforms.ts`)

- **WordPress**:
  - `wordpressConnectSchema` - Connection configuration
  - `wordpressPublishSchema` - Publishing options

- **Ghost**:
  - `ghostConnectSchema` - API credentials
  - `ghostPublishSchema` - Publishing options

- **Medium**:
  - `mediumConnectSchema` - OAuth connection
  - `mediumPublishSchema` - Publishing options (5-tag limit)

- **Webhook**:
  - `webhookConfigSchema` - Webhook configuration
  - `webhookPublishSchema` - Publish payload

### 4. API Endpoints

#### WordPress Endpoints
- `POST /api/platforms/blog/wordpress/connect` - Initiate OAuth or configure API key
- `GET /api/platforms/blog/wordpress/callback` - OAuth callback handler
- `POST /api/platforms/blog/wordpress/publish` - Publish content
- `POST /api/platforms/blog/wordpress/refresh` - Refresh OAuth token

#### Ghost Endpoints
- `POST /api/platforms/blog/ghost/connect` - Configure Ghost connection
- `POST /api/platforms/blog/ghost/publish` - Publish content
- `POST /api/platforms/blog/ghost/test` - Test connection

#### Medium Endpoints
- `POST /api/platforms/blog/medium/connect` - Initiate OAuth
- `GET /api/platforms/blog/medium/callback` - OAuth callback handler
- `POST /api/platforms/blog/medium/publish` - Publish content

#### Webhook Endpoints
- `POST /api/platforms/blog/webhook/configure` - Configure webhook
- `POST /api/platforms/blog/webhook/test` - Test webhook (dry run)
- `POST /api/platforms/blog/webhook/publish` - Send content via webhook

## Security Features

1. **Credential Encryption**:
   - All API keys and tokens encrypted with AES-256-GCM
   - Authenticated encryption prevents tampering
   - Environment-based encryption key

2. **OAuth Security**:
   - State parameter validation for CSRF protection
   - Temporary state storage with encryption
   - Secure token exchange flows

3. **Webhook Security**:
   - HMAC-SHA256 signature generation
   - Timestamp validation (5-minute window)
   - Constant-time signature comparison (prevents timing attacks)

4. **API Security**:
   - Session-based authentication on all endpoints
   - User-scoped credential access
   - Validation of all inputs with Zod schemas

## Database Schema Updates

Added to `PlatformType` enum in Prisma schema:
```prisma
enum PlatformType {
  // ... existing types
  WORDPRESS
  GHOST
  WEBHOOK
  // ... other types
}
```

## Environment Variables Required

```env
# Encryption
ENCRYPTION_KEY=<64-character-hex-string>

# WordPress.com OAuth
WORDPRESS_CLIENT_ID=<client-id>
WORDPRESS_CLIENT_SECRET=<client-secret>

# Medium OAuth
MEDIUM_CLIENT_ID=<client-id>
MEDIUM_CLIENT_SECRET=<client-secret>

# Application URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Dependencies Required

Add to `package.json`:
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "remark": "^15.0.1",
    "remark-html": "^16.0.1",
    "gray-matter": "^4.0.3"
  }
}
```

**Note**: `remark`, `remark-html`, and `gray-matter` are already installed. Only `jsonwebtoken` needs to be added.

## Next Steps

### Required Setup

1. **Install Missing Dependency**:
   ```bash
   npm install jsonwebtoken
   ```

2. **Generate Encryption Key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add to `.env.local` as `ENCRYPTION_KEY`

3. **Run Prisma Migration**:
   ```bash
   npx prisma migrate dev --name add_blog_platforms
   npx prisma generate
   ```

4. **Configure OAuth Apps**:
   - Register WordPress.com app: https://developer.wordpress.com/apps/
   - Register Medium app: https://medium.com/me/applications/new
   - Add redirect URIs to OAuth apps

### Testing Checklist

- [ ] Test WordPress.com OAuth flow
- [ ] Test self-hosted WordPress with application password
- [ ] Test Ghost connection with Admin API
- [ ] Test Medium OAuth flow
- [ ] Test webhook configuration and dry run
- [ ] Verify encryption/decryption of credentials
- [ ] Test content publishing to each platform
- [ ] Verify retry logic on webhook failures
- [ ] Test OAuth token refresh for WordPress
- [ ] Validate publication records in database

### Documentation

Complete documentation available in:
- `/lib/platforms/README.md` - Integration guide with examples
- This file - Implementation summary

## API Usage Examples

### WordPress Connection (OAuth)
```typescript
POST /api/platforms/blog/wordpress/connect
{
  "platformName": "My WordPress Blog"
}
// Response: { authUrl: "https://public-api.wordpress.com/oauth2/..." }
```

### WordPress Connection (Self-hosted)
```typescript
POST /api/platforms/blog/wordpress/connect
{
  "platformName": "My Blog",
  "wordpressSiteUrl": "https://myblog.com",
  "apiKey": "user:xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

### Ghost Connection
```typescript
POST /api/platforms/blog/ghost/connect
{
  "platformName": "My Ghost Blog",
  "apiUrl": "https://myblog.ghost.io",
  "adminApiKey": "1234567890abcdef:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

### Medium Connection
```typescript
POST /api/platforms/blog/medium/connect
{
  "platformName": "Medium Profile"
}
// Response: { authUrl: "https://medium.com/m/oauth/authorize?..." }
```

### Webhook Configuration
```typescript
POST /api/platforms/blog/webhook/configure
{
  "platformName": "Custom API",
  "url": "https://api.example.com/posts",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "payloadTemplate": "{\"title\":\"{title}\",\"body\":\"{content}\"}",
  "signatureSecret": "webhook-secret-key",
  "retryAttempts": 3,
  "retryDelay": 60
}
```

### Publishing Content
```typescript
POST /api/platforms/blog/wordpress/publish
{
  "platformId": "clx123abc",
  "contentId": "clx456def",
  "options": {
    "status": "publish",
    "categories": ["Technology"],
    "tags": ["Next.js", "React"]
  }
}
```

## Rate Limits

- **WordPress**: 200 requests/hour for authenticated apps
- **Ghost**: No specific limits (self-hosted)
- **Medium**: ~60 requests/hour (unofficial limit)
- **Webhooks**: Configurable retry logic with exponential backoff

## Error Handling

All endpoints return consistent error responses:
```typescript
{
  "error": "Error message",
  "details": {} // Optional validation errors
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad request / validation error
- `401` - Unauthorized
- `404` - Resource not found
- `500` - Server error

## Publication Tracking

All successful publications create a `Publication` record with:
- `contentId` - Reference to published content
- `platformId` - Reference to platform
- `platformPostId` - Platform-specific post ID
- `platformUrl` - Direct URL to published content
- `status` - Publication status
- `metadata` - Platform-specific metadata (publish time, tags, etc.)

## Performance Considerations

1. **Token Refresh**: WordPress OAuth tokens expire after 2 weeks - implement automatic refresh
2. **Rate Limiting**: Implement client-side rate limiting for Medium (60/hr)
3. **Webhook Retries**: Exponential backoff prevents overwhelming failed endpoints
4. **Encryption Overhead**: Minimal impact (~1ms per encrypt/decrypt operation)

## Architecture Decisions

1. **Native Fetch**: Used instead of axios to avoid dependency conflicts
2. **AES-256-GCM**: Chosen for authenticated encryption (integrity + confidentiality)
3. **Separate Formatters**: Platform-specific formatting isolated for maintainability
4. **JWT for Ghost**: Admin API requires JWT with short expiry (5 min)
5. **HMAC Webhooks**: Industry-standard signature verification for webhooks

## Known Limitations

1. **Medium**:
   - No update/delete support (API limitation)
   - 5-tag maximum enforced
   - 60 requests/hour unofficial limit

2. **WordPress**:
   - WordPress.com OAuth different from self-hosted
   - Media upload requires separate API call
   - Category/tag assignment requires IDs

3. **Ghost**:
   - Requires jsonwebtoken dependency
   - JWT tokens expire after 5 minutes (regenerated per request)
   - Lexical format recommended over Mobiledoc

4. **Webhooks**:
   - No standardized response format
   - Retry logic may not suit all endpoints
   - Template variables limited to predefined set

## Future Enhancements

- [ ] Scheduled publishing support
- [ ] Bulk publishing across multiple platforms
- [ ] Platform-specific analytics integration
- [ ] Draft synchronization
- [ ] Content preview before publishing
- [ ] Automated token refresh background job
- [ ] Webhook response validation
- [ ] Support for additional platforms (Hashnode, Dev.to)
