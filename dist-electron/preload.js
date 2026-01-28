"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    onStartRecording: (callback) => electron_1.ipcRenderer.on('start-recording', callback),
    onStopRecording: (callback) => electron_1.ipcRenderer.on('stop-recording', callback),
    setOverlayIdle: (idle) => electron_1.ipcRenderer.send('overlay-set-idle', idle),
    setOverlayInteractive: (interactive) => electron_1.ipcRenderer.send('overlay-set-interactive', interactive),
    removeListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('start-recording');
        electron_1.ipcRenderer.removeAllListeners('stop-recording');
    }
});
