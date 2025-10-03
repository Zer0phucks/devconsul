# Social Media Platform Integration - Setup Guide

## Phase 3.2 Implementation Complete ✅

This document provides step-by-step instructions for setting up and testing the social media platform integrations.

## What Was Implemented

### ✅ Platforms
- **Twitter/X**: OAuth 2.0 with PKCE, tweets, threads, media uploads, rate limiting
- **LinkedIn**: OAuth 2.0, personal/organization posts, articles, media uploads
- **Facebook**: OAuth 2.0, page/group posts, photo uploads, scheduling
- **Reddit**: OAuth 2.0, text/link/image posts, flair selection, subreddit validation

### ✅ Core Infrastructure
- Character limit enforcement system (`lib/platforms/limits.ts`)
- Platform-specific content formatters (`lib/platforms/formatters/social.ts`)
- Token encryption with AES-256-GCM (`lib/platforms/encryption.ts`)
- Validation schemas (`lib/validations/social-platforms.ts`)

### ✅ Platform Clients
- `lib/platforms/twitter.ts` - Twitter API v2 client
- `lib/platforms/linkedin.ts` - LinkedIn API v2 client
- `lib/platforms/facebook.ts` - Facebook Graph API client
- `lib/platforms/reddit.ts` - Reddit API client

### ✅ API Endpoints (12 routes)
- Twitter: `/api/platforms/social/twitter/{connect,callback,post}`
- LinkedIn: `/api/platforms/social/linkedin/{connect,callback,post}`
- Facebook: `/api/platforms/social/facebook/{connect,callback,post}`
- Reddit: `/api/platforms/social/reddit/{connect,callback,post}`

## Prerequisites

### 1. Install Missing Dependencies

The implementation requires `axios` which is not currently in package.json:

```bash
npm install axios
```

Verify all dependencies are installed:
```bash
npm install
```

### 2. Database Setup

Run Prisma migrations to update the schema with FACEBOOK and REDDIT platforms:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (when database is available)
npx prisma migrate dev --name add_facebook_reddit_platforms

# Alternatively, push schema directly
npx prisma db push
```

### 3. Environment Variables

Copy the social platform environment template:

```bash
cp .env.example.social .env.local
# Or append to existing .env file
cat .env.example.social >> .env
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated key to your `.env`:
```env
ENCRYPTION_KEY=your_generated_64_character_hex_key_here
```

## OAuth Application Setup

### Twitter/X

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create new app or select existing app
3. Enable OAuth 2.0 settings:
   - Type: Web App, Automated App or Bot
   - Callback URL: `http://localhost:3000/api/platforms/social/twitter/callback`
   - Website URL: `http://localhost:3000`
4. Generate OAuth 2.0 Client ID and Client Secret
5. Add to `.env`:
   ```env
   TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   ```

**Required Scopes**: `tweet.read`, `tweet.write`, `users.read`, `offline.access`

### LinkedIn

1. Go to https://www.linkedin.com/developers/apps
2. Create new app or select existing app
3. Add Products:
   - "Sign In with LinkedIn using OpenID Connect"
   - Request "Share on LinkedIn" (requires verification)
4. OAuth 2.0 settings:
   - Redirect URL: `http://localhost:3000/api/platforms/social/linkedin/callback`
5. Add to `.env`:
   ```env
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_client_secret
   ```

**Required Scopes**: `openid`, `profile`, `email`, `w_member_social`

### Facebook

1. Go to https://developers.facebook.com/apps
2. Create new app (Business type recommended)
3. Add Products:
   - Facebook Login
   - App Review (for permissions)
4. Settings > Basic:
   - Add platform: Website
   - Site URL: `http://localhost:3000`
5. Facebook Login > Settings:
   - Valid OAuth Redirect URIs: `http://localhost:3000/api/platforms/social/facebook/callback`
6. Request permissions in App Review:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `publish_to_groups` (if needed)
7. Add to `.env`:
   ```env
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```

**Note**: App must be in "Live" mode for production use

### Reddit

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..."
3. Select "web app" type (NOT installed app or script)
4. Settings:
   - Name: Your app name
   - Redirect URI: `http://localhost:3000/api/platforms/social/reddit/callback`
5. Copy Client ID (under app name) and Secret
6. Add to `.env`:
   ```env
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=YourApp/1.0.0 (by /u/yourusername)
   ```

**Required Scopes**: `identity`, `submit`, `edit`, `read`, `flair`

**Important**: Reddit is strict about User-Agent - must be unique and descriptive

### Application URL

Set your application's public URL:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update this to your actual domain and update all OAuth callback URLs in platform settings.

## Verification

Run the verification script to check setup:

```bash
./scripts/verify-social-setup.sh
```

This checks:
- ✅ All required files are present
- ✅ Database schema includes new platforms
- ⚠️ Environment variables are configured
- ⚠️ Dependencies are installed

## Testing

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test OAuth Flow

For each platform, test the OAuth connection:

**Twitter Example**:
```bash
curl -X POST http://localhost:3000/api/platforms/social/twitter/connect \
  -H "Content-Type: application/json" \
  -d '{"projectId": "your_project_id"}'
```

This returns an `authUrl` - open it in a browser to complete OAuth.

### 3. Test Posting

After successful OAuth, test posting:

**Twitter Example**:
```bash
curl -X POST http://localhost:3000/api/platforms/social/twitter/post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test post from Full Self Publishing! 🚀",
    "projectId": "your_project_id"
  }'
```

**LinkedIn Example**:
```bash
curl -X POST http://localhost:3000/api/platforms/social/linkedin/post \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Excited to share this professional update!",
    "visibility": "PUBLIC",
    "projectId": "your_project_id"
  }'
```

