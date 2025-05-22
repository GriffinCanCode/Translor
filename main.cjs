const path = require('path');
const fs = require('fs');
// Load environment variables from .env file
require('dotenv').config();

const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const Store = require('electron-store');
const store = new Store();
const isDev = process.env.NODE_ENV === 'development';

// Import the logger
const { logger, createContextLogger } = require('./src/utils/logger');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// User data paths
const USER_DATA_PATH = path.join(app.getPath('userData'), 'userData.json');
const LESSONS_DATA_PATH = path.join(app.getPath('userData'), 'lessons.json');

// Audio stream management
let activeAudioStreams = 0;
const MAX_AUDIO_STREAMS = 10; // Reduced from 45 to prevent browser crashes
const AUDIO_STREAMS_CLEANUP_THRESHOLD = 5;

// Log application startup
logger.info('Application starting', { version: app.getVersion(), env: process.env.NODE_ENV });

// Initialize store with default values if empty
if (!store.has('userSettings')) {
  store.set('userSettings', {
    nativeLanguage: 'en',
    learningLanguage: 'es',
    dailyGoal: 10,
    notifications: true,
    theme: 'light'
  });
  logger.info('Initialized default user settings');
}

if (!store.has('userProgress')) {
  store.set('userProgress', {
    completedLessons: [],
    xp: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    achievements: []
  });
  logger.info('Initialized default user progress');
}

