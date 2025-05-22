import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import TranslationService from '../../services/TranslationService';

// Import components
import ChatMessage from './ChatMessage';
import ControlPanel from './ControlPanel';
import Feedback from './Feedback';

const Conversation = () => {
  const { targetLanguage, nativeLanguage, addXp } = useUser();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial greeting when component mounts
  useEffect(() => {
    const greetUser = async () => {
      try {
        setIsProcessing(true);
        
        // AI greeting in target language
        const greeting = getRandomGreeting(targetLanguage);
        
        // Translate greeting to native language for reference
        const translation = await TranslationService.translateText(
          greeting, 
          nativeLanguage, 
          targetLanguage
        );
        
        // Add greeting to messages
        addMessage({
          id: Date.now(),
          text: greeting,
          translation: translation.translatedText,
          sender: 'ai',
          language: targetLanguage
        });
        
        // Speak greeting
        speakText(greeting, targetLanguage);
      } catch (error) {
        console.error('Error greeting user:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    greetUser();
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
        id: Date.now(),
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
      // In a real app, this would call an API to get the AI response
      // For now, we'll use a simple mock response
      const aiResponseText = mockAIResponse(translatedUserInput, targetLanguage);
      
      // Translate AI response to native language for reference
      const translation = await TranslationService.translateText(
        aiResponseText, 
        nativeLanguage, 
        targetLanguage
      );
      
      // Add AI message to chat
      const aiMessage = {
        id: Date.now(),
        text: aiResponseText,
        translation: translation.translatedText,
        sender: 'ai',
        language: targetLanguage
      };
      
      addMessage(aiMessage);
      
      // Generate learning feedback based on conversation
      const feedback = generateFeedback(translatedUserInput, aiResponseText);
      setFeedbackData(feedback);
      
      // Speak AI response
      speakText(aiResponseText, targetLanguage);
    } catch (error) {
      console.error('Error generating AI response:', error);
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
          setInputText(result.text);
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

// Helper function for random greeting
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

// Mock AI response function (would be replaced with actual API call)
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

// Generate feedback based on user input and AI response
function generateFeedback(userInput, aiResponse) {
  // In a real app, this would use AI to generate meaningful feedback
  return {
    title: 'Learning Tip',
    grammar: 'Remember to use the correct verb conjugation.',
    vocabulary: 'You might also want to use "interesante" (interesting) in your responses.',
    alternatives: 'Instead of "Sí", try using "Efectivamente" or "Por supuesto" for variety.',
    practice: 'Try asking a question in your next response.'
  };
}

export default Conversation; 