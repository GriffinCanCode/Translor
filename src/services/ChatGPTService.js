import axios from 'axios';

/**
 * Service for interacting with OpenAI's GPT models
 */
class ChatGPTService {
  constructor() {
    this.apiKey = window.env?.REACT_APP_OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.conversationHistory = new Map(); // Store conversation history by user
  }

  /**
   * Initialize or retrieve a conversation history for a user
   * @param {string} userId - Unique identifier for the user
   * @returns {Array} - The conversation history
   */
  initializeConversation(userId) {
    if (!this.conversationHistory.has(userId)) {
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
    try {
      // Get conversation history
      const history = this.initializeConversation(userId);

      // Add system message for context if it's a new conversation
      if (history.length === 0) {
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
      
      // Add assistant response to history
      this.addMessage(userId, 'assistant', responseText);
      
      return responseText;
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
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
      
      // Parse JSON response
      try {
        return JSON.parse(feedbackText);
      } catch (parseError) {
        console.error('Error parsing feedback JSON:', parseError);
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
      console.error('Error generating feedback:', error);
      throw new Error('Failed to generate feedback');
    }
  }

  /**
   * Clear conversation history for a user
   * @param {string} userId - User identifier
   */
  clearConversation(userId) {
    this.conversationHistory.delete(userId);
  }
}

export default new ChatGPTService(); 