**Facebook Example**:
```bash
curl -X POST http://localhost:3000/api/platforms/social/facebook/post \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "your_page_id",
    "content": "Check out our latest update!",
    "projectId": "your_project_id"
  }'
```

**Reddit Example**:
```bash
curl -X POST http://localhost:3000/api/platforms/social/reddit/post \
  -H "Content-Type: application/json" \
  -d '{
    "subreddit": "test",
    "title": "Testing Full Self Publishing Integration",
    "content": "This is a test post",
    "projectId": "your_project_id"
  }'
```

## Character Limits Reference

| Platform | Limit | Smart Truncation |
|----------|-------|------------------|
| Twitter | 280 chars | ✅ Word boundary |
| LinkedIn | 3,000 chars | ✅ Word boundary |
| Facebook | 63,206 chars (recommended) | ✅ Word boundary |
| Reddit | 40,000 chars | ✅ Word boundary |

## Rate Limits

| Platform | Limit | Type |
|----------|-------|------|
| Twitter | 300 tweets per 3 hours | User context |
| LinkedIn | ~1 post per minute | Best practice |
| Facebook | Varies by app review | App-specific |
| Reddit | 1 post per 10 minutes (new accounts) | Account-based |

## Security Best Practices

1. **Never commit `.env` to version control**
2. **Use different credentials for dev/staging/production**
3. **Rotate secrets regularly**
4. **Monitor for unauthorized access**
5. **Implement IP whitelisting where possible**
6. **Use short-lived tokens when available**
7. **Log all OAuth failures for security monitoring**
8. **Implement rate limiting on your API endpoints**

## Documentation

Comprehensive documentation is available at:
- **API Documentation**: `lib/platforms/SOCIAL_README.md`
- **Environment Template**: `.env.example.social`
- **Validation Schemas**: `lib/validations/social-platforms.ts`

## File Structure

```
lib/platforms/
├── limits.ts                      # Character limit enforcement
├── encryption.ts                  # Token encryption (AES-256-GCM)
├── formatters/
│   └── social.ts                  # Platform-specific formatters
├── twitter.ts                     # Twitter API client
├── linkedin.ts                    # LinkedIn API client
├── facebook.ts                    # Facebook Graph API client
├── reddit.ts                      # Reddit API client
└── SOCIAL_README.md               # Comprehensive documentation

app/api/platforms/social/
├── twitter/
│   ├── connect/route.ts           # OAuth initiation
│   ├── callback/route.ts          # OAuth callback
│   └── post/route.ts              # Post tweets/threads
├── linkedin/
│   ├── connect/route.ts
│   ├── callback/route.ts
│   └── post/route.ts
├── facebook/
│   ├── connect/route.ts
│   ├── callback/route.ts
│   └── post/route.ts
└── reddit/
    ├── connect/route.ts
    ├── callback/route.ts
    └── post/route.ts

lib/validations/
└── social-platforms.ts            # Zod validation schemas

prisma/
└── schema.prisma                  # Updated with FACEBOOK, REDDIT

scripts/
└── verify-social-setup.sh         # Setup verification script
```

## Troubleshooting

### "ENCRYPTION_KEY not configured"
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add output to `.env` as `ENCRYPTION_KEY`

### "Token expired" errors
Tokens auto-refresh. Ensure `refreshToken` is stored and `clientId`/`clientSecret` are configured.

### Rate limit errors
- **Twitter**: Wait for reset time in error message
- **Reddit**: Respect 10-minute delay between posts
- **Others**: Implement exponential backoff

### OAuth callback errors
- Verify callback URLs match exactly in platform settings
- Check `NEXT_PUBLIC_APP_URL` is correct
- Ensure state parameter matches

### "axios" module not found
```bash
npm install axios
```

## Production Deployment

1. **Update Environment Variables**:
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Update OAuth Callback URLs** in all platform settings:
   - Twitter: `https://yourdomain.com/api/platforms/social/twitter/callback`
   - LinkedIn: `https://yourdomain.com/api/platforms/social/linkedin/callback`
   - Facebook: `https://yourdomain.com/api/platforms/social/facebook/callback`
   - Reddit: `https://yourdomain.com/api/platforms/social/reddit/callback`

3. **Secure Environment Variables**:
   - Use environment variable management (Vercel, Railway, etc.)
   - Never commit `.env` to git
   - Rotate keys regularly

4. **Enable Production Mode**:
   - Facebook app must be in "Live" mode
   - Complete app reviews for required permissions
   - Test all OAuth flows in staging first

5. **Monitor and Maintain**:
   - Monitor rate limits and implement backoff strategies
   - Regularly rotate encryption keys and re-encrypt tokens
   - Implement token refresh monitoring and alerting
   - Log all API interactions for debugging

## Next Steps

1. ✅ Install dependencies: `npm install axios`
2. ✅ Generate Prisma client: `npx prisma generate`
3. ✅ Run migrations: `npx prisma migrate dev`
4. ✅ Configure environment variables in `.env`
5. ✅ Set up OAuth applications on each platform
6. ✅ Test OAuth flows
7. ✅ Test posting capabilities
8. ✅ Implement rate limiting middleware
9. ✅ Add error monitoring
10. ✅ Deploy to production

## Support

For detailed usage examples and API documentation, see:
- `lib/platforms/SOCIAL_README.md`
- Platform-specific client files in `lib/platforms/`
- Validation schemas in `lib/validations/social-platforms.ts`

---

**Implementation Status**: Phase 3.2 Complete ✅
**Date**: 2025-10-02
**Components**: 4 platforms, 12 API endpoints, full OAuth flows, comprehensive documentation
