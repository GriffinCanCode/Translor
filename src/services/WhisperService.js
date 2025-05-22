/**
 * Service for OpenAI Whisper API integration for speech-to-text
 */
import { logger } from '../utils/logger';

class WhisperService {
  constructor() {
    // Get API key from environment variables
    this.apiKey = window.env?.REACT_APP_OPENAI_API_KEY || '';
    
    logger.info('WhisperService initialized', {
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * Convert speech to text using OpenAI Whisper API
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async speechToText(audioBlob, language) {
    logger.debug('Using Whisper API for speech recognition', { 
      language,
      audioSize: audioBlob.size
    });
    
    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      
      // Call Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      logger.debug('Whisper transcription completed', { 
        textLength: data.text.length,
        language
      });
      
      return {
        success: true,
        text: data.text,
        provider: 'whisper'
      };
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
  }
  
  /**
   * Check if Whisper service is available and configured
   * @returns {boolean} - Whether the service is available
   */
  isAvailable() {
    if (!this.apiKey) {
      logger.warn('Whisper API key not configured');
      return false;
    }
    
    return true;
  }
}

export default new WhisperService(); 