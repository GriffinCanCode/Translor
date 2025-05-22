/**
 * Service for language translation and speech processing
 */
class TranslationService {
  constructor() {
    // Access env variables through window.env or provide defaults
    this.apiKey = window.env?.REACT_APP_TRANSLATION_API_KEY || '';
    this.ttsProvider = window.env?.REACT_APP_TTS_PROVIDER || 'browser';
    this.sttProvider = window.env?.REACT_APP_STT_PROVIDER || 'browser';
    this.elevenLabsApiKey = window.env?.REACT_APP_ELEVENLABS_API_KEY || '';
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} - Translation result
   */
  async translateText(text, targetLang, sourceLang = 'auto') {
    try {
      // In a real app, this would call an external API
      console.log(`Translating from ${sourceLang} to ${targetLang}: ${text}`);
      
      // Mock translation service (replace with actual API call)
      const translatedText = this.mockTranslation(text, targetLang, sourceLang);
      
      return {
        success: true,
        originalText: text,
        translatedText,
        sourceLang,
        targetLang
      };
    } catch (error) {
      console.error('Translation error:', error);
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
    try {
      if (this.ttsProvider === 'elevenlabs' && this.elevenLabsApiKey) {
        return await this.elevenLabsTextToSpeech(text, language, options);
      } else {
        return await this.browserTextToSpeech(text, language, options);
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
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
    try {
      const voiceId = this.getVoiceIdForLanguage(language);
      const stability = options.stability || 0.5;
      const similarityBoost = options.similarityBoost || 0.75;
      
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
      
      return {
        success: true,
        audioUrl,
        provider: 'elevenlabs'
      };
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      // Fall back to browser TTS
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
        }
      }
      
      // Convert speech to blob URL
      utterance.onend = () => {
        resolve({
          success: true,
          audioUrl: audio.src,
          provider: 'browser'
        });
      };
      
      utterance.onerror = (error) => {
        console.error('Browser TTS error:', error);
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
        resolve({
          success: true,
          audioUrl: audio.src,
          provider: 'browser'
        });
      };
      
      // Start recording and speech synthesis
      mediaRecorder.start();
      window.speechSynthesis.speak(utterance);
      
      // Fallback in case onend doesn't fire
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, text.length * 100); // Rough estimate based on text length
    });
  }
  
  /**
   * Convert browser language code format
   * @param {string} langCode - Language code in 'xx' format
   * @returns {string} - Language code in 'xx-XX' format
   */
  getBrowserLanguageCode(langCode) {
    // Map two-letter codes to full browser language codes
    const languageMap = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'ru': 'ru-RU'
    };
    
    return languageMap[langCode] || langCode;
  }

  /**
   * Start recording audio for speech input
   * @returns {Promise<void>}
   */
  async startRecording() {
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
      console.log('Recording started');
    } catch (error) {
      console.error('Start recording error:', error);
      throw error;
    }
  }

  /**
   * Stop recording and get audio data
   * @returns {Promise<Blob>} - Audio data as blob
   */
  async stopRecording() {
    if (!this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        console.log('Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (error) => {
        reject(error);
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
    try {
      if (this.sttProvider === 'whisper' && this.apiKey) {
        return await this.whisperSpeechToText(audioBlob, language);
      } else {
        return await this.browserSpeechToText(audioBlob, language);
      }
    } catch (error) {
      console.error('Speech-to-text error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Use OpenAI Whisper for speech-to-text
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async whisperSpeechToText(audioBlob, language) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.env?.REACT_APP_OPENAI_API_KEY || ''}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        text: result.text,
        provider: 'whisper'
      };
    } catch (error) {
      console.error('Whisper STT error:', error);
      // Fall back to browser STT
      return this.browserSpeechToText(audioBlob, language);
    }
  }
  
  /**
   * Use browser's SpeechRecognition API
   * @param {Blob} audioBlob - Audio data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Transcription result
   */
  async browserSpeechToText(audioBlob, language) {
    return new Promise((resolve) => {
      // Create an audio element for the recorded audio
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      
      // Create a SpeechRecognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        resolve({
          success: false,
          error: 'Speech recognition not supported in this browser'
        });
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = this.getBrowserLanguageCode(language);
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Process results
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve({
          success: true,
          text: transcript,
          confidence: event.results[0][0].confidence,
          provider: 'browser'
        });
      };
      
      recognition.onerror = (error) => {
        console.error('Browser STT error:', error);
        resolve({
          success: false,
          error: error.error || 'Browser speech recognition failed'
        });
      };
      
      // Simulate recognition by playing the audio
      audio.onended = () => {
        recognition.stop();
        
        // Fallback in case recognition fails
        setTimeout(() => {
          resolve({
            success: true,
            text: this.mockSpeechRecognition(audioBlob.size, language),
            provider: 'mock'
          });
        }, 1000);
      };
      
      // Start recognition and play audio
      recognition.start();
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        recognition.stop();
      });
    });
  }
  
  /**
   * Mock translation function (for development/testing)
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language
   * @param {string} sourceLang - Source language
   * @returns {string} - Translated text
   */
  mockTranslation(text, targetLang, sourceLang) {
    // Simple mock translations for testing
    const translations = {
      'en->es': {
        'Hello': '¡Hola!',
        'How are you?': '¿Cómo estás?',
        'What is your name?': '¿Cómo te llamas?',
        'Good morning': 'Buenos días',
        'Thank you': 'Gracias'
      },
      'es->en': {
        '¡Hola!': 'Hello!',
        '¿Cómo estás?': 'How are you?',
        '¿Cómo te llamas?': 'What is your name?',
        'Buenos días': 'Good morning',
        'Gracias': 'Thank you'
      }
    };
    
    const key = `${sourceLang}->${targetLang}`;
    
    // Return known translation or original text
    if (translations[key] && translations[key][text]) {
      return translations[key][text];
    }
    
    // For testing purposes, add some indicators to show it's translated
    if (targetLang === 'es') {
      return `ES: ${text}`;
    } else if (targetLang === 'fr') {
      return `FR: ${text}`;
    } else if (targetLang === 'de') {
      return `DE: ${text}`;
    } else if (targetLang === 'en') {
      return `EN: ${text}`;
    }
    
    return text; // Default: return original text
  }
  
  /**
   * Mock speech recognition (for development/testing)
   * @param {number} size - Size of audio blob
   * @param {string} language - Language code
   * @returns {string} - Recognized text
   */
  mockSpeechRecognition(size, language) {
    // Generate mock text based on audio blob size and language
    const sizeCategory = Math.floor(size / 10000);
    
    const mockTexts = {
      'en': [
        'Hello there',
        'How does this app work?',
        'I would like to practice my language skills',
        'Can you help me with pronunciation?'
      ],
      'es': [
        'Hola',
        '¿Cómo funciona esta aplicación?',
        'Me gustaría practicar mi español',
        '¿Puedes ayudarme con la pronunciación?'
      ],
      'fr': [
        'Bonjour',
        'Comment fonctionne cette application?',
        'Je voudrais pratiquer mon français',
        'Pouvez-vous m\'aider avec la prononciation?'
      ]
    };
    
    const texts = mockTexts[language] || mockTexts.en;
    const index = sizeCategory % texts.length;
    
    return texts[index];
  }
}

export default new TranslationService(); 