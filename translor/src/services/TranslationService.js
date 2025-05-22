/**
 * Service for handling translation operations through Electron API
 */
class TranslationService {
  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr')
   * @param {string} sourceLanguage - Source language code, optional if auto-detection is used
   * @returns {Promise<Object>} - Translation result with original text and translation
   */
  static async translateText(text, targetLanguage, sourceLanguage = null) {
    try {
      if (!text || !targetLanguage) {
        throw new Error('Text and target language are required');
      }

      return await window.electronAPI.translateText(text, targetLanguage, sourceLanguage);
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  /**
   * Convert speech audio to text
   * @param {Blob|ArrayBuffer} audioData - Audio data from recording
   * @param {string} language - Language code of the speech
   * @returns {Promise<Object>} - Transcription result
   */
  static async speechToText(audioData, language) {
    try {
      if (!audioData) {
        throw new Error('Audio data is required');
      }

      return await window.electronAPI.speechToText(audioData, language);
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech audio
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code for the speech
   * @returns {Promise<Object>} - Audio URL or data
   */
  static async textToSpeech(text, language) {
    try {
      if (!text || !language) {
        throw new Error('Text and language are required');
      }

      return await window.electronAPI.textToSpeech(text, language);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  /**
   * Start recording audio
   * @returns {Promise<void>}
   */
  static async startRecording() {
    try {
      window.electronAPI.startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording audio and get the recorded data
   * @returns {Promise<Blob|ArrayBuffer>} - Recorded audio data
   */
  static async stopRecording() {
    try {
      return await window.electronAPI.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }
}

export default TranslationService; 