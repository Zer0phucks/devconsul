# Social Media Platforms - Quick Reference Card

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Configure .env
ENCRYPTION_KEY=<generated_key>
TWITTER_CLIENT_ID=<your_id>
TWITTER_CLIENT_SECRET=<your_secret>
# ... (see .env.example.social for all variables)

# 4. Setup database
npx prisma generate
npx prisma migrate dev

# 5. Verify setup
./scripts/verify-social-setup.sh

# 6. Start server
npm run dev
```

## Platform Limits

| Platform | Max Characters | Thread Support | Media Limit |
|----------|---------------|----------------|-------------|
| Twitter | 280 | ✅ Yes | 4 images |
| LinkedIn | 3,000 (posts) / 110,000 (articles) | ❌ No | 9 images |
| Facebook | 63,206 | ❌ No | Unlimited |
| Reddit | 40,000 | ❌ No | 1 image/link |

## Rate Limits

| Platform | Limit | Type |
|----------|-------|------|
| Twitter | 300 tweets / 3 hours | User context |
| LinkedIn | ~1 post / minute | Best practice |
| Facebook | Varies by app | App-specific |
| Reddit | 1 post / 10 minutes | Account age |

## API Endpoints

### Connect (Initiate OAuth)
```bash
POST /api/platforms/social/{platform}/connect
Body: { "projectId": "string" }
Response: { "authUrl": "string", "state": "string" }
```

### Callback (OAuth Handler)
```bash
GET /api/platforms/social/{platform}/callback
Params: ?code=string&state=string
Redirects: /dashboard/platforms?connected={platform}
```

### Post (Publish Content)
```bash
POST /api/platforms/social/{platform}/post
Body: { platform-specific payload }
Response: { platform-specific response }
```

## Client Usage

### Twitter
```typescript
import { createTwitterClient } from '@/lib/platforms/twitter';

