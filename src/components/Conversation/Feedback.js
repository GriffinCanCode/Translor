import React, { useEffect } from 'react';
import useLogger from '../../utils/useLogger';

const Feedback = ({ feedbackData, onClose }) => {
  const logger = useLogger({ component: 'Feedback' });
  
  useEffect(() => {
    if (feedbackData) {
      logger.debug('Showing feedback', {
        title: feedbackData.title,
        hasGrammar: !!feedbackData.grammar,
        hasVocabulary: !!feedbackData.vocabulary
      });
    }
  }, [feedbackData, logger]);
  
  if (!feedbackData) return null;
  
  const { title, grammar, vocabulary, alternatives, practice } = feedbackData;
  
  const handleClose = () => {
    logger.debug('Closing feedback');
    onClose();
  };
  
  return (
    <div className="p-4 mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <h3 className="text-amber-800 font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
          </svg>
          {title}
        </h3>
        <button 
          onClick={handleClose}
          className="text-amber-600 hover:text-amber-800"
          aria-label="Close feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mt-2 space-y-2 text-sm text-amber-800">
        {grammar && (
          <div className="flex">
            <span className="font-medium mr-2">Grammar:</span>
            <span>{grammar}</span>
          </div>
        )}
        
        {vocabulary && (
          <div className="flex">
            <span className="font-medium mr-2">Vocabulary:</span>
            <span>{vocabulary}</span>
          </div>
        )}
        
        {alternatives && (
          <div className="flex">
            <span className="font-medium mr-2">Alternatives:</span>
            <span>{alternatives}</span>
          </div>
        )}
        
        {practice && (
          <div className="flex">
            <span className="font-medium mr-2">Practice:</span>
            <span>{practice}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback; 