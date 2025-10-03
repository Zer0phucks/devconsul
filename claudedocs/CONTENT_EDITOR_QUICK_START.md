# Content Editor - Quick Start Guide

## Installation

Dependencies already installed:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link \
  @tiptap/extension-image @tiptap/extension-code-block-lowlight \
  @tiptap/extension-placeholder lowlight react-markdown rehype-highlight \
  diff-match-patch --legacy-peer-deps
```

## Basic Usage

### 1. Simple Editor

```tsx
import { ContentEditor } from '@/components/content/ContentEditor';

export default function MyPage() {
  const [content, setContent] = useState('');

  return (
    <ContentEditor
      content={content}
      contentId="post-123"
      platform="blog"
      onChange={setContent}
      onSave={async (content) => {
        await fetch('/api/content/post-123', {
          method: 'PUT',
          body: JSON.stringify({ content })
        });
      }}
    />
  );
}
```

### 2. With Preview

```tsx
import { ContentEditor } from '@/components/content/ContentEditor';
import { PreviewModal } from '@/components/content/PreviewModal';

export default function EditorWithPreview() {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <ContentEditor content={content} onChange={setContent} />
      <button onClick={() => setShowPreview(true)}>Preview</button>

      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        content={content}
        defaultPlatform="blog"
      />
    </>
  );
}
```

### 3. With AI Regeneration

```tsx
import { RegenerateModal } from '@/components/content/RegenerateModal';

const [showRegenerate, setShowRegenerate] = useState(false);

<RegenerateModal
  open={showRegenerate}
  onClose={() => setShowRegenerate(false)}
  currentContent={content}
  contentId="post-123"
  onRegenerate={async (options) => {
    const res = await fetch(`/api/content/post-123/regenerate`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
    const data = await res.json();
    return data.variations;
  }}
/>
```

## API Endpoints

### Update Content
```typescript
PUT /api/content/[id]
{
  "content": "Updated content...",
  "title": "New Title",
  "platform": "blog"
}
```

### Regenerate Content
```typescript
POST /api/content/[id]/regenerate
{
  "refinementPrompt": "Make it more technical",
  "keepPrevious": true,
  "generateVariations": true,
  "variationCount": 3,
  "aiModel": "gpt-4"
}
```

### Save Draft
```typescript
POST /api/content/[id]/draft
{
  "content": "Draft content..."
}
```

## Keyboard Shortcuts

- **Cmd/Ctrl + B**: Bold
- **Cmd/Ctrl + I**: Italic
- **Cmd/Ctrl + S**: Save
- **Cmd/Ctrl + Enter**: Save (inline editor)
- **F11**: Fullscreen
- **Escape**: Cancel/Close

## Markdown Shortcuts

- `**text**` → Bold
- `*text*` → Italic
- `# text` → Heading 1
- `## text` → Heading 2
- `- item` → Bullet list
- `1. item` → Ordered list
- `` `code` `` → Inline code
- `> quote` → Blockquote

## Platform Character Limits

| Platform | Limit |
|----------|-------|
| Blog | 50,000 |
| Email | 10,000 |
| Twitter | 280 |
| LinkedIn | 3,000 |
| Facebook | 5,000 |
| Reddit | 40,000 |

## Common Patterns

### Auto-Save with Custom Interval

```tsx
import { useAutoSave } from '@/lib/hooks/useAutoSave';

const { status, save } = useAutoSave(content, 'post-123', {
  debounceMs: 10000, // 10 seconds
  onSave: async (content) => {
    await saveDraft(content);
  }
});
```

### Platform-Specific Formatting

```tsx
import { formatContent } from '@/lib/content/formatters';

const formatted = await formatContent(content, 'twitter');
// Returns: { html, plainText, metadata }
```

### Version Comparison

```tsx
import { VersionHistory } from '@/components/content/VersionHistory';

<VersionHistory
  versions={versions}
  onPreview={(id) => console.log('Preview', id)}
  onRestore={async (id) => {
    await fetch(`/api/content/post-123/versions/${id}`, {
      method: 'PUT'
    });
  }}
/>
```

## Troubleshooting

**Issue**: Editor not rendering
- Check React 19 compatibility
- Verify Tiptap imports

**Issue**: Auto-save not working
- Ensure `onSave` returns Promise
- Check console for errors

**Issue**: Character limit not showing
- Set `platform` prop correctly
- Verify platform in formatters

For full documentation, see `CONTENT_EDITOR_IMPLEMENTATION.md`
