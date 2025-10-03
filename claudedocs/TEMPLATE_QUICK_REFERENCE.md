# Template System - Quick Reference Guide

## 🚀 Quick Start

### Create a Template

```typescript
// API: POST /api/templates
const template = await fetch('/api/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Blog Template',
    platform: 'BLOG',
    content: `# {{projectName}} Update - {{dateLong}}

{{allCommits}}

Visit: {{repositoryUrl}}`,
    variables: ['projectName', 'dateLong', 'allCommits', 'repositoryUrl'],
    tags: ['blog', 'technical']
  })
});
```

### Render a Template

```typescript
// API: POST /api/templates/render
const rendered = await fetch('/api/templates/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'template-id-here',
    variables: {
      projectName: 'My Project',
      dateLong: 'January 15, 2024',
      allCommits: '- Fix bug\n- Add feature',
      repositoryUrl: 'https://github.com/user/repo'
    }
  })
});
```

### Use Template Engine Directly

```typescript
import { renderTemplate, extractVariableNames } from '@/lib/templates';

const template = '# {{projectName}} - {{date}}';
const variables = { projectName: 'My App', date: '2024-01-15' };
const result = renderTemplate(template, variables);
// Result: "# My App - 2024-01-15"
```

---

## 📋 Variable Reference

### Most Common Variables

```handlebars
{{repository}}           - Repository name
{{projectName}}          - Project name
{{activity}}             - Activity summary (e.g., "3 commits, 1 PR")
{{commitCount}}          - Number of commits
{{latestCommit}}         - Latest commit message
{{allCommits}}           - All commit titles (list)
{{date}}                 - Current date (YYYY-MM-DD)
{{dateLong}}             - Long date (January 15, 2024)
```

### All Available Variables

| Category | Variables |
|----------|-----------|
| **Repository** | repository, repositoryUrl, repositoryOwner, repositoryName, repositoryDescription |
| **Activity** | activity, activityCount, commitCount, prCount, issueCount, releaseCount |
| **Commits** | latestCommit, latestCommitAuthor, latestCommitUrl, allCommits |
| **Pull Requests** | latestPR, latestPRAuthor, latestPRUrl, allPRs |
| **Issues** | latestIssue, latestIssueUrl, allIssues |
| **Releases** | latestRelease, latestReleaseVersion, latestReleaseUrl, latestReleaseNotes |
| **Date/Time** | date, dateShort, dateLong, time, timestamp, weekNumber, monthName, year, dateRange, weekRange, monthRange |
| **Project** | projectName, projectDescription |
| **Author** | authorName, authorEmail |
| **Brand** | tone, audience |

---

## 🎨 Template Filters

### Syntax
```handlebars
{{variable|filter:argument}}
```

### Available Filters

| Filter | Usage | Example |
|--------|-------|---------|
| `uppercase` | Convert to uppercase | `{{repository\|uppercase}}` → MY-PROJECT |
| `lowercase` | Convert to lowercase | `{{repository\|lowercase}}` → my-project |
| `titlecase` | Title case | `{{repository\|titlecase}}` → My-Project |
| `truncate:N` | Limit to N characters | `{{description\|truncate:100}}` → First 100 chars... |
| `default:value` | Default if empty | `{{optional\|default:N/A}}` → N/A if missing |
| `first` | First line only | `{{allCommits\|first}}` → First commit |
| `count` | Count lines | `{{allCommits\|count}}` → 5 |
| `capitalize` | Capitalize first letter | `{{word\|capitalize}}` → Word |
| `replace:old:new` | Replace text | `{{text\|replace:foo:bar}}` → Replace foo with bar |

### Filter Chaining
```handlebars
{{allCommits|truncate:200|uppercase}}
```

---

## 📝 Template Examples

### Blog Post

```markdown
# {{projectName}} Development Update - {{dateLong}}

## Overview
This week we shipped {{commitCount}} commits to {{repository}}.

## Changes
{{allCommits}}

{{#if latestRelease}}
## Latest Release: {{latestRelease}}
{{latestReleaseNotes}}
{{/if}}

---
*From {{repository}} • {{repositoryUrl}}*
```

### Email Newsletter

```
Subject: {{projectName}} Update - {{monthName}}

Hi!

Here's what's new this month:

{{allCommits|truncate:500}}

Best,
{{authorName}}

---
Unsubscribe: {{unsubscribeUrl}}
```

### Twitter Thread

```
1/ 📢 {{repository}} update!

{{latestCommit|truncate:100}}

2/ This week: {{commitCount}} commits

{{allCommits|first}}

3/ Check it out: {{repositoryUrl}}
```

