# Social Media Platform Integrations

Complete social media integrations for Twitter/X, LinkedIn, Facebook, and Reddit with OAuth 2.0 authentication and posting capabilities.

## Overview

This module provides production-ready integrations for major social media platforms:

- **Twitter/X**: OAuth 2.0, tweets, threads, media uploads, rate limiting
- **LinkedIn**: OAuth 2.0, personal/organization posts, articles, media uploads
- **Facebook**: OAuth 2.0, page/group posts, photo uploads, post scheduling
- **Reddit**: OAuth 2.0, text/link/image posts, flair selection, subreddit validation

## Features

### Common Features
- ✅ OAuth 2.0 authentication with token refresh
- ✅ Encrypted token storage (AES-256-GCM)
- ✅ Character limit enforcement with smart truncation
- ✅ Platform-specific content formatting
- ✅ Rate limit handling and compliance
- ✅ Comprehensive error handling
- ✅ TypeScript with full type safety

### Platform-Specific Features

#### Twitter/X
- Single tweets (280 chars)
- Tweet threads with auto-numbering
- Media uploads (up to 4 per tweet)
- Reply chains
- Quote tweets
- Polls
- Rate limiting (300 tweets per 3 hours)

#### LinkedIn
- Personal profile posts (3000 chars)
- Organization/company page posts
- LinkedIn articles (110,000 chars)
- Image uploads (up to 9 per post)
- Visibility control (PUBLIC/CONNECTIONS)
- Professional tone enforcement

#### Facebook
- Page posts with targeting
- Group posts
- Photo uploads with captions
- Post scheduling (10 min to 75 days ahead)
- Long-lived token management
- Multi-page support

#### Reddit
- Text posts (40,000 chars)
- Link posts
- Image posts
- Post flair selection
- Subreddit validation
- Markdown formatting support
- Rate limiting compliance (1 post per 10 min)

## Installation

### 1. Install Dependencies

All required dependencies are already in `package.json`:
- `axios` - HTTP client
- `zod` - Schema validation
- `@prisma/client` - Database ORM

### 2. Environment Variables

Add to `.env`:

```env
# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_char_hex_key

# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Reddit
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=YourApp/1.0.0

# App URL (for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Migration

The `Platform` model in Prisma schema supports all social platforms:

```bash
npm run db:migrate
```

## Usage

### Twitter/X Integration

#### Connect Account
```typescript
// POST /api/platforms/social/twitter/connect
const response = await fetch('/api/platforms/social/twitter/connect', {
  method: 'POST',
  body: JSON.stringify({ projectId: 'project_123' }),
});
const { authUrl } = await response.json();
window.location.href = authUrl;
```

#### Post Tweet
```typescript
// POST /api/platforms/social/twitter/post
const response = await fetch('/api/platforms/social/twitter/post', {
  method: 'POST',
  body: JSON.stringify({
    text: 'Hello Twitter! 🚀',
    mediaIds: ['media_123'],
    replySettings: 'everyone',
  }),
});
```

#### Post Thread
```typescript
const response = await fetch('/api/platforms/social/twitter/post', {
  method: 'POST',
  body: JSON.stringify({
    tweets: [
      'First tweet in thread...',
      'Second tweet continues...',
      'Final tweet concludes.'
    ],
    addThreadIndicators: true,
  }),
});
```

#### Programmatic Usage
```typescript
import { createTwitterClient } from '@/lib/platforms/twitter';