const client = createTwitterClient({
  accessToken: encryptedToken,
  refreshToken: encryptedRefreshToken,
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

// Single tweet
await client.postTweet('Hello world!');

// Thread
await client.postThread({
  tweets: ['First tweet', 'Second tweet', 'Third tweet'],
  addThreadIndicators: true,
});

// With media
const media = await client.uploadMedia(imageBuffer, 'image/png');
await client.postTweet('Check this out!', { mediaIds: [media.media_id_string] });
```

### LinkedIn
```typescript
import { createLinkedInClient } from '@/lib/platforms/linkedin';

const client = createLinkedInClient({
  accessToken: encryptedToken,
  personId: 'linkedin_person_id',
});

// Personal post
await client.createPost('Professional update...', {
  visibility: 'PUBLIC',
  mediaUrls: ['https://example.com/image.jpg'],
});

// Article
await client.createArticle({
  title: 'My Article',
  content: 'Long-form content...',
  canonicalUrl: 'https://example.com/article',
});
```

### Facebook
```typescript
import { createFacebookClient } from '@/lib/platforms/facebook';

const client = createFacebookClient({
  accessToken: encryptedToken,
  pageId: 'facebook_page_id',
});

// Post to page
await client.postToPage('page_123', 'Update text', {
  link: 'https://example.com',
  published: true,
});

// Schedule post
await client.schedulePost(
  'page_123',
  'Future post',
  new Date(Date.now() + 24 * 60 * 60 * 1000)
);
```

### Reddit
```typescript
import { createRedditClient } from '@/lib/platforms/reddit';

const client = createRedditClient({
  accessToken: encryptedToken,
  refreshToken: encryptedRefreshToken,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  userAgent: 'YourApp/1.0',
});

// Text post
await client.submitTextPost(
  'programming',
  'Post Title',
  'Post content...',
  { flairId: 'flair_123' }
);

// Link post
await client.submitLinkPost('webdev', 'Cool Resource', 'https://example.com');
```

## Content Formatters

```typescript
import {
  toTwitterFormat,
  toLinkedInFormat,
  toFacebookFormat,
  toRedditFormat,
} from '@/lib/platforms/formatters/social';

// Twitter (hashtags, concise)
const tweet = toTwitterFormat(content, {
  hashtags: ['tech', 'coding'],
  maxHashtags: 3,
});

// LinkedIn (professional)
const linkedIn = toLinkedInFormat(content, {
  tone: 'professional',
  hashtags: ['technology'],
});

// Facebook (casual)
const facebook = toFacebookFormat(content, {
  tone: 'casual',
  hashtags: ['update'],
});

// Reddit (markdown)
const reddit = toRedditFormat(content, {
  includeUrl: 'https://example.com',
});
```

## Character Limits

```typescript
import { enforceLimit, validateLength } from '@/lib/platforms/limits';

// Enforce with truncation
const result = enforceLimit(longText, 'twitter', { forceTruncate: true });
console.log(result.text); // Truncated
console.log(result.truncated); // true/false

// Validate without modifying
const validation = validateLength(text, 'linkedin');
console.log(validation.valid); // true/false
console.log(validation.warning); // Warning if any
```

## OAuth Callback URLs

```
Development:
Twitter:  http://localhost:3000/api/platforms/social/twitter/callback
LinkedIn: http://localhost:3000/api/platforms/social/linkedin/callback
Facebook: http://localhost:3000/api/platforms/social/facebook/callback
Reddit:   http://localhost:3000/api/platforms/social/reddit/callback

Production:
Twitter:  https://yourdomain.com/api/platforms/social/twitter/callback
LinkedIn: https://yourdomain.com/api/platforms/social/linkedin/callback
Facebook: https://yourdomain.com/api/platforms/social/facebook/callback
Reddit:   https://yourdomain.com/api/platforms/social/reddit/callback
```

## Required OAuth Scopes

```
Twitter:  tweet.read, tweet.write, users.read, offline.access
LinkedIn: openid, profile, email, w_member_social
Facebook: pages_manage_posts, pages_read_engagement, pages_show_list
Reddit:   identity, submit, edit, read, flair
```

## Environment Variables Template

```env
# Encryption (REQUIRED)
ENCRYPTION_KEY=your_64_character_hex_key

# Twitter
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Reddit
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=YourApp/1.0.0

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "ENCRYPTION_KEY not configured" | Generate key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| "Token expired" | Tokens auto-refresh. Check refreshToken and credentials are set |
| "Rate limit exceeded" (Twitter) | Wait for reset time in error message |
| "Rate limit exceeded" (Reddit) | Wait 10 minutes between posts |
| "OAuth callback failed" | Verify callback URLs match exactly in platform settings |
| "axios not found" | Run `npm install axios` |

## Testing Commands

```bash
# Test Twitter connection
curl -X POST http://localhost:3000/api/platforms/social/twitter/connect \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your_project_id"}'

# Test Twitter post
curl -X POST http://localhost:3000/api/platforms/social/twitter/post \
  -H "Content-Type: application/json" \
  -d '{"text": "Test post!", "projectId": "your_project_id"}'

# Test LinkedIn connection
curl -X POST http://localhost:3000/api/platforms/social/linkedin/connect \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your_project_id"}'

# Test Facebook connection
curl -X POST http://localhost:3000/api/platforms/social/facebook/connect \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your_project_id"}'

# Test Reddit connection
curl -X POST http://localhost:3000/api/platforms/social/reddit/connect \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your_project_id"}'
```

## Validation Schemas

```typescript
import {
  twitterPostSchema,
  twitterThreadSchema,
  linkedinPostSchema,
  facebookPostSchema,
  redditPostSchema,
} from '@/lib/validations/social-platforms';

// Validate Twitter post
const validated = twitterPostSchema.parse(requestBody);

// Validate Twitter thread
const thread = twitterThreadSchema.parse(requestBody);

// Validate LinkedIn post
const post = linkedinPostSchema.parse(requestBody);
```

## File Locations

```
Core:
  lib/platforms/limits.ts
  lib/platforms/formatters/social.ts
  lib/platforms/encryption.ts

Clients:
  lib/platforms/twitter.ts
  lib/platforms/linkedin.ts
  lib/platforms/facebook.ts
  lib/platforms/reddit.ts

Validation:
  lib/validations/social-platforms.ts

API Routes:
  app/api/platforms/social/{platform}/connect/route.ts
  app/api/platforms/social/{platform}/callback/route.ts
  app/api/platforms/social/{platform}/post/route.ts

Docs:
  lib/platforms/SOCIAL_README.md
  SETUP_SOCIAL_PLATFORMS.md
  .env.example.social
```

## Database Schema

```prisma
enum PlatformType {
  TWITTER
  LINKEDIN
  FACEBOOK  // ✅ Added in Phase 3.2
  REDDIT    // ✅ Added in Phase 3.2
  // ... other platforms
}

model Platform {
  type           PlatformType
  accessToken    String?      @db.Text  // Encrypted
  refreshToken   String?      @db.Text  // Encrypted
  tokenExpiresAt DateTime?
  isConnected    Boolean      @default(false)
  // ... other fields
}
```

## Next Steps After Setup

1. ✅ Configure environment variables
2. ✅ Run database migrations
3. ✅ Create OAuth apps on each platform
4. ✅ Test OAuth flows
5. ✅ Test posting capabilities
6. ✅ Monitor rate limits
7. ✅ Deploy to production

## Support Resources

- **API Docs**: `/lib/platforms/SOCIAL_README.md` (580+ lines)
- **Setup Guide**: `/SETUP_SOCIAL_PLATFORMS.md`
- **Environment Template**: `/.env.example.social`
- **Verification Script**: `/scripts/verify-social-setup.sh`
- **Implementation Summary**: `/claudedocs/PHASE_3.2_IMPLEMENTATION_SUMMARY.md`

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-10-02
**Implementation**: Phase 3.2 Complete ✅