// Create the browser window
function createWindow() {
  logger.debug('Creating main window');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval';",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
          "connect-src 'self' ws: wss: https://api.openai.com https://*.openai.com https://api.elevenlabs.io https://*.elevenlabs.io https://libretranslate.com https://*.libretranslate.com https://translate.argosopentech.com https://translation.googleapis.com;",
          "img-src 'self' data: blob:;",
          "media-src 'self' data: blob: file: filesystem:;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          "font-src 'self' https://fonts.gstatic.com;",
          "object-src 'none';"
        ].join(' ')
      }
    });
  });
  
  // Set environment variables for renderer process
  // This will make API keys and other configuration available to the renderer
  const envVarsForRenderer = {
    REACT_APP_TRANSLATION_API_KEY: process.env.REACT_APP_TRANSLATION_API_KEY || '',
    REACT_APP_ELEVENLABS_API_KEY: process.env.REACT_APP_ELEVENLABS_API_KEY || '',
    REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || '',
    NODE_ENV: process.env.NODE_ENV || 'production'
  };

  // Make sure these environment variables are accessible in the renderer process
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.env = ${JSON.stringify(envVarsForRenderer)};
    `).catch(error => {
      logger.error('Failed to inject environment variables', { error });
    });
  });
  
  // Load the app
  if (isDev) {
    // In development, load from webpack dev server
    logger.debug('Loading application in development mode');
    mainWindow.loadURL('http://localhost:3003');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from dist directory
    logger.debug('Loading application in production mode');
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      const errorMsg = `Index file not found at: ${indexPath}`;
      logger.error(errorMsg);
      dialog.showErrorBox('Loading Error', 'Could not find application resources. Try rebuilding the application.');
    }
  }

  mainWindow.once('ready-to-show', () => {
    logger.debug('Main window ready to show');
    mainWindow.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    logger.debug('Main window closed');
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  logger.info('Electron ready, creating window');
  createWindow();

  // Initialize user data if not exists
  initializeUserData();
  // Initialize lessons data if not exists
  initializeLessonsData();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (mainWindow === null) {
      logger.debug('Activated application, creating window');
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  logger.debug('All windows closed');
  if (process.platform !== 'darwin') {
    logger.info('Application quitting');
    app.quit();
  }
});

// Log when app is going to quit
app.on('will-quit', () => {
  logger.info('Application will quit');
});

// Initialize user data file if it doesn't exist
function initializeUserData() {
  if (!fs.existsSync(USER_DATA_PATH)) {
    logger.info('Creating user data file', { path: USER_DATA_PATH });
    const initialData = {
      user: {
        name: 'User',
        email: '',
        avatarUrl: ''
      },
      targetLanguage: 'es',
      nativeLanguage: 'en',
      xp: 0,
      level: 1,
      streak: 0,
      achievements: [],
      lessonProgress: {}
    };

    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Initialize lessons data file if it doesn't exist
function initializeLessonsData() {
  if (!fs.existsSync(LESSONS_DATA_PATH)) {
    logger.info('Creating lessons data file', { path: LESSONS_DATA_PATH });
    const initialData = {
      chapters: [
        {
          id: 'chapter1',
          title: 'Basics',
          description: 'Learn the fundamentals of your target language',
          order: 1
        },
        {
          id: 'chapter2',
          title: 'Phrases',
          description: 'Common phrases for everyday conversations',
          order: 2
        },
        {
          id: 'chapter3',
          title: 'Grammar',
          description: 'Essential grammar concepts',
          order: 3
        }
      ],
      lessons: [
        {
          id: 'lesson1',
          chapterId: 'chapter1',
          title: 'Greetings',
          description: 'Learn how to greet people',
          prerequisites: [],
          order: 1
        },
        {
          id: 'lesson2',
          chapterId: 'chapter1',
          title: 'Numbers',
          description: 'Count in your target language',
          prerequisites: ['lesson1'],
          order: 2
        },
        {
          id: 'lesson3',
          chapterId: 'chapter2',
          title: 'Restaurant Phrases',
          description: 'Order food and drinks',
          prerequisites: ['lesson1', 'lesson2'],
          order: 1
        }
      ]
    };

    fs.writeFileSync(LESSONS_DATA_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Get user data from file
function getUserData() {
  try {
    const data = fs.readFileSync(USER_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading user data', { error });
    return null;
  }
}

// Save user data to file
function saveUserData(data) {
  try {
    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data, null, 2));
    logger.debug('User data saved successfully');
    return true;
  } catch (error) {
    logger.error('Error saving user data', { error });
    return false;
  }
}

// Get lessons data from file
function getLessonsData() {
  try {
    const data = fs.readFileSync(LESSONS_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading lessons data', { error });
    return null;
  }
}

// IPC handlers for communication with renderer process
ipcMain.handle('get-user-settings', async () => {
  logger.debug('Fetching user settings');
  return store.get('userSettings');
});

ipcMain.handle('get-user-progress', async () => {
  logger.debug('Fetching user progress');
  return store.get('userProgress');
});

ipcMain.handle('save-progress', async (_, progressData) => {
  logger.debug('Saving user progress', { progressData });
  const currentProgress = store.get('userProgress');
  store.set('userProgress', { ...currentProgress, ...progressData });
  return { success: true };
});

ipcMain.handle('update-xp', async (_, amount) => {
  logger.debug('Updating XP', { amount });
  const currentProgress = store.get('userProgress');
  const newXP = currentProgress.xp + amount;
  store.set('userProgress.xp', newXP);
  
  // Check for streak update
  const lastActive = new Date(currentProgress.lastActive);
  const today = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (today - lastActive > oneDayMs) {
    const yesterday = new Date(today - oneDayMs);
    const isConsecutiveDay = 
      lastActive.getDate() === yesterday.getDate() &&
      lastActive.getMonth() === yesterday.getMonth() &&
      lastActive.getFullYear() === yesterday.getFullYear();
    
    if (isConsecutiveDay) {
      logger.info('User streak increased', { newStreak: currentProgress.streak + 1 });
      store.set('userProgress.streak', currentProgress.streak + 1);
    } else {
      logger.info('User streak reset', { oldStreak: currentProgress.streak });
      store.set('userProgress.streak', 1);
    }
  }
  
  store.set('userProgress.lastActive', today.toISOString());
  
  return { 
    xp: newXP, 
    streak: store.get('userProgress.streak')
  };
});

ipcMain.handle('save-user-settings', async (_, settings) => {
  logger.debug('Saving user settings', { settings });
  store.set('userSettings', settings);
  return { success: true };
});

ipcMain.handle('unlock-achievement', async (_, achievementId) => {
  const currentProgress = store.get('userProgress');
  if (!currentProgress.achievements.includes(achievementId)) {
    logger.info('Achievement unlocked', { achievementId });
    const updatedAchievements = [...currentProgress.achievements, achievementId];
    store.set('userProgress.achievements', updatedAchievements);
    return { success: true, achievements: updatedAchievements };
  }
  logger.debug('Achievement already unlocked', { achievementId });
  return { success: false, message: 'Achievement already unlocked' };
});

ipcMain.handle('get-lessons', async () => {
  logger.debug('Fetching all lessons');
  try {
    const lessonsPath = isDev 
      ? path.join(__dirname, 'src/lessons') 
      : path.join(process.resourcesPath, 'lessons');
    
    const files = fs.readdirSync(lessonsPath)
      .filter(file => file.endsWith('.json'));
    
    const lessons = files.map(file => {
      const data = fs.readFileSync(path.join(lessonsPath, file), 'utf8');
      return JSON.parse(data);
    });
    
    return lessons;
  } catch (error) {
    logger.error('Error loading lessons', { error });
    return [];
  }
});

ipcMain.handle('get-lesson-by-id', async (_, lessonId) => {
  logger.debug('Fetching lesson by ID', { lessonId });
  try {
    const lessonsPath = isDev 
      ? path.join(__dirname, 'src/lessons') 
      : path.join(process.resourcesPath, 'lessons');
    
    const filePath = path.join(lessonsPath, `${lessonId}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } else {
      logger.warn('Lesson not found', { lessonId });
      return { error: 'Lesson not found' };
    }
  } catch (error) {
    logger.error(`Error loading lesson`, { lessonId, error });
    return { error: 'Failed to load lesson' };
  }
});

