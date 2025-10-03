# Prompt Library API - Complete Guide

## Phase 5.2 Complete - Agent 15

---

## Overview

The Prompt Library API system provides comprehensive management for AI prompts used in content generation across the Full Self Publishing platform. This guide covers all API endpoints, usage patterns, and integration strategies.

---

## API Endpoints Summary

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/prompts` | GET | List prompts with filtering/pagination |
| `/api/prompts` | POST | Create new prompt |
| `/api/prompts/[id]` | GET | Get prompt details with stats |
| `/api/prompts/[id]` | PATCH | Update prompt |
| `/api/prompts/[id]` | DELETE | Delete prompt |
| `/api/prompts/[id]/track-usage` | POST | Track usage statistics |
| `/api/prompts/defaults` | GET | Get default system prompts |
| `/api/prompts/defaults/seed` | POST | Seed default prompts (setup) |

---

## Endpoint Details

### 1. List Prompts - `GET /api/prompts`

**Purpose**: Retrieve prompts with filtering, searching, and pagination.

**Query Parameters**:
```typescript
{
  platform?: 'BLOG' | 'EMAIL' | 'TWITTER' | 'LINKEDIN' | ...;
  category?: 'TECHNICAL_UPDATE' | 'FEATURE_ANNOUNCEMENT' | ...;
  templateId?: string;  // Filter by associated template
  isDefault?: boolean;  // System defaults only
  isPublic?: boolean;   // Public prompts only
  projectId?: string;   // Project-specific prompts
  search?: string;      // Search name/description
  tags?: string;        // Comma-separated tags
  limit?: number;       // Default: 20, Max: 100
  offset?: number;      // Pagination offset
  sortBy?: 'name' | 'createdAt' | 'usageCount' | 'averageRating';
  sortOrder?: 'asc' | 'desc';
}
```

**Response**:
```json
{
  "prompts": [
    {
      "id": "clu123...",
      "name": "Technical Blog Post - Detailed",
      "description": "Comprehensive technical blog post...",
      "category": "TECHNICAL_UPDATE",
      "platform": "BLOG",
      "systemPrompt": "You are a technical content writer...",
      "userPrompt": "Write a comprehensive blog post...",
      "variables": ["activity", "repository", "allCommits"],
      "tags": ["technical", "blog", "detailed"],
      "isDefault": true,
      "isPublic": true,
      "usageCount": 45,
      "averageRating": 4.5,
      "successRate": 0.92,
      "template": {
        "id": "clu456...",
        "name": "Technical Update Template",
        "platform": "BLOG"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Access Control**:
- Returns user's own prompts + public prompts + default system prompts
- Override with `isDefault` or `isPublic` filters

**Example Requests**:

```bash
# Get all blog prompts
GET /api/prompts?platform=BLOG

# Get default prompts only
GET /api/prompts?isDefault=true

# Search prompts by keyword
GET /api/prompts?search=tutorial

# Get prompts for specific template
GET /api/prompts?templateId=clu789...

# Get top-rated prompts
GET /api/prompts?sortBy=averageRating&sortOrder=desc&limit=10
```

---

### 2. Create Prompt - `POST /api/prompts`

**Purpose**: Create a new custom prompt.

**Request Body**:
```json
{
  "name": "My Custom Prompt",
  "description": "Custom prompt for weekly updates",
  "category": "WEEKLY_DIGEST",
  "platform": "NEWSLETTER",
  "systemPrompt": "You are a newsletter writer with a friendly tone...",
  "userPrompt": "Write a weekly digest about:\n\n{{activity}}\n\nInclude highlights and next steps.",
  "variables": ["activity", "projectName", "weekRange"],
  "tags": ["weekly", "newsletter", "custom"],
  "isPublic": false,
  "projectId": "clu000...",
  "templateId": "clu111...",  // Optional: associate with template
  "contentType": "email_newsletter",
  "tone": "friendly",
  "targetLength": 600
}
```

**Response**:
```json
{
  "prompt": { /* created prompt object */ },
  "qualityScore": 85,
  "warnings": [
    "Consider adding output format specification"
  ]
}
```

**Quality Scoring**:
The API automatically validates prompt quality (0-100) based on:
- System prompt completeness (role definition, context)
- User prompt clarity (instructions, variables, format)
- Best practices (tone, examples, structure)

**Score Interpretation**:
- **90-100**: Excellent prompt quality
- **70-89**: Good quality, minor improvements suggested
- **50-69**: Acceptable, but several improvements recommended
- **< 50**: Low quality, significant improvements needed (warnings issued)

**Validation Rules**:
- System prompt: minimum 10 characters
- User prompt: minimum 10 characters
- Name: 1-200 characters
- Description: max 1000 characters
- Tags: array of strings
- Variables: array of variable names matching {{variable}} in prompts

---

### 3. Get Prompt Details - `GET /api/prompts/[id]`

**Purpose**: Retrieve detailed prompt information with version history and statistics.

**Response**:
```json
{
  "prompt": {
    "id": "clu123...",
    "name": "Technical Blog Post",
    "systemPrompt": "...",
    "userPrompt": "...",
    "version": 3,
    "usageCount": 45,
    "lastUsedAt": "2025-10-01T10:30:00Z",
    "averageRating": 4.5,
    "successRate": 0.92,
    "averageTokenUsage": 850,
    "template": {
      "id": "clu456...",
      "name": "Blog Template",
      "platform": "BLOG",
      "content": "# {{projectName}}..."
    },
    "versions": [
      {
        "id": "clu789...",
        "version": 2,
        "createdAt": "2025-09-15T...",
        "name": "Technical Blog Post v2"
      }
    ],
    "parent": {
      "id": "clu012...",
      "version": 2,
      "name": "Technical Blog Post v2"
    }
  },
  "qualityScore": 85,
  "qualitySuggestions": [
    "Consider adding examples in the system prompt",
    "Specify desired markdown format"
  ]
}
```

**Access Control**:
- Owner can access their prompts
- Anyone can access public prompts
- Anyone can access default system prompts

---

### 4. Update Prompt - `PATCH /api/prompts/[id]`

**Purpose**: Update an existing prompt (creates new version if content changes).

**Request Body** (all fields optional):
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "systemPrompt": "Updated system prompt...",
  "userPrompt": "Updated user prompt with {{newVariable}}",
  "variables": ["newVariable", "existingVariable"],
  "tags": ["updated", "improved"],
  "isPublic": true,
  "templateId": "clu999..."
}
```

**Versioning Behavior**:
- If `systemPrompt` or `userPrompt` changes → version increments
- Other field changes → no version change
- Version history is preserved

**Response**:
```json
{
  "prompt": { /* updated prompt */ },
  "qualityScore": 90,
  "warnings": []  // If quality dropped
}
```

**Access Control**:
- Only prompt owner can update
- Cannot update default system prompts

---

### 5. Delete Prompt - `DELETE /api/prompts/[id]`

**Purpose**: Delete a custom prompt.

**Response**:
```json
{
  "success": true,
  "message": "Prompt deleted successfully"
}
```

**Restrictions**:
- Only prompt owner can delete
- Cannot delete default system prompts
- Deletion is permanent (no soft delete)

---

### 6. Track Usage - `POST /api/prompts/[id]/track-usage`

**Purpose**: Record usage statistics and effectiveness metrics.

**Request Body**:
```json
{
  "rating": 4,                    // 1-5 stars (optional)
  "tokenUsage": 850,              // Tokens consumed (optional)
  "wasSuccessful": true,          // Generation succeeded (optional)
  "generatedContentId": "clu...", // Link to content (optional)
  "timeToGenerate": 3500          // Milliseconds (optional)
}
```

**Response**:
```json
{
  "prompt": {
    "id": "clu123...",
    "name": "Technical Blog Post",
    "usageCount": 46,         // Incremented
    "averageRating": 4.48,    // Recalculated
    "successRate": 0.93,      // Recalculated
    "averageTokenUsage": 848, // Recalculated
    "lastUsedAt": "2025-10-02T..."
  },
  "message": "Usage tracked successfully"
}
```

**Calculation Logic**:
- **Usage Count**: Increments by 1 on each call
- **Average Rating**: `(currentAvg * currentCount + newRating) / newCount`
- **Success Rate**: `(currentSuccesses + (wasSuccessful ? 1 : 0)) / newCount`
- **Average Tokens**: `(currentAvgTokens * currentCount + newTokens) / newCount`

**Use Cases**:
- Track which prompts generate best content
- Identify prompts needing improvement
- A/B test different prompt variations
- Monitor token consumption per prompt

---

### 7. Get Default Prompts - `GET /api/prompts/defaults`

**Purpose**: Retrieve all system default prompts.

**Response**:
```json
{
  "prompts": [
    { /* default prompt 1 */ },
    { /* default prompt 2 */ }
  ],
  "byPlatform": {
    "BLOG": [/* blog prompts */],
    "EMAIL": [/* email prompts */],
    "TWITTER": [/* twitter prompts */]
  },
  "total": 6
}
```

**Default Prompts Included**:
1. **Technical Blog Post - Detailed** (BLOG)
2. **Twitter Thread - Development Update** (TWITTER)
3. **Email Newsletter - Weekly Digest** (NEWSLETTER)
4. **LinkedIn Post - Professional Update** (LINKEDIN)
5. **Release Notes - Feature Announcement** (BLOG)
6. **Dev.to Article - Tutorial Style** (DEVTO)

**Platform Coverage**:
All defaults cover major platforms with production-ready prompts

---

### 8. Seed Default Prompts - `POST /api/prompts/defaults/seed`

**Purpose**: One-time setup to seed default prompts (admin/setup only).

**Response (Success)**:
```json
{
  "success": true,
  "message": "Successfully seeded 6 default prompts",
  "prompts": [
    {
      "id": "clu123...",
      "name": "Technical Blog Post - Detailed",
      "platform": "BLOG",
      "category": "TECHNICAL_UPDATE"
    }
    // ... more prompts
  ]
}
```

**Response (Already Seeded)**:
```json
{
  "error": "Default prompts already seeded",
  "existing": 6,
  "message": "Delete existing defaults first or use a migration script"
}
```

**When to Use**:
- Initial platform setup
- After database reset
- Development environment initialization

**Security Note**:
- All users can call this during initial setup
- Prevented if defaults already exist
- Production: Should be called once during deployment

---

## Default Prompts Detailed Specifications

### 1. Technical Blog Post - Detailed

**Category**: `TECHNICAL_UPDATE`
**Platform**: `BLOG`
**Target Length**: 1000 words

**System Prompt**:
```
You are a technical content writer for a software development blog. Your writing style is:
- Clear and accessible to developers of all levels
- Technically accurate with code examples
- Engaging and educational
- Well-structured with clear sections
- Includes practical takeaways

Focus on explaining the "why" behind technical decisions, not just the "what".
```

**User Prompt**:
```
Write a comprehensive blog post about the following development activity:

{{activity}}

Repository: {{repository}}
Latest changes: {{allCommits}}

Include:
1. Overview of changes
2. Technical details and implementation
3. Code examples (if applicable)
4. Benefits and impact
5. Next steps

Target length: 800-1200 words
Tone: Professional but approachable
```

**Variables Used**: `activity`, `repository`, `allCommits`, `latestCommit`, `projectName`

---

### 2. Twitter Thread - Development Update

**Category**: `TECHNICAL_UPDATE`
**Platform**: `TWITTER`
**Target Length**: 280 characters per tweet

**System Prompt**:
```
You are a social media content creator specializing in developer-focused Twitter threads. Your style is:
- Concise and punchy (each tweet under 280 characters)
- Engaging with emojis and formatting
- Builds excitement and interest
- Uses thread format effectively
- Clear call-to-action

Make technical content accessible and shareable.
```

**User Prompt**:
```
Create a Twitter thread (5-7 tweets) about:

{{activity}}

Repository: {{repository}}
Key changes: {{latestCommit}}

Thread structure:
1/ Hook - What's new and exciting
2-5/ Key points and details
Last/ Call to action + link

Keep each tweet under 280 characters.
Use relevant emojis.
Include hashtags: #dev #opensource
```

**Variables Used**: `activity`, `repository`, `latestCommit`, `repositoryUrl`

---

### 3. Email Newsletter - Weekly Digest

**Category**: `WEEKLY_DIGEST`
**Platform**: `NEWSLETTER`
**Target Length**: 650 words

**System Prompt**:
```
You are an email newsletter writer for a development project. Your style is:
- Friendly and conversational
- Well-organized with clear sections
- Highlights key updates
- Includes visuals/formatting hints
- Personal and engaging tone

Build community through consistent, valuable updates.
```

**User Prompt**:
```
Write a weekly development digest email for {{projectName}}:

This week's activity: {{activity}}
Commits: {{commitCount}}
Notable changes: {{allCommits}}

Email structure:
- Warm greeting
- "This Week's Highlights" section
- Detailed updates with context
- "What's Next" preview
- Community engagement ask
- Sign-off

Subject line: {{projectName}} Weekly Update - {{weekRange}}

Tone: Friendly and informative
Length: 500-800 words
```

**Variables Used**: `projectName`, `activity`, `commitCount`, `allCommits`, `weekRange`

---

### 4. LinkedIn Post - Professional Update

**Category**: `TECHNICAL_UPDATE`
**Platform**: `LINKEDIN`
**Target Length**: 200 words

**System Prompt**:
```
You are a LinkedIn content creator for professional software development updates. Your style is:
- Professional but personable
- Business-value focused
- Includes insights and learnings
- Engaging storytelling
- Clear structure with line breaks

Appeal to both technical and non-technical professionals.
```

**User Prompt**:
```
Create a LinkedIn post about development progress:

Project: {{projectName}}
Recent work: {{activity}}
Latest: {{latestCommit}}

Post structure:
- Opening hook (personal or insight)
- Context and problem
- Solution/progress made
- Key learnings
- Impact/results
- Call for engagement

Length: 150-300 words
Use line breaks for readability
Professional tone with personality
```

**Variables Used**: `projectName`, `activity`, `latestCommit`, `repositoryUrl`

---

### 5. Release Notes - Feature Announcement

**Category**: `FEATURE_ANNOUNCEMENT`
**Platform**: `BLOG`
**Target Length**: 600 words

**System Prompt**:
```
You are a product documentation writer creating release notes. Your style is:
- Clear and structured
- Feature-benefit focused
- Includes upgrade instructions
- Highlights breaking changes
- Technical but accessible

Help users understand what changed and why it matters.
```

**User Prompt**:
```
Write release notes for version {{latestReleaseVersion}}:

Release: {{latestRelease}}
Changes: {{latestReleaseNotes}}
Commits included: {{allCommits}}

Structure:
# {{latestReleaseVersion}} Release Notes

## 🎉 New Features
[Feature descriptions with benefits]

## 🔧 Improvements
[Enhancement details]

## 🐛 Bug Fixes
[Fixed issues]

## ⚠️ Breaking Changes
[If any, with migration guide]

## 📦 Installation
[Upgrade instructions]

Tone: Professional and helpful
Be specific about user impact
```

**Variables Used**: `latestReleaseVersion`, `latestRelease`, `latestReleaseNotes`, `allCommits`

---

### 6. Dev.to Article - Tutorial Style

**Category**: `TUTORIAL`
**Platform**: `DEVTO`
**Target Length**: 1200 words

**System Prompt**:
```
You are a Dev.to community writer creating educational content. Your style is:
- Tutorial-focused and practical
- Step-by-step explanations
- Code examples with syntax highlighting
- Beginner-friendly language
- Community-oriented tone

Share knowledge in an accessible, encouraging way.
```

**User Prompt**:
```
Create a Dev.to article teaching about recent development work:

Topic: {{latestCommit}}
Context: {{activity}}
Repository: {{repository}}

Article structure:
- Introduction (what we'll learn)
- Prerequisites
- Step-by-step tutorial
- Code examples
- Explanation of concepts
- Conclusion and next steps
- Resources/links

Include: ```language code blocks```
Use subheadings (##)
Add cover image suggestion
Tags: #tutorial #{{platform}}

Length: 1000-1500 words
Tone: Friendly and educational
```

**Variables Used**: `latestCommit`, `activity`, `repository`, `repositoryUrl`

---

## Quality Scoring System

### Scoring Criteria (0-100)

The quality validation system evaluates prompts based on multiple factors:

#### System Prompt Checks (45 points)
- **Length Check** (15 points): Minimum 50 characters
- **Role Definition** (10 points): Contains "You are..." statement
- **Tone Specification** (5 points): Includes tone/style guidance
- **Examples Bonus** (5 points): Mentions examples or demonstrations
- **Completeness Bonus** (10 points): Over 200 characters with detail

#### User Prompt Checks (50 points)
- **Length Check** (15 points): Minimum 30 characters
- **Variable Usage** (20 points): Uses `{{variables}}` for dynamic content
- **Clear Instructions** (10 points): Contains action verbs (create, generate, write)
- **Format Specification** (10 points): Specifies output format (markdown, HTML, etc.)
- **Completeness Bonus** (5 points): Over 100 characters with detail

#### Overall Quality (5 points)
- Combination of system + user prompt quality
- Bonus for comprehensive prompts

### Quality Interpretation

| Score Range | Quality Level | Action |
|-------------|---------------|--------|
| 90-100 | Excellent | Ready for production use |
| 70-89 | Good | Minor improvements suggested |
| 50-69 | Acceptable | Several improvements recommended |
| 30-49 | Fair | Significant improvements needed |
| 0-29 | Poor | Major revision required |

### Improvement Suggestions

The system provides specific, actionable suggestions:

**Common Suggestions**:
- "System prompt is very short. Consider adding more context and instructions."
- "System prompt should define the AI's role (e.g., 'You are a...')"
- "User prompt doesn't use variables. Consider using {{variables}} for dynamic content."
- "Add clear action verbs (create, generate, write) to guide the AI."
- "Specify the desired output format (markdown, HTML, etc.)"
- "Consider specifying tone and style preferences."

---

## Integration Patterns

### Pattern 1: Template + Prompt Workflow

**Use Case**: Generate content using template structure + AI enhancement

```typescript
// 1. Get template
const template = await fetch(`/api/templates/${templateId}`);
const templateData = await template.json();

// 2. Render template with variables
const rendered = await fetch('/api/templates/render', {
  method: 'POST',
  body: JSON.stringify({
    templateId,
    variables: extractedVariables
  })
});
const { rendered: baseContent } = await rendered.json();

// 3. Get associated prompt
const prompt = await fetch(`/api/prompts/${templateData.template.promptLibrary[0].id}`);
const promptData = await prompt.json();

// 4. Generate AI-enhanced content
const enhanced = await generateContent({
  systemPrompt: promptData.prompt.systemPrompt,
  userPrompt: promptData.prompt.userPrompt.replace(/\{\{activity\}\}/g, baseContent)
});

// 5. Track usage
await fetch(`/api/prompts/${promptData.prompt.id}/track-usage`, {
  method: 'POST',
  body: JSON.stringify({
    rating: userRating,
    tokenUsage: enhanced.usage.total_tokens,
    wasSuccessful: true
  })
});
```

---

### Pattern 2: Direct Prompt Usage

**Use Case**: Generate content directly from prompt without template

```typescript
// 1. List prompts for platform
const prompts = await fetch('/api/prompts?platform=BLOG&category=TECHNICAL_UPDATE');
const { prompts: available } = await prompts.json();

// 2. Select prompt (user choice or automatic)
const selectedPrompt = available[0];

// 3. Extract variables from GitHub activities
const variables = extractTemplateVariables(githubActivities, context);

// 4. Substitute variables in prompts
const systemPrompt = selectedPrompt.systemPrompt;
const userPrompt = Object.keys(variables).reduce(
  (prompt, key) => prompt.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]),
  selectedPrompt.userPrompt
);

// 5. Generate content
const content = await generateContent({ systemPrompt, userPrompt });

// 6. Track effectiveness
await trackUsage(selectedPrompt.id, {
  rating: 5,
  tokenUsage: content.usage.total_tokens,
  wasSuccessful: true
});
```

---

### Pattern 3: A/B Testing Prompts

**Use Case**: Compare effectiveness of different prompts for same content type

```typescript
// 1. Get prompt variations
const variants = await fetch('/api/prompts?category=TECHNICAL_UPDATE&platform=BLOG');
const { prompts } = await variants.json();

// 2. Generate with multiple prompts
const results = await Promise.all(
  variants.prompts.slice(0, 2).map(async (prompt) => {
    const content = await generateContent({
      systemPrompt: prompt.systemPrompt,
      userPrompt: substituteVariables(prompt.userPrompt, variables)
    });

    return { promptId: prompt.id, content };
  })
);

// 3. User selects best result
const bestPromptId = userSelection.promptId;

// 4. Track successful prompt
await trackUsage(bestPromptId, {
  rating: 5,
  wasSuccessful: true,
  tokenUsage: results.find(r => r.promptId === bestPromptId).usage
});

// 5. Track unsuccessful prompt
const otherPromptId = results.find(r => r.promptId !== bestPromptId).promptId;
await trackUsage(otherPromptId, {
  rating: 3,
  wasSuccessful: false
});
```

---

### Pattern 4: Effectiveness Dashboard

**Use Case**: Display prompt performance analytics

```typescript
// 1. Get prompts sorted by effectiveness
const topPrompts = await fetch(
  '/api/prompts?sortBy=averageRating&sortOrder=desc&limit=10'
);

// 2. Get usage statistics
const { prompts } = await topPrompts.json();

// 3. Display metrics
prompts.forEach(prompt => {
  console.log({
    name: prompt.name,
    usageCount: prompt.usageCount,
    averageRating: prompt.averageRating,
    successRate: prompt.successRate,
    avgTokens: prompt.averageTokenUsage,
    efficiency: prompt.successRate / (prompt.averageTokenUsage / 1000) // success per 1K tokens
  });
});

// 4. Identify underperforming prompts
const needsImprovement = prompts.filter(p =>
  p.averageRating < 3.5 || p.successRate < 0.7
);
```

---

## Error Handling

### Common Errors and Solutions

#### 1. 401 Unauthorized
**Cause**: No valid session or authentication failed
**Solution**: Ensure user is logged in with valid session

#### 2. 403 Forbidden
**Cause**: User doesn't own the prompt or trying to modify default prompts
**Solution**: Check prompt ownership before attempting updates/deletes

#### 3. 404 Not Found
**Cause**: Prompt doesn't exist or user doesn't have access
**Solution**: Verify prompt ID and access permissions

#### 4. 400 Validation Error
**Cause**: Invalid request data (missing required fields, invalid types)
**Solution**: Check request body against schema requirements

**Example Error Response**:
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 10,
      "type": "string",
      "path": ["systemPrompt"],
      "message": "System prompt must be at least 10 characters"
    }
  ]
}
```

#### 5. 400 Already Seeded
**Cause**: Attempting to seed defaults when they already exist
**Solution**: Skip seeding or delete existing defaults first

#### 6. 500 Internal Server Error
**Cause**: Database error, unexpected exception
**Solution**: Check server logs, database connection, Prisma client status

---

## Best Practices

### Creating High-Quality Prompts

1. **Define Clear Role** (System Prompt)
   ```
   ✅ "You are a technical content writer specializing in clear explanations..."
   ❌ "Write technical content"
   ```

2. **Use Variables for Flexibility** (User Prompt)
   ```
   ✅ "Write about {{activity}} in {{repository}}"
   ❌ "Write about recent changes"
   ```

3. **Specify Output Format**
   ```
   ✅ "Format as markdown with ## headings"
   ❌ No format specification
   ```

4. **Provide Structure**
   ```
   ✅ "Include: 1. Overview, 2. Details, 3. Conclusion"
   ❌ "Write a blog post"
   ```

5. **Set Tone and Style**
   ```
   ✅ "Tone: Professional but approachable. Style: Conversational with technical accuracy."
   ❌ No tone guidance
   ```

### Prompt Versioning Strategy

- **Version 1**: Initial creation
- **Version 2+**: Content modifications (systemPrompt or userPrompt changes)
- **Metadata-only changes**: Don't increment version
- Keep version history for rollback capability

### Effectiveness Tracking

**When to Track**:
- ✅ After content generation
- ✅ After user edits generated content
- ✅ After content is published
- ✅ After engagement metrics are available

**What to Track**:
- User satisfaction rating (1-5 stars)
- Generation success (did it work?)
- Token consumption (cost efficiency)
- Edit distance (how much user changed output)
- Engagement metrics (if available)

**How to Use Data**:
- Compare prompts for same content type
- Identify underperforming prompts for improvement
- Find most cost-effective prompts (success rate / token usage)
- Guide prompt library curation

---

## Prompt Library Curation

### Default Prompts

**System Responsibilities**:
- Maintain 6 core default prompts
- Cover major platforms (Blog, Twitter, LinkedIn, Email)
- Cover major categories (Technical, Tutorial, Digest, Release)
- High-quality, production-tested prompts
- Regular updates based on effectiveness data

**User Benefits**:
- Immediate productivity (no setup required)
- Best practice examples
- Starting point for customization

### Public Prompts

**Sharing Criteria**:
- Average rating > 4.0
- Success rate > 80%
- Usage count > 10 (proven track record)
- Clear documentation (name, description, variables)
- No project-specific details

**Community Value**:
- Share successful patterns
- Learn from others' effective prompts
- Discover new use cases

### Private Prompts

**Use Cases**:
- Project-specific templates
- Experimental prompts
- Proprietary content strategies
- Work-in-progress improvements

**Ownership**:
- Full control (update, delete, version)
- No sharing required
- Can promote to public when ready

---

## Performance Considerations

### Caching Strategy

**Cache Default Prompts**:
```typescript
// Cache at application level (1 hour TTL)
const defaultPromptsCache = new Map();

async function getDefaultPrompts() {
  if (defaultPromptsCache.has('defaults')) {
    const cached = defaultPromptsCache.get('defaults');
    if (Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.data;
    }
  }

  const data = await fetch('/api/prompts/defaults').then(r => r.json());
  defaultPromptsCache.set('defaults', { data, timestamp: Date.now() });
  return data;
}
```

### Pagination

**List Prompts**:
- Default limit: 20
- Max limit: 100
- Use offset-based pagination
- Consider cursor-based for large datasets

**Best Practice**:
```typescript
// Fetch in batches
async function getAllUserPrompts(userId) {
  const allPrompts = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await fetch(
      `/api/prompts?userId=${userId}&limit=${limit}&offset=${offset}`
    );
    const { prompts, pagination } = await response.json();

    allPrompts.push(...prompts);

    if (!pagination.hasMore) break;
    offset += limit;
  }

  return allPrompts;
}
```

### Rate Limiting

**Track Usage API**:
- Batch usage tracking (collect metrics, send periodically)
- Don't track on every generation (sample or aggregate)

**Best Practice**:
```typescript
// Batch usage tracking
const usageQueue = [];

function queueUsageTracking(promptId, metrics) {
  usageQueue.push({ promptId, metrics });

  if (usageQueue.length >= 10) {
    flushUsageQueue();
  }
}

async function flushUsageQueue() {
  const batch = [...usageQueue];
  usageQueue.length = 0;

  await Promise.all(
    batch.map(({ promptId, metrics }) =>
      fetch(`/api/prompts/${promptId}/track-usage`, {
        method: 'POST',
        body: JSON.stringify(metrics)
      })
    )
  );
}
```

---

## Security Considerations

### Access Control

**Prompt Visibility**:
- User sees: Own prompts + Public + Defaults
- Default prompts: Read-only for all users
- Public prompts: Read-only for all users
- Private prompts: Full control for owner only

**Ownership Validation**:
```typescript
// Server-side check before update/delete
const prompt = await db.promptLibrary.findUnique({ where: { id } });
if (prompt.userId !== session.user.id) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### Input Validation

**All endpoints use Zod validation**:
- Type safety at runtime
- Clear error messages
- Prevents injection attacks
- Enforces business rules

**SQL Injection Prevention**:
- All database access through Prisma ORM
- Parameterized queries
- No raw SQL with user input

### Prompt Injection Risks

**Be Aware**:
- User prompts become part of AI generation
- Malicious prompts could attempt to override system instructions
- Template variables could contain adversarial content

**Mitigation**:
- Clear separation between system and user prompts
- Validate variable content before substitution
- Sanitize HTML output if rendering in browsers
- Monitor generated content for policy violations

---

## Migration and Setup

### Initial Setup

**1. Database Migration**:
```bash
# Run Prisma migration to create tables
npx prisma migrate dev --name add_prompt_library

# Generate Prisma Client
npx prisma generate
```

**2. Seed Default Prompts**:
```bash
# Via API endpoint
curl -X POST http://localhost:3000/api/prompts/defaults/seed \
  -H "Authorization: Bearer ${SESSION_TOKEN}"
```

**3. Verify Setup**:
```bash
# Check default prompts exist
curl http://localhost:3000/api/prompts/defaults

# Should return 6 default prompts
```

### Development Workflow

**1. Local Development**:
```bash
# Start dev server
npm run dev

# In another terminal, seed prompts
npm run seed:prompts  # Create this script
```

**2. Testing**:
```bash
# Run API tests
npm run test:api

# Test prompt quality validation
npm run test:prompts
```

**3. Production Deployment**:
```bash
# Deploy code
git push production main

# Run migrations
npm run db:migrate:deploy

# Seed defaults (one-time)
npm run seed:prompts:production
```

---

## Troubleshooting

### Issue: "Default prompts already seeded"
**Solution**: This is normal after first setup. Defaults only need to be seeded once.

### Issue: Low quality score on custom prompt
**Review**: Check suggestions returned in response
**Action**: Improve system prompt role definition, add format specification, use variables

### Issue: Prompt not appearing in list
**Check**:
- Is it private and you're filtering by isPublic?
- Correct platform/category filters?
- Search term matching?

### Issue: Cannot update prompt
**Check**:
- Are you the prompt owner?
- Is it a default prompt? (Cannot modify defaults)

### Issue: Usage statistics not updating
**Verify**:
- Track-usage API returning success?
- Correct prompt ID in request?
- Metrics being calculated correctly?

---

## Next Steps

**Completed** (Phase 5.2):
- ✅ Prompt Library database schema
- ✅ Prompt CRUD APIs
- ✅ Default prompt seeding
- ✅ Quality validation system
- ✅ Effectiveness tracking
- ✅ Comprehensive documentation

**Pending** (Phase 5.3+):
- ⏳ Prompt library UI components
- ⏳ Prompt editor with quality live-preview
- ⏳ Effectiveness analytics dashboard
- ⏳ A/B testing UI workflow
- ⏳ Integration with content generation

---

**Documentation Date**: 2025-10-02
**Agent**: Agent 15
**Phase**: 5.2 - Prompt Library APIs
**Status**: ✅ Complete
**Next Phase**: 5.3 - Template & Prompt UI Components
