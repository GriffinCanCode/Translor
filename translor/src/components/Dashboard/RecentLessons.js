import React from 'react';
import { Link } from 'react-router-dom';
import { useLesson } from '../../contexts/LessonContext';

const RecentLessons = () => {
  const { lessons, userProgress } = useLesson();
  
  // Get lessons with progress and sort by last update
  const lessonsWithProgress = lessons
    .filter(lesson => userProgress[lesson.id])
    .map(lesson => ({
      ...lesson,
      progress: userProgress[lesson.id]
    }))
    .sort((a, b) => {
      const dateA = new Date(a.progress.lastUpdated || 0);
      const dateB = new Date(b.progress.lastUpdated || 0);
      return dateB - dateA; // Sort by most recent
    })
    .slice(0, 5); // Show only the 5 most recent lessons
  
  if (lessonsWithProgress.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No recent activity. Start a lesson to track your progress!
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {lessonsWithProgress.map(lesson => (
        <Link 
          key={lesson.id}
          to={`/lessons/${lesson.id}`}
          className="block px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{lesson.title}</h3>
              <p className="text-xs text-gray-500">
                {new Date(lesson.progress.lastUpdated).toLocaleDateString()}
              </p>
            </div>
            <div>
              {lesson.progress.completed ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  In Progress
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
      
      <div className="text-center pt-2">
        <Link to="/lessons" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all lessons
        </Link>
      </div>
    </div>
  );
};

export default RecentLessons; 