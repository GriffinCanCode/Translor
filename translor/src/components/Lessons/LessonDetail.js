import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLesson } from '../../contexts/LessonContext';
import { useUser } from '../../contexts/UserContext';
import TranslationService from '../../services/TranslationService';

const LessonDetail = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { 
    currentLesson, 
    loadLesson, 
    saveUserProgress, 
    isLessonCompleted, 
    loading 
  } = useLesson();
  const { addXp, targetLanguage, nativeLanguage } = useUser();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Load lesson data on mount
  useEffect(() => {
    loadLesson(lessonId);
  }, [lessonId, loadLesson]);
  
  // Calculate progress percentage
  const progressPercentage = currentLesson && currentLesson.elements
    ? Math.round((currentStep / currentLesson.elements.length) * 100)
    : 0;
  
  // Handle answering a question
  const handleAnswer = (answer, elementId) => {
    setUserAnswers({
      ...userAnswers,
      [elementId]: answer
    });
  };
  
  // Move to next step
  const handleNextStep = () => {
    if (!currentLesson) return;
    
    const nextStep = currentStep + 1;
    
    if (nextStep < currentLesson.elements.length) {
      setCurrentStep(nextStep);
    } else {
      // Complete lesson
      handleComplete();
    }
  };
  
  // Move to previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Mark lesson as complete and calculate score
  const handleComplete = async () => {
    if (!currentLesson) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate score
      let correctAnswers = 0;
      let totalQuestions = 0;
      
      currentLesson.elements.forEach(element => {
        if (element.type.includes('exercise')) {
          totalQuestions++;
          if (userAnswers[element.id] === element.correctAnswer) {
            correctAnswers++;
          }
        }
      });
      
      const calculatedScore = totalQuestions > 0 
        ? Math.round((correctAnswers / totalQuestions) * 100) 
        : 100;
      
      setScore(calculatedScore);
      
      // Save progress
      await saveUserProgress(lessonId, {
        completed: true,
        score: calculatedScore,
        answers: userAnswers
      });
      
      // Award XP
      addXp(calculatedScore < 70 ? 10 : calculatedScore < 90 ? 20 : 30);
      
      // Show results
      setShowResults(true);
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Play audio for vocabulary
  const handlePlayAudio = async (text) => {
    try {
      const result = await TranslationService.textToSpeech(text, targetLanguage);
      
      if (result.success && result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!currentLesson) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson Not Found</h2>
        <p className="text-gray-600 mb-6">
          The lesson you're looking for doesn't exist or isn't available yet.
        </p>
        <Link to="/lessons" className="btn btn-primary">
          Back to Lessons
        </Link>
      </div>
    );
  }
  
  // Get current element
  const currentElement = currentLesson.elements[currentStep];
  
  // If showing results
  if (showResults) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary-600">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Completed!</h2>
            <p className="text-gray-600 mb-6">You've completed "{currentLesson.title}"</p>
            
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-primary-50 border-4 border-primary-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-700">{score}%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {score >= 90 
                  ? 'Excellent work! You\'ve mastered this lesson.' 
                  : score >= 70 
                    ? 'Good job! You\'ve learned the material well.' 
                    : 'Keep practicing! You\'ll get better with more study.'}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                <button 
                  onClick={() => {
                    setCurrentStep(0);
                    setShowResults(false);
                  }}
                  className="btn btn-outline"
                >
                  Review Lesson
                </button>
                <Link to="/lessons" className="btn btn-primary">
                  Continue Learning
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link to="/lessons" className="text-gray-600 hover:text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Lessons
        </Link>
        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {currentLesson.elements.length}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{currentLesson.title}</h1>
        </div>
        
        <div className="p-6">
          {/* Render content based on element type */}
          {currentElement && (
            <div className="space-y-6">
              {currentElement.type === 'intro' && (
                <div className="prose max-w-none">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">{currentElement.title}</h2>
                  <p className="text-gray-700">{currentElement.content}</p>
                </div>
              )}
              
              {currentElement.type === 'vocab' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Vocabulary</h2>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-medium text-gray-900">{currentElement.word}</p>
                        <p className="text-gray-500">{currentElement.translation}</p>
                      </div>
                      <button 
                        onClick={() => handlePlayAudio(currentElement.word)}
                        className="text-primary-600 hover:text-primary-800 p-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                          <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                        </svg>
                      </button>
                    </div>
                    {currentElement.example && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="italic text-gray-600">"{currentElement.example}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {currentElement.type === 'grammar' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Grammar</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-2">{currentElement.concept}</h3>
                    <p className="text-gray-700">{currentElement.explanation}</p>
                    {currentElement.examples && (
                      <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">Examples:</h4>
                        {currentElement.examples.map((example, idx) => (
                          <div key={idx} className="flex items-start">
                            <span className="h-5 w-5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full flex items-center justify-center mr-2 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-gray-600">{example}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {currentElement.type === 'exercise_translate' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Translation Exercise</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-4">Translate the following:</p>
                    <p className="text-lg font-medium text-gray-900 mb-6">{currentElement.sentence}</p>
                    
                    <textarea
                      value={userAnswers[currentElement.id] || ''}
                      onChange={(e) => handleAnswer(e.target.value, currentElement.id)}
                      placeholder="Type your translation here..."
                      className="input h-24 w-full"
                    />
                  </div>
                </div>
              )}
              
              {currentElement.type === 'exercise_multichoice' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Multiple Choice</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-4">{currentElement.question}</p>
                    
                    <div className="space-y-2">
                      {currentElement.options.map((option, idx) => (
                        <label 
                          key={idx} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            userAnswers[currentElement.id] === option
                              ? 'bg-primary-50 border-primary-200'
                              : 'border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentElement.id}`}
                            value={option}
                            checked={userAnswers[currentElement.id] === option}
                            onChange={() => handleAnswer(option, currentElement.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-3">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button 
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className={`btn ${currentStep === 0 ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-600' : 'btn-outline'}`}
          >
            Previous
          </button>
          
          <button 
            onClick={handleNextStep}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {currentStep === currentLesson.elements.length - 1 ? 'Complete Lesson' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail; 