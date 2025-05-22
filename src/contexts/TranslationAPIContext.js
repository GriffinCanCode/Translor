import React, { createContext, useContext, useState, useEffect } from 'react';
import TranslationAPIService from '../services/TranslationAPIService';
import { logger } from '../utils/logger';

// Create context
const TranslationAPIContext = createContext();

// Custom hook for using the context
export const useTranslationAPI = () => useContext(TranslationAPIContext);

export const TranslationAPIProvider = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if translation service is available
    const available = TranslationAPIService.isAvailable();
    setIsAvailable(available);
    logger.debug('Translation API availability', { isAvailable: available });
  }, []);

  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} - Translation result
   */
  const translateText = async (text, targetLang, sourceLang = 'auto') => {
    if (!isAvailable) {
      logger.warn('Translation API not available');
      return {
        success: false,
        error: 'Translation API not available or not configured'
      };
    }

    try {
      return await TranslationAPIService.translateText(text, targetLang, sourceLang);
    } catch (error) {
      logger.error('Translation API error', { 
        error: error.message,
        targetLang,
        sourceLang
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  /**
   * Use Google Translate API instead of the default translation service
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} - Translation result
   */
  const googleTranslate = async (text, targetLang, sourceLang = 'auto') => {
    if (!isAvailable) {
      logger.warn('Translation API not available');
      return {
        success: false,
        error: 'Translation API not available or not configured'
      };
    }

    try {
      return await TranslationAPIService.googleTranslate(text, targetLang, sourceLang);
    } catch (error) {
      logger.error('Google Translate API error', { 
        error: error.message,
        targetLang,
        sourceLang
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  const value = {
    isAvailable,
    translateText,
    googleTranslate
  };

  return (
    <TranslationAPIContext.Provider value={value}>
      {children}
    </TranslationAPIContext.Provider>
  );
};

export default TranslationAPIProvider; 