import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import App from './App.js';

// Import global styles in the correct order
import './styles/index.css';
import './styles/globals.css';
import './styles/theme.css';

// Import component-specific styles
import './styles/common.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/conversation.css';
import './styles/lessons.css';
import './styles/profile.css';
import './styles/settings.css';

// Import utility styles
import './styles/animations.css';
import './styles/responsive.css';

// Create root and render app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