// Handle log messages from the renderer process
ipcMain.handle('log', (event, logData) => {
  const { level, message, context } = logData;
  if (logger[level]) {
    logger[level](message, { source: 'renderer', ...context });
  }
  return true;
});

// Audio stream management handlers
ipcMain.handle('register-audio-stream', () => {
  activeAudioStreams++;
  logger.debug('Audio stream registered', { count: activeAudioStreams });
  
  // Check if we're approaching the limit
  if (activeAudioStreams > MAX_AUDIO_STREAMS) {
    logger.warn('Too many audio streams, forcing cleanup', { count: activeAudioStreams });
    // Automatically reset the counter
    const oldCount = activeAudioStreams;
    activeAudioStreams = 0;
    logger.info('Audio streams automatically reset', { oldCount, newCount: 0 });
    
    // Signal to renderer process to release audio streams
    if (mainWindow) {
      mainWindow.webContents.send('cleanup-audio-streams');
    }
    return { shouldProceed: false };
  }
  
  return { shouldProceed: true };
});

ipcMain.handle('release-audio-stream', () => {
  if (activeAudioStreams > 0) {
    activeAudioStreams--;
  }
  logger.debug('Audio stream released', { count: activeAudioStreams });
  
  // If count is suspiciously high, reset it
  if (activeAudioStreams > MAX_AUDIO_STREAMS) {
    logger.warn('Audio stream count too high, resetting', { oldCount: activeAudioStreams });
    activeAudioStreams = 0;
  }
  
  return { success: true };
});

ipcMain.handle('reset-audio-streams', () => {
  const oldCount = activeAudioStreams;
  activeAudioStreams = 0;
  logger.info('Audio streams reset', { oldCount, newCount: 0 });
  return { success: true };
});

// Translation and speech API handlers would connect to external services
// These are placeholder implementations
ipcMain.handle('translate-text', async (_, text, targetLanguage, sourceLanguage) => {
  // In a real app, this would call a translation API
  logger.debug('Translating text', { text, targetLanguage, sourceLanguage });
  return { 
    translation: `[Translation of "${text}" to ${targetLanguage}]`,
    sourceLanguage: sourceLanguage || 'auto-detected'
  };
});

ipcMain.handle('speech-to-text', async (_, audioData, language) => {
  // In a real app, this would send audio to a speech recognition API
  logger.debug('Converting speech to text', { language });
  return {
    text: '[Transcribed text would appear here]'
  };
});

ipcMain.handle('text-to-speech', async (_, text, language) => {
  // In a real app, this would generate audio from text
  logger.debug('Converting text to speech', { text, language });
  
  // Check if we can safely create another audio stream
  if (activeAudioStreams > MAX_AUDIO_STREAMS) {
    logger.warn('Maximum audio streams reached, skipping TTS', { count: activeAudioStreams });
    return {
      audioUrl: null,
      error: 'Too many audio streams active'
    };
  }
  
  // Register this new audio stream
  activeAudioStreams++;
  logger.debug('Audio stream created for TTS', { count: activeAudioStreams });
  
  return {
    audioUrl: '[Audio data would be returned here]'
  };
});

// Recording functionality
let recordingInterval;

ipcMain.on('start-recording', () => {
  logger.debug('Started recording audio');
  // In a real app, this would initialize audio recording
});

ipcMain.handle('stop-recording', async () => {
  logger.debug('Stopped recording audio');
  // In a real app, this would stop recording and return the audio data
  return {
    audioData: '[Recorded audio data would be here]'
  };
});