const client = createTwitterClient({
  accessToken: encryptedToken,
  refreshToken: encryptedRefreshToken,
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

// Post single tweet
const tweet = await client.postTweet('Hello world!', {
  mediaIds: ['media_123'],
});

// Post thread
const thread = await client.postThread({
  tweets: ['Tweet 1', 'Tweet 2', 'Tweet 3'],
  addThreadIndicators: true,
});

// Upload media
const media = await client.uploadMedia(imageBuffer, 'image/png');
```

### LinkedIn Integration

#### Connect Account
```typescript
// POST /api/platforms/social/linkedin/connect
const response = await fetch('/api/platforms/social/linkedin/connect', {
  method: 'POST',
  body: JSON.stringify({ projectId: 'project_123' }),
});
const { authUrl } = await response.json();
window.location.href = authUrl;
```

#### Post to LinkedIn
```typescript
// POST /api/platforms/social/linkedin/post
const response = await fetch('/api/platforms/social/linkedin/post', {
  method: 'POST',
  body: JSON.stringify({
    content: 'Excited to share...',
    visibility: 'PUBLIC',
    mediaUrls: ['https://example.com/image.jpg'],
  }),
});
```

#### Programmatic Usage
```typescript
import { createLinkedInClient } from '@/lib/platforms/linkedin';

const client = createLinkedInClient({
  accessToken: encryptedToken,
  personId: 'linkedin_person_id',
});

// Create post
const post = await client.createPost('Professional update...', {
  visibility: 'PUBLIC',
  mediaUrls: ['https://example.com/image.jpg'],
});

// Create article
const article = await client.createArticle({
  title: 'My Article',
  content: 'Article content...',
  canonicalUrl: 'https://example.com/article',
});
```

### Facebook Integration

#### Connect Account
```typescript
// POST /api/platforms/social/facebook/connect
const response = await fetch('/api/platforms/social/facebook/connect', {
  method: 'POST',
  body: JSON.stringify({ projectId: 'project_123' }),
});
const { authUrl } = await response.json();
window.location.href = authUrl;
```

#### Post to Page
```typescript
// POST /api/platforms/social/facebook/post
const response = await fetch('/api/platforms/social/facebook/post', {
  method: 'POST',
  body: JSON.stringify({
    pageId: 'page_123',
    content: 'Check out our latest update!',
    link: 'https://example.com',
  }),
});
```

#### Programmatic Usage
```typescript
import { createFacebookClient } from '@/lib/platforms/facebook';

const client = createFacebookClient({
  accessToken: encryptedToken,
  pageId: 'facebook_page_id',
});

// Post to page
const post = await client.postToPage('page_123', 'Update text', {
  link: 'https://example.com',
  published: true,
});

// Schedule post
const scheduled = await client.schedulePost(
  'page_123',
  'Future post',
  new Date(Date.now() + 24 * 60 * 60 * 1000)
);

// Upload photo
const photo = await client.uploadPhoto('page_123', imageBuffer, {
  caption: 'Check this out!',
});
```

### Reddit Integration

#### Connect Account
```typescript
// POST /api/platforms/social/reddit/connect
const response = await fetch('/api/platforms/social/reddit/connect', {
  method: 'POST',
  body: JSON.stringify({ projectId: 'project_123' }),
});
const { authUrl } = await response.json();
window.location.href = authUrl;
```

#### Submit Post
```typescript
// POST /api/platforms/social/reddit/post
const response = await fetch('/api/platforms/social/reddit/post', {
  method: 'POST',
  body: JSON.stringify({
    subreddit: 'programming',
    title: 'New tool for developers',
    content: 'Check out this awesome tool...',
    flairId: 'flair_123',
    nsfw: false,
  }),
});
```

#### Programmatic Usage
```typescript
import { createRedditClient } from '@/lib/platforms/reddit';

const client = createRedditClient({
  accessToken: encryptedToken,
  refreshToken: encryptedRefreshToken,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  userAgent: 'YourApp/1.0',
});

// Submit text post
const post = await client.submitTextPost(
  'programming',
  'My Post Title',
  'Post content...',
  { flairId: 'flair_123' }
);

// Submit link post
const link = await client.submitLinkPost(
  'webdev',
  'Cool Resource',
  'https://example.com'
);

// Get available flairs
const flairs = await client.getPostFlairs('programming');
```

## Character Limits

Platform character limits are enforced with smart truncation:

```typescript
import { enforceLimit, validateLength } from '@/lib/platforms/limits';

// Enforce limit with truncation
const result = enforceLimit(longText, 'twitter', { forceTruncate: true });
console.log(result.text); // Truncated text
console.log(result.truncated); // true if truncated

// Validate without modifying
const validation = validateLength(text, 'linkedin');
console.log(validation.valid); // true/false
console.log(validation.warning); // Warning message if any
```

Supported platforms:
- `twitter`: 280 chars
- `linkedin`: 3000 chars
- `linkedinArticle`: 110,000 chars
- `facebook`: 63,206 chars (recommended)
- `reddit`: 40,000 chars
- `redditTitle`: 300 chars

## Content Formatting

Platform-specific formatters optimize content for each platform:

```typescript
import {
  toTwitterFormat,
  toLinkedInFormat,
  toFacebookFormat,
  toRedditFormat,
} from '@/lib/platforms/formatters/social';

// Twitter formatting
const tweet = toTwitterFormat(content, {
  hashtags: ['tech', 'coding'],
  maxHashtags: 3,
  includeUrl: 'https://example.com',
});

// LinkedIn formatting (professional)
const linkedInPost = toLinkedInFormat(content, {
  tone: 'professional',
  hashtags: ['technology', 'innovation'],
});

// Facebook formatting (casual)
const fbPost = toFacebookFormat(content, {
  tone: 'casual',
  hashtags: ['update'],
});

// Reddit formatting (markdown)
const redditPost = toRedditFormat(content, {
  includeUrl: 'https://example.com',
});
```

## Error Handling

All clients provide comprehensive error handling:

```typescript
try {
  const post = await client.postTweet('Hello!');
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limiting
    console.error('Too many requests. Wait before retrying.');
  } else if (error.message.includes('401')) {
    // Handle authentication error
    console.error('Token expired. Refresh needed.');
  } else {
    // Handle other errors
    console.error('Post failed:', error.message);
  }
}
```

## Security

### Token Encryption

All OAuth tokens are encrypted before storage using AES-256-GCM:

```typescript
import { encrypt, decrypt } from '@/lib/platforms/encryption';

// Encrypt before storing
const encryptedToken = encrypt(accessToken);
await db.platform.create({
  data: {
    accessToken: encryptedToken,
    // ...
  },
});

// Decrypt when using
const decryptedToken = decrypt(platform.accessToken);
```

### Token Refresh

All platforms support automatic token refresh:

```typescript
// Tokens are automatically refreshed when expired
// Updated tokens are returned via getEncryptedTokens()
const client = createTwitterClient(config);
await client.postTweet('Hello!');

// Get updated tokens
const updatedTokens = client.getEncryptedTokens();
if (updatedTokens.accessToken !== config.accessToken) {
  // Save new tokens to database
  await db.platform.update({
    where: { id: platformId },
    data: {
      accessToken: updatedTokens.accessToken,
      refreshToken: updatedTokens.refreshToken,
      tokenExpiresAt: updatedTokens.tokenExpiresAt,
    },
  });
}
```

## Rate Limiting

### Twitter
- 300 tweets per 3 hours (user context)
- Enforced with automatic rate limit headers tracking
- Throws error when limit exceeded with reset time

### Reddit
- 1 post per 10 minutes (new accounts)
- Automatic 2-second delay between requests
- Respects Reddit's rate limiting rules

### LinkedIn & Facebook
- No strict rate limits enforced
- Best practice: 1 post per minute

## Testing

### Example Test Workflow

1. **Connect Platform**:
   - Navigate to `/dashboard/platforms`
   - Click "Connect Twitter" (or other platform)
   - Complete OAuth flow
   - Verify connection in database

2. **Post Content**:
   ```bash
   curl -X POST http://localhost:3000/api/platforms/social/twitter/post \
     -H "Content-Type: application/json" \
     -d '{"text": "Test post from API"}'
   ```

3. **Verify Post**:
   - Check platform website for post
   - Check database for updated `totalPublished` count
   - Check `lastPublishedAt` timestamp

## OAuth Setup

### Twitter/X
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create new app with OAuth 2.0
3. Enable "Read and Write" permissions
4. Add callback URL: `http://localhost:3000/api/platforms/social/twitter/callback`
5. Copy Client ID and Client Secret

### LinkedIn
1. Go to https://www.linkedin.com/developers/apps
2. Create new app
3. Add "Sign In with LinkedIn" product
4. Request "w_member_social" scope
5. Add redirect URL: `http://localhost:3000/api/platforms/social/linkedin/callback`
6. Copy Client ID and Client Secret

### Facebook
1. Go to https://developers.facebook.com/apps
2. Create new app (Business type)
3. Add "Facebook Login" product
4. Add permissions: `pages_manage_posts`, `pages_read_engagement`, `publish_to_groups`
5. Add redirect URI: `http://localhost:3000/api/platforms/social/facebook/callback`
6. Copy App ID and App Secret

### Reddit
1. Go to https://www.reddit.com/prefs/apps
2. Create "web app"
3. Set redirect URI: `http://localhost:3000/api/platforms/social/reddit/callback`
4. Copy Client ID and Secret
5. Set User-Agent: `YourApp/1.0.0`

## API Endpoints

### Twitter
- `POST /api/platforms/social/twitter/connect` - Initiate OAuth
- `GET /api/platforms/social/twitter/callback` - OAuth callback
- `POST /api/platforms/social/twitter/post` - Post tweet/thread

### LinkedIn
- `POST /api/platforms/social/linkedin/connect` - Initiate OAuth
- `GET /api/platforms/social/linkedin/callback` - OAuth callback
- `POST /api/platforms/social/linkedin/post` - Create post/article

### Facebook
- `POST /api/platforms/social/facebook/connect` - Initiate OAuth
- `GET /api/platforms/social/facebook/callback` - OAuth callback
- `POST /api/platforms/social/facebook/post` - Post to page/group

### Reddit
- `POST /api/platforms/social/reddit/connect` - Initiate OAuth
- `GET /api/platforms/social/reddit/callback` - OAuth callback
- `POST /api/platforms/social/reddit/post` - Submit post

## Troubleshooting

### "ENCRYPTION_KEY not configured"
Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to `.env` as `ENCRYPTION_KEY`

### "Token expired" errors
Tokens auto-refresh. Ensure `refreshToken` is stored and `clientId`/`clientSecret` are configured.

### Rate limit errors
- Twitter: Wait for reset time in error message
- Reddit: Respect 10-minute delay between posts
- Others: Implement exponential backoff

### OAuth callback errors
- Verify callback URLs match exactly in platform settings
- Check `NEXT_PUBLIC_APP_URL` is correct
- Ensure state parameter matches

## License

Part of Full Self Publishing Platform - Internal Use Only
