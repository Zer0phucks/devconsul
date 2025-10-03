# Blog Platform Integrations

Complete integrations for WordPress, Ghost CMS, Medium, and generic webhooks with OAuth 2.0 and API key authentication.

## Overview

This module provides production-ready clients for publishing content to major blogging platforms:

- **WordPress**: OAuth 2.0 (WordPress.com) and API keys (self-hosted)
- **Ghost CMS**: Admin API v5 with API keys
- **Medium**: OAuth 2.0 authentication
- **Webhook**: Generic HMAC-signed webhooks

## Directory Structure

```
lib/platforms/
├── encryption.ts          # AES-256-GCM credential encryption
├── wordpress.ts           # WordPress REST API v2 client
├── ghost.ts              # Ghost Admin API v5 client (TO BE CREATED)
├── medium.ts             # Medium API v1 client (TO BE CREATED)
├── webhook.ts            # Generic webhook client (TO BE CREATED)
├── formatters/
│   ├── markdown-to-html.ts  # Markdown → HTML converter
│   ├── wordpress.ts          # WordPress formatter
│   ├── ghost.ts             # Ghost Lexical/Mobiledoc formatter
│   └── medium.ts            # Medium formatter
└── README.md
```

## Environment Variables

```env
# Encryption (required)
ENCRYPTION_KEY=<64-char hex string>  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# WordPress.com OAuth
WORDPRESS_CLIENT_ID=<your-client-id>
WORDPRESS_CLIENT_SECRET=<your-client-secret>
WORDPRESS_REDIRECT_URI=https://yoursite.com/api/platforms/blog/wordpress/callback

# Medium OAuth
MEDIUM_CLIENT_ID=<your-client-id>
MEDIUM_CLIENT_SECRET=<your-client-secret>
MEDIUM_REDIRECT_URI=https://yoursite.com/api/platforms/blog/medium/callback
```

## Usage Examples

### WordPress Integration

```typescript
import { getWordPressOAuthUrl, getWordPressAccessToken, createPost } from '@/lib/platforms/wordpress';

// 1. Initiate OAuth flow
const authUrl = getWordPressOAuthUrl('https://yoursite.com/callback', 'state123');
// Redirect user to authUrl

// 2. Exchange code for token (in callback handler)
const tokens = await getWordPressAccessToken(code, redirectUri);

// 3. Store encrypted tokens in database
import { encrypt } from '@/lib/platforms/encryption';
await db.platform.create({
  data: {
    type: 'WORDPRESS',
    accessToken: encrypt(tokens.accessToken),
    refreshToken: encrypt(tokens.refreshToken),
    tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
  },
});

// 4. Publish content
const client = {
  type: 'oauth',
  accessToken: decrypt(platform.accessToken),
};

const result = await createPost(client, 'My Post Title', markdownContent, {
  status: 'publish',
  categories: ['Technology', 'Programming'],
  tags: ['nextjs', 'typescript'],
});

console.log(result.platformUrl); // Published post URL
```

### Ghost CMS Integration

```typescript
import { createGhostPost } from '@/lib/platforms/ghost';

const client = {
  apiUrl: 'https://yourblog.com',
  adminApiKey: decrypt(platform.apiKey),
};

const result = await createGhostPost(client, 'Post Title', markdownContent, {
  status: 'published',
  featured: true,
  tags: ['tutorial', 'javascript'],
});
```

### Medium Integration

```typescript
import { getMediumOAuthUrl, getMediumAccessToken, createStory } from '@/lib/platforms/medium';

// OAuth flow similar to WordPress
const authUrl = getMediumOAuthUrl('https://yoursite.com/callback');

// Publish
const client = {
  accessToken: decrypt(platform.accessToken),
};

const result = await createStory(client, 'Story Title', markdownContent, {
  publishStatus: 'public',
  tags: ['programming', 'tutorial'],
  canonicalUrl: 'https://yourblog.com/original-post',
});
```

### Generic Webhook

```typescript
import { sendWebhook } from '@/lib/platforms/webhook';

const config = {
  url: 'https://api.example.com/posts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'secret-key',
  },
  payloadTemplate: JSON.stringify({
    title: '{title}',
    content: '{content}',
    author: '{author}',
    publishedAt: '{date}',
  }),
  signatureSecret: decrypt(platform.apiSecret),
};

const result = await sendWebhook(config, content, { dryRun: false });
```

## API Endpoints

