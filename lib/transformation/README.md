# Cross-Platform Content Transformation System

## Overview

The Content Transformation System enables intelligent adaptation of content across different platforms while maintaining message integrity and respecting platform-specific constraints.

## Features

### 1. Content Transformation Engine
- AI-powered summarization and expansion
- Platform-specific formatting
- Smart content splitting (Twitter threads, etc.)
- Quality scoring and validation
- Key point preservation

### 2. Platform-Specific Formatters
- **Twitter/X**: 280-char limit, thread creation, smart hashtag placement
- **LinkedIn**: Professional formatting, 3000-char articles
- **Facebook**: Casual tone, 600-char optimal
- **Reddit**: Markdown preservation, 40K-char limit
- **Email**: HTML conversion, spam filter optimization
- **Blog**: Long-form with SEO optimization

### 3. Link Management
- Automatic URL shortening (bit.ly, TinyURL, custom)
- UTM parameter injection for tracking
- Batch link processing
- Fallback mechanisms

### 4. Hashtag System
- Smart hashtag generation from content
- Platform-specific optimization (2-3 for Twitter, 5 for LinkedIn)
- Intelligent placement (inline vs end)
- Hashtag quality scoring

## Usage

### Basic Transformation

```typescript
import { ContentTransformationEngine } from '@/lib/transformation/engine';

const engine = new ContentTransformationEngine('openai');

const result = await engine.transform({
  content: 'Your long-form blog post content here...',
  sourceFormat: 'blog',
  targetFormat: 'twitter',
  tone: 'professional',
});

console.log(result.content); // Transformed Twitter-ready content
console.log(result.metadata.qualityScore); // 0-100 quality score
```

### Batch Transformation

```typescript
import { transformToMultiplePlatforms } from '@/lib/transformation/engine';

const adaptations = await transformToMultiplePlatforms(
  blogContent,
  'blog',
  ['twitter', 'linkedin', 'facebook', 'reddit'],
  {
    tone: 'professional',
    aiProvider: 'openai',
  }
);

// Access transformed content for each platform
console.log(adaptations.twitter.content);
console.log(adaptations.linkedin.content);
```

### With Link Shortening

```typescript
import { replaceUrlsWithShortened } from '@/lib/utils/link-shortener';

const result = await replaceUrlsWithShortened(content, {
  provider: 'tinyurl', // or 'bitly' or 'custom'
  apiKey: process.env.BITLY_API_KEY, // Required for bit.ly
});

console.log(result.content); // Content with shortened URLs
console.log(result.shortenedLinks); // Array of {originalUrl, shortUrl, provider}
```

### With Hashtag Injection

```typescript
import { injectHashtags, generateHashtagsFromContent } from '@/lib/utils/hashtag-injector';

// Auto-generate hashtags
const hashtags = generateHashtagsFromContent(content, 5);

// Inject with smart placement
const result = injectHashtags(content, hashtags, {
  platform: 'twitter',
  placement: 'smart', // or 'inline' or 'end'
});

console.log(result.content); // Content with hashtags
console.log(result.hashtags); // Optimized hashtag list
console.log(result.metadata.totalHashtags); // Count
```

### Integration with AI Generator

```typescript
import { generateWithAdaptation } from '@/lib/ai/generator';

const result = await generateWithAdaptation(
  githubActivities,
  'blog', // Base platform
  ['twitter', 'linkedin', 'facebook'], // Target platforms
  {
    brandVoice: {
      tone: 'professional',
      audience: 'developers',
    },
    transformationSettings: {
      shortenLinks: true,
      addHashtags: true,
      generateHashtags: true,
      tone: 'professional',
    },
  }
);

console.log(result.base.content); // Original blog post
console.log(result.adaptations.twitter.content); // Twitter adaptation
console.log(result.adaptations.linkedin.content); // LinkedIn adaptation
```

## API Routes

