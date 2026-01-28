import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  onStartRecording: (callback: () => void) => ipcRenderer.on('start-recording', callback),
  onStopRecording: (callback: () => void) => ipcRenderer.on('stop-recording', callback),
  setOverlayIdle: (idle: boolean) => ipcRenderer.send('overlay-set-idle', idle),
  setOverlayInteractive: (interactive: boolean) => ipcRenderer.send('overlay-set-interactive', interactive),
  removeListeners: () => {
    ipcRenderer.removeAllListeners('start-recording');
    ipcRenderer.removeAllListeners('stop-recording');
  }
});
