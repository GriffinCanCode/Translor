import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const UserContext = createContext();

// Custom hook for using the context
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [targetLanguage, setTargetLanguage] = useState('es'); // Default to Spanish
  const [nativeLanguage, setNativeLanguage] = useState('en'); // Default to English

  useEffect(() => {
    // Load user data from electron API or local storage
    const loadUserData = async () => {
      try {
        // In a real app, this would call the Electron API through preload
        const userSettings = await window.electronAPI.getUserSettings();
        
        if (userSettings) {
          setUser({
            name: userSettings.name || 'User',
            email: userSettings.email || '',
            avatarUrl: userSettings.avatarUrl || '',
          });
          setTargetLanguage(userSettings.targetLanguage || 'es');
          setNativeLanguage(userSettings.nativeLanguage || 'en');
        }
        
        // Get user progress data
        const progressData = await window.electronAPI.getUserProgress();
        
        if (progressData) {
          setXp(progressData.xp || 0);
          setLevel(progressData.level || 1);
          setStreak(progressData.streak || 0);
          setAchievements(progressData.achievements || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Function to update user XP
  const addXp = async (amount) => {
    const newXp = xp + amount;
    setXp(newXp);
    
    // Calculate new level based on XP thresholds
    const newLevel = calculateLevel(newXp);
    if (newLevel > level) {
      setLevel(newLevel);
      // Could trigger a level-up animation/notification here
    }
    
    try {
      await window.electronAPI.updateXP(amount);
    } catch (error) {
      console.error('Error saving XP update:', error);
    }
  };

  // Calculate level based on XP (simplified example)
  const calculateLevel = (experiencePoints) => {
    return Math.floor(Math.sqrt(experiencePoints / 100)) + 1;
  };

  // Function to update user streak
  const updateStreak = async () => {
    const newStreak = streak + 1;
    setStreak(newStreak);
    
    try {
      await window.electronAPI.saveProgress({ streak: newStreak });
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Function to unlock a new achievement
  const unlockAchievement = async (achievementId) => {
    if (achievements.includes(achievementId)) return; // Already unlocked
    
    const newAchievements = [...achievements, achievementId];
    setAchievements(newAchievements);
    
    try {
      await window.electronAPI.unlockAchievement(achievementId);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  // Function to update language preferences
  const updateLanguagePreferences = async (newTargetLang, newNativeLang) => {
    setTargetLanguage(newTargetLang);
    setNativeLanguage(newNativeLang);
    
    try {
      await window.electronAPI.saveUserSettings({
        targetLanguage: newTargetLang,
        nativeLanguage: newNativeLang
      });
    } catch (error) {
      console.error('Error saving language preferences:', error);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    xp,
    level,
    streak,
    achievements,
    targetLanguage,
    nativeLanguage,
    addXp,
    updateStreak,
    unlockAchievement,
    updateLanguagePreferences
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}; 