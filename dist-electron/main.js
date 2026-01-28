"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const uiohook_napi_1 = require("uiohook-napi");
let mainWindow = null;
let tray = null;
let hideOnIdleTimer = null;
let isOverlayInteractive = false;
function createWindow() {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        x: width - 820,
        y: height - 620,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
        },
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        show: false,
    });
    // Set highest window level to appear above fullscreen videos
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    const startUrl = electron_is_dev_1.default
        ? 'http://localhost:8080'
        : `file://${path_1.default.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);
    mainWindow.on('closed', () => (mainWindow = null));
    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    if (electron_is_dev_1.default) {
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}
function createTray() {
    const iconPath = path_1.default.join(__dirname, electron_is_dev_1.default ? '../public/favicon.ico' : '../dist/favicon.ico');
    tray = new electron_1.Tray(iconPath);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show Overlay',
            click: () => {
                mainWindow?.show();
                mainWindow?.setAlwaysOnTop(true, 'screen-saver');
            }
        },
        { type: 'separator' },
        { label: 'Quit', click: () => electron_1.app.quit() },
    ]);
    tray.setToolTip('Quick Translate Pop');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow?.isVisible()) {
            mainWindow.hide();
        }
        else {
            mainWindow?.show();
            mainWindow?.setAlwaysOnTop(true, 'screen-saver');
        }
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.ipcMain.on('overlay-set-idle', (_event, idle) => {
        if (!mainWindow)
            return;
        // Cancel any pending hide when becoming active again
        if (!idle && hideOnIdleTimer) {
            clearTimeout(hideOnIdleTimer);
            hideOnIdleTimer = null;
        }
        // When idle, make window click-through and hide after a short grace period.
        // This prevents an "invisible rectangle" from blocking clicks while still
        // allowing short-lived in-app toasts to be visible briefly.
        if (idle) {
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
            if (!hideOnIdleTimer) {
                hideOnIdleTimer = setTimeout(() => {
                    hideOnIdleTimer = null;
                    mainWindow?.hide();
                }, 1600);
            }
        }
        else {
            // Default to click-through unless the overlay is explicitly interactive.
            if (isOverlayInteractive) {
                mainWindow.setIgnoreMouseEvents(false);
            }
            else {
                mainWindow.setIgnoreMouseEvents(true, { forward: true });
            }
        }
    });
    electron_1.ipcMain.on('overlay-set-interactive', (_event, interactive) => {
        if (!mainWindow)
            return;
        isOverlayInteractive = interactive;
        if (interactive) {
            mainWindow.setIgnoreMouseEvents(false);
        }
        else {
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
        }
    });
    let isCtrlDown = false;
    let isShiftDown = false;
    let isRecording = false;
    uiohook_napi_1.uIOhook.on('keydown', (e) => {
        if (e.keycode === uiohook_napi_1.UiohookKey.Ctrl || e.keycode === uiohook_napi_1.UiohookKey.CtrlRight) {
            isCtrlDown = true;
        }
        if (e.keycode === uiohook_napi_1.UiohookKey.Shift || e.keycode === uiohook_napi_1.UiohookKey.ShiftRight) {
            isShiftDown = true;
        }
        if (isCtrlDown && isShiftDown && !isRecording) {
            isRecording = true;
            mainWindow?.show();
            mainWindow?.setAlwaysOnTop(true, 'screen-saver');
            mainWindow?.webContents.send('start-recording');
        }
    });
    uiohook_napi_1.uIOhook.on('keyup', (e) => {
        if (e.keycode === uiohook_napi_1.UiohookKey.Ctrl || e.keycode === uiohook_napi_1.UiohookKey.CtrlRight) {
            isCtrlDown = false;
        }
        if (e.keycode === uiohook_napi_1.UiohookKey.Shift || e.keycode === uiohook_napi_1.UiohookKey.ShiftRight) {
            isShiftDown = false;
        }
        if ((!isCtrlDown || !isShiftDown) && isRecording) {
            isRecording = false;
            mainWindow?.webContents.send('stop-recording');
        }
    });
    uiohook_napi_1.uIOhook.start();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
