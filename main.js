const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the index.html of the app.
  // In development, load from webpack-dev-server. In production, load from file.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080'); // Or your Webpack dev server port
    mainWindow.webContents.openDevTools(); // Open DevTools automatically in development
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Example IPC handler (can be expanded)
ipcMain.handle('example-ipc', async (event, arg) => {
  console.log('IPC message received:', arg);
  return `Response from main process: ${arg}`;
});

// Basic Express server setup (can be moved to a separate file)
const express = require('express');
const backendApp = express();
const PORT = 3001; // Different port from Electron and React dev server

backendApp.use(express.json());

backendApp.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from Translor backend!' });
});

backendApp.listen(PORT, () => {
  console.log(`Translor backend server running on http://localhost:${PORT}`);
}); 