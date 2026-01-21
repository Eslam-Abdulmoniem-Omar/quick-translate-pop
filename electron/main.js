const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store({
  defaults: {
    sourceLanguage: 'en',
    targetLanguage: 'ar'
  }
});

let mainWindow = null;
let settingsWindow = null;
let tray = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Position at bottom center of screen
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  mainWindow.setPosition(
    Math.round((width - 500) / 2),
    height - 250
  );

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide on blur (click outside)
  mainWindow.on('blur', () => {
    // Don't hide if settings window is focused
    if (!settingsWindow || !settingsWindow.isFocused()) {
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 450,
    frame: true,
    transparent: false,
    resizable: false,
    title: 'TransLingual Settings',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load settings page
  if (isDev) {
    settingsWindow.loadURL('http://localhost:5173/settings');
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/settings'
    });
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function showAboutDialog() {
  dialog.showMessageBox({
    type: 'info',
    title: 'About TransLingual',
    message: 'TransLingual',
    detail: `Version: ${app.getVersion()}\n\nA voice-powered translation tool.\n\nHold Alt+T to record and translate.`,
    buttons: ['OK']
  });
}

function createTray() {
  // Create tray icon (use a simple icon for now)
  const iconPath = path.join(__dirname, isDev ? '../public/favicon.ico' : '../dist/favicon.ico');
  
  // Create a default icon if the file doesn't exist
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // Create a simple colored icon as fallback
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click: () => createSettingsWindow()
    },
    { type: 'separator' },
    {
      label: 'About TransLingual',
      click: () => showAboutDialog()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setToolTip('TransLingual - Hold Alt+T to translate');
  tray.setContextMenu(contextMenu);
  
  // Double-click opens settings
  tray.on('double-click', () => createSettingsWindow());
}

function registerGlobalShortcuts() {
  // Alt+T: Show overlay and trigger recording
  globalShortcut.register('Alt+T', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.webContents.send('start-recording');
    }
  });
}

// IPC Handlers
ipcMain.on('hide-overlay', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('save-settings', (event, settings) => {
  store.set('sourceLanguage', settings.sourceLanguage);
  store.set('targetLanguage', settings.targetLanguage);
  
  // Notify main window of settings change
  if (mainWindow) {
    mainWindow.webContents.send('settings-changed', settings);
  }
});

ipcMain.handle('load-settings', () => {
  return {
    sourceLanguage: store.get('sourceLanguage'),
    targetLanguage: store.get('targetLanguage')
  };
});

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerGlobalShortcuts();
});

app.on('window-all-closed', () => {
  // Keep app running in tray on macOS
  if (process.platform !== 'darwin') {
    // On Windows, don't quit - keep in tray
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
