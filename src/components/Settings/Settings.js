import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useBrowserSpeech } from '../../contexts/BrowserSpeechContext';
import { useElevenLabs } from '../../contexts/ElevenLabsContext';
import { useWhisper } from '../../contexts/WhisperContext';
import { useUser } from '../../contexts/UserContext';

function Settings() {
  const { theme, setTheme, effectiveTheme, currentSystemTheme } = useTheme();
  const { updateSettings, settings } = useUser();
  const { ttsProvider, sttProvider } = useTranslation();
  const { isAvailable: browserSpeechAvailable, voices: browserVoices } = useBrowserSpeech();
  const { isAvailable: elevenLabsAvailable, voices: elevenLabsVoices, loading: elevenLabsLoading } = useElevenLabs();
  const { isAvailable: whisperAvailable } = useWhisper();
  
  const [language, setLanguage] = useState('english');
  const [notifications, setNotifications] = useState(true);
  const [savedSettings, setSavedSettings] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedTtsProvider, setSelectedTtsProvider] = useState(ttsProvider);
  const [selectedSttProvider, setSelectedSttProvider] = useState(sttProvider);
  const [voiceSpeed, setVoiceSpeed] = useState(settings?.voiceSpeed || 1);

  // Load user settings on mount
  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'light');
      setNotifications(settings.notifications !== false);
      setVoiceSpeed(settings.voiceSpeed || 1);
    }
  }, [settings]);

  useEffect(() => {
    // Load settings from electron API
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getUserSettings();
        if (settings) {
          setLanguage(settings.language || 'english');
          setNotifications(settings.notifications ?? true);
          setSavedSettings(settings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newSettings = {
        ...savedSettings,
        language,
        theme,
        notifications,
        voiceSpeed,
        ttsProvider: selectedTtsProvider,
        sttProvider: selectedSttProvider
      };
      
      await window.electronAPI.saveUserSettings(newSettings);
      
      // Also update the user context
      updateSettings(newSettings);
      
      setSaveStatus('Settings saved successfully');
      setSavedSettings(newSettings);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Error saving settings');
    }
  };

  return (
    <div className="settings-container p-6">
      <h1 className="settings-heading text-2xl">Settings</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h2 className="settings-heading">Language Preferences</h2>
          
          <div className="settings-form-group">
            <label htmlFor="language" className="settings-label">Interface Language</label>
            <select 
              id="language" 
              className="settings-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
              <option value="german">German</option>
              <option value="chinese">Chinese</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="settings-heading">Text-to-Speech Settings</h2>
          
          <div className="settings-form-group">
            <label htmlFor="ttsProvider" className="settings-label">TTS Provider</label>
            <select 
              id="ttsProvider" 
              className="settings-select"
              value={selectedTtsProvider}
              onChange={(e) => setSelectedTtsProvider(e.target.value)}
            >
              <option value="browser">Browser</option>
              <option value="elevenlabs" disabled={!elevenLabsAvailable}>
                ElevenLabs {!elevenLabsAvailable && '(Not Available)'}
              </option>
            </select>
          </div>
          
          <div className="settings-form-group">
            <label htmlFor="voiceSpeed" className="settings-label">Speech Speed</label>
            <input
              type="range"
              id="voiceSpeed"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="settings-heading">Speech Recognition Settings</h2>
          
          <div className="settings-form-group">
            <label htmlFor="sttProvider" className="settings-label">Speech Recognition Provider</label>
            <select 
              id="sttProvider" 
              className="settings-select"
              value={selectedSttProvider}
              onChange={(e) => setSelectedSttProvider(e.target.value)}
            >
              <option value="browser">Browser</option>
              <option value="whisper" disabled={!whisperAvailable}>
                OpenAI Whisper {!whisperAvailable && '(Not Available)'}
              </option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="settings-heading">Display Settings</h2>
          
          <div className="settings-form-group">
            <label htmlFor="theme" className="settings-label">
              Theme (Current: {effectiveTheme})
            </label>
            <select 
              id="theme" 
              className="settings-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="system">System Default (currently {currentSystemTheme})</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h2 className="settings-heading">Notifications</h2>
          
          <div className="settings-form-group flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="notifications" className="settings-label mb-0">
              Enable Notifications
            </label>
          </div>
        </div>
        
        {saveStatus && (
          <div className={`mt-4 p-3 rounded ${
            saveStatus.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {saveStatus}
          </div>
        )}
        
        <div className="flex gap-4 mt-6">
          <button type="submit" className="settings-save-button">
            Save Changes
          </button>
          <button type="button" className="settings-cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings; 