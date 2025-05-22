const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // User settings and progress
    getUserSettings: () => ipcRenderer.invoke('get-user-settings'),
    getUserProgress: () => ipcRenderer.invoke('get-user-progress'),
    saveProgress: (progressData) => ipcRenderer.invoke('save-progress', progressData),
    updateXP: (amount) => ipcRenderer.invoke('update-xp', amount),
    saveUserSettings: (settings) => ipcRenderer.invoke('save-user-settings', settings),
    unlockAchievement: (achievementId) => ipcRenderer.invoke('unlock-achievement', achievementId),
    
    // Lessons
    getLessons: () => ipcRenderer.invoke('get-lessons'),
    getLessonById: (lessonId) => ipcRenderer.invoke('get-lesson-by-id', lessonId),
    
    // Translation services
    translateText: (text, targetLanguage, sourceLanguage) => 
      ipcRenderer.invoke('translate-text', text, targetLanguage, sourceLanguage),
    
    // Speech services
    speechToText: (audioData, language) => 
      ipcRenderer.invoke('speech-to-text', audioData, language),
    textToSpeech: (text, language) => 
      ipcRenderer.invoke('text-to-speech', text, language),
    
    // Recording
    startRecording: () => ipcRenderer.send('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording')
  }
);

// Expose environment variables to the renderer process
contextBridge.exposeInMainWorld('env', {
  REACT_APP_OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY,
  REACT_APP_TRANSLATION_API_KEY: process.env.REACT_APP_TRANSLATION_API_KEY,
  REACT_APP_TTS_PROVIDER: process.env.REACT_APP_TTS_PROVIDER,
  REACT_APP_STT_PROVIDER: process.env.REACT_APP_STT_PROVIDER,
  REACT_APP_ELEVENLABS_API_KEY: process.env.REACT_APP_ELEVENLABS_API_KEY,
  NODE_ENV: process.env.NODE_ENV
});

console.log('Preload script loaded.'); 