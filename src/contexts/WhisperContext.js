import React, { createContext, useContext, useState, useEffect } from 'react';
import WhisperService from '../services/WhisperService';
import { logger } from '../utils/logger';

// Create context
const WhisperContext = createContext();

// Custom hook for using the context
export const useWhisper = () => useContext(WhisperContext);

export const WhisperProvider = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if Whisper service is available
    const available = WhisperService.isAvailable();
    setIsAvailable(available);
    logger.debug('Whisper service availability', { isAvailable: available });
  }, []);

  /**
   * Convert speech to text using OpenAI Whisper API
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  const speechToText = async (audioBlob, language) => {
    if (!isAvailable) {
      logger.warn('Whisper API not available');
      return {
        success: false,
        error: 'Whisper API not available or not configured'
      };
    }

    try {
      return await WhisperService.speechToText(audioBlob, language);
    } catch (error) {
      logger.error('Whisper API error', {
        error: error.message,
        language
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  const value = {
    isAvailable,
    speechToText
  };

  return (
    <WhisperContext.Provider value={value}>
      {children}
    </WhisperContext.Provider>
  );
};

export default WhisperProvider; 