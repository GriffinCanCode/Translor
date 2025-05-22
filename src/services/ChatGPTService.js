import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Service for interacting with OpenAI's GPT models
 */
class ChatGPTService {
  constructor() {
    this.apiKey = window.env?.REACT_APP_OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.conversationHistory = new Map(); // Store conversation history by user
    logger.info('ChatGPTService initialized', { 
      hasApiKey: !!this.apiKey,
      endpoint: this.apiUrl
    });
  }

  /**
   * Initialize or retrieve a conversation history for a user
   * @param {string} userId - Unique identifier for the user
   * @returns {Array} - The conversation history
   */
  initializeConversation(userId) {
    if (!this.conversationHistory.has(userId)) {
      logger.debug('Initializing new conversation history', { userId });
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId);
  }

  /**
   * Add a message to the conversation history
   * @param {string} userId - User identifier
   * @param {string} role - 'user', 'assistant', or 'system'
   * @param {string} content - Message content
   */
  addMessage(userId, role, content) {
    const history = this.initializeConversation(userId);
    history.push({ role, content });
    
    // Keep history size manageable (last 10 messages)
    if (history.length > 10) {
      logger.debug('Trimming conversation history', { userId, historyLength: history.length });
      this.conversationHistory.set(userId, history.slice(-10));
    }
  }

