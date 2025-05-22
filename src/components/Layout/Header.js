import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const Header = () => {
  const { user, xp, level, streak } = useUser();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-display font-bold text-primary-600">
                Translor
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* XP Display */}
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{xp}</span> XP
            </div>
            
            {/* Level Display */}
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm">
                {level}
              </span>
            </div>
            
            {/* Streak Display */}
            {streak > 0 && (
              <div className="flex items-center text-sm text-amber-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1 text-amber-500">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{streak}</span>
              </div>
            )}
            
            {/* User Avatar/Profile */}
            <Link to="/profile" className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-medium">{user?.name?.charAt(0)}</span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 