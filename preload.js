const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Expose a function to invoke an IPC handler in the main process
  invokeExample: (data) => ipcRenderer.invoke('example-ipc', data),

  // Example: Send a message to the main process (one-way)
  sendExample: (data) => ipcRenderer.send('example-ipc-send', data),

  // Example: Receive messages from the main process
  onExampleReply: (callback) => ipcRenderer.on('example-ipc-reply', (_event, ...args) => callback(...args)),

  // Placeholder for translation related functions
  translateText: (text, targetLang) => ipcRenderer.invoke('translate-text', text, targetLang),
  startRecording: () => ipcRenderer.send('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),
});

console.log('Preload script loaded.'); 