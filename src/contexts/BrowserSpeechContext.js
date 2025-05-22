import React, { createContext, useContext, useState, useEffect } from 'react';
import BrowserSpeechService from '../services/BrowserSpeechService';
import { logger } from '../utils/logger';

// Create context
const BrowserSpeechContext = createContext();

// Custom hook for using the context
export const useBrowserSpeech = () => useContext(BrowserSpeechContext);

export const BrowserSpeechProvider = ({ children }) => {
  const [availability, setAvailability] = useState({
    speechRecognition: false,
    speechSynthesis: false
  });
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    // Check availability of speech services
    const available = BrowserSpeechService.isAvailable();
    setAvailability(available);

    // Load available voices if speech synthesis is available
    if (available.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = BrowserSpeechService.getVoices();
        logger.debug('Loaded browser voices', { count: availableVoices.length });
        setVoices(availableVoices);
      };

      // Voices may not be available immediately in some browsers
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Try loading voices immediately as well
      loadVoices();
    }
  }, []);

  /**
   * Convert speech to text using browser's SpeechRecognition API
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  const speechToText = async (audioBlob, language) => {
    return BrowserSpeechService.speechToText(audioBlob, language);
  };

  /**
   * Convert text to speech using browser's SpeechSynthesis API
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result object
   */
  const textToSpeech = async (text, language, options = {}) => {
    return BrowserSpeechService.textToSpeech(text, language, options);
  };

  /**
   * Convert browser language code to standard format
   * @param {string} langCode - Language code
   * @returns {string} - Standardized language code
   */
  const getBrowserLanguageCode = (langCode) => {
    return BrowserSpeechService.getBrowserLanguageCode(langCode);
  };

  const value = {
    isAvailable: availability,
    voices,
    speechToText,
    textToSpeech,
    getBrowserLanguageCode
  };

  return (
    <BrowserSpeechContext.Provider value={value}>
      {children}
    </BrowserSpeechContext.Provider>
  );
};

export default BrowserSpeechProvider; 