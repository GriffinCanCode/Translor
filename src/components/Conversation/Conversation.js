import React, { useState, useEffect, useRef } from 'react';

import { useUser } from '../../contexts/UserContext';
import TranslationService from '../../services/TranslationService';
import ChatGPTService from '../../services/ChatGPTService';

// Import components
import ChatMessage from './ChatMessage';
import ControlPanel from './ControlPanel';
import Feedback from './Feedback';

// For generating unique message IDs
let messageIdCounter = 0;
const generateUniqueId = () => {
  messageIdCounter += 1;
  return `${Date.now()}-${messageIdCounter}`;
};

const Conversation = () => {
  const { targetLanguage, nativeLanguage, addXp, userId, proficiencyLevel } = useUser();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle audio playback state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onplay = () => setIsAudioPlaying(true);
      audioRef.current.onended = () => setIsAudioPlaying(false);
      audioRef.current.onpause = () => setIsAudioPlaying(false);
    }
  }, [audioRef]);

  // Handle initial greeting when component mounts
  useEffect(() => {
    const greetUser = async () => {
      try {
        setIsProcessing(true);
        
        // Get AI greeting in target language
        const greeting = await ChatGPTService.getResponse(
          userId, 
          targetLanguage, 
          "Initial greeting", 
          proficiencyLevel
        );
        
        // Translate greeting to native language for reference
        const translation = await TranslationService.translateText(
          greeting, 
          nativeLanguage, 
          targetLanguage
        );
        
        // Add greeting to messages
        addMessage({
          id: generateUniqueId(),
          text: greeting,
          translation: translation.translatedText,
          sender: 'ai',
          language: targetLanguage
        });
        
        // Speak greeting
        speakText(greeting, targetLanguage);
      } catch (error) {
        console.error('Error greeting user:', error);
        
        // Fallback to simple greeting if API fails
        const fallbackGreeting = getRandomGreeting(targetLanguage);
        addMessage({
          id: generateUniqueId(),
          text: fallbackGreeting,
          sender: 'ai',
          language: targetLanguage
        });
        
        speakText(fallbackGreeting, targetLanguage);
      } finally {
        setIsProcessing(false);
      }
    };
    
    greetUser();
    
    // Clean up conversation history when component unmounts
    return () => {
      ChatGPTService.clearConversation(userId);
    };
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add message to chat
  const addMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  // Handle text input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message
      const userMessage = {
        id: generateUniqueId(),
        text: inputText,
        sender: 'user',
        language: nativeLanguage
      };
      
      addMessage(userMessage);
      setInputText('');
      
      // Translate user message to target language
      const translation = await TranslationService.translateText(
        inputText, 
        targetLanguage,
        nativeLanguage
      );
      
      // AI response based on translated input
      await processAIResponse(translation.translatedText);
      
      // Award XP for conversation interaction
      addXp(5);
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process and generate AI response
  const processAIResponse = async (translatedUserInput) => {
    try {
      // Get AI response from ChatGPT
      const aiResponseText = await ChatGPTService.getResponse(
        userId,
        targetLanguage,
        translatedUserInput,
        proficiencyLevel
      );
      
      // Translate AI response to native language for reference
      const translation = await TranslationService.translateText(
        aiResponseText, 
        nativeLanguage, 
        targetLanguage
      );
      
      // Add AI message to chat
      const aiMessage = {
        id: generateUniqueId(),
        text: aiResponseText,
        translation: translation.translatedText,
        sender: 'ai',
        language: targetLanguage
      };
      
      addMessage(aiMessage);
      
      // Generate learning feedback based on conversation
      const feedback = await ChatGPTService.generateFeedback(
        userId, 
        translatedUserInput, 
        targetLanguage
      );
      
      setFeedbackData(feedback);
      
      // Speak AI response
      speakText(aiResponseText, targetLanguage);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback to mock response if API fails
      const fallbackResponse = mockAIResponse(translatedUserInput, targetLanguage);
      
      // Add fallback message
      const fallbackMessage = {
        id: generateUniqueId(),
        text: fallbackResponse,
        sender: 'ai',
        language: targetLanguage
      };
      
      addMessage(fallbackMessage);
      
      // Use mock feedback
      setFeedbackData(generateFeedback(translatedUserInput, fallbackResponse));
      
      // Speak fallback response
      speakText(fallbackResponse, targetLanguage);
    }
  };

  // Handle voice input
  const handleVoiceInput = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        setIsProcessing(true);
        
        // Stop recording and get audio data
        const audioData = await TranslationService.stopRecording();
        
        // Convert speech to text
        const result = await TranslationService.speechToText(audioData, nativeLanguage);
        
        if (result.success && result.text) {
          // Automatically submit the voice input
          const userMessage = {
            id: generateUniqueId(),
            text: result.text,
            sender: 'user',
            language: nativeLanguage
          };
          
          addMessage(userMessage);
          
          // Translate user message to target language
          const translation = await TranslationService.translateText(
            result.text, 
            targetLanguage,
            nativeLanguage
          );
          
          // Process AI response
          await processAIResponse(translation.translatedText);
          
          // Award XP for voice interaction (extra points for speaking)
          addXp(8);
        }
      } else {
        setIsRecording(true);
        await TranslationService.startRecording();
      }
    } catch (error) {
      console.error('Voice input error:', error);
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play text-to-speech audio
  const speakText = async (text, language) => {
    try {
      // Don't interrupt currently playing audio
      if (isAudioPlaying) {
        audioRef.current.pause();
      }
      
      const result = await TranslationService.textToSpeech(text, language);
      
      if (result.success && result.audioUrl) {
        if (audioRef.current) {
          audioRef.current.src = result.audioUrl;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(message => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onPlay={() => speakText(message.text, message.language)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {feedbackData && (
        <Feedback 
          data={feedbackData} 
          onClose={() => setFeedbackData(null)} 
        />
      )}
      
      <ControlPanel 
        inputText={inputText}
        setInputText={setInputText}
        handleSubmit={handleSubmit}
        handleVoiceInput={handleVoiceInput}
        isRecording={isRecording}
        isProcessing={isProcessing}
      />
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

// Helper function for random greeting (fallback if API fails)
function getRandomGreeting(language) {
  const greetings = {
    'es': ['¡Hola! ¿Cómo estás?', '¡Buenos días!', '¡Bienvenido!'],
    'fr': ['Bonjour! Comment allez-vous?', 'Salut!', 'Bienvenue!'],
    'de': ['Hallo! Wie geht es dir?', 'Guten Tag!', 'Willkommen!'],
    'it': ['Ciao! Come stai?', 'Buongiorno!', 'Benvenuto!'],
    'pt': ['Olá! Como vai?', 'Bom dia!', 'Bem-vindo!'],
    'en': ['Hello! How are you?', 'Good day!', 'Welcome!']
  };
  
  const defaultGreetings = ['Hello! How are you?', 'Welcome!'];
  const languageGreetings = greetings[language] || defaultGreetings;
  
  return languageGreetings[Math.floor(Math.random() * languageGreetings.length)];
}

// Mock AI response function (fallback if API fails)
function mockAIResponse(translatedUserInput, language) {
  const responses = {
    'es': [
      '¡Qué interesante! Cuéntame más.',
      'Entiendo. ¿Y qué piensas sobre eso?',
      'Muy bien. ¿Qué más puedo hacer por ti?',
      '¡Excelente! Sigamos practicando.',
    ],
    'fr': [
      'C\'est intéressant! Dites-m\'en plus.',
      'Je comprends. Et que pensez-vous de cela?',
      'Très bien. Que puis-je faire d\'autre pour vous?',
      'Excellent! Continuons à pratiquer.',
    ],
    'de': [
      'Wie interessant! Erzählen Sie mir mehr.',
      'Ich verstehe. Und was denken Sie darüber?',
      'Sehr gut. Was kann ich noch für Sie tun?',
      'Ausgezeichnet! Lass uns weiter üben.',
    ],
    'en': [
      'How interesting! Tell me more.',
      'I understand. And what do you think about that?',
      'Very good. What else can I do for you?',
      'Excellent! Let\'s keep practicing.',
    ]
  };
  
  const defaultResponses = responses.en;
  const languageResponses = responses[language] || defaultResponses;
  
  return languageResponses[Math.floor(Math.random() * languageResponses.length)];
}

// Generate feedback based on user input and AI response (fallback if API fails)
function generateFeedback(userInput, aiResponse) {
  // Fallback feedback if ChatGPT feedback generation fails
  return {
    title: 'Learning Tip',
    grammar: 'Remember to use the correct verb conjugation.',
    vocabulary: 'You might also want to use "interesante" (interesting) in your responses.',
    alternatives: 'Instead of "Sí", try using "Efectivamente" or "Por supuesto" for variety.',
    practice: 'Try asking a question in your next response.'
  };
}

export default Conversation; 