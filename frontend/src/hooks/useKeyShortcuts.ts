'use client';

import { useEffect } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const combo = ctrl ? `ctrl+${key}` : key;
      const action = shortcuts[combo];
      if (action) {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        if (combo === 'Escape' || combo === 'ctrl+f') {
          // Escape and Ctrl+F work everywhere
          e.preventDefault();
          action();
        } else if (!isInput) {
          e.preventDefault();
          action();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
