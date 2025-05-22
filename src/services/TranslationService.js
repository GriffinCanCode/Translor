/**
 * Service for language translation and speech processing
 */
import { logger } from '../utils/logger';

class TranslationService {
  constructor() {
    // Access env variables through window.env or provide defaults
    this.apiKey = window.env?.REACT_APP_TRANSLATION_API_KEY || '';
    this.ttsProvider = window.env?.REACT_APP_TTS_PROVIDER || 'browser';
    this.sttProvider = window.env?.REACT_APP_STT_PROVIDER || 'browser';
    this.elevenLabsApiKey = window.env?.REACT_APP_ELEVENLABS_API_KEY || '';
    this.mediaRecorder = null;
    this.audioChunks = [];
    
    logger.info('TranslationService initialized', {
      ttsProvider: this.ttsProvider,
      sttProvider: this.sttProvider,
      hasApiKey: !!this.apiKey,
      hasElevenLabsKey: !!this.elevenLabsApiKey
    });
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
      // In a real app, this would call an external API
      console.log(`Translating from ${sourceLang} to ${targetLang}: ${text}`);
      
      // Mock translation service (replace with actual API call)
      const translatedText = this.mockTranslation(text, targetLang, sourceLang);
      
      logger.debug('Translation completed', {
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
        targetLang
      };
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
      if (this.ttsProvider === 'elevenlabs' && this.elevenLabsApiKey) {
        return await this.elevenLabsTextToSpeech(text, language, options);
      } else {
        return await this.browserTextToSpeech(text, language, options);
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
   * Use ElevenLabs for high-quality text-to-speech
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result with audio URL
   */
  async elevenLabsTextToSpeech(text, language, options = {}) {
    logger.debug('Using ElevenLabs TTS', {
      language,
      textLength: text.length,
      stability: options.stability || 0.5,
      similarityBoost: options.similarityBoost || 0.75
    });
    
    try {
      const voiceId = this.getVoiceIdForLanguage(language);
      const stability = options.stability || 0.5;
      const similarityBoost = options.similarityBoost || 0.75;
      
      logger.debug('Making ElevenLabs API request', { voiceId });
      
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
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
    } catch (error) {
      logger.error('ElevenLabs TTS error', {
        error: error.message,
        language,
        textLength: text.length
      });
      
      // Fall back to browser TTS
      logger.debug('Falling back to browser TTS');
      return this.browserTextToSpeech(text, language, options);
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
   * Use browser's built-in speech synthesis
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result object
   */
  async browserTextToSpeech(text, language, options = {}) {
    logger.debug('Using browser TTS', {
      language,
      textLength: text.length,
      rate: options.rate || 1,
      pitch: options.pitch || 1
    });
    
    return new Promise((resolve) => {
      // Create an audio element for playback
      const audio = new Audio();
      
      // Create a SpeechSynthesisUtterance instance
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
          logger.debug('Selected specific voice', { voice: selectedVoice.name });
        }
      }
      
      // Convert speech to blob URL
      utterance.onend = () => {
        logger.debug('Browser TTS completed', { audioUrl: !!audio.src });
        resolve({
          success: true,
          audioUrl: audio.src,
          provider: 'browser'
        });
      };
      
      utterance.onerror = (error) => {
        logger.error('Browser TTS error', { error: error.message || 'Unknown error' });
        resolve({
          success: false,
          error: error.message || 'Browser speech synthesis failed'
        });
      };
      
      // Use MediaRecorder to capture the synthesized speech
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      
      // Create an oscillator as a workaround
      const oscillator = audioContext.createOscillator();
      oscillator.connect(destination);
      
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        audio.src = URL.createObjectURL(audioBlob);
      };
      
      mediaRecorder.start();
      oscillator.start();
      
      window.speechSynthesis.speak(utterance);
      
      setTimeout(() => {
        mediaRecorder.stop();
        oscillator.stop();
      }, 5000); // Allow 5 seconds for synthesis
    });
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
      if (this.sttProvider === 'whisper' && this.apiKey) {
        return await this.whisperSpeechToText(audioBlob, language);
      } else {
        return await this.browserSpeechToText(audioBlob, language);
      }
    } catch (error) {
      logger.error('Speech-to-text error', { 
        error: error.message,
        provider: this.sttProvider
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Use OpenAI Whisper API for speech recognition
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async whisperSpeechToText(audioBlob, language) {
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
        throw new Error(`Whisper API error: ${response.status}`);
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
      
      // Fall back to browser speech recognition
      logger.debug('Falling back to browser speech recognition');
      return this.browserSpeechToText(audioBlob, language);
    }
  }
  
  /**
   * Use browser's built-in speech recognition
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async browserSpeechToText(audioBlob, language) {
    logger.debug('Using browser speech recognition', { language });
    
    // In a real implementation, we would use the Web Speech API
    // This is a mock implementation
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        const mockText = this.mockSpeechRecognition(audioBlob.size, language);
        logger.debug('Browser speech recognition completed', {
          textLength: mockText.length,
          language
        });
        
        resolve({
          success: true,
          text: mockText,
          provider: 'browser'
        });
      }, 1000);
    });
  }
  
  /**
   * Mock translation function (for development)
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language
   * @param {string} sourceLang - Source language
   * @returns {string} - Mock translated text
   */
  mockTranslation(text, targetLang, sourceLang) {
    logger.debug('Using mock translation', { 
      sourceLang, 
      targetLang,
      textLength: text.length
    });
    
    // Common translations for demonstration purposes
    const translations = {
      'en': {
        'es': {
          'Hello': 'Hola',
          'How are you?': 'Cómo estás?',
          'Thank you': 'Gracias',
          'Welcome': 'Bienvenido',
          'Goodbye': 'Adiós'
        },
        'fr': {
          'Hello': 'Bonjour',
          'How are you?': 'Comment ça va?',
          'Thank you': 'Merci',
          'Welcome': 'Bienvenue',
          'Goodbye': 'Au revoir'
        }
      },
      'es': {
        'en': {
          'Hola': 'Hello',
          'Cómo estás?': 'How are you?',
          'Gracias': 'Thank you',
          'Bienvenido': 'Welcome',
          'Adiós': 'Goodbye'
        }
      },
      'fr': {
        'en': {
          'Bonjour': 'Hello',
          'Comment ça va?': 'How are you?',
          'Merci': 'Thank you',
          'Bienvenue': 'Welcome',
          'Au revoir': 'Goodbye'
        }
      }
    };
    
    // Check if we have a direct translation
    if (translations[sourceLang]?.[targetLang]?.[text]) {
      return translations[sourceLang][targetLang][text];
    }
    
    // Generate a mock translation by adding a language prefix
    const langMarker = targetLang === 'en' ? '' : `[${targetLang.toUpperCase()}] `;
    logger.debug('No predefined translation, using mock translation');
    return `${langMarker}${text}`;
  }
  
  /**
   * Mock speech recognition results (for development)
   * @param {number} size - Audio blob size
   * @param {string} language - Language code
   * @returns {string} - Mock transcription
   */
  mockSpeechRecognition(size, language) {
    logger.debug('Using mock speech recognition', { 
      audioSize: size, 
      language 
    });
    
    // Return a mock response based on audio size and language
    const phrases = {
      'en': [
        'Hello, how can I help you today?',
        'I would like to practice my language skills.',
        'Could you recommend a good restaurant in the area?',
        'Thank you for your assistance.'
      ],
      'es': [
        'Hola, cómo puedo ayudarte hoy?',
        'Me gustaría practicar mis habilidades lingüísticas.',
        'Podrías recomendar un buen restaurante en la zona?',
        'Gracias por tu ayuda.'
      ],
      'fr': [
        'Bonjour, comment puis-je vous aider aujourd\'hui?',
        'Je voudrais pratiquer mes compétences linguistiques.',
        'Pourriez-vous recommander un bon restaurant dans la région?',
        'Merci pour votre aide.'
      ],
      'de': [
        'Hallo, wie kann ich Ihnen heute helfen?',
        'Ich möchte meine Sprachkenntnisse üben.',
        'Könnten Sie ein gutes Restaurant in der Gegend empfehlen?',
        'Vielen Dank für Ihre Hilfe.'
      ]
    };
    
    // Select language phrases or default to English
    const langPhrases = phrases[language] || phrases['en'];
    
    // Use audio size as a crude way to determine which phrase to return
    const index = Math.min(Math.floor(size / 10000) % langPhrases.length, langPhrases.length - 1);
    return langPhrases[index];
  }
}

export default new TranslationService(); 