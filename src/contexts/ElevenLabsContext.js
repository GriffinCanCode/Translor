import React, { createContext, useContext, useState, useEffect } from 'react';
import ElevenLabsService from '../services/ElevenLabsService';
import { logger } from '../utils/logger';

// Create context
const ElevenLabsContext = createContext();

// Custom hook for using the context
export const useElevenLabs = () => useContext(ElevenLabsContext);

export const ElevenLabsProvider = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check availability of ElevenLabs service
    const checkAvailability = async () => {
      try {
        const available = await ElevenLabsService.isAvailable();
        setIsAvailable(available);
        
        // Only fetch voices if service is available
        if (available) {
          const voicesResult = await ElevenLabsService.getVoices();
          if (voicesResult.success) {
            setVoices(voicesResult.voices);
            logger.debug('Loaded ElevenLabs voices', { count: voicesResult.voices.length });
          }
        }
      } catch (error) {
        logger.error('Error checking ElevenLabs availability', { error: error.message });
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, []);

  /**
   * Convert text to speech using ElevenLabs
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result with audio URL
   */
  const textToSpeech = async (text, language, options = {}) => {
    if (!isAvailable) {
      logger.warn('ElevenLabs service not available');
      return {
        success: false,
        error: 'ElevenLabs service not available'
      };
    }

    try {
      return await ElevenLabsService.textToSpeech(text, language, options);
    } catch (error) {
      logger.error('Error in ElevenLabs TTS', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  };

  /**
   * Get ElevenLabs voice ID for a specific language
   * @param {string} language - Language code
   * @returns {string} - Voice ID
   */
  const getVoiceIdForLanguage = (language) => {
    return ElevenLabsService.getVoiceIdForLanguage(language);
  };

  const value = {
    isAvailable,
    voices,
    loading,
    textToSpeech,
    getVoiceIdForLanguage
  };

  return (
    <ElevenLabsContext.Provider value={value}>
      {children}
    </ElevenLabsContext.Provider>
  );
};

export default ElevenLabsProvider; 