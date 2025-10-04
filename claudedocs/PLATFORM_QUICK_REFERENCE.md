# Platform Integration Quick Reference

## File Locations

```
lib/platforms/
├── hashnode.ts          # Hashnode adapter
├── devto.ts             # Dev.to adapter
├── formatters/
│   ├── hashnode.ts      # Hashnode content formatter
│   └── devto.ts         # Dev.to content formatter
├── limits.ts            # Character limits (updated)
└── index.ts             # Platform exports (updated)
```

## Import Patterns

```typescript
// Hashnode
import {
  createHashnodeClient,
  createHashnodeArticle,
  getHashnodePublications,
} from '@/lib/platforms';

// Dev.to
import {
  createDevToClient,
  createDevToArticle,
  getDevToArticles,
} from '@/lib/platforms';
```

## Authentication Setup

### Hashnode (OAuth 2.0)
```typescript
// 1. Get OAuth URL
const authUrl = getHashnodeOAuthUrl(
  'https://yourapp.com/callback',
  'state123',
  'read_user write_article'
);

// 2. Exchange code for token
const tokens = await getHashnodeAccessToken(code, redirectUri);

// 3. Create client
const client = createHashnodeClient({
  accessToken: tokens.accessToken
});
```

### Dev.to (API Key)
```typescript
// Simply create client with API key
const client = createDevToClient({
  apiKey: 'user_provided_api_key'
});
```

## Publishing Flow

### Hashnode
```typescript
const result = await createHashnodeArticle(
  client,
  'Article Title',
  'Markdown content...',
  {
    publicationId: 'pub_id',     // Optional, auto-detected
    tags: [
      { id: '1', name: 'JavaScript', slug: 'javascript' }
    ],
    coverImageUrl: 'https://...',
    subtitle: 'Article subtitle',
    slug: 'custom-slug',          // Optional, auto-generated
    publishStatus: 'published',    // or 'draft'
  }
);

// Response
{
  success: true,
  platformPostId: '123',
  platformUrl: 'https://blog.hashnode.dev/article',
  metadata: {
    slug: 'article-title',
    publishedAt: '2024-10-03T...',
    coverImage: 'https://...'
  }
}
```

### Dev.to
```typescript
const result = await createDevToArticle(
  client,
  'Article Title',
  'Markdown content...',
  {
    published: true,              // false for draft
    tags: ['javascript', 'webdev'], // Max 4, lowercase
    mainImage: 'https://...',
    canonicalUrl: 'https://...',
    description: 'Article description',
    series: 'Series Name',        // Optional
    organizationId: 123,          // Optional
  }
);

// Response
{
  success: true,
  platformPostId: '456',
  platformUrl: 'https://dev.to/user/article',
  metadata: {
    published: true,
    slug: 'article-title',
    publishedAt: '2024-10-03T...',
    tags: ['javascript', 'webdev']
  }
}
```

## Content Formatting

### Hashnode
```typescript
import { toHashnode, formatHashnodePost } from '@/lib/platforms';

// Convert content
const formatted = toHashnode(title, markdown, options);

// Prepare for API
const apiPayload = formatHashnodePost(formatted, {
  publicationId: 'pub_id',
  disableComments: false,
  metaTags: {
    title: 'SEO Title',
    description: 'SEO Description',
    image: 'https://...'
  }
});
```

### Dev.to
```typescript
import { toDevTo, formatDevToPost } from '@/lib/platforms';

// Convert content (adds frontmatter)
const formatted = toDevTo(title, markdown, options);

// Prepare for API
const apiPayload = formatDevToPost(formatted, {
  organizationId: 123  // Optional
});
```

## Tag Validation

### Hashnode
```typescript
import { validateHashnodeTags } from '@/lib/platforms';

const validation = validateHashnodeTags([
  { id: '1', name: 'JavaScript', slug: 'javascript' },
  { id: '2', name: 'Web Development', slug: 'webdev' }
]);

// Rules:
// - Max 5 tags
// - Each tag max 50 characters
// - Requires id, name, slug
```

### Dev.to
```typescript
import { validateDevToTags } from '@/lib/platforms';

const validation = validateDevToTags([
  'javascript',
  'webdev',
  'tutorial'
]);

// Rules:
// - Max 4 tags
// - Max 30 characters each
// - Lowercase alphanumeric only
```

## Character Limits

