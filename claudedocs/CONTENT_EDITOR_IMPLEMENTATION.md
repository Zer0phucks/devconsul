# Content Editor System - Implementation Documentation

## Overview

Comprehensive content editing system with platform-specific previews, rich text editor, AI regeneration, and version history.

**Phase**: 4.2 - Content Preview & Editing
**Status**: ✅ Complete
**Date**: 2025-10-02

---

## Architecture

### Component Structure

```
components/content/
├── ContentEditor.tsx      - Tiptap-based rich text editor
├── PreviewModal.tsx       - Platform-specific preview modal
├── InlineEditor.tsx       - Quick inline editing
├── RegenerateModal.tsx    - AI regeneration with refinement
└── VersionHistory.tsx     - Version management with diff viewer

lib/content/
└── formatters.ts          - Platform-specific formatters

lib/hooks/
└── useAutoSave.ts         - Auto-save with debounce

lib/validations/
└── content-editor.ts      - Zod validation schemas

lib/ai/
└── generate-content.ts    - AI content generation

app/api/content/[id]/
├── route.ts               - GET/PUT content
├── regenerate/route.ts    - POST regenerate
├── versions/route.ts      - GET/POST versions
├── versions/[versionId]/route.ts - PUT/DELETE version
└── draft/route.ts         - GET/POST draft
```

---

## Components

### 1. ContentEditor (Tiptap-based)

**Location**: `/components/content/ContentEditor.tsx`

**Features**:
- Rich text editing with Tiptap
- Formatting toolbar (bold, italic, headings, lists, links, images)
- Markdown shortcuts (**, *, #, etc.)
- Auto-save every 30 seconds
- Character counter with platform limits
- Keyboard shortcuts (Cmd+S, F11 fullscreen)
- Code blocks with syntax highlighting
- Undo/redo support

**Props**:
```typescript
interface ContentEditorProps {
  content: string;
  contentId: string;
  platform?: Platform;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}
```

**Usage**:
```tsx
<ContentEditor
  content={content}
  contentId="post-123"
  platform="blog"
  onSave={async (content) => {
    await fetch(`/api/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }}
/>
```

### 2. PreviewModal

**Location**: `/components/content/PreviewModal.tsx`

**Features**:
- Platform-specific preview rendering
- Platform switcher (Blog, Email, Twitter, LinkedIn, Facebook, Reddit)
- Mobile/Desktop view toggle
- Metadata display (chars, words, read time, cost)
- Copy to clipboard
- Edit/Regenerate/Publish actions

**Platform Previews**:
- **Blog**: Markdown → formatted HTML with syntax highlighting
- **Email**: Responsive HTML email layout
- **Twitter**: Tweet cards with thread numbering
- **LinkedIn**: Professional post format
- **Facebook**: Casual format with emoji rendering
- **Reddit**: Markdown with subreddit styling

**Props**:
```typescript
interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
  title?: string;
  defaultPlatform?: Platform;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onPublish?: () => void;
  metadata?: {
    aiModel?: string;
    cost?: number;
  };
}
```

### 3. InlineEditor

**Location**: `/components/content/InlineEditor.tsx`

**Features**:
- Quick editing without modal
- Auto-expanding textarea
- Basic formatting toolbar (bold, italic, code)
- Character counter
- Keyboard shortcuts (Cmd+Enter, Escape)
- Optimistic UI updates

**Usage**:
```tsx
<InlineEditor
  content={content}
  contentId="post-123"
  platform="twitter"
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### 4. RegenerateModal

**Location**: `/components/content/RegenerateModal.tsx`

**Features**:
- AI content regeneration
- Optional refinement prompt (200 char max)
- Suggested prompts (chips)
- Multiple variations (A/B testing)
- AI model selector (GPT-3.5, GPT-4, Claude)
- Side-by-side comparison (old vs new)
- Cost estimate display
- Keep previous version option

