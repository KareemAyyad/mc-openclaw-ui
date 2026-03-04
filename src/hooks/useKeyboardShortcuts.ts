'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

/**
 * Hook that registers global keyboard shortcuts.
 * Automatically skips shortcuts when focus is inside an input, textarea, or select.
 *
 * @param shortcuts - Array of shortcut definitions
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Returns a standard set of keyboard shortcuts for the app.
 * Pass callbacks for each action you want to enable.
 */
export function getAppShortcuts(actions: {
  newTask?: () => void;
  showHelp?: () => void;
  closeModal?: () => void;
}): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.newTask) {
    shortcuts.push({ key: 'n', handler: actions.newTask, description: 'Create new task' });
  }
  if (actions.showHelp) {
    shortcuts.push({ key: '?', shift: true, handler: actions.showHelp, description: 'Show keyboard shortcuts' });
  }
  if (actions.closeModal) {
    shortcuts.push({ key: 'Escape', handler: actions.closeModal, description: 'Close modal' });
  }

  return shortcuts;
}
