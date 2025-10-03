"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
  global?: boolean;
}

/**
 * Check if the pressed keys match a shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatches = shortcut.alt ? event.altKey : !event.altKey;

  return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * Hook for registering keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcuts to register
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (!shortcut.global && isInput) continue;

        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Format shortcut for display
 * @param shortcut - The keyboard shortcut
 * @returns Formatted string (e.g., "Ctrl+Shift+K")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    // Use Cmd on Mac, Ctrl on other platforms
    const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
    parts.push(isMac ? "⌘" : "Ctrl");
  }

  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");

  parts.push(shortcut.key.toUpperCase());

  return parts.join("+");
}

/**
 * Common keyboard shortcuts preset
 */
export const commonShortcuts = {
  search: (handler: () => void): KeyboardShortcut => ({
    key: "k",
    ctrl: true,
    handler,
    description: "Open search",
    global: true,
  }),

  save: (handler: () => void): KeyboardShortcut => ({
    key: "s",
    ctrl: true,
    handler,
    description: "Save",
  }),

  newItem: (handler: () => void): KeyboardShortcut => ({
    key: "n",
    ctrl: true,
    handler,
    description: "Create new",
    global: true,
  }),

  close: (handler: () => void): KeyboardShortcut => ({
    key: "Escape",
    handler,
    description: "Close",
    global: true,
  }),

  help: (handler: () => void): KeyboardShortcut => ({
    key: "?",
    shift: true,
    handler,
    description: "Show help",
    global: true,
  }),

  undo: (handler: () => void): KeyboardShortcut => ({
    key: "z",
    ctrl: true,
    handler,
    description: "Undo",
  }),

  redo: (handler: () => void): KeyboardShortcut => ({
    key: "z",
    ctrl: true,
    shift: true,
    handler,
    description: "Redo",
  }),
};
