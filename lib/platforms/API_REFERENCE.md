# Blog Platforms API Reference

Quick reference guide for all blog platform integration endpoints.

## Authentication

All endpoints require authentication via session. Include session cookie or authentication header.

## WordPress Endpoints

### Connect (OAuth)
```http
POST /api/platforms/blog/wordpress/connect
Content-Type: application/json

{
  "platformName": "My WordPress Blog"
}
```

**Response**:
```json
{
  "success": true,
  "authType": "oauth",
  "authUrl": "https://public-api.wordpress.com/oauth2/authorize?..."
}
```

### Connect (API Key - Self-hosted)
```http
POST /api/platforms/blog/wordpress/connect
Content-Type: application/json

{
  "platformName": "My Blog",
  "wordpressSiteUrl": "https://myblog.com",
  "apiKey": "username:xxxx xxxx xxxx xxxx xxxx xxxx"
}
```

**Response**:
```json
{
  "success": true,
  "platformId": "clx123abc",
  "authType": "api_key"
}
```

### OAuth Callback
```http
GET /api/platforms/blog/wordpress/callback?code=...&state=...
```

Redirects to: `/dashboard/platforms?success=wordpress_connected`

### Publish Post
```http
POST /api/platforms/blog/wordpress/publish
Content-Type: application/json

{
  "platformId": "clx123abc",
  "contentId": "clx456def",
  "options": {
    "status": "publish",
    "categories": ["Technology"],
    "tags": ["Next.js", "React"],
    "featuredImage": "https://example.com/image.jpg",
    "excerpt": "Post excerpt"
  }
}
```

**Response**:
```json
{
  "success": true,
  "platformPostId": "12345",
  "platformUrl": "https://myblog.com/post-slug",
  "metadata": {
    "status": "publish",
    "publishedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Refresh Token
```http
POST /api/platforms/blog/wordpress/refresh
Content-Type: application/json

{
  "platformId": "clx123abc"
}
```

**Response**:
```json
{
  "success": true,
  "expiresIn": 1209600
}
```

---

## Ghost CMS Endpoints

### Connect
```http
POST /api/platforms/blog/ghost/connect
Content-Type: application/json

