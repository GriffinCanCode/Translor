import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const LessonContext = createContext();

// Custom hook for using the context
export const useLesson = () => useContext(LessonContext);

export const LessonProvider = ({ children }) => {
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load lesson data from electron API
    const loadLessonData = async () => {
      try {
        // In a real app, this would call the Electron API through preload
        const lessonsData = await window.electronAPI.getLessons();
        
        if (lessonsData) {
          setLessons(lessonsData.lessons || []);
          setChapters(lessonsData.chapters || []);
        }
        
        // Get user progress data
        const progressData = await window.electronAPI.getUserProgress();
        
        if (progressData && progressData.lessonProgress) {
          setUserProgress(progressData.lessonProgress);
        }
      } catch (error) {
        console.error('Error loading lesson data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLessonData();
  }, []);

  // Load a specific lesson by ID
  const loadLesson = async (lessonId) => {
    if (!lessonId) return;
    
    try {
      setLoading(true);
      const lessonData = await window.electronAPI.getLessonById(lessonId);
      
      if (lessonData) {
        setCurrentLesson(lessonData);
      }
    } catch (error) {
      console.error(`Error loading lesson ${lessonId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Save user progress for a lesson
  const saveUserProgress = async (lessonId, progress) => {
    const updatedProgress = {
      ...userProgress,
      [lessonId]: {
        ...userProgress[lessonId],
        ...progress,
        lastUpdated: new Date().toISOString()
      }
    };
    
    setUserProgress(updatedProgress);
    
    try {
      await window.electronAPI.saveProgress({
        lessonProgress: updatedProgress
      });
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId) => {
    return userProgress[lessonId]?.completed === true;
  };

  // Check if a lesson is unlocked (available to start)
  const isLessonUnlocked = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    
    // If not found or no prerequisites, it's unlocked
    if (!lesson || !lesson.prerequisites || lesson.prerequisites.length === 0) {
      return true;
    }
    
    // Check if all prerequisite lessons are completed
    return lesson.prerequisites.every(prereqId => isLessonCompleted(prereqId));
  };

  // Get all unlocked lessons
  const getUnlockedLessons = () => {
    return lessons.filter(lesson => isLessonUnlocked(lesson.id));
  };

  // Get chapter completion percentage
  const getChapterCompletionPercentage = (chapterId) => {
    const chapterLessons = lessons.filter(lesson => lesson.chapterId === chapterId);
    if (chapterLessons.length === 0) return 0;
    
    const completedCount = chapterLessons.filter(lesson => 
      isLessonCompleted(lesson.id)
    ).length;
    
    return Math.round((completedCount / chapterLessons.length) * 100);
  };

  const value = {
    chapters,
    lessons,
    currentLesson,
    userProgress,
    loading,
    loadLesson,
    saveUserProgress,
    isLessonCompleted,
    isLessonUnlocked,
    getUnlockedLessons,
    getChapterCompletionPercentage
  };

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}; 