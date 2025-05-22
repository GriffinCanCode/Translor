import React from 'react';
import { useLesson } from '../../contexts/LessonContext';

const ProgressChart = () => {
  const { chapters, getChapterCompletionPercentage } = useLesson();

  // If no data is available yet
  if (!chapters || chapters.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No progress data available yet. Start learning to see your progress!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chapters.map((chapter) => {
        const progressPercentage = getChapterCompletionPercentage(chapter.id);
        
        return (
          <div key={chapter.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{chapter.title}</span>
              <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
            </div>
            <div className="relative">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressChart; 