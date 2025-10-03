# Help System Quick Start Guide

## For End Users

### Access Help (3 Methods)

1. **Floating Button** - Click the blue help button in bottom-right corner
2. **Keyboard** - Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) or `?`
3. **Navigation** - Visit `/docs` in your browser

### Find Answers Fast

**Search FAQs:**
```
1. Press Cmd+K or click help button
2. Type your question
3. Select from filtered results
OR
Visit /docs/faq and use search bar
```

**Platform Setup:**
```
1. Go to /docs/integrations
2. Click your platform (WordPress, Twitter, etc.)
3. Follow step-by-step guide
```

**Getting Started:**
```
Visit /docs/getting-started
Complete 7 steps in ~20-30 minutes
```

## For Developers

### Add Help to Your Components

**Simple Tooltip:**
```tsx
import { SimpleHelpTooltip } from "@/components/help/help-tooltip"

<SimpleHelpTooltip text="Click to generate content">
  <Button>Generate</Button>
</SimpleHelpTooltip>
```

**Tooltip with Keyboard Shortcut:**
```tsx
import { HelpTooltip } from "@/components/help/help-tooltip"

<HelpTooltip content="Save your changes" keyboard="Cmd+S">
  <Button>Save</Button>
</HelpTooltip>
```

**Feature Help Modal:**
```tsx
import { FeatureHelp } from "@/components/help/help-modal"

<FeatureHelp
  title="Content Generation"
  description="Generate AI-powered content from your GitHub activity"
  steps={[
    { title: "Connect GitHub", content: "Link your repository..." },
    { title: "Configure Settings", content: "Set your preferences..." },
  ]}
  tips={[
    "Start with weekly frequency",
    "Review content before publishing",
  ]}
  relatedDocs={[
    { title: "Getting Started", href: "/docs/getting-started" },
  ]}
/>
```

### Add FAQ Items

**Edit:** `lib/help/faq-data.ts`

```typescript
{
  id: "unique-slug",
  category: "getting-started", // or "platforms", "content", "billing", "troubleshooting", "api"
  question: "How do I...?",
  answer: "You can... by following these steps:\n1. First\n2. Second",
  keywords: ["search", "terms", "for", "finding"],
  relatedLinks: [
    { title: "Related Doc", href: "/docs/page" }
  ]
}
```

### Add Documentation Page

**1. Create MDX file:**
```
content/docs/my-new-page.mdx
```

**2. Add frontmatter:**
```yaml
---
title: "Page Title"
description: "Page description for SEO"
---

# Page Content

Your documentation here...
```

**3. Create route:**
```tsx
// app/docs/my-new-page/page.tsx
import { compileMDX } from "next-mdx-remote/rsc"
import rehypeHighlight from "rehype-highlight"
// ... (copy pattern from existing docs pages)
```

### Add Platform Integration Guide

**1. Create MDX:**
```
content/docs/integrations/platform-name.mdx
```

**2. Follow template:**
```markdown
---
title: "Platform Name Integration"
description: "Connect and publish to Platform"
platform: "platform-slug"
---

# Platform Integration

## Prerequisites
- List requirements

## Setup
### Step 1: Get API Credentials
Instructions...

### Step 2: Connect to FSP
Instructions...

## Configuration
Settings explanation...

## Troubleshooting
Common issues...
```

**3. Update integrations page:**
Add platform to array in `app/docs/integrations/page.tsx`

## Component Reference

### HelpTooltip Props
```typescript
{
  content: ReactNode        // Tooltip content
  children: ReactNode       // Wrapped element
  side?: "top"|"right"|"bottom"|"left"  // Position
  keyboard?: string         // Keyboard shortcut text
  type?: "info"|"help"|"keyboard"       // Icon type
}
```

### FeatureHelp Props
```typescript
{
  title: string            // Modal title
  description: string      // Feature description
  steps?: Array<{          // Step-by-step guide
    title: string
    content: string
  }>
  tips?: string[]          // Pro tips
  warnings?: string[]      // Important warnings
  relatedDocs?: Array<{    // Documentation links
    title: string
    href: string
  }>
  videoUrl?: string        // Tutorial video link
}
```

