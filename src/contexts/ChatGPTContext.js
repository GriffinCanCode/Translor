import React, { createContext, useContext } from 'react';
import ChatGPTService from '../services/ChatGPTService';
import { logger } from '../utils/logger';

// Create context
const ChatGPTContext = createContext();

// Custom hook for using the context
export const useChatGPT = () => useContext(ChatGPTContext);

export const ChatGPTProvider = ({ children }) => {
  /**
   * Initialize or retrieve a conversation history for a user
   * @param {string} userId - Unique identifier for the user
   * @returns {Array} - The conversation history
   */
  const initializeConversation = (userId) => {
    return ChatGPTService.initializeConversation(userId);
  };

  /**
   * Add a message to the conversation history
   * @param {string} userId - User identifier
   * @param {string} role - 'user', 'assistant', or 'system'
   * @param {string} content - Message content
   */
  const addMessage = (userId, role, content) => {
    ChatGPTService.addMessage(userId, role, content);
  };

  /**
   * Get a response from ChatGPT based on conversation history
   * @param {string} userId - User identifier
   * @param {string} targetLanguage - Language code for the response
   * @param {string} userMessage - The latest user message
   * @param {string} userLevel - Language proficiency level (beginner, intermediate, advanced)
   * @returns {Promise<string>} - ChatGPT response
   */
  const getResponse = async (userId, targetLanguage, userMessage, userLevel = 'beginner') => {
    try {
      const response = await ChatGPTService.getResponse(userId, targetLanguage, userMessage, userLevel);
      logger.debug('ChatGPT response received', { 
        userId, 
        targetLanguage, 
        responseLength: response.length 
      });
      return response;
    } catch (error) {
      logger.error('Error getting ChatGPT response', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  };

  /**
   * Generate language learning feedback for the user
   * @param {string} userId - User identifier
   * @param {string} userInput - Original user input
   * @param {string} targetLanguage - Target language
   * @returns {Promise<Object>} - Structured feedback
   */
  const generateFeedback = async (userId, userInput, targetLanguage) => {
    try {
      return await ChatGPTService.generateFeedback(userId, userInput, targetLanguage);
    } catch (error) {
      logger.error('Error generating feedback', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  };

  /**
   * Clear conversation history for a user
   * @param {string} userId - User identifier
   */
  const clearConversation = (userId) => {
    ChatGPTService.clearConversation(userId);
  };

  const value = {
    initializeConversation,
    addMessage,
    getResponse,
    generateFeedback,
    clearConversation
  };

  return (
    <ChatGPTContext.Provider value={value}>
      {children}
    </ChatGPTContext.Provider>
  );
};

export default ChatGPTProvider; 