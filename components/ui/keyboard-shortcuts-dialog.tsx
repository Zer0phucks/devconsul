"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { formatShortcut, type KeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({ shortcuts }: KeyboardShortcutsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "?" && event.shiftKey) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Press <kbd className="px-2 py-1 text-xs bg-muted rounded">Shift</kbd> +{" "}
            <kbd className="px-2 py-1 text-xs bg-muted rounded">?</kbd> to toggle this dialog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group shortcuts by category if needed */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Available Shortcuts</h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="px-3 py-1 text-xs font-mono bg-muted rounded border">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Additional tips */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Most shortcuts won't work when typing in text fields</li>
              <li>Global shortcuts (marked) work anywhere in the app</li>
              <li>On Mac, ⌘ (Cmd) replaces Ctrl in shortcuts</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
