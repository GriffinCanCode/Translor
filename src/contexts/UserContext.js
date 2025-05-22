import React, { createContext, useContext, useState, useEffect } from 'react';

// User context to manage user data across the app
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  // User state with defaults
  const [user, setUser] = useState({
    userId: localStorage.getItem('userId') || `user-${Date.now()}`,
    name: localStorage.getItem('userName') || '',
    nativeLanguage: localStorage.getItem('nativeLanguage') || 'en',
    targetLanguage: localStorage.getItem('targetLanguage') || 'es',
    proficiencyLevel: localStorage.getItem('proficiencyLevel') || 'beginner',
    xp: parseInt(localStorage.getItem('userXp') || '0', 10),
    streak: parseInt(localStorage.getItem('userStreak') || '0', 10),
    lastActiveDate: localStorage.getItem('lastActiveDate') || null,
    completedLessons: JSON.parse(localStorage.getItem('completedLessons') || '[]'),
    settings: JSON.parse(localStorage.getItem('userSettings') || '{"voiceSpeed": 1, "notifications": true}')
  });

  // Update localStorage when user state changes
  useEffect(() => {
    localStorage.setItem('userId', user.userId);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('nativeLanguage', user.nativeLanguage);
    localStorage.setItem('targetLanguage', user.targetLanguage);
    localStorage.setItem('proficiencyLevel', user.proficiencyLevel);
    localStorage.setItem('userXp', user.xp.toString());
    localStorage.setItem('userStreak', user.streak.toString());
    localStorage.setItem('lastActiveDate', user.lastActiveDate);
    localStorage.setItem('completedLessons', JSON.stringify(user.completedLessons));
    localStorage.setItem('userSettings', JSON.stringify(user.settings));
  }, [user]);

  // Check and update streak on login
  useEffect(() => {
    const checkStreak = () => {
      const today = new Date().toDateString();
      if (user.lastActiveDate) {
        const lastActive = new Date(user.lastActiveDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive.toDateString() === yesterday.toDateString()) {
          // User was active yesterday, increment streak
          setUser(prev => ({
            ...prev,
            streak: prev.streak + 1,
            lastActiveDate: today
          }));
        } else if (lastActive.toDateString() !== today) {
          // User wasn't active yesterday or today, reset streak
          setUser(prev => ({
            ...prev,
            streak: 1,
            lastActiveDate: today
          }));
        }
      } else {
        // First time user
        setUser(prev => ({
          ...prev,
          streak: 1,
          lastActiveDate: today
        }));
      }
    };
    
    checkStreak();
  }, []);

  // Update user name
  const updateName = (name) => {
    setUser(prev => ({ ...prev, name }));
  };

  // Update language preferences
  const updateLanguages = (nativeLanguage, targetLanguage) => {
    setUser(prev => ({ ...prev, nativeLanguage, targetLanguage }));
  };

  // Update proficiency level
  const updateProficiencyLevel = (proficiencyLevel) => {
    setUser(prev => ({ ...prev, proficiencyLevel }));
  };

  // Add XP points
  const addXp = (points) => {
    setUser(prev => ({ ...prev, xp: prev.xp + points }));
  };

  // Mark a lesson as completed
  const completeLesson = (lessonId) => {
    if (!user.completedLessons.includes(lessonId)) {
      setUser(prev => ({
        ...prev,
        completedLessons: [...prev.completedLessons, lessonId],
        xp: prev.xp + 20 // Award XP for completing a lesson
      }));
    }
  };

  // Update user settings
  const updateSettings = (newSettings) => {
    setUser(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  // Reset user progress (for testing or user request)
  const resetProgress = () => {
    const today = new Date().toDateString();
    setUser(prev => ({
      ...prev,
      xp: 0,
      streak: 1,
      lastActiveDate: today,
      completedLessons: []
    }));
  };
  
  // Value to be provided to consumers
  const value = {
    userId: user.userId,
    name: user.name,
    nativeLanguage: user.nativeLanguage,
    targetLanguage: user.targetLanguage,
    proficiencyLevel: user.proficiencyLevel,
    xp: user.xp,
    streak: user.streak,
    completedLessons: user.completedLessons,
    settings: user.settings,
    updateName,
    updateLanguages,
    updateProficiencyLevel,
    addXp,
    completeLesson,
    updateSettings,
    resetProgress
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider; 