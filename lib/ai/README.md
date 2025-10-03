# AI Content Generation Module

Complete AI-powered content generation engine with OpenAI and Anthropic Claude integration for multi-platform content creation.

## Features

- **Dual Provider Support**: OpenAI (GPT-4/3.5) and Anthropic (Claude 3)
- **Automatic Fallback**: If primary provider fails, automatically tries secondary
- **Platform-Specific Prompts**: Optimized for 6 platforms (Blog, Email, Twitter, LinkedIn, Facebook, Reddit)
- **Token Tracking**: Monitor usage and costs
- **Database Integration**: Automatically stores generated content
- **Content Validation**: Ensures platform-specific requirements

## Installation

```bash
npm install openai@^4.0.0 @anthropic-ai/sdk@^0.27.0
```

## Environment Setup

Add to `.env`:

```env
# AI Content Generation
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
AI_PROVIDER="openai" # or "anthropic"
```

## Quick Start

### Generate Content for a Single Platform

```typescript
import { generateContent, parseGitHubActivity } from '@/lib/ai/generator';
import type { GitHubActivity } from '@/lib/ai/generator';

// Sample GitHub activity data
const activities: GitHubActivity[] = [
  {
    type: 'commit',
    title: 'feat: add AI content generation engine',
    description: 'Implemented OpenAI and Anthropic providers',
    timestamp: new Date(),
    additions: 500,
    deletions: 20,
    filesChanged: ['lib/ai/generator.ts', 'lib/ai/providers/openai.ts'],
  },
];

// Generate blog post
const result = await generateContent({
  activities,
  platform: 'blog',
  brandVoice: {
    tone: 'technical but accessible',
    audience: 'software developers',
    themes: ['AI', 'automation', 'productivity'],
  },
  projectId: 'your-project-id', // Optional: stores in database
});

if (result.success) {
  console.log('Generated content:', result.content);
  console.log('Tokens used:', result.metadata.tokensUsed);
  console.log('Cost:', result.metadata.cost);
}
```

### Generate for Multiple Platforms

```typescript
import { generateForAllPlatforms } from '@/lib/ai/generator';

const results = await generateForAllPlatforms(
  activities,
  ['blog', 'twitter', 'linkedin'], // Enabled platforms
  {
    brandVoice: {
      tone: 'professional yet friendly',
      audience: 'tech professionals',
    },
    provider: 'openai', // Optional: defaults to env variable
    projectId: 'your-project-id',
  }
);

results.forEach((result) => {
  console.log(`${result.platform}:`, result.success ? 'Success' : result.error);
});
```

## API Endpoints

### POST /api/ai/generate

Generate content for a specific platform.

**Request:**

```json
{
  "activities": [
    {
      "type": "commit",
      "title": "feat: add user authentication",
      "timestamp": "2024-10-01T12:00:00Z"
    }
  ],
  "platform": "blog",
  "brandVoice": {
    "tone": "technical",
    "audience": "developers"
  },
  "provider": "openai"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "content": "# Building User Authentication...",
    "platform": "blog",
    "metadata": {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "tokensUsed": {
        "prompt": 150,
        "completion": 800,
        "total": 950
      },
      "cost": 0.00095,
      "finishReason": "stop"
    },
    "validation": {
      "valid": true,
      "errors": []
    }
  }
}
```

### POST /api/ai/generate-all

Generate content for all enabled platforms at once.

**Request:**

```json
{
  "activities": [...],
  "enabledPlatforms": ["blog", "twitter", "linkedin"],
  "brandVoice": {...}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [...]
  }
}
```

### POST /api/ai/regenerate

Regenerate existing AI content with optional refinement.

**Request:**

```json
{
  "contentId": "clxxx...",
  "refinementPrompt": "Make it more engaging and add code examples"
}
```

## Platform Specifications

### Blog
- **Format**: Markdown
- **Length**: 800-1500 words
- **Structure**: Title, intro, sections with headings, conclusion
- **Features**: Code blocks, technical depth

### Email Newsletter
- **Format**: HTML-friendly markdown
- **Length**: 300-600 words
- **Style**: Short paragraphs, bullet points, conversational
- **Features**: Subject line, call-to-action

### Twitter/X Thread
- **Format**: Numbered tweets (1/, 2/, 3/)
- **Length**: 5-10 tweets, 280 chars max per tweet
- **Style**: Punchy, engaging hooks
- **Features**: Strategic hashtags

### LinkedIn
- **Format**: Plain text with line breaks
- **Length**: 1300-3000 characters
- **Style**: Professional yet personable
- **Features**: Engagement questions, 3-5 hashtags

### Facebook
- **Format**: Plain text
- **Length**: 400-600 characters
- **Style**: Casual, friendly, accessible
- **Features**: Emojis, simple language

