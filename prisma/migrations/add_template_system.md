# Migration Guide: Template System

## Overview
This migration adds the Template and Customization system to the database.

## What's Added

### New Models
1. **Template** - Content templates with variable support
2. **PromptLibrary** - AI prompt management
3. **ContentTemplateHistory** - Usage tracking

### New Enums
1. **TemplatePlatform** - Platform types (BLOG, EMAIL, TWITTER, etc.)
2. **PromptCategory** - Prompt categories (TECHNICAL_UPDATE, FEATURE_ANNOUNCEMENT, etc.)

## Running the Migration

### Step 1: Generate Migration
```bash
npx prisma migrate dev --name add_template_system
```

### Step 2: Apply Migration
```bash
npx prisma migrate deploy
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

## Post-Migration Tasks

### 1. Seed Default Templates
Create `/prisma/seeds/templates.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { getAllDefaultTemplates } from '@/lib/templates/defaults';

const prisma = new PrismaClient();

async function seedTemplates() {
  const defaults = getAllDefaultTemplates();

  for (const template of defaults) {
    await prisma.template.create({
      data: {
        name: template.name,
        description: template.description,
        platform: template.platform as any,
        category: template.category,
        content: template.content,
        subject: template.subject,
        variables: template.variables,
        tags: template.tags,
        isDefault: true,
        isPublic: true,
        version: 1,
      },
    });
  }

  console.log(`✅ Seeded ${defaults.length} default templates`);
}

seedTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx tsx prisma/seeds/templates.ts
```

### 2. Verify Migration
```bash
npx prisma studio
```

Check for:
- Template table exists
- PromptLibrary table exists
- ContentTemplateHistory table exists
- Default templates are seeded

## Rollback (if needed)

If you need to rollback:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually drop tables
DROP TABLE IF EXISTS content_template_history;
DROP TABLE IF EXISTS prompt_library;
DROP TABLE IF EXISTS templates;
```

## Troubleshooting

### Issue: Migration fails with foreign key error
**Solution:** Ensure related models (User, Project, Content) exist first

### Issue: Enum values don't match
**Solution:** Check that TemplatePlatform and PromptCategory enums are properly defined

### Issue: Seed script fails
**Solution:** Verify default templates data structure matches schema

## Testing

After migration, test:

1. **Create Template:**
```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "platform": "BLOG",
    "content": "# {{projectName}}"
  }'
```

2. **List Templates:**
```bash
curl http://localhost:3000/api/templates
```

3. **Render Template:**
```bash
curl -X POST http://localhost:3000/api/templates/render \
  -H "Content-Type: application/json" \
  -d '{
    "templateContent": "# {{projectName}}",
    "variables": {"projectName": "Test"}
  }'
```

## Schema Changes

```prisma
// Added to schema.prisma

model Template {
  id                  String    @id @default(cuid())
  projectId           String?
  userId              String?
  name                String
  platform            TemplatePlatform
  content             String    @db.Text
  variables           String[]
  isDefault           Boolean   @default(false)
  // ... additional fields
}

model PromptLibrary {
  id                  String    @id @default(cuid())
  name                String
  category            PromptCategory
  systemPrompt        String    @db.Text
  userPrompt          String    @db.Text
  // ... additional fields
}

model ContentTemplateHistory {
  id                  String    @id @default(cuid())
  contentId           String
  templateId          String?
  variables           Json
  platform            TemplatePlatform
  // ... additional fields
}

enum TemplatePlatform {
  BLOG
  EMAIL
  NEWSLETTER
  TWITTER
  LINKEDIN
  // ... etc
}

enum PromptCategory {
  TECHNICAL_UPDATE
  FEATURE_ANNOUNCEMENT
  // ... etc
}
```

## Success Criteria

✅ Migration runs without errors
✅ All new tables created
✅ Enums properly defined
✅ Foreign keys established
✅ Default templates seeded
✅ API endpoints work

---

**Migration Date:** 2025-10-02
**Schema Version:** 5.1
**Status:** Ready to Deploy
