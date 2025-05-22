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
    
    // Speech recognition fallback services
    checkNetworkStatus: () => ipcRenderer.invoke('check-network-status'),
    useWhisperSpeechToText: (audioBlob, language) => ipcRenderer.invoke('use-whisper-speech-to-text', audioBlob, language),
    useElevenLabsSpeechToText: (audioBlob, language) => ipcRenderer.invoke('use-elevenlabs-speech-to-text', audioBlob, language),
    
    // ElevenLabs API proxy
    callElevenLabsApi: (requestData) => 
      ipcRenderer.invoke('call-elevenlabs-api', requestData),
    
    // Recording
    startRecording: () => ipcRenderer.send('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    
    // Audio stream management
    registerAudioStream: () => ipcRenderer.invoke('register-audio-stream'),
    releaseAudioStream: () => ipcRenderer.invoke('release-audio-stream'),
    resetAudioStreams: () => ipcRenderer.invoke('reset-audio-streams'),
    componentUnmounting: (componentName) => ipcRenderer.invoke('component-unmounting', componentName),
    
    // Cleanup event listener
    onCleanupAudioStreams: (callback) => {
      ipcRenderer.on('cleanup-audio-streams', () => callback());
      return () => ipcRenderer.removeListener('cleanup-audio-streams', callback);
    },
    
    // Logging - single handler to simplify the process
    log: (logData) => ipcRenderer.invoke('log', logData)
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