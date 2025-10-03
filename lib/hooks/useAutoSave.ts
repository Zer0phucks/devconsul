/**
 * Auto-save hook with debounce and conflict resolution
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (content: string) => Promise<void>;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  status: SaveStatus;
  lastSaved: Date | null;
  error: string | null;
  save: () => Promise<void>;
}

/**
 * Custom hook for auto-saving content with debounce
 *
 * @param content - Content to auto-save
 * @param contentId - Unique identifier for the content
 * @param options - Configuration options
 * @returns Auto-save state and manual save trigger
 *
 * @example
 * const { status, lastSaved, save } = useAutoSave(
 *   content,
 *   'post-123',
 *   {
 *     debounceMs: 2000,
 *     onSave: async (content) => {
 *       await fetch(`/api/content/${id}/draft`, {
 *         method: 'POST',
 *         body: JSON.stringify({ content })
 *       });
 *     }
 *   }
 * );
 */
export function useAutoSave(
  content: string,
  contentId: string,
  options: AutoSaveOptions = {}
): AutoSaveState {
  const {
    debounceMs = 30000, // 30 seconds default
    enabled = true,
    onSave,
    onError,
  } = options;

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);
  const isSavingRef = useRef(false);

  /**
   * Save content to server
   */
  const saveContent = useCallback(async () => {
    if (isSavingRef.current) return;
    if (!onSave) return;

    try {
      isSavingRef.current = true;
      setStatus('saving');
      setError(null);

      await onSave(content);

      setStatus('saved');
      setLastSaved(new Date());
      lastContentRef.current = content;

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setError(errorMessage);
      setStatus('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      isSavingRef.current = false;
    }
  }, [content, onSave, onError]);

  /**
   * Manual save trigger
   */
  const manualSave = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await saveContent();
  }, [saveContent]);

  /**
   * Auto-save effect with debounce
   */
  useEffect(() => {
    if (!enabled) return;
    if (!onSave) return;

    // Skip if content hasn't changed
    if (content === lastContentRef.current) return;

    // Skip if currently saving
    if (isSavingRef.current) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      saveContent();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, enabled, onSave, debounceMs, saveContent]);

  /**
   * Save on unmount if there are unsaved changes
   */
  useEffect(() => {
    return () => {
      if (content !== lastContentRef.current && enabled && onSave) {
        // Use navigator.sendBeacon for reliable unmount saves
        const data = JSON.stringify({ content, contentId });
        navigator.sendBeacon(`/api/content/${contentId}/draft`, data);
      }
    };
  }, [content, contentId, enabled, onSave]);

  /**
   * Handle visibility change (save when tab becomes hidden)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && content !== lastContentRef.current) {
        manualSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [content, manualSave]);

  return {
    status,
    lastSaved,
    error,
    save: manualSave,
  };
}

/**
 * Hook for restoring drafts from local storage
 */
export function useDraftRestore(contentId: string): {
  draft: string | null;
  clearDraft: () => void;
} {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    const key = `draft-${contentId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDraft(parsed.content);
      } catch {
        // Invalid draft, ignore
      }
    }
  }, [contentId]);

  const clearDraft = useCallback(() => {
    const key = `draft-${contentId}`;
    localStorage.removeItem(key);
    setDraft(null);
  }, [contentId]);

  return { draft, clearDraft };
}

/**
 * Get formatted time since last save
 */
export function getTimeSince(date: Date | null): string {
  if (!date) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
