import { app, BrowserWindow, Tray, Menu, ipcMain, screen, shell } from 'electron';
import path from 'path';
import { uIOhook, UiohookKey } from 'uiohook-napi';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let hideOnIdleTimer: NodeJS.Timeout | null = null;
let isOverlayInteractive = false;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: width - 820,
    y: height - 620,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
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

  const startUrl = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => (mainWindow = null));

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createTray() {
  const iconPath = path.join(__dirname, isDev ? '../public/favicon.ico' : '../dist/favicon.ico');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Overlay', 
      click: () => {
        mainWindow?.show();
        mainWindow?.setAlwaysOnTop(true, 'screen-saver');
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setToolTip('Quick Translate Pop');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.setAlwaysOnTop(true, 'screen-saver');
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  ipcMain.on('overlay-set-idle', (_event, idle: boolean) => {
    if (!mainWindow) return;

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
    } else {
      // Default to click-through unless the overlay is explicitly interactive.
      if (isOverlayInteractive) {
        mainWindow.setIgnoreMouseEvents(false);
      } else {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  });

  ipcMain.on('overlay-set-interactive', (_event, interactive: boolean) => {
    if (!mainWindow) return;
    isOverlayInteractive = interactive;
    if (interactive) {
      mainWindow.setIgnoreMouseEvents(false);
    } else {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  let isCtrlDown = false;
  let isShiftDown = false;
  let isRecording = false;

  uIOhook.on('keydown', (e) => {
    if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
      isCtrlDown = true;
    }
    if (e.keycode === UiohookKey.Shift || e.keycode === UiohookKey.ShiftRight) {
      isShiftDown = true;
    }

    if (isCtrlDown && isShiftDown && !isRecording) {
      isRecording = true;
      mainWindow?.show();
      mainWindow?.setAlwaysOnTop(true, 'screen-saver');
      mainWindow?.webContents.send('start-recording');
    }
  });

  uIOhook.on('keyup', (e) => {
    if (e.keycode === UiohookKey.Ctrl || e.keycode === UiohookKey.CtrlRight) {
      isCtrlDown = false;
    }
    if (e.keycode === UiohookKey.Shift || e.keycode === UiohookKey.ShiftRight) {
      isShiftDown = false;
    }

    if ((!isCtrlDown || !isShiftDown) && isRecording) {
      isRecording = false;
      mainWindow?.webContents.send('stop-recording');
    }
  });

  uIOhook.start();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
