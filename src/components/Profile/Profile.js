import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLesson } from '../../contexts/LessonContext';

const Profile = () => {
  const { 
    user, 
    xp, 
    level, 
    streak, 
    achievements, 
    targetLanguage, 
    nativeLanguage,
    loading 
  } = useUser();
  
  const { lessons, userProgress, chapters } = useLesson();
  
  const [activeTab, setActiveTab] = useState('stats');
  
  // Get language name
  const getLanguageName = (code) => {
    const languages = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean',
      'ru': 'Russian'
    };
    
    return languages[code] || code;
  };
  
  // Calculate next level XP
  const nextLevelXp = Math.pow((level), 2) * 100;
  
  // Calculate XP progress percentage
  const xpProgressPercentage = (xp / nextLevelXp) * 100;
  
  // Get completed lessons count
  const completedLessonsCount = Object.values(userProgress).filter(
    progress => progress.completed
  ).length;
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-6 sm:px-6 flex items-center">
          <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-3xl font-bold mr-6">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.email || ''}</p>
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex items-center text-amber-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1 text-amber-500">
                  <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{streak} day streak</span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm mr-1">
                  {level}
                </span>
                <span className="font-medium">Level</span>
              </div>
            </div>
          </div>
          <div className="ml-auto">
            <Link to="/settings" className="btn btn-outline">
              Edit Profile
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-500">Learning:</span>{' '}
              <span className="font-medium">{getLanguageName(targetLanguage)}</span>
            </div>
            <div>
              <span className="text-gray-500">Native language:</span>{' '}
              <span className="font-medium">{getLanguageName(nativeLanguage)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'achievements'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Achievements
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* XP Progress */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Experience Points</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-2xl font-bold text-gray-900">{xp} XP</div>
                  <div className="text-sm text-gray-500">Next level: {nextLevelXp} XP</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(xpProgressPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{completedLessonsCount}</div>
                    <div className="text-sm text-gray-500">Lessons Completed</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{streak}</div>
                    <div className="text-sm text-gray-500">Day Streak</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{achievements.length}</div>
                    <div className="text-sm text-gray-500">Achievements</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Progress */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Progress</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {Object.entries(userProgress)
                  .sort((a, b) => {
                    const dateA = new Date(a[1].lastUpdated || 0);
                    const dateB = new Date(b[1].lastUpdated || 0);
                    return dateB - dateA;
                  })
                  .slice(0, 5)
                  .map(([lessonId, progress]) => {
                    const lesson = lessons.find(l => l.id === lessonId);
                    if (!lesson) return null;
                    
                    const chapter = chapters.find(c => c.id === lesson.chapterId);
                    
                    return (
                      <div key={lessonId} className="px-4 py-4 sm:px-6">
                        <div className="flex justify-between">
                          <div>
                            <Link to={`/lessons/${lessonId}`} className="text-primary-600 hover:text-primary-900 font-medium">
                              {lesson.title}
                            </Link>
                            <p className="text-sm text-gray-500">{chapter?.title || 'Unknown Chapter'}</p>
                          </div>
                          <div className="flex items-center">
                            {progress.completed && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                Completed
                              </span>
                            )}
                            {progress.score && (
                              <span className="text-sm text-gray-700 font-medium">
                                {progress.score}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {progress.lastUpdated && (
                            <time dateTime={progress.lastUpdated}>
                              {new Date(progress.lastUpdated).toLocaleDateString()} at {new Date(progress.lastUpdated).toLocaleTimeString()}
                            </time>
                          )}
                        </div>
                      </div>
                    );
                  })}
                
                {Object.keys(userProgress).length === 0 && (
                  <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                    No lesson progress yet. Start a lesson to see your progress!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Achievements</h3>
            </div>
            
            {achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {achievements.map(achievementId => {
                  // In a real app, you'd fetch achievement details from a database
                  // For now, we'll use dummy data
                  const achievementData = {
                    id: achievementId,
                    title: achievementId,
                    description: 'You earned this achievement!',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    )
                  };
                  
                  return (
                    <div key={achievementId} className="bg-gray-50 p-4 rounded-lg flex">
                      <div className="bg-primary-100 text-primary-600 p-3 rounded-lg mr-4">
                        {achievementData.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{achievementData.title}</h4>
                        <p className="text-sm text-gray-500">{achievementData.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No achievements yet. Complete lessons and engage with the app to earn achievements!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 