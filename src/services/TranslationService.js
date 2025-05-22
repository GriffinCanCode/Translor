/**
 * Service for language translation and speech processing
 */
import { logger } from '../utils/logger';
import ElevenLabsService from './ElevenLabsService';
import WhisperService from './WhisperService';
import TranslationAPIService from './TranslationAPIService';
import BrowserSpeechService from './BrowserSpeechService';

class TranslationService {
  constructor() {
    // Prevent multiple initialization of listeners
    if (TranslationService.instance) {
      return TranslationService.instance;
    }
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          window.env?.NODE_ENV === 'development';
    
    // Access env variables through window.env or provide defaults
    this.apiKey = window.env?.REACT_APP_TRANSLATION_API_KEY || '';
    
    // In development mode, default to browser TTS to avoid CSP issues
    this.ttsProvider = isDevelopment 
      ? 'browser' 
      : (window.env?.REACT_APP_TTS_PROVIDER || 'elevenlabs');
      
    this.sttProvider = window.env?.REACT_APP_STT_PROVIDER || 'browser';
    this.elevenLabsApiKey = window.env?.REACT_APP_ELEVENLABS_API_KEY || '';
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    logger.info('TranslationService initialized', {
      ttsProvider: this.ttsProvider,
      sttProvider: this.sttProvider,
      hasApiKey: !!this.apiKey,
      hasElevenLabsKey: !!this.elevenLabsApiKey,
      isDevelopment
    });
    
    // Set up audio stream cleanup listener
    if (window.electronAPI) {
      this.cleanupListener = window.electronAPI.onCleanupAudioStreams(() => {
        this.cleanupAudioResources();
      });
    }
    
    // Store the instance
    TranslationService.instance = this;
  }
  
  /**
   * Dispose of the service and remove event listeners
   */
  dispose() {
    logger.info('Disposing TranslationService');
    
    // Remove cleanup listener if it exists
    if (this.cleanupListener && typeof this.cleanupListener.remove === 'function') {
      this.cleanupListener.remove();
      this.cleanupListener = null;
      logger.debug('Removed cleanup listener');
    }
    
    // Clean up any active media resources
    this.cleanupAudioResources();
    
    // Reset the instance
    TranslationService.instance = null;
  }
  
  /**
   * Clean up audio resources when instructed by main process
   */
  cleanupAudioResources() {
    logger.info('Cleaning up audio resources');
    
    // Stop any speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      logger.debug('Cancelled all speech synthesis');
    }
    
    // Stop and clean up media recorder if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      this.mediaRecorder = null;
      this.audioChunks = [];
    }
    
    // Reset audio streams counter
    if (window.electronAPI) {
      window.electronAPI.resetAudioStreams();
    }
  }

  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} - Translation result
   */
  async translateText(text, targetLang, sourceLang = 'auto') {
    logger.info('Translating text', {
      textLength: text.length,
      targetLang,
      sourceLang
    });
    
    try {
      // Use the real translation API service
      return await TranslationAPIService.translateText(text, targetLang, sourceLang);
    } catch (error) {
      logger.error('Translation error', {
        error: error.message,
        targetLang,
        sourceLang,
        textLength: text.length
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert text to speech audio
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result with audio URL
   */
  async textToSpeech(text, language, options = {}) {
    logger.info('Converting text to speech', {
      provider: this.ttsProvider,
      language,
      textLength: text.length,
      options: Object.keys(options)
    });
    
    try {
      if (this.ttsProvider === 'elevenlabs') {
        return await ElevenLabsService.textToSpeech(text, language, options);
      } else {
        return await BrowserSpeechService.textToSpeech(text, language, options);
      }
    } catch (error) {
      logger.error('Text-to-speech error', {
        error: error.message,
        provider: this.ttsProvider,
        language
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get browser language code to standard format
   * @param {string} langCode - Language code
   * @returns {string} - Standardized language code
   */
  getBrowserLanguageCode(langCode) {
    return BrowserSpeechService.getBrowserLanguageCode(langCode);
  }

  /**
   * Start recording audio
   * @returns {Promise<boolean>} - Success indicator
   */
  async startRecording() {
    logger.info('Starting audio recording');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      logger.debug('Recording started successfully');
      
      return true;
    } catch (error) {
      logger.error('Failed to start recording', { error: error.message });
      return false;
    }
  }
  
  /**
   * Stop recording and return audio blob
   * @returns {Promise<Object>} - Audio data
   */
  async stopRecording() {
    logger.info('Stopping audio recording');
    
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        logger.warn('No active recording to stop');
        resolve({ success: false, error: 'No active recording' });
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        logger.debug('Recording stopped', { 
          blobSize: audioBlob.size,
          durationMs: this.audioChunks.length > 0 ? 'available' : 'empty'
        });
        
        resolve({
          success: true,
          audioBlob,
          audioUrl
        });
      };
      
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }
  
  /**
   * Convert speech to text
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async speechToText(audioBlob, language) {
    logger.info('Converting speech to text', {
      provider: this.sttProvider,
      language,
      audioSize: audioBlob.size
    });
    
    try {
      let result;
      
      // Use direct provider selection first
      if (this.sttProvider === 'whisper') {
        result = await WhisperService.speechToText(audioBlob, language);
      } 
      // Use the fallback mechanism for browser speech recognition
      else if (this.sttProvider === 'browser') {
        // Use the new fallback system that handles Electron network errors
        result = await BrowserSpeechService.speechToTextWithFallback(audioBlob, language);
      }
      // Use the regular browser speech recognition
      else {
        result = await BrowserSpeechService.speechToText(audioBlob, language);
      }
      
      // Handle demo mode specially
      if (result.demoMode) {
        logger.info('Using demo mode speech recognition', { text: result.text });
        // We'll keep the demoMode flag so UI can show appropriate message if needed
      }
      
      // If there's a user-friendly message in the result, enhance the error object
      if (!result.success && result.userMessage) {
        result.displayError = result.userMessage;
      } else if (!result.success) {
        // Provide a generic user-friendly message if none exists
        result.displayError = 'Sorry, speech recognition failed. You can try again or type your message.';
      }
      
      return result;
    } catch (error) {
      logger.error('Speech-to-text error', { 
        error: error.message,
        provider: this.sttProvider
      });
      
      return {
        success: false,
        error: error.message,
        displayError: 'Speech recognition encountered an error. Please try again later.'
      };
    }
  }
}

// Static instance property to ensure singleton pattern
TranslationService.instance = null;

export default new TranslationService(); 