import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key?: string;      // Character key (legacy)
  code?: string;     // Physical key code (preferred for i18n)
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

export function useKeyboardShortcut(
  config: ShortcutConfig,
  callback: () => void,
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Support both physical key code and character key
      const matchesKey = config.code 
        ? event.code === config.code 
        : config.key 
          ? event.key.toLowerCase() === config.key.toLowerCase()
          : false;
      const matchesAlt = config.altKey ? event.altKey : !event.altKey;
      const matchesCtrl = config.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const matchesShift = config.shiftKey ? event.shiftKey : !event.shiftKey;
      const matchesMeta = config.metaKey ? event.metaKey : !event.metaKey;

      if (matchesKey && matchesAlt && matchesCtrl && matchesShift && matchesMeta) {
        event.preventDefault();
        callback();
      }
    },
    [config, callback, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}