---

## 🔧 API Endpoints

### List Templates
```http
GET /api/templates?platform=BLOG&limit=20
```

**Query Parameters:**
- `platform` - Filter by platform (BLOG, EMAIL, TWITTER, etc.)
- `category` - Filter by category
- `isDefault` - Show only default templates
- `isPublic` - Show only public templates
- `search` - Search by name/description
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset
- `sortBy` - Sort field (name, createdAt, usageCount)
- `sortOrder` - asc or desc

### Get Template
```http
GET /api/templates/[id]
```

**Response includes:**
- Template details
- Associated prompts
- Version history
- Usage statistics

### Create Template
```http
POST /api/templates

{
  "name": "Template Name",
  "platform": "BLOG",
  "content": "Template content with {{variables}}",
  "tags": ["tag1", "tag2"]
}
```

### Update Template
```http
PATCH /api/templates/[id]

{
  "name": "Updated Name",
  "content": "Updated content"
}
```

### Delete Template
```http
DELETE /api/templates/[id]
```

### Render Template
```http
POST /api/templates/render

{
  "templateId": "template-id",
  "variables": {
    "projectName": "My Project",
    "date": "2024-01-15"
  }
}
```

---

## 🎯 Platform-Specific Templates

### Blog Platforms
- `BLOG` - General blog posts
- `HASHNODE` - Hashnode articles
- `DEVTO` - Dev.to articles
- `MEDIUM` - Medium posts
- `WORDPRESS` - WordPress posts
- `GHOST` - Ghost posts

### Social Media
- `TWITTER` - Twitter posts/threads
- `LINKEDIN` - LinkedIn posts
- `FACEBOOK` - Facebook posts
- `REDDIT` - Reddit posts

### Email
- `EMAIL` - General emails
- `NEWSLETTER` - Newsletter campaigns

### Universal
- `ALL` - Works across all platforms

---

## 💡 Best Practices

### 1. Use Descriptive Variable Names
```handlebars
✅ {{projectName}}
❌ {{p}}
```

### 2. Provide Default Values
```handlebars
{{description|default:No description available}}
```

### 3. Truncate Long Content
```handlebars
{{allCommits|truncate:500}}
```

### 4. Use Filters for Formatting
```handlebars
{{repository|uppercase}} - {{date|date:long}}
```

### 5. Test with Sample Data
```typescript
import { getTemplatePreview } from '@/lib/templates/engine';

const preview = getTemplatePreview(templateContent, {
  repository: 'test-repo',
  commitCount: 5
});
```

---

## 🐛 Common Issues & Solutions

### Issue: "Missing template variable"
**Solution:** Use `|default` filter or set `strict: false`
```handlebars
{{optionalVar|default:N/A}}
```

### Issue: "Unclosed variable tags"
**Solution:** Ensure matching `{{` and `}}`
```handlebars
✅ {{variable}}
❌ {{variable}
```

### Issue: "Variable with spaces"
**Solution:** Use camelCase
```handlebars
✅ {{projectName}}
❌ {{project Name}}
```

### Issue: "Content exceeds platform limits"
**Solution:** Use truncate filter
```handlebars
{{allCommits|truncate:280}}  // Twitter limit
```

---

## 🔍 Debugging

### Check Variable Extraction
```typescript
import { extractVariableNames } from '@/lib/templates/engine';

const vars = extractVariableNames('{{foo}} and {{bar}}');
console.log(vars); // ['foo', 'bar']
```

### Validate Template
```typescript
import { validateTemplate } from '@/lib/templates/engine';

const result = validateTemplate(templateContent);
if (!result.valid) {
  console.error(result.errors);
}
```

### Test Rendering
```typescript
import { getTemplatePreview } from '@/lib/templates/engine';

const preview = getTemplatePreview(template);
console.log(preview);
```

---

## 📚 Resources

- **Full Documentation:** `/claudedocs/TEMPLATE_SYSTEM_IMPLEMENTATION.md`
- **API Source:** `/app/api/templates/`
- **Engine Source:** `/lib/templates/`
- **Validation Schemas:** `/lib/validations/template.ts`
- **Default Templates:** `/lib/templates/defaults.ts`

---

## 🚦 Next Steps

1. **Run Migration:** `npm run db:migrate`
2. **Seed Templates:** Import and seed default templates
3. **Test API:** Use Postman/curl to test endpoints
4. **Build UI:** Create template editor components
5. **Integrate:** Connect to content generation workflow

---

**Last Updated:** 2025-10-02
**Version:** 1.0
**Status:** Production Ready