### FAQItem Type
```typescript
{
  id: string               // Unique identifier
  category: string         // One of 6 categories
  question: string         // Question text
  answer: string           // Answer (supports \n for line breaks)
  keywords?: string[]      // Search terms
  relatedLinks?: Array<{   // Related documentation
    title: string
    href: string
  }>
}
```

## File Locations

```
Components:
├── components/help/help-tooltip.tsx       # Tooltip component
├── components/help/help-modal.tsx         # Feature help modals
├── components/help/help-widget.tsx        # Floating help button
├── components/help/faq-section.tsx        # FAQ display
├── components/ui/command.tsx              # Command palette
└── components/ui/accordion.tsx            # Accordion UI

Data:
└── lib/help/faq-data.ts                   # FAQ database

Documentation:
├── content/docs/getting-started.mdx       # Getting started guide
├── content/docs/api.mdx                   # API reference
├── content/docs/videos.mdx                # Video tutorials
└── content/docs/integrations/
    ├── _index.mdx                         # Integrations overview
    ├── wordpress.mdx                      # WordPress guide
    ├── twitter.mdx                        # Twitter guide
    ├── linkedin.mdx                       # LinkedIn guide
    └── ghost.mdx                          # Ghost guide

Pages:
├── app/docs/page.tsx                      # Docs home
├── app/docs/layout.tsx                    # Docs layout
├── app/docs/getting-started/page.tsx      # Getting started
├── app/docs/api/page.tsx                  # API reference
├── app/docs/faq/page.tsx                  # FAQ page
├── app/docs/videos/page.tsx               # Videos page
└── app/docs/integrations/
    ├── page.tsx                           # Integrations index
    └── [platform]/page.tsx                # Dynamic platform pages
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open help command palette |
| `?` | Open help (when not in input) |
| `Esc` | Close help dialog |
| `↑` / `↓` | Navigate command palette |
| `Enter` | Select command palette item |

## URL Routes

| Route | Description |
|-------|-------------|
| `/docs` | Documentation home |
| `/docs/getting-started` | Getting started guide |
| `/docs/integrations` | Platform integrations index |
| `/docs/integrations/wordpress` | WordPress setup guide |
| `/docs/integrations/twitter` | Twitter setup guide |
| `/docs/integrations/[platform]` | Other platform guides |
| `/docs/api` | API reference |
| `/docs/faq` | FAQ page |
| `/docs/videos` | Video tutorials |

## Styling

All help components use existing design system:
- Tailwind CSS classes
- shadcn/ui components
- Responsive breakpoints
- Dark mode compatible
- Accessible colors

## Best Practices

### For Documentation
1. Use clear, concise language
2. Include code examples
3. Add step-by-step instructions
4. Provide troubleshooting sections
5. Link related documentation
6. Update when features change

### For Tooltips
1. Keep content brief (1-2 sentences)
2. Use action-oriented language
3. Include keyboard shortcuts when relevant
4. Position appropriately (avoid covering content)
5. Don't over-use (only for complex features)

### For FAQ
1. Write as actual questions users ask
2. Provide complete answers
3. Add keywords for searchability
4. Link to detailed documentation
5. Review and update monthly

### For Help Modals
1. Break complex features into steps
2. Include visual aids (when available)
3. Provide "Next Steps" section
4. Keep under 5 minutes to read
5. Test with actual users

## Testing Checklist

- [ ] Help widget appears on all pages
- [ ] Cmd+K / Ctrl+K opens command palette
- [ ] ? opens help (outside inputs)
- [ ] All documentation pages load
- [ ] MDX renders correctly
- [ ] Code syntax highlighting works
- [ ] Links navigate correctly
- [ ] Search functions properly
- [ ] Mobile responsive
- [ ] Dark mode compatible
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

## Support

**Issues or Questions?**
- Create GitHub issue
- Contact support team
- Check FAQ first
- Review documentation

**Want to Contribute?**
- Add FAQ items
- Improve documentation
- Report unclear sections
- Suggest new help topics

---

**Quick Links:**
- [Full Implementation Docs](./HELP_SYSTEM_IMPLEMENTATION.md)
- [Main README](./README.md)
- [Project Tasks](./TASKS.md)
