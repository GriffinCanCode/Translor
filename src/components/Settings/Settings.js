import React, { useState } from 'react';

function Settings() {
  const [language, setLanguage] = useState('english');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings logic would go here
    console.log('Settings saved:', { language, theme, notifications });
  };

  return (
    <div className="settings-container">
      <h1 className="settings-heading">Settings</h1>
      
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
            <label htmlFor="theme" className="settings-label">Theme</label>
            <select 
              id="theme" 
              className="settings-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
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