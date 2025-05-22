const path = require('path');
const fs = require('fs');

const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const Store = require('electron-store');
const store = new Store();
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// User data paths
const USER_DATA_PATH = path.join(app.getPath('userData'), 'userData.json');
const LESSONS_DATA_PATH = path.join(app.getPath('userData'), 'lessons.json');

// Initialize store with default values if empty
if (!store.has('userSettings')) {
  store.set('userSettings', {
    nativeLanguage: 'en',
    learningLanguage: 'es',
    dailyGoal: 10,
    notifications: true,
    theme: 'light'
  });
}

if (!store.has('userProgress')) {
  store.set('userProgress', {
    completedLessons: [],
    xp: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    achievements: []
  });
}

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false
  });

  // Load the app
  if (isDev) {
    // In development, load from webpack dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from dist directory
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error(`Index file not found at: ${indexPath}`);
      dialog.showErrorBox('Loading Error', 'Could not find application resources. Try rebuilding the application.');
    }
  }

  mainWindow.once('ready-to-show', () => {
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

  // Initialize user data if not exists
  initializeUserData();
  // Initialize lessons data if not exists
  initializeLessonsData();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Initialize user data file if it doesn't exist
function initializeUserData() {
  if (!fs.existsSync(USER_DATA_PATH)) {
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
    console.error('Error reading user data:', error);
    return null;
  }
}

// Save user data to file
function saveUserData(data) {
  try {
    fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

// Get lessons data from file
function getLessonsData() {
  try {
    const data = fs.readFileSync(LESSONS_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading lessons data:', error);
    return null;
  }
}

// IPC handlers for communication with renderer process
ipcMain.handle('get-user-settings', async () => {
  return store.get('userSettings');
});

ipcMain.handle('get-user-progress', async () => {
  return store.get('userProgress');
});

ipcMain.handle('save-progress', async (_, progressData) => {
  const currentProgress = store.get('userProgress');
  store.set('userProgress', { ...currentProgress, ...progressData });
  return { success: true };
});

ipcMain.handle('update-xp', async (_, amount) => {
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
      store.set('userProgress.streak', currentProgress.streak + 1);
    } else {
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
  store.set('userSettings', settings);
  return { success: true };
});

ipcMain.handle('unlock-achievement', async (_, achievementId) => {
  const currentProgress = store.get('userProgress');
  if (!currentProgress.achievements.includes(achievementId)) {
    const updatedAchievements = [...currentProgress.achievements, achievementId];
    store.set('userProgress.achievements', updatedAchievements);
    return { success: true, achievements: updatedAchievements };
  }
  return { success: false, message: 'Achievement already unlocked' };
});

ipcMain.handle('get-lessons', async () => {
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
    console.error('Error loading lessons:', error);
    return [];
  }
});

ipcMain.handle('get-lesson-by-id', async (_, lessonId) => {
  try {
    const lessonsPath = isDev 
      ? path.join(__dirname, 'src/lessons') 
      : path.join(process.resourcesPath, 'lessons');
    
    const filePath = path.join(lessonsPath, `${lessonId}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } else {
      return { error: 'Lesson not found' };
    }
  } catch (error) {
    console.error(`Error loading lesson ${lessonId}:`, error);
    return { error: 'Failed to load lesson' };
  }
});

// Translation and speech API handlers would connect to external services
// These are placeholder implementations
ipcMain.handle('translate-text', async (_, text, targetLanguage, sourceLanguage) => {
  // In a real app, this would call a translation API
  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: ${text}`);
  return { 
    translation: `[Translation of "${text}" to ${targetLanguage}]`,
    sourceLanguage: sourceLanguage || 'auto-detected'
  };
});

ipcMain.handle('speech-to-text', async (_, audioData, language) => {
  // In a real app, this would send audio to a speech recognition API
  console.log(`Converting speech to text in ${language}`);
  return {
    text: '[Transcribed text would appear here]'
  };
});

ipcMain.handle('text-to-speech', async (_, text, language) => {
  // In a real app, this would generate audio from text
  console.log(`Converting text to speech in ${language}: ${text}`);
  return {
    audioUrl: '[Audio data would be returned here]'
  };
});

// Recording functionality
let recordingInterval;

ipcMain.on('start-recording', () => {
  console.log('Started recording audio');
  // In a real app, this would initialize audio recording
});

ipcMain.handle('stop-recording', async () => {
  console.log('Stopped recording audio');
  // In a real app, this would stop recording and return the audio data
  return {
    audioData: '[Recorded audio data would be here]'
  };
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