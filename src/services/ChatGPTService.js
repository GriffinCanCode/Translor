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

      // Prepare messages for API call
      const messages = [...this.conversationHistory.get(userId)];

      // Call OpenAI API
      logger.debug('Calling OpenAI API', { 
        userId,
        model: 'gpt-4-turbo',
        messagesCount: messages.length
      });
      
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4-turbo',
          messages: messages,
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Extract response text
      const responseText = response.data.choices[0].message.content.trim();
      logger.debug('Received ChatGPT response', { 
        userId, 
        responseLength: responseText.length,
        promptTokens: response.data.usage?.prompt_tokens,
        completionTokens: response.data.usage?.completion_tokens,
        totalTokens: response.data.usage?.total_tokens
      });
      
      // Add assistant response to history
      this.addMessage(userId, 'assistant', responseText);
      
      return responseText;
    } catch (error) {
      logger.error('Error calling ChatGPT API', { 
        userId,
        error: error.message,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data
      });
      throw new Error('Failed to get response from ChatGPT');
    }
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
      const feedbackPrompt = `
        As a language tutor, analyze this learner's ${targetLanguage} message: "${userInput}"
        Provide feedback in JSON format with these fields:
        - grammar: one key grammatical point to improve
        - vocabulary: one vocabulary suggestion
        - alternatives: alternative phrases they could use
        - practice: a suggestion for practice
        
        Format as valid JSON only, without explanation or conversation.
      `;

      logger.debug('Calling OpenAI API for feedback', { 
        userId,
        model: 'gpt-4-turbo',
        targetLanguage
      });
      
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: feedbackPrompt }],
          max_tokens: 300,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const feedbackText = response.data.choices[0].message.content.trim();
      logger.debug('Received feedback response', {
        userId,
        responseLength: feedbackText.length,
        promptTokens: response.data.usage?.prompt_tokens,
        completionTokens: response.data.usage?.completion_tokens
      });
      
      // Parse JSON response
      try {
        return JSON.parse(feedbackText);
      } catch (parseError) {
        logger.error('Error parsing feedback JSON', { 
          userId,
          error: parseError.message,
          rawResponse: feedbackText
        });
        // Fallback structure if JSON parsing fails
        return {
          title: 'Learning Tip',
          grammar: 'Focus on sentence structure',
          vocabulary: 'Try expanding your vocabulary',
          alternatives: 'Consider using different expressions',
          practice: 'Practice making questions'
        };
      }
    } catch (error) {
      logger.error('Error generating feedback', { 
        userId,
        error: error.message,
        statusCode: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data
      });
      throw new Error('Failed to generate feedback');
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