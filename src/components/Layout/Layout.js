import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

import { useUser } from '../../contexts/UserContext';

// Import components
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-text-primary">Loading Translor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary overflow-hidden">
      <Header />
      
      <div className="flex flex-1 bg-bg-primary overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 bg-bg-primary overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 