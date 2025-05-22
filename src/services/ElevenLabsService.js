/**
 * Service for ElevenLabs API integration
 */
import { logger } from '../utils/logger';

class ElevenLabsService {
  constructor() {
    // Get API key from environment variables
    this.apiKey = window.env?.REACT_APP_ELEVENLABS_API_KEY || '';
    
    logger.info('ElevenLabsService initialized', {
      hasApiKey: !!this.apiKey
    });
  }
  
  /**
   * Convert text to speech using ElevenLabs
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result with audio URL
   */
  async textToSpeech(text, language, options = {}) {
    logger.debug('Using ElevenLabs TTS', {
      language,
      textLength: text.length,
      stability: options.stability || 0.5,
      similarityBoost: options.similarityBoost || 0.75
    });
    
    // Register new audio stream with main process
    if (window.electronAPI) {
      const streamCheck = await window.electronAPI.registerAudioStream();
      if (!streamCheck.shouldProceed) {
        logger.warn('Too many audio streams, skipping TTS');
        return {
          success: false,
          error: 'Too many audio streams active'
        };
      }
    }
    
    try {
      const voiceId = this.getVoiceIdForLanguage(language);
      const stability = options.stability || 0.5;
      const similarityBoost = options.similarityBoost || 0.75;
      
      logger.debug('Making ElevenLabs API request', { voiceId });
      
      // Use proxy method through main process if available
      if (window.electronAPI && window.electronAPI.callElevenLabsApi) {
        const result = await window.electronAPI.callElevenLabsApi({
          method: 'POST',
          endpoint: `/text-to-speech/${voiceId}`,
          body: {
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability,
              similarity_boost: similarityBoost
            }
          }
        });
        
        if (!result.success) {
          throw new Error(result.error || 'ElevenLabs API error');
        }
        
        logger.debug('ElevenLabs TTS successful through main process', {
          audioSize: result.audioSize,
          language,
          voiceId
        });
        
        return {
          success: true,
          audioUrl: result.audioUrl,
          provider: 'elevenlabs'
        };
      } else {
        // Fallback to direct API call (may be blocked by CSP)
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability,
              similarity_boost: similarityBoost
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        logger.debug('ElevenLabs TTS successful', {
          audioSize: audioBlob.size,
          language,
          voiceId
        });
        
        return {
          success: true,
          audioUrl,
          provider: 'elevenlabs'
        };
      }
    } catch (error) {
      logger.error('ElevenLabs TTS error', {
        error: error.message,
        language,
        textLength: text.length
      });
      
      // Release the audio stream that was registered
      if (window.electronAPI) {
        window.electronAPI.releaseAudioStream();
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get ElevenLabs voice ID for a specific language
   * @param {string} language - Language code
   * @returns {string} - Voice ID
   */
  getVoiceIdForLanguage(language) {
    // Map language codes to ElevenLabs voice IDs
    const voiceMap = {
      'en': 'EXAVITQu4vr4xnSDxMaL', // English - Rachel
      'es': 'ErXwobaYiN019PkySvjV', // Spanish - Antoni
      'fr': 'MF3mGyEYCl7XYWbV9V6O', // French - Gabrielle
      'de': 'jsCqWAovK2LkecY7zXl4', // German - Hans
      'it': 'AZnzlk1XvdvUeBnXmlld', // Italian - Vittoria
      'pt': 'Lj5rVjUF3hEFmb7gWmLk'  // Portuguese - Pedro
    };
    
    return voiceMap[language] || 'EXAVITQu4vr4xnSDxMaL'; // Default to English
  }
  
  /**
   * Get available voices from ElevenLabs
   * @returns {Promise<Array>} - List of available voices
   */
  async getVoices() {
    logger.debug('Getting available ElevenLabs voices');
    
    try {
      // Use proxy method through main process if available
      if (window.electronAPI && window.electronAPI.callElevenLabsApi) {
        const result = await window.electronAPI.callElevenLabsApi({
          method: 'GET',
          endpoint: '/voices'
        });
        
        if (!result.success) {
          throw new Error(result.error || 'ElevenLabs API error');
        }
        
        logger.debug('Retrieved ElevenLabs voices through main process', {
          voiceCount: result.data.voices?.length || 0
        });
        
        return {
          success: true,
          voices: result.data.voices || []
        };
      } else {
        // Fallback to direct API call (may be blocked by CSP)
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          method: 'GET',
          headers: {
            'xi-api-key': this.apiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }
        
        const data = await response.json();
        logger.debug('Retrieved ElevenLabs voices', {
          voiceCount: data.voices?.length || 0
        });
        
        return {
          success: true,
          voices: data.voices || []
        };
      }
    } catch (error) {
      logger.error('Error getting ElevenLabs voices', {
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        voices: []
      };
    }
  }
  
  /**
   * Check if ElevenLabs service is available and configured
   * @returns {Promise<boolean>} - Whether the service is available
   */
  async isAvailable() {
    if (!this.apiKey) {
      logger.warn('ElevenLabs API key not configured');
      return false;
    }
    
    try {
      // Use proxy method through main process if available
      if (window.electronAPI && window.electronAPI.callElevenLabsApi) {
        const result = await window.electronAPI.callElevenLabsApi({
          method: 'GET',
          endpoint: '/user'
        });
        
        const isAvailable = result.success;
        logger.debug('ElevenLabs service availability check through main process', { 
          isAvailable
        });
        
        return isAvailable;
      } else {
        // Fallback to direct API call (may be blocked by CSP)
        const response = await fetch('https://api.elevenlabs.io/v1/user', {
          method: 'GET',
          headers: {
            'xi-api-key': this.apiKey
          }
        });
        
        const isAvailable = response.ok;
        logger.debug('ElevenLabs service availability check', { 
          isAvailable, 
          status: response.status 
        });
        
        return isAvailable;
      }
    } catch (error) {
      logger.error('Error checking ElevenLabs availability', {
        error: error.message
      });
      return false;
    }
  }
}

export default new ElevenLabsService(); 