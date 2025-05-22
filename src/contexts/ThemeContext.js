import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [systemTheme, setSystemTheme] = useState(() => {
    // Initialize with the current system theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Function to get system theme
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Load saved theme from settings
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const settings = await window.electronAPI.getUserSettings();
        if (settings?.theme) {
          setTheme(settings.theme);
        }
      } catch (error) {
        console.error('Error loading theme setting:', error);
      }
    };
    loadSavedTheme();
  }, []);

  // Update system theme when it changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newTheme);
      // If the current theme is 'system', we need to update the effective theme
      if (theme === 'system') {
        document.documentElement.classList.remove('theme-light', 'theme-dark');
        document.documentElement.classList.add(`theme-${newTheme}`);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    // Set initial system theme
    setSystemTheme(getSystemTheme());

    // Listen for system theme changes
    mediaQuery.addEventListener('change', handleChange);

    // Listen for theme changes from the main process
    const cleanup = window.electronAPI.onSystemThemeChange((newTheme) => {
      setSystemTheme(newTheme);
    });
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      cleanup();
    };
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    
    // Remove all theme classes
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    // Add the current theme class
    document.documentElement.classList.add(`theme-${effectiveTheme}`);
    // Also set data-theme attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme, systemTheme]);

  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      systemTheme,
      effectiveTheme: theme === 'system' ? systemTheme : theme,
      currentSystemTheme: systemTheme // Add this to expose the current system theme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 