  /**
   * Get a response from ChatGPT based on conversation history
   * @param {string} userId - User identifier
   * @param {string} targetLanguage - Language code for the response
   * @param {string} userMessage - The latest user message
   * @param {string} userLevel - Language proficiency level (beginner, intermediate, advanced)
   * @returns {Promise<string>} - ChatGPT response
   */
  async getResponse(userId, targetLanguage, userMessage, userLevel = 'beginner') {
    logger.info('Getting ChatGPT response', { 
      userId, 
      targetLanguage,
      userLevel,
      messageLength: userMessage.length
    });
    
    try {
      // Get conversation history
      const history = this.initializeConversation(userId);

      // Add system message for context if it's a new conversation
      if (history.length === 0) {
        logger.debug('Adding system message for new conversation', { userId, targetLanguage });
        this.addMessage(userId, 'system', 
          `You are a helpful language tutor helping a ${userLevel} learn ${targetLanguage}. 
           Respond in ${targetLanguage} only. Keep responses conversational and appropriate for their level.
           Focus on helping them practice speaking naturally. Provide corrections only when necessary.`
        );
      }

      // Add user message to history
      this.addMessage(userId, 'user', userMessage);

      // Check if API key is available
      if (!this.apiKey) {
        logger.warn('No OpenAI API key available, using mock response', { userId });
        // Generate a mock response based on the target language
        const responseText = this.getMockResponse(targetLanguage, userMessage || 'greeting');
        
        // Add assistant response to history
        this.addMessage(userId, 'assistant', responseText);
        
        return responseText;
      }

      // Prepare messages for API call
      const messages = [...history];

      // Call OpenAI API
      logger.debug('Calling OpenAI API', { 
        userId,
        historyLength: messages.length
      });

      const response = await axios.post(this.apiUrl, 
        {
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 256
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Extract response text
      const responseText = response.data.choices[0].message.content;
      
      // Add assistant response to history
      this.addMessage(userId, 'assistant', responseText);
      
      return responseText;
    } catch (error) {
      logger.error('Error generating response', { 
        userId,
        error: error.message
      });
      
      // Fallback to mock response on error
      logger.debug('Falling back to mock response due to error', { userId });
      const responseText = this.getMockResponse(targetLanguage, userMessage || 'greeting');
      this.addMessage(userId, 'assistant', responseText);
      
      return responseText;
    }
  }

  /**
   * Generate a mock response based on the target language
   * @param {string} language - Target language code
   * @param {string} messageType - Type of message to generate response for
   * @returns {string} - Mock response text
   */
  getMockResponse(language, messageType) {
    // Sample responses for different languages
    const greetings = {
      'es': '¡Hola! Soy tu tutor de español. ¿Cómo puedo ayudarte hoy?',
      'fr': 'Bonjour! Je suis votre tuteur de français. Comment puis-je vous aider aujourd\'hui?',
      'de': 'Hallo! Ich bin dein Deutschlehrer. Wie kann ich dir heute helfen?',
      'it': 'Ciao! Sono il tuo tutor di italiano. Come posso aiutarti oggi?',
      'pt': 'Olá! Sou seu tutor de português. Como posso ajudá-lo hoje?',
      'default': 'Hello! I am your language tutor. How can I help you today?'
    };
    
    const responses = {
      'es': '¡Muy bien! Vamos a practicar juntos. Puedes hacerme cualquier pregunta.',
      'fr': 'Très bien! Pratiquons ensemble. Vous pouvez me poser n\'importe quelle question.',
      'de': 'Sehr gut! Lass uns zusammen üben. Du kannst mir jede Frage stellen.',
      'it': 'Molto bene! Pratichiamo insieme. Puoi farmi qualsiasi domanda.',
      'pt': 'Muito bem! Vamos praticar juntos. Você pode me fazer qualquer pergunta.',
      'default': 'Great! Let\'s practice together. You can ask me any question.'
    };
    
    // Return appropriate response based on message type
    if (messageType === 'greeting' || messageType.toLowerCase().includes('hello') || messageType.toLowerCase().includes('hi')) {
      return greetings[language] || greetings['default'];
    }
    
    return responses[language] || responses['default'];
  }

  /**
   * Generate language learning feedback for the user
   * @param {string} userId - User identifier
   * @param {string} userInput - Original user input
   * @param {string} targetLanguage - Target language
   * @returns {Promise<Object>} - Structured feedback
   */
  async generateFeedback(userId, userInput, targetLanguage) {
    logger.info('Generating language feedback', { 
      userId, 
      targetLanguage,
      inputLength: userInput.length 
    });
    
    try {
      // Check if API key is available
      if (!this.apiKey) {
        logger.warn('No OpenAI API key available, using mock feedback', { userId });
        // Sample feedback based on target language
        return {
          title: 'Learning Tip',
          grammar: 'Focus on verb conjugation in your sentences.',
          vocabulary: 'Try using more varied adjectives to describe things.',
          alternatives: 'Consider using different greetings like "Buenos días" or "Buenas tardes".',
          practice: 'Practice asking questions using the correct word order.'
        };
      }
      
      // Prepare prompt for feedback generation
      const prompt = `
        As a language tutor for ${targetLanguage}, provide constructive feedback on this student input:
        "${userInput}"
        
        Format your response as JSON with these fields:
        - grammar: main grammar point to improve
        - vocabulary: suggestion for vocabulary improvement
        - alternatives: alternative phrases they could use
        - practice: specific practice suggestion
      `;
      
      logger.debug('Calling OpenAI API for feedback', { userId });
      
      const response = await axios.post(this.apiUrl, 
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful language tutor. Respond only with JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 512
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      // Parse the JSON response
      const responseText = response.data.choices[0].message.content;
      
      try {
        // Extract JSON from response (handling potential text wrapping)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        const feedback = JSON.parse(jsonString);
        
        return {
          title: 'Learning Tip',
          ...feedback
        };
      } catch (jsonError) {
        logger.error('Error parsing feedback JSON', { 
          userId,
          error: jsonError.message,
          responseText
        });
        
        // Fallback to structured format if JSON parsing fails
        return {
          title: 'Learning Tip',
          grammar: responseText.includes('grammar') ? 
            responseText.split('grammar')[1].split('\n')[0].replace(/[:\-]/g, '').trim() : 
            'Focus on your grammar structure.',
          vocabulary: 'Try using more varied vocabulary.',
          alternatives: 'Consider alternative phrasing.',
          practice: 'Continue practicing consistently.'
        };
      }
    } catch (error) {
      logger.error('Error generating feedback', { 
        userId,
        error: error.message
      });
      
      // Fallback to mock feedback on error
      return {
        title: 'Learning Tip',
        grammar: 'Focus on verb conjugation in your sentences.',
        vocabulary: 'Try using more varied adjectives to describe things.',
        alternatives: 'Consider using different greetings like "Buenos días" or "Buenas tardes".',
        practice: 'Practice asking questions using the correct word order.'
      };
    }
  }

  /**
   * Clear conversation history for a user
   * @param {string} userId - User identifier
   */
  clearConversation(userId) {
    logger.info('Clearing conversation history', { userId });
    this.conversationHistory.delete(userId);
  }
}

export default new ChatGPTService(); 