### Transform Content
```bash
POST /api/transformation/transform

{
  "content": "Your content here...",
  "sourceFormat": "blog",
  "targetPlatforms": ["twitter", "linkedin", "facebook"],
  "settings": {
    "tone": "professional",
    "addHashtags": true,
    "generateHashtags": true,
    "hashtags": ["#webdev", "#programming"],
    "shortenLinks": true,
    "linkShortener": "tinyurl",
    "addUTM": true,
    "utmSource": "newsletter",
    "utmCampaign": "launch"
  }
}
```

Response:
```json
{
  "success": true,
  "results": {
    "twitter": {
      "content": "Transformed Twitter content...",
      "metadata": {
        "qualityScore": 85,
        "hashtags": ["#webdev", "#programming"],
        "shortenedLinks": [...]
      },
      "warnings": []
    },
    "linkedin": { ... },
    "facebook": { ... }
  }
}
```

### Validate Content
```bash
POST /api/transformation/validate

{
  "content": "Your content here...",
  "platform": "twitter",
  "hashtags": ["#webdev", "#programming", "#coding"]
}
```

Response:
```json
{
  "success": true,
  "validation": {
    "platform": "twitter",
    "qualityScore": 90,
    "isValid": true,
    "content": {
      "length": 250,
      "lengthValidation": {
        "valid": true,
        "length": 250,
        "limit": 280
      }
    },
    "hashtags": {
      "score": 85,
      "valid": ["#webdev", "#programming", "#coding"],
      "invalid": []
    },
    "issues": [],
    "warnings": [],
    "suggestions": []
  }
}
```

## Transformation Rules

### Platform-Specific Strategies

| Source → Target | Strategy | Char Limit | Features |
|----------------|----------|------------|----------|
| Blog → Twitter | Summarize | 280 | Split thread, hashtags, shorten links |
| Blog → LinkedIn | Reformat | 3000 | Professional tone, hashtags |
| Blog → Facebook | Summarize | 600 | Casual tone, hashtags |
| Blog → Reddit | Reformat | 40000 | Markdown, no hashtags |
| Email → Twitter | Summarize | 280 | Extract key CTA |
| Email → LinkedIn | Reformat | 3000 | Professional conversion |

### Quality Scoring

Quality scores (0-100) are calculated based on:
- Length appropriateness for platform (30 points)
- Key point preservation (25 points)
- Format compliance (20 points)
- Hashtag optimization (15 points)
- Link handling (10 points)

**Score Ranges:**
- 80-100: Excellent - Ready to publish
- 60-79: Good - Minor adjustments recommended
- 40-59: Fair - Significant review needed
- 0-39: Poor - Major issues, regenerate recommended

## UI Components

### TransformationPreview
Side-by-side comparison of original and transformed content with quality metrics.

```typescript
import { TransformationPreview } from '@/components/transformation/TransformationPreview';

<TransformationPreview
  originalContent={blogPost}
  transformedContent={adaptations}
  onEdit={(platform, content) => handleEdit(platform, content)}
  onApprove={(platform) => handleApprove(platform)}
  onRegenerate={(platform) => handleRegenerate(platform)}
/>
```

### AdaptationControls
Configuration interface for transformation settings.

```typescript
import { AdaptationControls } from '@/components/transformation/AdaptationControls';

<AdaptationControls
  onSettingsChange={(settings) => setAdaptationSettings(settings)}
  onTransform={() => performTransformation()}
  isTransforming={isLoading}
/>
```

## Configuration

### Environment Variables

```bash
# Link Shortening
BITLY_API_KEY=your_bitly_api_key_here  # Optional, falls back to TinyURL

# AI Providers (for transformation)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Default Settings
AI_PROVIDER=openai  # or 'anthropic'
```

### Platform Limits