**Props**:
```typescript
interface RegenerateModalProps {
  open: boolean;
  onClose: () => void;
  currentContent: string;
  contentId: string;
  onRegenerate: (options: RegenerateOptions) => Promise<string[]>;
  estimatedCost?: number;
}
```

### 5. VersionHistory

**Location**: `/components/content/VersionHistory.tsx`

**Features**:
- Version list with metadata
- View/Restore/Delete actions
- Diff viewer (compare two versions)
- Highlight changes (additions/deletions)
- Version info (AI model, refinement prompt)
- Timestamp display

**Props**:
```typescript
interface VersionHistoryProps {
  versions: Version[];
  currentVersionId: string;
  onPreview: (versionId: string) => void;
  onRestore: (versionId: string) => Promise<void>;
  onDelete: (versionId: string) => Promise<void>;
  className?: string;
}
```

---

## Platform-Specific Formatters

**Location**: `/lib/content/formatters.ts`

### Supported Platforms

1. **Blog**
   - Markdown → HTML
   - Syntax highlighting
   - GFM support

2. **Email**
   - Responsive HTML
   - Inline styles
   - Email-safe formatting

3. **Twitter**
   - Split into 280-char tweets
   - Thread numbering
   - Character count per tweet

4. **LinkedIn**
   - Professional formatting
   - Line break preservation
   - Hashtag styling

5. **Facebook**
   - Casual format
   - Emoji support
   - Simple paragraphs

6. **Reddit**
   - Markdown support
   - Code blocks
   - Subreddit styling

### Functions

```typescript
// Main formatter
formatContent(content: string, platform: Platform): Promise<FormattedContent>

// Platform-specific formatters
formatForBlog(content: string): Promise<FormattedContent>
formatForEmail(content: string): Promise<FormattedContent>
formatForTwitter(content: string): FormattedContent
formatForLinkedIn(content: string): FormattedContent
formatForFacebook(content: string): FormattedContent
formatForReddit(content: string): Promise<FormattedContent>

// Utilities
getPlatformCharLimit(platform: Platform): number
exceedsLimit(content: string, platform: Platform): boolean
```

---

## Auto-Save System

**Location**: `/lib/hooks/useAutoSave.ts`

### Features

- Debounced auto-save (30s default)
- Manual save trigger
- Save status tracking (idle, saving, saved, error)
- Visibility change handling (save on tab hide)
- Beacon API for unmount saves
- Conflict resolution support

### Hook Usage

```typescript
const { status, lastSaved, error, save } = useAutoSave(
  content,
  'post-123',
  {
    debounceMs: 30000,
    enabled: true,
    onSave: async (content) => {
      await saveDraft(content);
    },
    onError: (error) => {
      console.error('Save failed:', error);
    }
  }
);
```

### Draft Restore

```typescript
const { draft, clearDraft } = useDraftRestore('post-123');
```

---

## API Endpoints

### 1. Update Content

**Endpoint**: `PUT /api/content/[id]`

**Request**:
```json
{
  "content": "Updated content...",
  "title": "New Title",
  "platform": "blog",
  "metadata": {
    "tags": ["tag1", "tag2"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "content": { /* updated content */ }
}
```

### 2. Regenerate Content

**Endpoint**: `POST /api/content/[id]/regenerate`

**Request**:
```json
{
  "refinementPrompt": "Make it more technical",
  "keepPrevious": true,
  "generateVariations": true,
  "variationCount": 3,
  "aiModel": "gpt-4"
}
```

**Response**:
```json
{
  "success": true,
  "variations": ["variation1", "variation2", "variation3"],
  "cost": 0.009
}
```

### 3. Version Management

**Endpoints**:
- `GET /api/content/[id]/versions` - List versions
- `POST /api/content/[id]/versions` - Create version
- `PUT /api/content/[id]/versions/[versionId]` - Restore version
- `DELETE /api/content/[id]/versions/[versionId]` - Delete version

### 4. Draft Auto-Save

