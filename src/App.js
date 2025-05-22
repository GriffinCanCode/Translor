import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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

// Import utility for CSS validation
import validateCssFiles from './utils/cssLoader';

function App() {
  useEffect(() => {
    // In development mode, validate that all CSS files are loaded properly
    if (process.env.NODE_ENV === 'development') {
      validateCssFiles();
    }
  }, []);

  return (
    <UserProvider>
      <LessonProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="conversation" element={<Conversation />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="lessons/:lessonId" element={<LessonDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </LessonProvider>
    </UserProvider>
  );
}

export default App;
