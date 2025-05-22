import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useLesson } from '../../contexts/LessonContext';
import { useUser } from '../../contexts/UserContext';

const Lessons = () => {
  const { chapters, lessons, isLessonCompleted, isLessonUnlocked, getChapterCompletionPercentage, loading } = useLesson();
  const { targetLanguage } = useUser();
  
  const [searchParams] = useSearchParams();
  const [activeChapter, setActiveChapter] = useState(null);
  
  // Check for chapter in URL params on mount
  useEffect(() => {
    const chapterId = searchParams.get('chapter');
    if (chapterId && chapters.some(c => c.id === chapterId)) {
      setActiveChapter(chapterId);
    } else if (chapters.length > 0) {
      setActiveChapter(chapters[0].id);
    }
  }, [searchParams, chapters]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Get chapters or show empty state
  if (chapters.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Lessons Available</h2>
        <p className="text-gray-600 mb-6">
          Check back soon as we're adding new lessons regularly.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Filter lessons by active chapter
  const chapterLessons = lessons.filter(lesson => lesson.chapterId === activeChapter);
  const currentChapter = chapters.find(chapter => chapter.id === activeChapter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
        <Link to="/conversation" className="btn btn-primary">
          Practice Conversation
        </Link>
      </div>

      {/* Chapter Selector */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="flex items-center overflow-x-auto">
          {chapters.map((chapter) => {
            const completionPercentage = getChapterCompletionPercentage(chapter.id);
            
            return (
              <button
                key={chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 focus:outline-none ${
                  activeChapter === chapter.id 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <span>{chapter.title}</span>
                  {completionPercentage > 0 && (
                    <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {completionPercentage}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter Description */}
      {currentChapter && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">{currentChapter.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{currentChapter.description}</p>
          </div>
        </div>
      )}

      {/* Lessons Grid */}
      {chapterLessons.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {chapterLessons.map((lesson) => {
            const isCompleted = isLessonCompleted(lesson.id);
            const isUnlocked = isLessonUnlocked(lesson.id);
            
            return (
              <div 
                key={lesson.id}
                className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
                  !isUnlocked ? 'opacity-75' : ''
                }`}
              >
                {lesson.imageUrl && (
                  <div className="h-36 overflow-hidden">
                    <img 
                      src={lesson.imageUrl} 
                      alt={lesson.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                    {isCompleted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </span>
                    ) : (
                      isUnlocked && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Available
                        </span>
                      )
                    )}
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {lesson.description}
                  </p>
                  
                  <div className="mt-4">
                    {isUnlocked ? (
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="btn btn-primary w-full"
                      >
                        {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="btn w-full opacity-75 cursor-not-allowed bg-gray-300 text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                        Locked
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">
            No lessons available for this chapter yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default Lessons; 