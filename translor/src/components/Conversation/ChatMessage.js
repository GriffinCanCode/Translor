import React, { useState } from 'react';

const ChatMessage = ({ message, onPlay }) => {
  const [showTranslation, setShowTranslation] = useState(true);
  
  const isAI = message.sender === 'ai';
  
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`
        max-w-[80%] rounded-xl p-4 shadow-sm
        ${isAI ? 'bg-white border border-gray-200' : 'bg-primary-100 text-primary-900'}
      `}>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="text-xs font-medium text-gray-500">
              {isAI ? 'Translor' : 'You'}
            </div>
            {isAI && (
              <button 
                onClick={onPlay}
                className="text-primary-600 hover:text-primary-800"
                title="Play pronunciation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="text-sm">
            {message.text}
          </div>
          
          {isAI && message.translation && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button 
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-xs text-gray-500 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 mr-1 transition-transform ${showTranslation ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                {showTranslation ? 'Hide translation' : 'Show translation'}
              </button>
              
              {showTranslation && (
                <div className="text-xs text-gray-600 mt-1">
                  {message.translation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 