{
  "platformName": "My Ghost Blog",
  "apiUrl": "https://myblog.ghost.io",
  "adminApiKey": "1234567890abcdef:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**Response**:
```json
{
  "success": true,
  "platformId": "clx123abc"
}
```

### Publish Post
```http
POST /api/platforms/blog/ghost/publish
Content-Type: application/json

{
  "platformId": "clx123abc",
  "contentId": "clx456def",
  "options": {
    "status": "published",
    "featured": true,
    "visibility": "public",
    "authors": ["author-id"],
    "customExcerpt": "Custom excerpt",
    "metaTitle": "SEO Title",
    "metaDescription": "SEO description"
  }
}
```

**Response**:
```json
{
  "success": true,
  "platformPostId": "ghost-post-id",
  "platformUrl": "https://myblog.ghost.io/post-slug",
  "metadata": {
    "status": "published",
    "slug": "post-slug",
    "publishedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Test Connection
```http
POST /api/platforms/blog/ghost/test
Content-Type: application/json

{
  "platformId": "clx123abc"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Connection successful"
}
```

---

## Medium Endpoints

### Connect (OAuth)
```http
POST /api/platforms/blog/medium/connect
Content-Type: application/json

{
  "platformName": "Medium Profile"
}
```

**Response**:
```json
{
  "success": true,
  "authUrl": "https://medium.com/m/oauth/authorize?..."
}
```

### OAuth Callback
```http
GET /api/platforms/blog/medium/callback?code=...&state=...
```

Redirects to: `/dashboard/platforms?success=medium_connected`

### Publish Story
```http
POST /api/platforms/blog/medium/publish
Content-Type: application/json

{
  "platformId": "clx123abc",
  "contentId": "clx456def",
  "options": {
    "publishStatus": "public",
    "canonicalUrl": "https://myblog.com/original-post",
    "tags": ["JavaScript", "React", "Next.js"],
    "license": "all-rights-reserved",
    "notifyFollowers": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "platformPostId": "medium-story-id",
  "platformUrl": "https://medium.com/@user/story-slug",
  "metadata": {
    "publishStatus": "public",
    "publishedAt": "2024-01-01T00:00:00Z",
    "license": "all-rights-reserved",
    "tags": ["JavaScript", "React", "Next.js"]
  }
}
```

---

## Webhook Endpoints

### Configure
```http
POST /api/platforms/blog/webhook/configure
Content-Type: application/json

{
  "platformName": "Custom API",
  "url": "https://api.example.com/posts",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  },
  "payloadTemplate": "{\"title\":\"{title}\",\"content\":\"{content}\",\"author\":\"{author}\"}",
  "signatureSecret": "webhook-secret-key",
  "retryAttempts": 3,
  "retryDelay": 60
}
```

**Response**:
```json
{
  "success": true,
  "platformId": "clx123abc"
}
```

### Test Webhook (Dry Run)
```http
POST /api/platforms/blog/webhook/test
Content-Type: application/json

{
  "platformId": "clx123abc"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook configuration is valid",
  "metadata": {
    "dryRun": true,
    "url": "https://api.example.com/posts",
    "method": "POST",
    "headers": {...},
    "bodyPreview": "..."
  }
}
```

### Publish via Webhook
```http
POST /api/platforms/blog/webhook/publish
Content-Type: application/json

{
  "platformId": "clx123abc",
  "contentId": "clx456def",
  "options": {
    "tags": ["tag1", "tag2"],
    "metadata": {
      "customField": "value"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "metadata": {
    "statusCode": 200,
    "responseData": {...},
    "attempt": 1
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": {}
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 401  | Unauthorized - No valid session |
| 400  | Bad Request - Invalid input data |
| 404  | Not Found - Platform or content not found |
| 500  | Server Error - Internal processing error |

### Example Validation Error
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["platformName"],
      "message": "Required"
    }
  ]
}
```

---

## Payload Templates (Webhooks)

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{title}` | Content title | "My Blog Post" |
| `{content}` | Content body (markdown or HTML) | "Post content..." |
| `{author}` | Author name | "John Doe" |
| `{date}` | Published date (ISO 8601) | "2024-01-01T00:00:00Z" |
| `{tags}` | Tags array (JSON) | ["tag1", "tag2"] |
| `{metadata}` | Custom metadata (JSON) | {"key": "value"} |

### Example Templates

**Simple JSON**:
```json
{
  "title": "{title}",
  "body": "{content}",
  "author": "{author}"
}
```

**With Arrays**:
```json
{
  "title": "{title}",
  "content": "{content}",
  "tags": {tags},
  "published_at": "{date}"
}
```

**Custom Structure**:
```json
{
  "post": {
    "title": "{title}",
    "body": "{content}"
  },
  "meta": {
    "author": "{author}",
    "tags": {tags},
    "custom": {metadata}
  }
}
```

---

## Webhook Signature Verification

When webhooks are sent with `signatureSecret`, the following headers are included:

```
X-Webhook-Signature: sha256=<hmac-sha256-hex>
X-Webhook-Timestamp: <unix-timestamp-ms>
```

### Verification (Receiving Webhooks)

```typescript
import { verifyWebhookSignature } from '@/lib/platforms/webhook';

const payload = await request.text();
const signature = request.headers.get('X-Webhook-Signature');
const timestamp = request.headers.get('X-Webhook-Timestamp');

const isValid = verifyWebhookSignature(
  payload,
  signature,
  'your-webhook-secret',
  timestamp
);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}
```

**Security Notes**:
- Signatures use HMAC-SHA256
- Timestamps must be within 5 minutes (prevents replay attacks)
- Constant-time comparison prevents timing attacks

---

## Rate Limits

| Platform | Limit | Notes |
|----------|-------|-------|
| WordPress | 200/hour | OAuth apps |
| Medium | ~60/hour | Unofficial limit |
| Ghost | None | Self-hosted |
| Webhooks | Configurable | Exponential backoff on retry |

---

## Publishing Options

### WordPress Post Options
```typescript
{
  status: 'draft' | 'publish' | 'pending' | 'private',
  categories: string[],
  tags: string[],
  featuredImage: string, // URL
  excerpt: string,
  format: 'standard' | 'aside' | 'gallery' | ...
}
```

### Ghost Post Options
```typescript
{
  status: 'draft' | 'published' | 'scheduled',
  publishAt: string, // ISO 8601
  featured: boolean,
  visibility: 'public' | 'members' | 'paid',
  authors: string[], // Author IDs
  customExcerpt: string,
  metaTitle: string,
  metaDescription: string,
  ogImage: string, // URL
  twitterImage: string, // URL
  codeinjectionHead: string,
  codeinjectionFoot: string
}
```

### Medium Story Options
```typescript
{
  publishStatus: 'draft' | 'public' | 'unlisted',
  canonicalUrl: string, // URL
  tags: string[], // Max 5 tags
  license: 'all-rights-reserved' | 'cc-40-by' | ...,
  notifyFollowers: boolean
}
```

### Webhook Publish Options
```typescript
{
  tags: string[],
  metadata: Record<string, any>
}
```

---

## Testing

### Test Sequence

1. **Connect Platform**
   - WordPress: Test both OAuth and API key methods
   - Ghost: Test connection with test endpoint
   - Medium: Complete OAuth flow
   - Webhook: Test with dry run

2. **Verify Credentials**
   - Check platform record created in database
   - Verify credentials encrypted
   - Confirm `isActive` set to true

3. **Publish Content**
   - Create test content in database
   - Publish to platform
   - Verify publication record created
   - Check platform URL accessible

4. **Error Handling**
   - Test invalid credentials
   - Test missing content
   - Test network failures
   - Verify retry logic (webhooks)

### Sample Test Content

```typescript
const testContent = {
  title: "Test Blog Post",
  content: `# Test Post

This is a test post to verify the integration.

## Features
- Markdown support
- Image handling
- Tag management

\`\`\`javascript
console.log('Hello World');
\`\`\`
  `
};
```

---

## Environment Setup

```env
# Required
ENCRYPTION_KEY=<64-char-hex-string>
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# WordPress.com OAuth (optional)
WORDPRESS_CLIENT_ID=<client-id>
WORDPRESS_CLIENT_SECRET=<client-secret>

# Medium OAuth (optional)
MEDIUM_CLIENT_ID=<client-id>
MEDIUM_CLIENT_SECRET=<client-secret>
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
