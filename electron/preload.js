const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Overlay controls
  hideOverlay: () => ipcRenderer.send('hide-overlay'),
  
  // Settings persistence
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // Listen for recording trigger from main process
  onStartRecording: (callback) => {
    ipcRenderer.on('start-recording', callback);
  },
  
  // Listen for settings changes
  onSettingsChanged: (callback) => {
    ipcRenderer.on('settings-changed', (event, settings) => callback(settings));
  }
});