**Endpoints**:
- `GET /api/content/[id]/draft` - Get draft
- `POST /api/content/[id]/draft` - Save draft

---

## Validation Schemas

**Location**: `/lib/validations/content-editor.ts`

### Platform Limits

```typescript
{
  blog: { minLength: 100, maxLength: 50000 },
  email: { minLength: 50, maxLength: 10000 },
  twitter: { minLength: 1, maxLength: 280 },
  linkedin: { minLength: 10, maxLength: 3000 },
  facebook: { minLength: 10, maxLength: 5000 },
  reddit: { minLength: 1, maxLength: 40000 }
}
```

### Schemas

- `platformSchema` - Platform enum
- `contentUpdateSchema` - Content update validation
- `regenerateSchema` - Regeneration options
- `versionCreateSchema` - Version creation
- `draftSaveSchema` - Draft save
- `editorStateSchema` - Editor state (local storage)

---

## Keyboard Shortcuts

### ContentEditor

- **Cmd/Ctrl + B**: Bold
- **Cmd/Ctrl + I**: Italic
- **Cmd/Ctrl + S**: Save
- **F11**: Toggle fullscreen
- **Cmd/Ctrl + Z**: Undo
- **Cmd/Ctrl + Shift + Z**: Redo

### InlineEditor

- **Cmd/Ctrl + Enter**: Save
- **Escape**: Cancel

### Markdown Shortcuts

- `**text**`: Bold
- `*text*`: Italic
- `~~text~~`: Strikethrough
- `` `text` ``: Inline code
- `# text`: Heading 1
- `## text`: Heading 2
- `### text`: Heading 3
- `- item`: Bullet list
- `1. item`: Ordered list
- `> quote`: Blockquote

---

## Testing

### Manual Testing Checklist

**Rich Text Editor**:
- [ ] Bold, italic, strikethrough formatting
- [ ] Headings (H1, H2, H3)
- [ ] Lists (bullet, ordered)
- [ ] Links (with URL input)
- [ ] Code blocks (with syntax highlighting)
- [ ] Images (upload/URL)
- [ ] Undo/redo
- [ ] Fullscreen mode
- [ ] Character counter
- [ ] Auto-save indicator

**Platform Previews**:
- [ ] Blog: Markdown rendering
- [ ] Email: Responsive layout
- [ ] Twitter: Tweet splitting
- [ ] LinkedIn: Professional format
- [ ] Facebook: Casual format
- [ ] Reddit: Markdown with code

**Auto-Save**:
- [ ] Debounced save (30s)
- [ ] Manual save
- [ ] Status indicators
- [ ] Tab hide save
- [ ] Draft restore

**Version History**:
- [ ] Version list
- [ ] Diff viewer
- [ ] Restore version
- [ ] Delete version
- [ ] Compare two versions

**Regeneration**:
- [ ] Refinement prompt
- [ ] Multiple variations
- [ ] AI model selection
- [ ] Side-by-side comparison
- [ ] Cost estimate

### Mobile Responsiveness

- [ ] Toolbar responsive on mobile
- [ ] Touch-friendly editor
- [ ] Preview modal mobile view
- [ ] Inline editor mobile support
- [ ] Version history scrolling

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load Tiptap extensions on demand
2. **Debouncing**: 30s auto-save prevents excessive API calls
3. **Optimistic UI**: Immediate feedback before API response
4. **Code Splitting**: Separate bundles for editor components
5. **Memoization**: Prevent unnecessary re-renders

### Bundle Size

- Tiptap core: ~50KB
- Extensions: ~30KB per extension
- Total estimated: ~150-200KB (gzipped)

---

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Meets 4.5:1 ratio
- **Alternative Text**: Image alt attributes

### Keyboard Navigation

- Tab through toolbar buttons
- Arrow keys in dropdown menus
- Enter to activate buttons
- Escape to close modals

---

## Future Enhancements

### Planned Features

