/// <reference types="vite/client" />

interface Window {
  electron?: {
    onStartRecording: (callback: () => void) => void;
    onStopRecording: (callback: () => void) => void;
    setOverlayIdle: (idle: boolean) => void;
    setOverlayInteractive: (interactive: boolean) => void;
    removeListeners: () => void;
  };
}