```typescript
import { PLATFORM_LIMITS, validateLength } from '@/lib/platforms/limits';

// Hashnode
PLATFORM_LIMITS.hashnode.characterLimit        // 250,000
PLATFORM_LIMITS.hashnodeTitle.characterLimit   // 250

// Dev.to
PLATFORM_LIMITS.devto.characterLimit           // 400,000
PLATFORM_LIMITS.devtoTitle.characterLimit      // 250

// Validate
const check = validateLength(content, 'hashnode');
if (!check.valid) {
  console.log(check.warning);
}
```

## Error Handling

Both platforms return consistent error format:

```typescript
{
  success: false,
  error: 'Error message describing what went wrong'
}
```

Always check `success` before accessing other fields:

```typescript
const result = await createHashnodeArticle(...);

if (!result.success) {
  console.error('Publication failed:', result.error);
  return;
}

// Safe to access
console.log('Published at:', result.platformUrl);
```

## Testing Connection

```typescript
import {
  testHashnodeConnection,
  testDevToConnection
} from '@/lib/platforms';

// Hashnode
const isValid = await testHashnodeConnection(client);

// Dev.to
const isValid = await testDevToConnection(client);
```

## Additional Features

### Hashnode
```typescript
// Get user publications
const pubs = await getHashnodePublications(client);

// Get publication by domain
const pub = await getHashnodePublicationByDomain(
  client,
  'blog.hashnode.dev'
);

// Update article
await updateHashnodeArticle(client, postId, title, content, options);

// Delete article
await deleteHashnodeArticle(client, postId);
```

### Dev.to
```typescript
// Get user articles
const articles = await getDevToArticles(client, {
  page: 1,
  perPage: 30
});

// Get specific article
const article = await getDevToArticle(client, articleId);

// Publish draft
await publishDevToArticle(client, articleId);

// Unpublish (to draft)
await unpublishDevToArticle(client, articleId);

// Get organizations
const orgs = await getDevToOrganizations(client);

// Upload image
const { url } = await uploadDevToImage(client, imageBlob);
```

## Dev.to Liquid Tags

```typescript
import {
  generateLiquidTags,
  convertEmbedsToLiquid
} from '@/lib/platforms';

// Generate specific tag
const tag = generateLiquidTags('youtube', 'dQw4w9WgXcQ');
// {% youtube dQw4w9WgXcQ %}

// Auto-convert URLs in content
const content = `
Check out this video:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
`;

const withLiquid = convertEmbedsToLiquid(content);
// {% youtube dQw4w9WgXcQ %}

// Supported: youtube, twitter, github, codepen, codesandbox,
//            vimeo, instagram, spotify
```

## HTML to Markdown Conversion

```typescript
import {
  htmlToHashnodeMarkdown,
  htmlToDevToMarkdown
} from '@/lib/platforms';

// Convert HTML to Hashnode-friendly Markdown
const hashMarkdown = htmlToHashnodeMarkdown(htmlContent);

// Convert HTML to Dev.to-friendly Markdown
const devMarkdown = htmlToDevToMarkdown(htmlContent);
```

## Frontmatter Handling

```typescript
import {
  extractHashnodeFrontmatter,
  extractDevToFrontmatter
} from '@/lib/platforms';

// Extract YAML frontmatter
const { frontmatter, content } = extractDevToFrontmatter(markdown);

console.log(frontmatter.title);      // 'Article Title'
console.log(frontmatter.published);  // true
console.log(frontmatter.tags);       // ['javascript', 'webdev']
```

## Environment Variables

Add to `.env`:

```bash
# Hashnode OAuth (required for OAuth flow)
HASHNODE_CLIENT_ID=your_client_id
HASHNODE_CLIENT_SECRET=your_client_secret

# Dev.to (optional - users provide their own API keys)
# DEVTO_API_KEY is stored per-user in database
```

## Database Integration

Both platforms work with existing Platform model:

```typescript
// Store Hashnode connection
await prisma.platform.create({
  data: {
    projectId: 'project_id',
    type: 'HASHNODE',
    config: encrypt({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      publicationId: 'pub_id',
    }),
    isConnected: true,
  }
});

// Store Dev.to connection
await prisma.platform.create({
  data: {
    projectId: 'project_id',
    type: 'DEVTO',
    config: encrypt({
      apiKey: 'user_api_key',
    }),
    isConnected: true,
  }
});
```