ipcMain.handle('component-unmounting', (_, componentName) => {
  if (componentName === 'Conversation') {
    logger.debug('Conversation component unmounting, cleaning up resources');
    if (mainWindow) {
      mainWindow.webContents.send('cleanup-audio-streams');
    }
  }
  return true;
});

// Example IPC handler (can be expanded)
ipcMain.handle('example-ipc', async (event, arg) => {
  logger.debug('IPC message received', { arg });
  return `Response from main process: ${arg}`;
});

// ElevenLabs API proxy handler
ipcMain.handle('call-elevenlabs-api', async (_, requestData) => {
  const { method, endpoint, body } = requestData;
  const apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    logger.error('ElevenLabs API key not configured');
    return { success: false, error: 'API key not configured' };
  }
  
  logger.debug('Proxying ElevenLabs API request', { 
    method, 
    endpoint: endpoint.replace(/\/[a-zA-Z0-9]+$/, '/[ID]') // Log redacted endpoint for privacy
  });
  
  try {
    const url = `https://api.elevenlabs.io/v1${endpoint}`;
    
    const options = {
      method,
      headers: {
        'xi-api-key': apiKey
      }
    };
    
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      logger.error('ElevenLabs API error', { status: response.status });
      return { 
        success: false, 
        error: `API error: ${response.status}` 
      };
    }
    
    // Handle binary responses for audio
    if (response.headers.get('content-type')?.includes('audio/')) {
      const buffer = await response.arrayBuffer();
      
      // Convert ArrayBuffer to Base64
      const audioBase64 = Buffer.from(buffer).toString('base64');
      
      // Create a data URL for audio
      const contentType = response.headers.get('content-type');
      const audioUrl = `data:${contentType};base64,${audioBase64}`;
      
      logger.debug('ElevenLabs API audio response processed', { 
        size: buffer.byteLength 
      });
      
      return {
        success: true,
        audioUrl,
        audioSize: buffer.byteLength
      };
    } else {
      // Handle JSON responses for other endpoints
      const data = await response.json();
      
      logger.debug('ElevenLabs API JSON response processed');
      
      return {
        success: true,
        data
      };
    }
  } catch (error) {
    logger.error('Error calling ElevenLabs API', { 
      error: error.message 
    });
    
    return {
      success: false,
      error: error.message
    };
  }
});

// Basic Express server setup (can be moved to a separate file)
const express = require('express');
const backendApp = express();
const PORT = 3001; // Different port from Electron and React dev server
const http = require('http');
const server = http.createServer(backendApp);

backendApp.use(express.json());

backendApp.get('/api/test', (req, res) => {
  logger.debug('API test endpoint called');
  res.json({ message: 'Hello from Translor backend!' });
});

// Try to start the server on the specified port
// If it fails, try with a different port
function startServer(port) {
  try {
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is already in use, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        logger.error('Error starting the server', { error });
      }
    });
    
    server.listen(port, () => {
      logger.info(`Backend server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start backend server', { error });
  }
}

startServer(PORT);

// Handler for checking network status in Electron
ipcMain.handle('check-network-status', async () => {
  return {
    isRestricted: true, // Default to true in Electron since Web Speech API has issues
    reason: "Electron restricts Web Speech API network access"
  };
});

// Handler for Whisper speech recognition
ipcMain.handle('use-whisper-speech-to-text', async (_, audioBlob, language) => {
  try {
    // Convert blob to buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save to temp file
    const tempFilePath = path.join(app.getPath('temp'), `speech-${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);
    
    logger.info('Using Whisper for speech recognition', { language, audioSize: buffer.length });
    
    // TODO: Implement actual Whisper transcription
    // This is a placeholder that should be replaced with real Whisper implementation
    return {
      success: true,
      text: "This is a placeholder for Whisper transcription. In a production app, this would use a real Whisper API.",
      provider: 'whisper'
    };
  } catch (error) {
    logger.error('Whisper speech recognition error', { error: error.message });
    return {
      success: false,
      error: error.message,
      provider: 'whisper'
    };
  }
});

// Handler for ElevenLabs speech recognition
ipcMain.handle('use-elevenlabs-speech-to-text', async (_, audioBlob, language) => {
  logger.info('Using ElevenLabs for speech recognition', { language });
  // This can be implemented if you have ElevenLabs API access
  return {
    success: false,
    error: "ElevenLabs speech recognition not implemented yet",
    provider: 'elevenlabs'
  };
}); 