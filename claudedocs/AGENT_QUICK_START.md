# Agent Quick Start Guide

## 🚀 Getting Started - Day 1

### Prerequisites Checklist
- [ ] Clone repository: `git clone <repo-url>`
- [ ] Install dependencies: `npm install`
- [ ] Set up local database: `npm run setup:db`
- [ ] Copy `.env.example` to `.env` and configure
- [ ] Run dev server: `npm run dev`
- [ ] Run tests: `npm test`

---

## 👤 Agent Role Assignment

### Agent A - Platform Engineer (Social)
**Focus**: Social media platform integrations
**Primary Skills**: API integration, OAuth flows, rate limiting
**Week 1-2 Tasks**: Twitter, LinkedIn, Facebook, Reddit

**Your First Task**:
```bash
# Create feature branch
git checkout -b feat/phase-1-agent-a-twitter

# Navigate to the file
code lib/inngest/functions/scheduled-publish.ts

# Find line 587-592 (Twitter TODO)
# Start implementation following the pattern below
```

**Implementation Pattern**:
```typescript
// 1. Create platform adapter
// File: lib/platforms/twitter.ts

import { TwitterApi } from 'twitter-api-v2'

export async function publishToTwitter(
  platform: Platform,
  content: Content
) {
  const client = new TwitterApi({
    appKey: platform.config.appKey,
    appSecret: platform.config.appSecret,
    accessToken: platform.accessToken,
    accessSecret: platform.config.accessSecret,
  })

  // Compose tweet (280 char limit)
  const tweetText = composeTweet(content)

  // Post tweet
  const result = await client.v2.tweet(tweetText)

  return {
    success: true,
    platformPostId: result.data.id,
    platformUrl: `https://twitter.com/user/status/${result.data.id}`,
  }
}

// 2. Update scheduled-publish.ts
case PlatformType.TWITTER:
  return await publishToTwitter(platform, content)
```

**Testing**:
```bash
# Create test file
code __tests__/integration/platforms/twitter.test.ts

# Run your tests
npm run test:integration -- twitter.test.ts
```

---

### Agent B - Platform Engineer (Blog)
**Focus**: Blog platform integrations
**Primary Skills**: API integration, content transformation, markdown
**Week 1-2 Tasks**: Hashnode, Dev.to, Medium, WordPress, Ghost

**Your First Task**:
```bash
# Create feature branch
git checkout -b feat/phase-1-agent-b-hashnode

# Navigate to the file
code lib/inngest/functions/scheduled-publish.ts

# Find line 611-616 (Hashnode TODO)
```

**Implementation Pattern**:
```typescript
// File: lib/platforms/hashnode.ts

import { GraphQLClient } from 'graphql-request'

export async function publishToHashnode(
  platform: Platform,
  content: Content
) {
  const client = new GraphQLClient('https://api.hashnode.com')

  // Create draft mutation
  const mutation = `
    mutation CreateDraft($input: CreateDraftInput!) {
      createDraft(input: $input) {
        draft {
          id
          slug
        }
      }
    }
  `

  const result = await client.request(mutation, {
    input: {
      title: content.title,
      contentMarkdown: content.rawContent,
      tags: content.tags,
      publicationId: platform.config.publicationId,
    },
  })

  return {
    success: true,
    platformPostId: result.createDraft.draft.id,
    platformUrl: `https://${platform.config.domain}/${result.createDraft.draft.slug}`,
  }
}
```

---

### Agent C - Security Engineer
**Focus**: Authentication and authorization
**Primary Skills**: Security, auth flows, access control
**Week 1-2 Tasks**: Remove mock auth, add authorization checks

**Your First Task**:
```bash
# Create feature branch
git checkout -b feat/phase-1-agent-c-auth-removal

# Find all mock auth instances
grep -r "mock-user-id" app/api/

# Start with GitHub repos route
code app/api/github/repos/route.ts
```

**Implementation Pattern**:
```typescript
// Before (line 19):
const userId = 'mock-user-id' // TODO: Replace

// After:
import { requireAuth } from '@/lib/auth'

export async function GET(req: Request) {
  // Get authenticated user
  const user = await requireAuth()

  // Use real user ID
  const repos = await getGitHubRepos(user.id)

  return Response.json(repos)
}
```

**Next: Add ownership verification**:
```typescript
// File: app/api/publishing/single/route.ts

