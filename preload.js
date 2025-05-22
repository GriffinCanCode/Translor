const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process through the "api" global object
contextBridge.exposeInMainWorld('electronAPI', {
  // Translation APIs
  translateText: (text, targetLanguage) => ipcRenderer.invoke('translate-text', text, targetLanguage),
  speechToText: (audioData, language) => ipcRenderer.invoke('speech-to-text', audioData, language),
  textToSpeech: (text, language) => ipcRenderer.invoke('text-to-speech', text, language),
  
  // User data and settings
  saveUserSettings: (settings) => ipcRenderer.invoke('save-user-settings', settings),
  getUserSettings: () => ipcRenderer.invoke('get-user-settings'),
  
  // Lesson and progress APIs
  getLessons: () => ipcRenderer.invoke('get-lessons'),
  getLessonById: (lessonId) => ipcRenderer.invoke('get-lesson-by-id', lessonId),
  saveProgress: (progress) => ipcRenderer.invoke('save-progress', progress),
  getUserProgress: () => ipcRenderer.invoke('get-user-progress'),
  
  // Gamification APIs
  updateXP: (xpAmount) => ipcRenderer.invoke('update-xp', xpAmount),
  getAchievements: () => ipcRenderer.invoke('get-achievements'),
  unlockAchievement: (achievementId) => ipcRenderer.invoke('unlock-achievement', achievementId),
  
  // System APIs
  startRecording: () => ipcRenderer.send('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
  
  // Event listeners
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress-update', (event, ...args) => callback(...args));
    return () => {
      ipcRenderer.removeAllListeners('progress-update');
    };
  }
});

console.log('Preload script loaded.'); 