1. **Collaborative Editing**: Real-time multi-user editing
2. **Comments**: Inline comments and suggestions
3. **Templates**: Pre-built content templates
4. **AI Suggestions**: Real-time writing assistance
5. **Grammar Check**: Integrated grammar/spell checking
6. **Export**: PDF, Word, Markdown export
7. **Voice Input**: Speech-to-text support
8. **Offline Mode**: IndexedDB-based offline editing

### Technical Debt

1. Implement proper version table in database
2. Add more robust conflict resolution
3. Improve diff algorithm performance
4. Add comprehensive unit tests
5. Add E2E tests with Playwright

---

## Dependencies

### NPM Packages

```json
{
  "@tiptap/react": "^3.6.3",
  "@tiptap/starter-kit": "^3.6.3",
  "@tiptap/extension-link": "^3.6.3",
  "@tiptap/extension-image": "^3.6.3",
  "@tiptap/extension-code-block-lowlight": "^3.6.3",
  "@tiptap/extension-placeholder": "^3.6.3",
  "lowlight": "^3.3.0",
  "react-markdown": "^10.1.0",
  "rehype-highlight": "^7.0.2",
  "diff-match-patch": "^1.0.5",
  "date-fns": "^4.1.0",
  "zod": "^4.1.11"
}
```

---

## Demo Usage

### Basic Editor

```tsx
import { ContentEditor } from '@/components/content/ContentEditor';

export default function EditorPage() {
  const [content, setContent] = useState('');

  return (
    <ContentEditor
      content={content}
      contentId="demo-123"
      platform="blog"
      onChange={setContent}
      onSave={async (content) => {
        await fetch('/api/content/demo-123', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
      }}
      placeholder="Start writing your blog post..."
    />
  );
}
```

### Full Editing Flow

```tsx
import { useState } from 'react';
import { ContentEditor } from '@/components/content/ContentEditor';
import { PreviewModal } from '@/components/content/PreviewModal';
import { RegenerateModal } from '@/components/content/RegenerateModal';
import { VersionHistory } from '@/components/content/VersionHistory';

export default function ContentEditorPage() {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Editor */}
      <div className="col-span-2">
        <ContentEditor
          content={content}
          contentId="post-123"
          platform="blog"
          onChange={setContent}
          onSave={saveContent}
        />

        <div className="mt-4 flex gap-2">
          <button onClick={() => setShowPreview(true)}>Preview</button>
          <button onClick={() => setShowRegenerate(true)}>Regenerate</button>
        </div>
      </div>

      {/* Version History Sidebar */}
      <div>
        <VersionHistory
          versions={versions}
          currentVersionId={currentId}
          onPreview={handlePreview}
          onRestore={handleRestore}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      <PreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        content={content}
        onEdit={() => setShowPreview(false)}
        onRegenerate={() => {
          setShowPreview(false);
          setShowRegenerate(true);
        }}
      />

      <RegenerateModal
        open={showRegenerate}
        onClose={() => setShowRegenerate(false)}
        currentContent={content}
        contentId="post-123"
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}
```

---

## Troubleshooting

### Common Issues

**Issue**: Auto-save not working
- **Solution**: Check `onSave` callback is provided and returns Promise

**Issue**: Character limit not showing
- **Solution**: Ensure `platform` prop is set correctly

**Issue**: Tiptap editor not rendering
- **Solution**: Check React 19 compatibility, ensure proper import

**Issue**: Diff viewer not showing changes
- **Solution**: Verify two versions are selected for comparison

---

## Summary

✅ **Completed Deliverables**:
- Tiptap-based rich text editor with full formatting
- Platform-specific preview modal (6 platforms)
- Inline editor for quick edits
- AI regeneration with refinement options
- Version history with diff viewer
- Auto-save system with debounce
- Complete API endpoints
- Zod validation schemas
- Platform-specific formatters
- Comprehensive documentation

**Next Steps**: Integration testing with content display and publisher agents.