export async function POST(req: Request) {
  const user = await requireAuth()
  const { contentId, platformId } = await req.json()

  // CRITICAL: Verify ownership
  const content = await prisma.content.findFirst({
    where: {
      id: contentId,
      project: { userId: user.id },
    },
  })

  if (!content) {
    return Response.json(
      { error: 'Content not found or unauthorized' },
      { status: 403 }
    )
  }

  // Proceed with publishing
}
```

---

### Agent D - Quality Engineer
**Focus**: Code quality and testing
**Primary Skills**: ESLint, TypeScript, testing
**Week 1-2 Tasks**: Fix ESLint errors, improve type safety

**Your First Task**:
```bash
# Create feature branch
git checkout -b feat/phase-1-agent-d-eslint-fixes

# See all ESLint errors
npm run lint

# Start with analytics test file
code __tests__/integration/api/analytics.test.ts
```

**Implementation Pattern**:
```typescript
// Before (line 32):
const { createMockRequest } = require('./test-helpers')

// After:
import { createMockRequest } from './test-helpers'

// Before (line 94):
const mockData: any = { ... }

// After:
interface MockAnalyticsData {
  projectId: string
  metrics: MetricData[]
  dateRange: DateRange
}

const mockData: MockAnalyticsData = { ... }
```

**Type Safety Pattern**:
```typescript
// Create typed mocks file
// File: __tests__/utils/typed-mocks.ts

import { User, Project, Content } from '@prisma/client'

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: null,
    image: null,
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: null,
    timezone: 'UTC',
    isActive: true,
    ...overrides,
  }
}
```

---

### Agent E - Full-Stack Engineer
**Focus**: AI content generation
**Primary Skills**: AI APIs, prompt engineering, content transformation
**Week 1-2 Tasks**: Implement AI content generation

**Your First Task**:
```bash
# Create feature branch
git checkout -b feat/phase-1-agent-e-ai-generation

# Navigate to the file
code lib/inngest/functions/content-generation.ts

# Find line 154 (AI generation TODO)
```

**Implementation Pattern**:
```typescript
// File: lib/ai/content-generator.ts

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export async function generateContent(
  activity: GitHubActivity,
  config: AIGenerationConfig
): Promise<GeneratedContent> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Build prompt from activity
  const prompt = buildPrompt(activity, config)

  // Generate with GPT-4
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a technical writer creating blog posts from GitHub activity.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const generatedText = completion.choices[0].message.content

  return {
    title: extractTitle(generatedText),
    body: generatedText,
    excerpt: extractExcerpt(generatedText),
    tags: extractTags(activity),
  }
}

// Update in content-generation.ts (line 154):
const generated = await generateContent(activity, config)
await saveGeneratedContent(generated, projectId)
```

---

## 🔄 Daily Workflow

### Morning (9:00 AM - 12:00 PM)

**1. Standup (9:00 AM - 9:15 AM)**
```
Template:
- Yesterday: "Completed Twitter OAuth flow implementation"
- Today: "Working on tweet composition and media upload"
- Blockers: "None" or "Need help with rate limit handling"
- Integration: "Will need Agent C to test auth flow"
```

**2. Pull Latest Changes (9:15 AM)**
```bash
git checkout main
git pull origin main
git checkout feat/phase-1-agent-a-twitter
git rebase main
```

**3. Work on Tasks (9:30 AM - 12:00 PM)**
- Focus on your assigned task
- Write tests as you code
- Commit frequently with clear messages

### Afternoon (1:00 PM - 5:00 PM)

**4. Continue Development (1:00 PM - 4:30 PM)**
```bash
# Run tests frequently
npm run test:watch

# Check linting
npm run lint

# Check types
npx tsc --noEmit
```

**5. Create PR (4:30 PM - 5:00 PM)**
```bash
# Before creating PR
npm run test        # All tests pass
npm run lint        # No errors
npm run build       # Build succeeds

# Create PR
git push origin feat/phase-1-agent-a-twitter
# Open GitHub, create PR with template
```

**6. Evening Sync (5:00 PM - 5:10 PM)**
```
Template:
- Completed: "Twitter OAuth + tweet posting"
- Tomorrow: "Media upload + thread support"
- PR: "#123 - Twitter integration foundation"
- Needs review: "Agent C for auth testing"
```

---

## 📝 Code Standards

### Commit Message Format
```
type(scope): short description

Longer description if needed

- Bullet point for details
- Another detail

