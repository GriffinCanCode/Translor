const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
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

console.log('Preload script loaded.'); 