import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function Settings() {
  const { theme, setTheme, effectiveTheme, currentSystemTheme } = useTheme();
  const [language, setLanguage] = useState('english');
  const [notifications, setNotifications] = useState(true);
  const [savedSettings, setSavedSettings] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load settings from electron API
    const loadSettings = async () => {
      try {
        const settings = await window.api.getUserSettings();
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
      };
      
      await window.api.saveUserSettings(newSettings);
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