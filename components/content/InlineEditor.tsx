'use client';

/**
 * Inline Editor - Quick editing without modal
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Bold, Italic, Code } from 'lucide-react';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import type { Platform } from '@/lib/validations/content-editor';
import { getPlatformCharLimit } from '@/lib/content/formatters';

interface InlineEditorProps {
  content: string;
  contentId: string;
  platform?: Platform;
  onSave?: (content: string) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function InlineEditor({
  content,
  contentId,
  platform = 'blog',
  onSave,
  onCancel,
  className = '',
}: InlineEditorProps) {
  const [value, setValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save (disabled for inline editor, manual save only)
  const { status, save } = useAutoSave(value, contentId, {
    enabled: false,
    onSave,
  });

  // Character limit
  const charLimit = getPlatformCharLimit(platform);
  const charCount = value.length;
  const charLimitWarning = charCount > charLimit * 0.9;
  const charLimitExceeded = charCount > charLimit;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value, handleSave, onCancel]);

  // Save handler
  const handleSave = async () => {
    if (charLimitExceeded) {
      alert(`Content exceeds ${charLimit} character limit`);
      return;
    }

    setIsSaving(true);
    try {
      await save();
      // Success handled by parent
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Format selection with markdown
  const formatSelection = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      const newValue =
        value.substring(0, start) +
        marker +
        selectedText +
        marker +
        value.substring(end);
      setValue(newValue);

      // Restore selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, end + marker.length);
      }, 0);
    }
  };

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex items-center gap-2">
        <button
          onClick={() => formatSelection('**')}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Bold (Cmd+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatSelection('*')}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Italic (Cmd+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatSelection('`')}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          {/* Character count */}
          <span
            className={`text-xs ${
              charLimitExceeded
                ? 'text-red-600 font-semibold'
                : charLimitWarning
                  ? 'text-yellow-600'
                  : 'text-gray-500'
            }`}
          >
            {charCount} / {charLimit}
          </span>

          {/* Save indicator */}
          {status === 'saving' && (
            <span className="text-xs text-blue-600">Saving...</span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full p-4 resize-none focus:outline-none font-mono text-sm"
        rows={5}
        placeholder="Type here..."
      />

      {/* Actions */}
      <div className="border-t bg-gray-50 p-2 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Cmd</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Enter</kbd> to
          save,{' '}
          <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Esc</kbd> to
          cancel
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || charLimitExceeded}
          >
            <Check className="w-4 h-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
