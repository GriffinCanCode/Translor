const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

// User data paths
const USER_DATA_PATH = path.join(app.getPath('userData'), 'userData.json');
const LESSONS_DATA_PATH = path.join(app.getPath('userData'), 'lessons.json');

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
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'translor/assets/icon.png')
  });

  // Load the app
  if (isDev) {
    // In development, load from webpack dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from build directory
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

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
ipcMain.handle('get-user-settings', () => {
  const userData = getUserData();
  return userData ? {
    name: userData.user.name,
    email: userData.user.email,
    avatarUrl: userData.user.avatarUrl,
    targetLanguage: userData.targetLanguage,
    nativeLanguage: userData.nativeLanguage
  } : null;
});

ipcMain.handle('get-user-progress', () => {
  const userData = getUserData();
  return userData ? {
    xp: userData.xp,
    level: userData.level,
    streak: userData.streak,
    achievements: userData.achievements,
    lessonProgress: userData.lessonProgress
  } : null;
});

ipcMain.handle('save-progress', (event, progressData) => {
  const userData = getUserData();
  if (!userData) return false;

  // Update user data with new progress
  Object.assign(userData, progressData);
  
  return saveUserData(userData);
});

ipcMain.handle('update-xp', (event, amount) => {
  const userData = getUserData();
  if (!userData) return false;

  userData.xp += amount;
  
  // Calculate new level based on XP
  userData.level = Math.floor(Math.sqrt(userData.xp / 100)) + 1;
  
  return saveUserData(userData);
});

ipcMain.handle('save-user-settings', (event, settings) => {
  const userData = getUserData();
  if (!userData) return false;

  // Update user data with new settings
  if (settings.name) userData.user.name = settings.name;
  if (settings.email) userData.user.email = settings.email;
  if (settings.avatarUrl) userData.user.avatarUrl = settings.avatarUrl;
  if (settings.targetLanguage) userData.targetLanguage = settings.targetLanguage;
  if (settings.nativeLanguage) userData.nativeLanguage = settings.nativeLanguage;
  
  return saveUserData(userData);
});

ipcMain.handle('unlock-achievement', (event, achievementId) => {
  const userData = getUserData();
  if (!userData) return false;

  // Add achievement if not already unlocked
  if (!userData.achievements.includes(achievementId)) {
    userData.achievements.push(achievementId);
    return saveUserData(userData);
  }
  
  return true;
});

ipcMain.handle('get-lessons', () => {
  return getLessonsData();
});

ipcMain.handle('get-lesson-by-id', (event, lessonId) => {
  const lessonsData = getLessonsData();
  if (!lessonsData) return null;

  const lesson = lessonsData.lessons.find(l => l.id === lessonId);
  if (!lesson) return null;

  // In a real app, this would load the lesson content from a database
  // For demonstration, we'll generate some content based on the lesson ID
  return {
    ...lesson,
    elements: generateLessonContent(lesson.id, lesson.title)
  };
});

// Mock translation service - in a real app, this would call a translation API
ipcMain.handle('translate-text', (event, text, targetLanguage, sourceLanguage) => {
  // Mock translation (just append language code in a real app)
  return {
    originalText: text,
    translatedText: `[${targetLanguage}] ${text}`,
    sourceLanguage: sourceLanguage || 'auto',
    targetLanguage
  };
});

// Mock speech-to-text service
ipcMain.handle('speech-to-text', (event, audioData, language) => {
  // In a real app, this would send audio to a speech recognition service
  return {
    success: true,
    text: "This is a mock transcription",
    language
  };
});

// Mock text-to-speech service
ipcMain.handle('text-to-speech', (event, text, language) => {
  // In a real app, this would convert text to audio using a TTS service
  return {
    success: true,
    audioUrl: 'data:audio/mp3;base64,mockAudioDataBase64',
    language
  };
});

// Mock recording functions
ipcMain.on('start-recording', () => {
  // In a real app, this would start audio recording
  console.log('Recording started');
});

ipcMain.handle('stop-recording', () => {
  // In a real app, this would stop recording and return the audio data
  return Buffer.from('mock audio data');
});

// Helper function to generate mock lesson content
function generateLessonContent(lessonId, lessonTitle) {
  const elements = [];
  
  // Intro element
  elements.push({
    id: `${lessonId}_intro`,
    type: 'intro',
    title: `Introduction to ${lessonTitle}`,
    content: `Welcome to this lesson about ${lessonTitle}. In this lesson, you will learn essential vocabulary and phrases.`
  });
  
  // Vocabulary elements
  elements.push({
    id: `${lessonId}_vocab1`,
    type: 'vocab',
    word: 'Hola',
    translation: 'Hello',
    example: '¡Hola! ¿Cómo estás?'
  });
  
  // Grammar element
  elements.push({
    id: `${lessonId}_grammar1`,
    type: 'grammar',
    concept: 'Present Tense',
    explanation: 'The present tense is used to describe actions happening now.',
    examples: ['Yo hablo español', 'Tú hablas español', 'Él habla español']
  });
  
  // Exercise elements
  elements.push({
    id: `${lessonId}_ex1`,
    type: 'exercise_translate',
    sentence: '¿Cómo te llamas?',
    correctAnswer: 'What is your name?'
  });
  
  elements.push({
    id: `${lessonId}_ex2`,
    type: 'exercise_multichoice',
    question: 'How do you say "Thank you" in Spanish?',
    options: ['Gracias', 'Por favor', 'De nada', 'Buenos días'],
    correctAnswer: 'Gracias'
  });
  
  return elements;
}