```typescript
// Defined in lib/platforms/limits.ts
export const PLATFORM_LIMITS = {
  twitter: { characterLimit: 280, recommendedLimit: 270 },
  linkedin: { characterLimit: 3000, recommendedLimit: 2900 },
  facebook: { characterLimit: 63206, recommendedLimit: 60000 },
  reddit: { characterLimit: 40000, recommendedLimit: 35000 },
  redditTitle: { characterLimit: 300, recommendedLimit: 280 },
};
```

## Best Practices

### 1. Content Transformation
- Always preview transformations before publishing
- Use quality scores as guidance, not absolute rules
- Test hashtag placement for engagement
- Validate URLs after shortening

### 2. Hashtag Usage
- Twitter: 2-3 hashtags max
- LinkedIn: 3-5 relevant professional hashtags
- Facebook: 1-2 hashtags (less important)
- Instagram: 11-30 hashtags (not currently supported)
- Reddit: No hashtags (use flair)

### 3. Link Management
- Use TinyURL for free, quick shortening
- Use bit.ly for analytics and custom domains
- Always add UTM parameters for tracking
- Test shortened links before publishing

### 4. Quality Assurance
- Review AI-generated summaries for accuracy
- Ensure key messages are preserved
- Check platform character limits
- Verify hashtag relevance
- Test links in transformed content

## Troubleshooting

### Common Issues

**Issue:** Transformation quality score is low
- **Solution:** Try regenerating with different tone
- **Solution:** Manually edit key points before transformation
- **Solution:** Ensure source content is well-structured

**Issue:** Links not shortening
- **Solution:** Check BITLY_API_KEY if using bit.ly
- **Solution:** Verify URLs are valid before shortening
- **Solution:** Falls back to TinyURL automatically

**Issue:** Hashtags not generating
- **Solution:** Ensure content has meaningful keywords
- **Solution:** Manually provide hashtags as fallback
- **Solution:** Check content length (too short = no good keywords)

**Issue:** Content exceeds platform limits
- **Solution:** Use thread splitting for Twitter
- **Solution:** Enable AI summarization
- **Solution:** Manually edit to reduce length

## Examples

### Complete Workflow Example

```typescript
import { generateWithAdaptation } from '@/lib/ai/generator';
import { replaceUrlsWithShortened } from '@/lib/utils/link-shortener';

// 1. Generate base content from GitHub activity
const activities = await fetchGitHubActivity(repo);

// 2. Generate with cross-platform adaptation
const result = await generateWithAdaptation(
  activities,
  'blog', // Start with blog post
  ['twitter', 'linkedin', 'facebook'], // Adapt to social
  {
    brandVoice: {
      tone: 'professional',
      audience: 'developers',
      themes: ['open source', 'web development'],
    },
    transformationSettings: {
      shortenLinks: true,
      addHashtags: true,
      generateHashtags: true,
      hashtags: ['#opensource', '#webdev'],
      tone: 'professional',
    },
  }
);

// 3. Optional: Further customize Twitter thread
const twitterContent = result.adaptations.twitter.content;
const tweets = twitterContent.split('\n\n---\n\n');

// 4. Validate before publishing
const validation = await validateContent(tweets[0], 'twitter');
if (validation.qualityScore >= 70) {
  // Publish to platforms
  await publishToTwitter(tweets);
  await publishToLinkedIn(result.adaptations.linkedin.content);
}
```

## Performance Considerations

- **AI API Costs**: Transformation uses AI tokens - monitor usage
- **Rate Limits**: Respect platform API limits for link shortening
- **Caching**: Consider caching transformed content for reuse
- **Batch Processing**: Transform multiple platforms in parallel
- **Fallbacks**: All utilities have fallback mechanisms

## Future Enhancements

- [ ] Image transformation and optimization per platform
- [ ] Video snippet creation for social platforms
- [ ] Emoji optimization based on platform culture
- [ ] A/B testing for different transformations
- [ ] Learning from engagement metrics
- [ ] Multi-language support
- [ ] Instagram integration
- [ ] TikTok caption generation
