export {};

declare global {
  interface Window {
    electron?: {
      onStartRecording: (callback: () => void) => void;
      onStopRecording: (callback: () => void) => void;
      removeListeners: () => void;
      setOverlayIdle: (idle: boolean) => void;
      setOverlayInteractive: (interactive: boolean) => void;
    };
  }
}