Closes #123
```

**Types**: feat, fix, test, docs, refactor, style, chore

**Example**:
```
feat(twitter): implement OAuth flow and basic tweet posting

- Add TwitterApi client wrapper
- Implement OAuth 2.0 with PKCE
- Add tweet composition with 280 char limit
- Include rate limit handling

Closes #45
```

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [x] Unit tests added
- [x] Integration tests added
- [ ] E2E tests added
- [x] Manual testing completed

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex code
- [x] Documentation updated
- [x] No new warnings
- [x] Tests pass locally

## Screenshots
(if applicable)

## Related Issues
Closes #123
```

---

## 🧪 Testing Requirements

### Unit Tests
**Location**: `__tests__/unit/`
**Coverage**: 100% for new code

```typescript
// Example: __tests__/unit/platforms/twitter.test.ts

import { publishToTwitter } from '@/lib/platforms/twitter'

describe('Twitter Platform', () => {
  describe('publishToTwitter', () => {
    it('should publish a tweet successfully', async () => {
      const mockPlatform = createMockPlatform({
        type: PlatformType.TWITTER,
      })
      const mockContent = createMockContent({
        title: 'Test Post',
        body: 'Test content',
      })

      const result = await publishToTwitter(mockPlatform, mockContent)

      expect(result.success).toBe(true)
      expect(result.platformPostId).toBeDefined()
    })

    it('should handle rate limiting', async () => {
      // Test rate limit scenario
    })

    it('should handle long content with threads', async () => {
      // Test thread creation
    })
  })
})
```

### Integration Tests
**Location**: `__tests__/integration/`
**Coverage**: Critical paths

```typescript
// Example: __tests__/integration/platforms/twitter-flow.test.ts

describe('Twitter Integration Flow', () => {
  it('should complete full publish flow', async () => {
    // 1. Authenticate
    // 2. Create content
    // 3. Publish to Twitter
    // 4. Verify publication
    // 5. Check database record
  })
})
```

---

## 🐛 Debugging Tips

### Common Issues

**1. Environment Variables Not Loading**
```bash
# Check .env file exists
ls -la .env

# Verify variables are set
echo $DATABASE_URL

# Restart dev server
npm run dev
```

**2. Prisma Client Out of Sync**
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database (caution: deletes data)
npm run db:reset
```

**3. TypeScript Errors**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear cache
rm -rf .next
npm run dev
```

**4. Test Failures**
```bash
# Run specific test
npm run test -- twitter.test.ts

# Run with verbose output
npm run test -- --verbose

# Update snapshots
npm run test -- -u
```

---

## 🆘 Getting Help

### Quick Questions
**Slack**: #devconsul-agents
**Response Time**: < 15 minutes during work hours

### Blockers
**Standup**: Report in morning standup
**Urgent**: Tag @tech-lead in Slack

### Code Review
**PR Review**: Tag 1 other agent + tech lead
**Response Time**: < 4 hours

### Technical Decisions
**Discussion**: Schedule 30-min call
**Document**: Update `decisions.md`

---

## 📚 Resources

### Documentation
- [Full Execution Plan](./PARALLEL_EXECUTION_PLAN.md)
- [Execution Summary](./EXECUTION_SUMMARY.md)
- [Code Analysis Report](./CODE_ANALYSIS_REPORT.md)
- [Project README](../README.md)

### External Resources
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Inngest Docs](https://www.inngest.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

### Platform API Docs
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Hashnode API](https://api.hashnode.com/)
- [Dev.to API](https://developers.forem.com/api)
- [Medium API](https://github.com/Medium/medium-api-docs)

---

## ✅ End of Day Checklist

Before signing off each day:
- [ ] All commits pushed to feature branch
- [ ] PR created or updated if task complete
- [ ] Tests passing locally
- [ ] Standup notes prepared for tomorrow
- [ ] Blockers documented in Slack
- [ ] Todo list updated

---

## 🎯 Your First Week Goals

### By End of Week 1
- [ ] Complete 2 platform integrations
- [ ] All tests passing for your work
- [ ] 2+ PRs merged
- [ ] Team coordination smooth
- [ ] No blockers carried over weekend

### Success Metrics
- Code quality: 0 ESLint errors
- Test coverage: 100% for new code
- Integration: Daily merges successful
- Communication: Standup participation

---

**Ready to start?** Pick your role and begin with your first task! 🚀

If you have questions, don't hesitate to ask in #devconsul-agents.

**Good luck!** 💪
