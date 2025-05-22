import React, { createContext, useContext, useState, useEffect } from 'react';
import TranslationService from '../services/TranslationService';
import { logger } from '../utils/logger';

// Create context
const TranslationContext = createContext();

// Custom hook for using the context
export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }) => {
  const [ttsProvider, setTtsProvider] = useState('browser');
  const [sttProvider, setSttProvider] = useState('browser');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState(null);

  useEffect(() => {
    // Initialize providers from translation service
    setTtsProvider(TranslationService.ttsProvider);
    setSttProvider(TranslationService.sttProvider);
    
    // Clean up audio resources when component unmounts
    return () => {
      // Use the new dispose method to properly clean up all resources
      TranslationService.dispose();
    };
  }, []);

  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} - Translation result
   */
  const translateText = async (text, targetLang, sourceLang = 'auto') => {
    try {
      return await TranslationService.translateText(text, targetLang, sourceLang);
    } catch (error) {
      logger.error('Translation error', {
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
   * Convert text to speech audio
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result with audio URL
   */
  const textToSpeech = async (text, language, options = {}) => {
    try {
      return await TranslationService.textToSpeech(text, language, options);
    } catch (error) {
      logger.error('Text-to-speech error', {
        error: error.message,
        provider: ttsProvider,
        language
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  /**
   * Start recording audio for speech recognition
   * @returns {Promise<boolean>} - Success indicator
   */
  const startRecording = async () => {
    try {
      const success = await TranslationService.startRecording();
      setIsRecording(success);
      return success;
    } catch (error) {
      logger.error('Failed to start recording', { error: error.message });
      setIsRecording(false);
      return false;
    }
  };

  /**
   * Stop recording and process the audio
   * @returns {Promise<Object>} - Recording data
   */
  const stopRecording = async () => {
    try {
      const data = await TranslationService.stopRecording();
      setIsRecording(false);
      setRecordingData(data);
      return data;
    } catch (error) {
      logger.error('Failed to stop recording', { error: error.message });
      setIsRecording(false);
      return { success: false, error: error.message };
    }
  };

  /**
   * Convert speech to text
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  const speechToText = async (audioBlob, language) => {
    try {
      return await TranslationService.speechToText(audioBlob, language);
    } catch (error) {
      logger.error('Speech-to-text error', {
        error: error.message,
        provider: sttProvider
      });
      return {
        success: false,
        error: error.message
      };
    }
  };

  /**
   * Get browser language code to standard format
   * @param {string} langCode - Language code
   * @returns {string} - Standardized language code
   */
  const getBrowserLanguageCode = (langCode) => {
    return TranslationService.getBrowserLanguageCode(langCode);
  };

  /**
   * Record, transcribe and translate in one operation
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} - Result with transcription and translation
   */
  const recordAndTranslate = async (sourceLang, targetLang) => {
    try {
      // Start recording
      const recordingStarted = await startRecording();
      if (!recordingStarted) {
        throw new Error('Failed to start recording');
      }
      
      // Wait for user to stop recording - this would be handled by UI
      logger.info('Recording started, waiting for stopRecording to be called');
      
      return {
        success: true,
        recording: true,
        message: 'Recording started, call stopAndTranslate to complete'
      };
    } catch (error) {
      logger.error('Record and translate error', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Stop recording, transcribe and translate the audio
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} - Result with transcription and translation
   */
  const stopAndTranslate = async (sourceLang, targetLang) => {
    try {
      // Stop recording
      const recordingData = await stopRecording();
      if (!recordingData.success) {
        throw new Error('Failed to stop recording');
      }
      
      // Transcribe the audio
      const transcription = await speechToText(recordingData.audioBlob, sourceLang);
      if (!transcription.success) {
        throw new Error(`Transcription failed: ${transcription.error}`);
      }
      
      // Translate the transcription
      const translation = await translateText(transcription.text, targetLang, sourceLang);
      
      return {
        success: true,
        audioUrl: recordingData.audioUrl,
        transcription: transcription.text,
        translation: translation.success ? translation.translatedText : '',
        translationResult: translation
      };
    } catch (error) {
      logger.error('Stop and translate error', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  };

  const value = {
    ttsProvider,
    sttProvider,
    isRecording,
    recordingData,
    translateText,
    textToSpeech,
    startRecording,
    stopRecording,
    speechToText,
    getBrowserLanguageCode,
    recordAndTranslate,
    stopAndTranslate
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider; 