### Reddit
- **Format**: Markdown
- **Style**: Authentic, humble, community-focused
- **Features**: Code blocks, title, no self-promotion

## Advanced Usage

### Custom Prompts

```typescript
const result = await generateContent({
  activities,
  platform: 'blog',
  customPrompt: `
    Write a detailed technical blog post about implementing OAuth.
    Focus on security best practices and common pitfalls.
    Include TypeScript code examples.
  `,
});
```

### Provider Selection with Fallback

```typescript
// Try OpenAI first, fallback to Claude automatically
const result = await generateContent({
  activities,
  platform: 'blog',
  provider: 'openai', // Primary provider
});
// If OpenAI fails, automatically tries Anthropic
```

### Content Validation

```typescript
import { validateContent } from '@/lib/ai/generator';

const validation = validateContent(generatedContent, 'twitter');
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  // ["Tweet 3 exceeds 280 characters (315)"]
}
```

## Token Costs (Approximate)

### OpenAI
- **GPT-4 Turbo**: $0.01/1K prompt tokens, $0.03/1K completion
- **GPT-3.5 Turbo**: $0.0005/1K prompt tokens, $0.0015/1K completion

### Anthropic
- **Claude 3 Opus**: $15/1M prompt tokens, $75/1M completion
- **Claude 3 Sonnet**: $3/1M prompt tokens, $15/1M completion
- **Claude 3 Haiku**: $0.25/1M prompt tokens, $1.25/1M completion

## Error Handling

The system automatically handles:

- **Rate Limiting**: Retries with exponential backoff
- **Provider Failures**: Falls back to alternative provider
- **Network Errors**: Retries retryable errors
- **Invalid API Keys**: Clear error messages

Example error response:

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

## Database Schema

Generated content is stored in the `Content` table:

```typescript
{
  sourceType: 'AI_GENERATED',
  isAIGenerated: true,
  aiModel: 'gpt-3.5-turbo',
  aiMetadata: {
    provider: 'openai',
    tokensUsed: { prompt: 150, completion: 800, total: 950 },
    cost: 0.00095,
    platform: 'blog',
    generatedAt: '2024-10-01T12:00:00Z'
  }
}
```

## Testing

### Test Provider Connection

```typescript
import { createOpenAIProvider, createAnthropicProvider } from '@/lib/ai/providers';

const openai = createOpenAIProvider();
const isConnected = await openai.testConnection();
console.log('OpenAI connected:', isConnected);

const anthropic = createAnthropicProvider();
const isConnectedClaude = await anthropic.testConnection();
console.log('Anthropic connected:', isConnectedClaude);
```

### Sample GitHub Activity Data

```typescript
const sampleActivities: GitHubActivity[] = [
  {
    type: 'commit',
    title: 'feat: implement user authentication with JWT',
    description: 'Added secure JWT-based authentication system',
    timestamp: new Date('2024-10-01'),
    additions: 250,
    deletions: 10,
    filesChanged: ['auth/jwt.ts', 'middleware/auth.ts'],
  },
  {
    type: 'pr',
    title: 'Add API rate limiting',
    description: 'Implemented Redis-based rate limiting for API endpoints',
    url: 'https://github.com/user/repo/pull/123',
    timestamp: new Date('2024-10-02'),
  },
  {
    type: 'release',
    title: 'v1.2.0 - Enhanced Security Features',
    description: 'Added JWT auth, rate limiting, and improved error handling',
    timestamp: new Date('2024-10-03'),
  },
];
```

## Best Practices

1. **Always provide project context** via GitHub activities
2. **Set brand voice** for consistent tone across platforms
3. **Validate generated content** before publishing
4. **Monitor token usage** to control costs
5. **Store projectId** to track generated content in database
6. **Use appropriate platforms** for your audience
7. **Review AI content** before publishing (human-in-the-loop)

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is set in `.env`
- Check API key is valid

### "Rate limit exceeded"
- System will automatically fallback to alternative provider
- Wait a few minutes and retry
- Consider upgrading API plan

### "Content validation errors"
- Review platform-specific requirements
- Adjust custom prompts for length constraints
- Regenerate with refinement prompts

## Production Checklist

- [ ] API keys configured in environment variables
- [ ] Both providers tested and working
- [ ] Database schema migrated (Prisma)
- [ ] Rate limiting configured on API endpoints
- [ ] Error monitoring setup (Sentry/similar)
- [ ] Content moderation/review workflow established
- [ ] Token usage monitoring dashboard
- [ ] Backup provider credentials

## Future Enhancements

- Content scheduling integration
- A/B testing for generated content
- Performance analytics per platform
- Custom model fine-tuning
- Multi-language support
- Image generation integration
- SEO optimization features