Create these endpoints in `/app/api/platforms/blog/`:

### WordPress

- `POST /wordpress/connect` - Initiate OAuth or store API key
- `GET /wordpress/callback` - OAuth callback handler
- `POST /wordpress/publish` - Publish content
- `POST /wordpress/refresh` - Refresh expired token

### Ghost

- `POST /ghost/connect` - Store API key
- `POST /ghost/publish` - Publish content
- `POST /ghost/test` - Test connection

### Medium

- `POST /medium/connect` - Initiate OAuth
- `GET /medium/callback` - OAuth callback handler
- `POST /medium/publish` - Publish content

### Webhook

- `POST /webhook/configure` - Configure webhook
- `POST /webhook/test` - Test webhook (dry run)
- `POST /webhook/publish` - Send webhook

## Security Considerations

### Encryption

All credentials stored in the database MUST be encrypted using the encryption utility:

```typescript
import { encrypt, decrypt } from '@/lib/platforms/encryption';

// Storing
const encrypted = encrypt(sensitiveData);
await db.platform.update({ data: { accessToken: encrypted } });

// Retrieving
const decrypted = decrypt(platform.accessToken);
```

### Token Refresh

WordPress OAuth tokens expire. Implement automatic refresh:

```typescript
import { refreshWordPressToken } from '@/lib/platforms/wordpress';

if (platform.tokenExpiresAt < new Date()) {
  const newTokens = await refreshWordPressToken(decrypt(platform.refreshToken));

  await db.platform.update({
    where: { id: platform.id },
    data: {
      accessToken: encrypt(newTokens.accessToken),
      refreshToken: encrypt(newTokens.refreshToken),
      tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
    },
  });
}
```

### Rate Limiting

Implement rate limiting for API calls to avoid hitting platform limits:

- WordPress.com: 200 requests per hour
- Ghost: No official limit, but be respectful
- Medium: 60 requests per hour

## Content Formatting

### Markdown to Platform-Specific Format

Each platform has different content requirements:

**WordPress**:
- Accepts HTML
- Supports categories, tags, featured images
- Custom post types and formats

**Ghost**:
- Prefers Lexical (JSON) format for Ghost 5.0+
- Falls back to HTML
- Supports custom excerpts, meta tags, code injection

**Medium**:
- Prefers Markdown
- Max 5 tags
- Canonical URL for cross-posting

### Image Handling

```typescript
import { uploadMedia } from '@/lib/platforms/wordpress';

const media = await uploadMedia(client, imageUrl, 'featured-image.jpg');
if (media) {
  await createPost(client, title, content, {
    featuredImage: media.url,
  });
}
```

## Error Handling

All client methods return a consistent `PublishResponse` format:

```typescript
interface PublishResponse {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}
```

Handle errors gracefully:

```typescript
const result = await createPost(client, title, content);

if (!result.success) {
  console.error('Publish failed:', result.error);

  // Store error in database
  await db.contentPublication.update({
    where: { id: publicationId },
    data: {
      status: 'FAILED',
      error: result.error,
      retryCount: { increment: 1 },
    },
  });
} else {
  console.log('Published:', result.platformUrl);

  await db.contentPublication.update({
    where: { id: publicationId },
    data: {
      status: 'PUBLISHED',
      platformPostId: result.platformPostId,
      platformUrl: result.platformUrl,
      publishedAt: new Date(),
    },
  });
}
```

## Testing

### Unit Tests

Test each client function with mocked API responses.

### Integration Tests

Test OAuth flows and actual API calls (use test accounts).

### Validation Tests

```typescript
import { wordpressPublishSchema } from '@/lib/validations/blog-platforms';

const input = wordpressPublishSchema.parse(requestBody);
```

## Remaining Implementation

The following files need to be created to complete the integration:

1. **`/lib/platforms/ghost.ts`** - Ghost Admin API v5 client
2. **`/lib/platforms/medium.ts`** - Medium API v1 client
3. **`/lib/platforms/webhook.ts`** - Generic webhook client with HMAC signing
4. **API endpoints** - All routes in `/app/api/platforms/blog/`

Reference the WordPress implementation as a template for Ghost and Medium clients.

## Support

For issues or questions:
1. Check platform-specific API documentation
2. Review validation schemas in `/lib/validations/blog-platforms.ts`
3. Examine formatter implementations in `/lib/platforms/formatters/`
4. Test with dry-run mode before production use

## License

Part of the Full Self Publishing Platform project.
