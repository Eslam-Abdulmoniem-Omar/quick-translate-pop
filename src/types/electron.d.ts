// Electron API types exposed via preload script
interface ElectronAPI {
  // Overlay controls
  hideOverlay: () => void;
  
  // Settings persistence
  saveSettings: (settings: { sourceLanguage: string; targetLanguage: string }) => void;
  loadSettings: () => Promise<{ sourceLanguage: string; targetLanguage: string }>;
  
  // Listen for recording trigger from main process
  onStartRecording: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
