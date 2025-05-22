/**
 * Service for handling text translation using an external API
 */
import { logger } from '../utils/logger';

class TranslationAPIService {
  constructor() {
    // Get API key from environment variables
    this.apiKey = window.env?.REACT_APP_TRANSLATION_API_KEY || '';
    
    logger.info('TranslationAPIService initialized', {
      hasApiKey: !!this.apiKey
    });
    
    // Log the API key existence for debugging purposes (not the actual key)
    if (!this.apiKey) {
      logger.warn('No translation API key found in environment variables');
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
    logger.info('Translating text with API', {
      textLength: text.length,
      targetLang,
      sourceLang
    });
    
    try {
      // If no API key is available, fallback to a free translation endpoint
      // or implement a fallback strategy
      if (!this.apiKey) {
        // Try fallback translation method, free public service
        return await this.fallbackTranslation(text, targetLang, sourceLang);
      }
      
      // This implementation uses the LibreTranslate API with API key
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `ApiKey ${this.apiKey}`;
      }
      
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'auto' ? 'auto' : sourceLang,
          target: targetLang,
          format: 'text',
          api_key: this.apiKey // Some LibreTranslate instances require the key in the body
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Translation API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const translatedText = data.translatedText || '';
      
      logger.debug('Translation completed', {
        sourceLang: data.detectedLanguage?.language || sourceLang,
        targetLang,
        originalLength: text.length,
        translatedLength: translatedText.length
      });
      
      return {
        success: true,
        originalText: text,
        translatedText,
        sourceLang: data.detectedLanguage?.language || sourceLang,
        targetLang,
        confidence: data.detectedLanguage?.confidence
      };
    } catch (error) {
      logger.error('Translation API error', {
        error: error.message,
        targetLang,
        sourceLang,
        textLength: text.length
      });
      
      // Try fallback method if primary method fails
      try {
        return await this.fallbackTranslation(text, targetLang, sourceLang);
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message,
          fallbackError: fallbackError.message
        };
      }
    }
  }

  /**
   * Fallback translation method when no API key is available
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code
   * @returns {Promise<Object>} - Translation result
   */
  async fallbackTranslation(text, targetLang, sourceLang) {
    logger.info('Using fallback translation method', {
      textLength: text.length,
      targetLang,
      sourceLang
    });
    
    try {
      // Simple local fallback if all else fails and text is short
      if (text.length < 50) {
        // Basic translations for common phrases if API call fails
        const basicTranslations = {
          en: {
            es: {
              'hello': 'hola',
              'goodbye': 'adiós',
              'thank you': 'gracias',
              'yes': 'sí',
              'no': 'no',
              'please': 'por favor',
              'excuse me': 'disculpe',
              'sorry': 'lo siento',
              'good morning': 'buenos días',
              'good afternoon': 'buenas tardes',
              'good evening': 'buenas noches'
            }
          }
        };
        
        const lowerText = text.toLowerCase().trim();
        if (basicTranslations[sourceLang]?.[targetLang]?.[lowerText]) {
          logger.debug('Using built-in basic translation', { 
            text: lowerText, 
            sourceLang, 
            targetLang 
          });
          
          return {
            success: true,
            originalText: text,
            translatedText: basicTranslations[sourceLang][targetLang][lowerText],
            sourceLang,
            targetLang,
            usingFallback: true,
            usingBasic: true
          };
        }
      }
      
      // Open source translation API without API key (resource intensive, use sparingly)
      const response = await fetch('https://translate.argosopentech.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'auto' ? 'en' : sourceLang, // Most free APIs don't support auto detection
          target: targetLang,
          format: 'text'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Fallback translation error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const translatedText = data.translatedText || '';
      
      logger.debug('Fallback translation completed', {
        sourceLang,
        targetLang,
        originalLength: text.length,
        translatedLength: translatedText.length
      });
      
      return {
        success: true,
        originalText: text,
        translatedText,
        sourceLang,
        targetLang,
        usingFallback: true
      };
    } catch (error) {
      logger.error('Fallback translation error', {
        error: error.message,
        targetLang,
        sourceLang,
        textLength: text.length
      });
      
      throw error;
    }
  }

  /**
   * Alternative implementation using Google Translate API
   * Note: This requires a Google Cloud API key with Translation API enabled
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} - Translation result
   */
  async googleTranslate(text, targetLang, sourceLang = 'auto') {
    logger.info('Translating text with Google API', {
      textLength: text.length,
      targetLang,
      sourceLang
    });
    
    try {
      // Format the API URL
      const url = new URL('https://translation.googleapis.com/language/translate/v2');
      url.searchParams.append('key', this.apiKey);
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          ...(sourceLang !== 'auto' && { source: sourceLang }),
          format: 'text'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Translate API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const translation = data.data?.translations?.[0];
      
      if (!translation) {
        throw new Error('No translation returned from API');
      }
      
      logger.debug('Google translation completed', {
        sourceLang: translation.detectedSourceLanguage || sourceLang,
        targetLang,
        originalLength: text.length,
        translatedLength: translation.translatedText.length
      });
      
      return {
        success: true,
        originalText: text,
        translatedText: translation.translatedText,
        sourceLang: translation.detectedSourceLanguage || sourceLang,
        targetLang
      };
    } catch (error) {
      logger.error('Google Translate API error', {
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
   * Check if translation service is available and configured
   * @returns {boolean} - Whether the service is available
   */
  isAvailable() {
    // We consider the service available even without an API key
    // because we have a fallback method
    return true;
  }
}

export default new TranslationAPIService(); 