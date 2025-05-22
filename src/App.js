import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useLogger from './utils/useLogger';

// Import contexts
import { UserProvider } from './contexts/UserContext';
import { LessonProvider } from './contexts/LessonContext';

// Import pages/components
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Conversation from './components/Conversation/Conversation';
import Lessons from './components/Lessons/Lessons';
import LessonDetail from './components/Lessons/LessonDetail';
import Profile from './components/Profile/Profile';
import Settings from './components/Settings/Settings';
import NotFound from './components/Common/NotFound';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Import utility for CSS validation
import validateCssFiles from './utils/cssLoader';

function App() {
  const logger = useLogger({ component: 'App' });
  
  useEffect(() => {
    // Log application startup
    logger.info('Application initialized', { 
      environment: process.env.NODE_ENV,
      version: window.electronAPI?.getAppVersion?.() || 'dev'
    });
    
    // In development mode, validate that all CSS files are loaded properly
    if (process.env.NODE_ENV === 'development') {
      validateCssFiles();
    }
    
    // Set up global error handler for uncaught errors
    const handleGlobalError = (event) => {
      logger.error('Uncaught error', { 
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        location: window.location.href
      });
      
      // Don't prevent default so browser console still shows the error
      // but we've logged it to our system
      return false;
    };
    
    // Set up global handler for unhandled promise rejections
    const handleRejection = (event) => {
      logger.error('Unhandled promise rejection', { 
        reason: event.reason?.toString() || 'Unknown reason',
        stack: event.reason?.stack,
        location: window.location.href
      });
      
      return false;
    };
    
    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleRejection);
      logger.info('Application cleanup');
    };
  }, [logger]);

  return (
    <ErrorBoundary>
      <UserProvider>
        <LessonProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <ErrorBoundary showResetButton>
                  <Dashboard />
                </ErrorBoundary>
              } />
              <Route path="conversation" element={
                <ErrorBoundary showResetButton>
                  <Conversation />
                </ErrorBoundary>
              } />
              <Route path="lessons" element={
                <ErrorBoundary showResetButton>
                  <Lessons />
                </ErrorBoundary>
              } />
              <Route path="lessons/:lessonId" element={
                <ErrorBoundary showResetButton>
                  <LessonDetail />
                </ErrorBoundary>
              } />
              <Route path="profile" element={
                <ErrorBoundary showResetButton>
                  <Profile />
                </ErrorBoundary>
              } />
              <Route path="settings" element={
                <ErrorBoundary showResetButton>
                  <Settings />
                </ErrorBoundary>
              } />
              <Route path="404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </LessonProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
