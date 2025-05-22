const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    show: false // Don't show until ready-to-show
  });

  // Load the app
  if (isDev) {
    // In development mode, load from the dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the local file
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when ready to avoid white flash
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS it's common to re-create a window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for translation services
ipcMain.handle('translate-text', async (event, text, targetLang) => {
  try {
    // This would be replaced with actual API call in production
    console.log(`Translating text: ${text} to ${targetLang}`);
    return {
      success: true,
      translatedText: `[${targetLang}] ${text}`, // Mock translation
      originalText: text
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for speech-to-text
ipcMain.handle('speech-to-text', async (event, audioData, language) => {
  try {
    // This would be replaced with actual API call in production
    console.log(`Converting speech to text in language: ${language}`);
    return {
      success: true,
      text: 'This is a mock transcription of your speech.', // Mock transcription
    };
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC handler for text-to-speech
ipcMain.handle('text-to-speech', async (event, text, language) => {
  try {
    // This would be replaced with actual API call in production
    console.log(`Converting text to speech in language: ${language}`);
    return {
      success: true,
      audioUrl: 'mock-audio-url' // Mock audio URL
    };
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return {
      success: false,
      error: error.message
    };
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