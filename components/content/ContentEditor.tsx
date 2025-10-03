'use client';

/**
 * Tiptap-based rich text editor component
 * Features: formatting toolbar, markdown shortcuts, auto-save, character counter
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import { useCallback, useEffect, useState } from 'react';
import { useAutoSave, getTimeSince } from '@/lib/hooks/useAutoSave';
import type { Platform } from '@/lib/validations/content-editor';
import { getPlatformCharLimit } from '@/lib/content/formatters';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Minus,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentEditorProps {
  content: string;
  contentId: string;
  platform?: Platform;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function ContentEditor({
  content,
  contentId,
  platform = 'blog',
  onChange,
  onSave,
  placeholder = 'Start writing...',
  className = '',
}: ContentEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Auto-save hook
  const { status, lastSaved, save } = useAutoSave(content, contentId, {
    debounceMs: 30000, // 30 seconds
    enabled: true,
    onSave,
  });

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none px-4 py-3 min-h-[400px]',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Character count
  const characterCount = editor?.storage.characterCount?.characters() || 0;
  const charLimit = getPlatformCharLimit(platform);
  const charLimitWarning = characterCount > charLimit * 0.9;
  const charLimitExceeded = characterCount > charLimit;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
      // F11 for fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, isFullscreen]);

  // Toolbar button component
  const ToolbarButton = ({
    onClick,
    active = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
        active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
      }`}
    >
      {children}
    </button>
  );

  // Link handler
  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  // Image upload handler
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // TODO: Upload to storage and get URL
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        editor?.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />;
  }

  return (
    <div
      className={`border rounded-lg bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}
    >
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Cmd+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Cmd+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Blocks */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal line"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => setShowLinkInput(!showLinkInput)}
            active={editor.isActive('link')}
            title="Add link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={handleImageUpload} title="Add image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* History */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Cmd+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Fullscreen */}
        <div className="flex items-center gap-1 ml-auto">
          <ToolbarButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (F11)'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </ToolbarButton>
        </div>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="border-b bg-gray-50 p-2 flex items-center gap-2">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 px-3 py-1 border rounded text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSetLink();
              }
              if (e.key === 'Escape') {
                setShowLinkInput(false);
                setLinkUrl('');
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleSetLink}>
            Insert
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className={isFullscreen ? 'overflow-y-auto h-[calc(100vh-120px)]' : ''}
      />

      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Auto-save status */}
          <div className="flex items-center gap-2">
            {status === 'saving' && <span className="text-blue-600">Saving...</span>}
            {status === 'saved' && (
              <span className="text-green-600">
                Saved {lastSaved ? getTimeSince(lastSaved) : ''}
              </span>
            )}
            {status === 'error' && <span className="text-red-600">Error saving</span>}
          </div>

          {/* Character count */}
          <div
            className={`${
              charLimitExceeded
                ? 'text-red-600 font-semibold'
                : charLimitWarning
                  ? 'text-yellow-600'
                  : 'text-gray-600'
            }`}
          >
            {characterCount} / {charLimit} chars
          </div>
        </div>

        {/* Manual save button */}
        <Button size="sm" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving...' : 'Save now'}
        </Button>
      </div>
    </div>
  );
}
