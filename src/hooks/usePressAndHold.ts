import { useEffect, useCallback, useRef } from 'react';

interface PressAndHoldConfig {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
}

interface PressAndHoldCallbacks {
  onKeyDown: () => void;
  onKeyUp: () => void;
}

export function usePressAndHold(
  config: PressAndHoldConfig,
  callbacks: PressAndHoldCallbacks,
  enabled: boolean = true
) {
  const isPressedRef = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || isPressedRef.current) return;

      const matchesKey = event.key.toLowerCase() === config.key.toLowerCase();
      const matchesAlt = config.altKey ? event.altKey : !event.altKey;
      const matchesCtrl = config.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const matchesShift = config.shiftKey ? event.shiftKey : !event.shiftKey;
      const matchesMeta = config.metaKey ? event.metaKey : !event.metaKey;

      if (matchesKey && matchesAlt && matchesCtrl && matchesShift && matchesMeta) {
        event.preventDefault();
        isPressedRef.current = true;
        callbacks.onKeyDown();
      }
    },
    [config, callbacks, enabled]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !isPressedRef.current) return;

      const matchesKey = event.key.toLowerCase() === config.key.toLowerCase();

      if (matchesKey) {
        event.preventDefault();
        isPressedRef.current = false;
        callbacks.onKeyUp();
      }
    },
    [config, callbacks, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [handleKeyDown, handleKeyUp, enabled]);
}
