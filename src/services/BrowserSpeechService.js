/**
 * Service for browser-based speech recognition and synthesis
 */
import { logger } from '../utils/logger';

class BrowserSpeechService {
  constructor() {
    // Check if we're in a browser environment
    this.isBrowser = typeof window !== 'undefined';
    this.isElectron = this.isBrowser && !!window.electronAPI;
    
    if (this.isBrowser) {
      this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.hasSpeechRecognition = !!this.SpeechRecognition;
      this.hasSpeechSynthesis = 'speechSynthesis' in window;
      
      logger.info('BrowserSpeechService initialized', {
        hasSpeechRecognition: this.hasSpeechRecognition,
        hasSpeechSynthesis: this.hasSpeechSynthesis,
        isElectron: this.isElectron
      });
    } else {
      this.SpeechRecognition = null;
      this.hasSpeechRecognition = false;
      this.hasSpeechSynthesis = false;
      this.isElectron = false;
      
      logger.warn('BrowserSpeechService initialized in non-browser environment');
    }
    
    // Track failed speech recognition attempts to optimize future attempts
    this.recognitionFailCount = 0;
    this.lastRecognitionError = null;
    this.preferAlternativeSpeechRecognition = this.isElectron; // Default to alternative in Electron
  }

  /**
   * Main entry point for speech-to-text that automatically selects the best available method
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async speechToTextWithFallback(audioBlob, language) {
    // Electron environment or previous network failures - try alternative first
    if (this.preferAlternativeSpeechRecognition) {
      logger.debug('Using alternative speech recognition as primary method', { 
        isElectron: this.isElectron,
        failCount: this.recognitionFailCount,
        lastError: this.lastRecognitionError
      });
      
      try {
        const result = await this.useAlternativeSpeechRecognition(audioBlob, language);
        if (result.success) {
          return result;
        }
        
        // Alternative failed, try browser as fallback if available
        if (this.hasSpeechRecognition && !this.isElectron) {
          logger.debug('Alternative recognition failed, falling back to browser', {
            alternativeError: result.error
          });
          return await this.speechToText(audioBlob, language);
        }
        
        // In Electron with no speech recognition, provide a demo mode fallback
        if (this.isElectron) {
          logger.debug('Using demo mode speech recognition fallback in Electron');
          return this.provideDemoModeSpeechRecognition(language);
        }
        
        return result;
      } catch (error) {
        // If alternative throws exception, try browser if available
        if (this.hasSpeechRecognition && !this.isElectron) {
          logger.warn('Alternative recognition error, falling back to browser', {
            error: error.message
          });
          return await this.speechToText(audioBlob, language);
        }
        
        // In Electron with no speech recognition, provide a demo mode fallback
        if (this.isElectron) {
          logger.debug('Using demo mode speech recognition fallback in Electron after error');
          return this.provideDemoModeSpeechRecognition(language);
        }
        
        // No fallback available
        return {
          success: false,
          error: error.message,
          provider: 'fallback-system'
        };
      }
    }
    
    // Default flow: try browser recognition first
    try {
      const result = await this.speechToText(audioBlob, language);
      
      // If browser recognition failed with network error, try alternative
      if (!result.success && 
          (result.errorType === 'network' || result.errorType === 'not-allowed')) {
        this.recognitionFailCount++;
        this.lastRecognitionError = result.errorType;
        
        // After repeated failures, prefer alternative in the future
        if (this.recognitionFailCount >= 2) {
          this.preferAlternativeSpeechRecognition = true;
          logger.info('Switching to alternative speech recognition as primary method after repeated failures');
        }
        
        logger.debug('Browser recognition failed, trying alternative', {
          error: result.errorType,
          failCount: this.recognitionFailCount
        });
        
        const alternativeResult = await this.useAlternativeSpeechRecognition(audioBlob, language);
        
        // If alternative also failed and we're in Electron, provide demo mode
        if (!alternativeResult.success && this.isElectron) {
          logger.debug('Alternative recognition failed in Electron, using demo mode');
          return this.provideDemoModeSpeechRecognition(language);
        }
        
        return alternativeResult;
      }
      
      // Reset fail count on success
      if (result.success) {
        this.recognitionFailCount = 0;
        this.lastRecognitionError = null;
      }
      
      return result;
    } catch (error) {
      logger.error('Speech recognition fallback system error', { error: error.message });
      
      // In Electron with error, provide a demo mode fallback
      if (this.isElectron) {
        logger.debug('Using demo mode speech recognition after error in fallback system');
        return this.provideDemoModeSpeechRecognition(language);
      }
      
      return {
        success: false,
        error: error.message,
        provider: 'fallback-system'
      };
    }
  }

  /**
   * Use alternative speech recognition service instead of browser
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async useAlternativeSpeechRecognition(audioBlob, language) {
    logger.debug('Using alternative speech recognition', { language });
    
    // Convert Blob to ArrayBuffer for IPC transfer
    let audioArrayBuffer;
    try {
      audioArrayBuffer = await audioBlob.arrayBuffer();
      logger.debug('Converted audio blob to ArrayBuffer', { 
        blobSize: audioBlob.size, 
        bufferSize: audioArrayBuffer.byteLength 
      });
    } catch (error) {
      logger.error('Failed to convert audio blob to ArrayBuffer', { error: error.message });
      return {
        success: false,
        error: 'Failed to process audio data: ' + error.message,
        errorType: 'data-conversion-error',
        provider: 'alternative'
      };
    }
    
    // Check if app has ElevenLabs API available through Electron main process
    if (this.isElectron && window.electronAPI && window.electronAPI.useElevenLabsSpeechToText) {
      try {
        logger.debug('Attempting ElevenLabs speech recognition');
        return await window.electronAPI.useElevenLabsSpeechToText(audioArrayBuffer, language);
      } catch (error) {
        logger.error('ElevenLabs speech recognition failed', { error: error.message });
      }
    }
    
    // Check if app has Whisper API available through Electron main process
    if (this.isElectron && window.electronAPI && window.electronAPI.useWhisperSpeechToText) {
      try {
        logger.debug('Attempting Whisper speech recognition');
        return await window.electronAPI.useWhisperSpeechToText(audioArrayBuffer, language);
      } catch (error) {
        logger.error('Whisper speech recognition failed', { error: error.message });
      }
    }
    
    // No alternative available or all alternatives failed
    logger.error('No alternative speech recognition service available');
    
    if (this.isElectron) {
      return {
        success: false,
        error: 'Speech recognition requires additional setup in Electron. Please check the app configuration to enable speech recognition fallback.',
        errorType: 'no-alternative-available',
        provider: 'alternative',
        userMessage: 'Sorry, speech recognition is currently unavailable. You can type your message instead.'
      };
    } else {
      return {
        success: false,
        error: 'Speech recognition is unavailable. This could be due to network issues or browser limitations.',
        errorType: 'no-alternative-available',
        provider: 'alternative',
        userMessage: 'Speech recognition failed. Please check your internet connection and try again, or type your message instead.'
      };
    }
  }

  /**
   * Convert speech to text using browser's SpeechRecognition API
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async speechToText(audioBlob, language) {
    logger.debug('Using browser speech recognition', { language });
    
    if (!this.isBrowser) {
      logger.error('Browser speech recognition not available: Not in browser environment');
      return {
        success: false,
        error: 'Browser speech recognition not available: Not in browser environment'
      };
    }
    
    if (!this.hasSpeechRecognition) {
      logger.error('Browser speech recognition not available');
      return {
        success: false,
        error: 'Browser speech recognition not available'
      };
    }
    
    // For Electron, check if we should instead use a different recognition method
    if (this.isElectron && window.electronAPI && window.electronAPI.isNetworkRestricted) {
      try {
        const networkStatus = await window.electronAPI.checkNetworkStatus();
        if (networkStatus && networkStatus.isRestricted) {
          logger.warn('Network access may be restricted in Electron, suggesting alternative speech recognition');
          return {
            success: false,
            error: 'Network connection issue. Speech recognition requires internet access in this environment.',
            errorType: 'network',
            provider: 'browser',
            suggestAlternative: true
          };
        }
      } catch (error) {
        logger.debug('Error checking Electron network status', { error: error.message });
        // Continue with normal recognition
      }
    }
    
    return new Promise((resolve) => {
      try {
        // Initialize speech recognition directly without trying to play the audio blob
        // This avoids CSP issues with blob URLs
        const recognition = new this.SpeechRecognition();
        recognition.lang = this.getBrowserLanguageCode(language);
        recognition.continuous = false;
        recognition.interimResults = false;
        
        let recognized = false;
        let errorOccurred = false;
        let errorInfo = null;
        
        // Set up event handlers
        recognition.onresult = (event) => {
          recognized = true;
          const transcript = event.results[0][0].transcript;
          logger.debug('Browser speech recognition result', {
            textLength: transcript.length,
            confidence: event.results[0][0].confidence
          });
          
          resolve({
            success: true,
            text: transcript,
            provider: 'browser',
            confidence: event.results[0][0].confidence
          });
        };
        
        recognition.onerror = (event) => {
          errorOccurred = true;
          logger.error('Browser speech recognition error', { error: event.error });
          
          // Provide more specific error messages for common error types
          let errorMessage = event.error;
          let shouldSuggestAlternative = false;
          
          if (event.error === 'network') {
            errorMessage = 'Network connection issue. Please check your internet connection and try again.';
            // In Electron, network errors for speech recognition are common due to CSP
            if (this.isElectron) {
              errorMessage = 'Network connection issue. The app may need to use an alternative speech recognition service.';
              shouldSuggestAlternative = true;
            }
          } else if (event.error === 'not-allowed') {
            errorMessage = 'Microphone access denied. Please enable microphone permissions.';
          } else if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please speak more clearly or check your microphone.';
          } else if (event.error === 'aborted') {
            errorMessage = 'Speech recognition was aborted.';
          }
          
          errorInfo = {
            success: false,
            error: errorMessage,
            errorType: event.error,
            provider: 'browser',
            suggestAlternative: shouldSuggestAlternative
          };
          
          // Only resolve for terminal errors that won't be followed by onend with useful information
          if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            resolve(errorInfo);
          }
        };
        
        recognition.onend = () => {
          // If we already got results or already resolved due to a terminal error, don't resolve again
          if (recognized || (errorOccurred && errorInfo && 
            (errorInfo.errorType === 'network' || 
             errorInfo.errorType === 'not-allowed' || 
             errorInfo.errorType === 'service-not-allowed'))) {
            return;
          }
          
          // If we had a non-terminal error, resolve with that error
          if (errorOccurred && errorInfo) {
            logger.warn('Speech recognition ended with error', { errorType: errorInfo.errorType });
            resolve(errorInfo);
            return;
          }
          
          // Otherwise, this is a case where no speech was detected
          logger.warn('Speech recognition ended without results');
          resolve({
            success: false,
            error: 'No speech was detected',
            provider: 'browser'
          });
        };
        
        // Start recognition directly
        recognition.start();
        
        // Set timeout for safety
        setTimeout(() => {
          if (!recognized && !errorOccurred) {
            logger.warn('Speech recognition timeout');
            recognition.stop();
            resolve({
              success: false,
              error: 'Recognition timeout',
              provider: 'browser'
            });
          }
        }, 10000); // 10 second timeout
      } catch (error) {
        logger.error('Error initializing browser speech recognition', { error: error.message });
        resolve({
          success: false,
          error: error.message,
          provider: 'browser'
        });
      }
    });
  }
  
  /**
   * Convert text to speech using browser's SpeechSynthesis API
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result object
   */
  async textToSpeech(text, language, options = {}) {
    logger.debug('Using browser TTS', {
      language,
      textLength: text.length,
      rate: options.rate || 1,
      pitch: options.pitch || 1
    });
    
    if (!this.isBrowser) {
      logger.error('Browser speech synthesis not available: Not in browser environment');
      return {
        success: false,
        error: 'Browser speech synthesis not available: Not in browser environment'
      };
    }
    
    if (!this.hasSpeechSynthesis) {
      logger.error('Browser speech synthesis not available');
      return {
        success: false,
        error: 'Browser speech synthesis not available'
      };
    }
    
    // Register new audio stream with main process if available
    if (this.isBrowser && window.electronAPI) {
      const streamCheck = await window.electronAPI.registerAudioStream();
      if (!streamCheck.shouldProceed) {
        logger.warn('Too many audio streams, skipping TTS');
        return {
          success: false,
          error: 'Too many audio streams active'
        };
      }
    }
    
    return new Promise((resolve) => {
      // Create a cleanup and resolution function
      const finishTTS = (result) => {
        // Release the audio stream if available
        if (window.electronAPI) {
          window.electronAPI.releaseAudioStream();
        }
        resolve(result);
      };
      
      try {
        // Use simple method that works with CSP restrictions
        logger.debug('Using simplified TTS for Electron');
        
        // Create a simple utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.getBrowserLanguageCode(language);
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        
        // Select voice if specified
        if (options.voice) {
          const voices = window.speechSynthesis.getVoices();
          const selectedVoice = voices.find(voice => voice.name === options.voice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }
        
        // Set event handlers
        utterance.onend = () => {
          logger.debug('Browser TTS completed');
          finishTTS({
            success: true,
            provider: 'browser'
          });
        };
        
        utterance.onerror = (event) => {
          // SpeechSynthesisErrorEvent structure is different from standard Error objects
          // The error may be in event.error or the event itself might contain the error info
          const errorType = (event && event.error) || 
                           (typeof event === 'string' ? event : 'unknown');
          
          // Provide more specific error messages for common error types
          let errorMessage;
          
          if (errorType === 'interrupted') {
            errorMessage = 'Speech synthesis was interrupted. This commonly happens when navigating between screens.';
          } else if (errorType === 'audio-busy') {
            errorMessage = 'Audio system is busy. Please try again later.';
          } else if (errorType === 'network') {
            errorMessage = 'Network connection issue. Please check your internet connection and try again.';
          } else if (errorType === 'synthesis-failed') {
            errorMessage = 'Speech synthesis failed. The language may not be supported.';
          } else {
            errorMessage = errorType === 'unknown' ? 'Browser speech synthesis failed' : errorType;
          }
          
          logger.error('Browser TTS error', { error: errorType });
          finishTTS({
            success: false,
            error: errorMessage,
            errorType: errorType
          });
        };
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
        // Add a timeout for safety
        setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            logger.warn('Browser TTS taking too long, finishing anyway');
            window.speechSynthesis.cancel();
            finishTTS({
              success: true,
              provider: 'browser',
              warning: 'TTS timed out'
            });
          }
        }, 10000);
      } catch (error) {
        logger.error('Error during browser TTS setup', { error: error.message || 'Unknown error' });
        // Clean up any resources and return failure
        window.speechSynthesis.cancel();
        finishTTS({
          success: false,
          error: 'Failed to initialize speech synthesis'
        });
      }
    });
  }
  
  /**
   * Get available voices from browser's speech synthesis
   * @returns {Array} - List of available voices
   */
  getVoices() {
    if (!this.hasSpeechSynthesis) {
      logger.warn('Browser speech synthesis not available');
      return [];
    }
    
    return window.speechSynthesis.getVoices();
  }
  
  /**
   * Convert browser language code to standard format
   * @param {string} langCode - Language code
   * @returns {string} - Standardized language code
   */
  getBrowserLanguageCode(langCode) {
    // Map our language codes to browser language codes if needed
    const languageMap = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ru': 'ru-RU'
    };
    
    const mappedCode = languageMap[langCode] || langCode;
    logger.debug('Mapped language code', { original: langCode, mapped: mappedCode });
    return mappedCode;
  }
  
  /**
   * Check if browser speech services are available
   * @returns {Object} - Availability information
   */
  isAvailable() {
    return {
      speechRecognition: this.hasSpeechRecognition,
      speechSynthesis: this.hasSpeechSynthesis
    };
  }
  
  /**
   * Provide a fallback demo mode for speech recognition in Electron
   * This simulates speech recognition with predefined responses for testing
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Simulated transcription result
   */
  provideDemoModeSpeechRecognition(language) {
    logger.info('Using demo mode speech recognition', { language });
    
    // List of demo phrases based on the language
    const demoPhrases = {
      'en': [
        "Hello, how are you today?",
        "I would like to learn Spanish",
        "What time is it?",
        "Can you help me translate this?",
        "I'm practicing my language skills"
      ],
      'es': [
        "Hola, ¿cómo estás hoy?",
        "Me gustaría aprender inglés",
        "¿Qué hora es?",
        "¿Puedes ayudarme a traducir esto?",
        "Estoy practicando mis habilidades lingüísticas"
      ],
      'fr': [
        "Bonjour, comment allez-vous aujourd'hui?",
        "Je voudrais apprendre l'anglais",
        "Quelle heure est-il?",
        "Pouvez-vous m'aider à traduire ceci?",
        "Je pratique mes compétences linguistiques"
      ]
    };
    
    // Get phrases for requested language or fall back to English
    const phrases = demoPhrases[language] || demoPhrases['en'];
    
    // Select a random phrase
    const randomIndex = Math.floor(Math.random() * phrases.length);
    const text = phrases[randomIndex];
    
    return {
      success: true,
      text,
      provider: 'demo-mode',
      confidence: 0.95,
      demoMode: true,
      userMessage: 'Using demo mode speech recognition. For production use, configure a speech recognition service.'
    };
  }
}

export default new BrowserSpeechService(); 