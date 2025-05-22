import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useChatGPT } from '../../contexts/ChatGPTContext';
import useLogger from '../../utils/useLogger';

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

// Track if initialization has happened to prevent loops
let hasInitialized = false;

const Conversation = () => {
  const { targetLanguage, nativeLanguage, addXp, userId, proficiencyLevel } = useUser();
  const { translateText, textToSpeech, startRecording, stopRecording, speechToText, isRecording: translationIsRecording } = useTranslation();
  const { getResponse, generateFeedback, clearConversation } = useChatGPT();
  const logger = useLogger({ component: 'Conversation', userId });
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const initializationRef = useRef(false);

  // Log component initialization
  useEffect(() => {
    logger.info('Conversation component initialized', { 
      targetLanguage, 
      nativeLanguage, 
      proficiencyLevel 
    });
    
    // Reset audio streams counter when component mounts
    if (window.electronAPI) {
      window.electronAPI.resetAudioStreams();
    }
    
    return () => {
      logger.debug('Conversation component unmounting, cleaning up resources');
      
      // Notify main process about component unmounting for cleanup
      if (window.electronAPI) {
        window.electronAPI.componentUnmounting('Conversation');
      }
      
      // Release any audio resources
      if (audioRef.current?.src) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = '';
      }
      
      // Stop any speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Clear conversation history
      logger.debug('Clearing conversation history');
      clearConversation(userId);
    };
  }, [logger, targetLanguage, nativeLanguage, proficiencyLevel, userId, clearConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle audio playback state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onplay = () => {
        setIsAudioPlaying(true);
        logger.debug('Audio playback started');
      };
      audioRef.current.onended = () => {
        setIsAudioPlaying(false);
        logger.debug('Audio playback ended');
        
        // Release audio stream when done
        if (window.electronAPI) {
          window.electronAPI.releaseAudioStream();
        }
      };
      audioRef.current.onpause = () => {
        setIsAudioPlaying(false);
        logger.debug('Audio playback paused');
      };
      audioRef.current.onerror = () => {
        setIsAudioPlaying(false);
        logger.debug('Audio playback error');
        
        // Release audio stream on error
        if (window.electronAPI) {
          window.electronAPI.releaseAudioStream();
        }
      };
    }
    
    // Set up cleanup listener
    let cleanupListener;
    if (window.electronAPI) {
      cleanupListener = window.electronAPI.onCleanupAudioStreams(() => {
        logger.debug('Received audio cleanup request');
        if (audioRef.current) {
          audioRef.current.pause();
          if (audioRef.current.src) {
            URL.revokeObjectURL(audioRef.current.src);
            audioRef.current.src = '';
          }
        }
        setIsAudioPlaying(false);
      });
    }
    
    // Cleanup function
    return () => {
      if (cleanupListener) {
        cleanupListener();
      }
    };
  }, [audioRef, logger]);

  // Handle initial greeting when component mounts
  useEffect(() => {
    // Use initialization ref to prevent multiple greetings on re-render
    if (initializationRef.current) {
      return;
    }
    
    initializationRef.current = true;
    
    const greetUser = async () => {
      logger.info('Starting initial greeting');
      try {
        setIsProcessing(true);
        
        // Get AI greeting in target language
        logger.debug('Requesting AI greeting', { targetLanguage });
        const greeting = await getResponse(
          userId, 
          targetLanguage, 
          "Initial greeting", 
          proficiencyLevel
        );
        
        // Translate greeting to native language for reference
        logger.debug('Translating AI greeting', { 
          from: targetLanguage, 
          to: nativeLanguage 
        });
        const translation = await translateText(
          greeting, 
          nativeLanguage, 
          targetLanguage
        );
        
        // Add greeting to messages
        logger.debug('Adding greeting to conversation', { greeting });
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
        logger.error('Error greeting user', { error: error.message });
        
        // Fallback to simple greeting if API fails
        logger.debug('Using fallback greeting');
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
  }, [userId, targetLanguage, nativeLanguage, proficiencyLevel, logger, getResponse, translateText]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add message to chat
  const addMessage = (message) => {
    logger.debug('Adding message to conversation', { 
      sender: message.sender, 
      language: message.language,
      messageId: message.id
    });
    setMessages(prevMessages => [...prevMessages, message]);
  };

  // Handle text input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim() || isProcessing) return;
    
    try {
      logger.info('Processing user text input', { 
        inputLength: inputText.length 
      });
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
      logger.debug('Translating user message', { 
        from: nativeLanguage, 
        to: targetLanguage 
      });
      const translation = await translateText(
        inputText, 
        targetLanguage,
        nativeLanguage
      );
      
      // AI response based on translated input
      await processAIResponse(translation.translatedText);
      
      // Award XP for conversation interaction
      logger.debug('Awarding XP for conversation', { xpAmount: 5 });
      addXp(5);
    } catch (error) {
      logger.error('Error processing message', { error: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Process and generate AI response
  const processAIResponse = async (translatedUserInput) => {
    logger.info('Processing AI response', { 
      inputLength: translatedUserInput.length
    });
    
    try {
      // Get AI response from ChatGPT
      logger.debug('Requesting AI response');
      const aiResponseText = await getResponse(
        userId,
        targetLanguage,
        translatedUserInput,
        proficiencyLevel
      );
      
      // Translate AI response to native language for reference
      logger.debug('Translating AI response', { 
        from: targetLanguage, 
        to: nativeLanguage 
      });
      const translation = await translateText(
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
      logger.debug('Generating learning feedback');
      const feedback = await generateFeedback(
        userId, 
        translatedUserInput, 
        targetLanguage
      );
      
      setFeedbackData(feedback);
      
      // Speak AI response
      speakText(aiResponseText, targetLanguage);
    } catch (error) {
      logger.error('Error generating AI response', { error: error.message });
      
      // Fallback to mock response if API fails
      logger.debug('Using fallback AI response');
      const fallbackResponse = mockAIResponse(translatedUserInput, targetLanguage);
      
      // Add fallback message
      const fallbackMessage = {
        id: generateUniqueId(),
        text: fallbackResponse,
        sender: 'ai',
        language: targetLanguage
      };
      
      addMessage(fallbackMessage);
      
      // Generate basic feedback
      const basicFeedback = generateFeedback(translatedUserInput, fallbackResponse);
      setFeedbackData(basicFeedback);
      
      // Speak fallback response
      speakText(fallbackResponse, targetLanguage);
    }
  };

  // Handle voice input for speaking practice
  const handleVoiceInput = async () => {
    if (isProcessing) return;
    
    if (!isRecording) {
      // Start recording
      logger.info('Starting voice recording');
      setIsRecording(true);
      
      try {
        await startRecording();
      } catch (error) {
        logger.error('Failed to start recording', { error: error.message });
        setIsRecording(false);
      }
    } else {
      // Stop recording and process audio
      logger.info('Stopping voice recording');
      setIsRecording(false);
      setIsProcessing(true);
      
      try {
        // Get recording data
        const recordingResult = await stopRecording();
        
        if (!recordingResult.success) {
          throw new Error('Recording failed');
        }
        
        logger.debug('Audio recording stopped', { 
          blobSize: recordingResult.audioBlob.size
        });
        
        // Convert speech to text
        logger.debug('Converting speech to text', { sourceLanguage: nativeLanguage });
        const speechResult = await speechToText(
          recordingResult.audioBlob,
          nativeLanguage
        );
        
        if (!speechResult.success) {
          throw new Error('Speech recognition failed');
        }
        
        // Add user speech message
        const userMessage = {
          id: generateUniqueId(),
          text: speechResult.text,
          sender: 'user',
          language: nativeLanguage,
          audioUrl: recordingResult.audioUrl
        };
        
        logger.debug('Adding speech message to conversation', { 
          text: speechResult.text
        });
        addMessage(userMessage);
        
        // Translate speech to target language
        logger.debug('Translating user speech', {
          from: nativeLanguage,
          to: targetLanguage
        });
        const translation = await translateText(
          speechResult.text,
          targetLanguage,
          nativeLanguage
        );
        
        // Process AI response
        await processAIResponse(translation.translatedText);
        
        // Award XP for voice practice
        logger.debug('Awarding XP for voice practice', { xpAmount: 10 });
        addXp(10); // More XP for voice practice
      } catch (error) {
        logger.error('Error processing voice input', { error: error.message });
        
        // Add error message if needed
        // addMessage({
        //   id: generateUniqueId(),
        //   text: "Sorry, I couldn't understand that. Please try again.",
        //   sender: 'system',
        //   language: nativeLanguage
        // });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Text to speech function
  const speakText = async (text, language) => {
    logger.info('Converting text to speech', { 
      language, 
      textLength: text.length
    });
    
    try {
      if (audioRef.current?.src) {
        // Stop any currently playing audio
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = '';
        
        // Release the previous audio stream
        if (window.electronAPI) {
          window.electronAPI.releaseAudioStream();
        }
      }
      
      // Get TTS audio
      const ttsResult = await textToSpeech(text, language);
      
      if (!ttsResult.success) {
        logger.warn('Text-to-speech failed', { error: ttsResult.error });
        return;
      }
      
      logger.debug('Speech audio generated', { provider: ttsResult.provider });
      
      // In development mode with simplified browser TTS, we may not have an audioUrl
      if (!ttsResult.audioUrl) {
        logger.debug('No audio URL returned, using native speech synthesis only');
        return;
      }
      
      // Update audio element
      audioRef.current.src = ttsResult.audioUrl;
      audioRef.current.play().catch(error => {
        logger.error('Error playing audio', { error: error.message });
        
        // Release the audio stream on playback error
        if (window.electronAPI) {
          window.electronAPI.releaseAudioStream();
        }
      });
    } catch (error) {
      logger.error('Error in text-to-speech', { error: error.message });
      
      // Ensure we release the audio stream on error
      if (window.electronAPI) {
        window.electronAPI.releaseAudioStream();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          {messages.map(message => (
            <ChatMessage 
              key={message.id}
              message={message}
              onPlayAudio={() => speakText(message.text, message.language)}
              isAudioPlaying={isAudioPlaying}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {feedbackData && (
        <Feedback 
          feedbackData={feedbackData} 
          onClose={() => setFeedbackData(null)}
        />
      )}
      
      <ControlPanel 
        inputText={inputText}
        setInputText={setInputText}
        handleSubmit={handleSubmit}
        isRecording={isRecording}
        toggleRecording={handleVoiceInput}
        isProcessing={isProcessing}
      />
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

function getRandomGreeting(language) {
  const greetings = {
    'en': ['Hello! How can I help you today?', 'Hi there! Ready to practice?'],
    'es': ['¡Hola! ¿Cómo puedo ayudarte hoy?', '¡Hola! ¿Listo para practicar?'],
    'fr': ['Bonjour! Comment puis-je vous aider aujourd\'hui?', 'Salut! Prêt à pratiquer?'],
    'de': ['Hallo! Wie kann ich Ihnen heute helfen?', 'Hallo! Bereit zu üben?']
  };
  
  const languageGreetings = greetings[language] || greetings.en;
  const randomIndex = Math.floor(Math.random() * languageGreetings.length);
  
  return languageGreetings[randomIndex];
}

function mockAIResponse(translatedUserInput, language) {
  const responses = {
    'en': [
      'I understand. Could you tell me more about that?',
      'That\'s interesting! Let\'s continue practicing.',
      'Great job expressing that! How do you feel about it?'
    ],
    'es': [
      'Entiendo. ¿Podrías contarme más sobre eso?',
      '¡Eso es interesante! Sigamos practicando.',
      '¡Buen trabajo expresando eso! ¿Cómo te sientes al respecto?'
    ],
    'fr': [
      'Je comprends. Pourriez-vous m\'en dire plus?',
      'C\'est intéressant! Continuons à pratiquer.',
      'Bon travail pour exprimer cela! Comment vous sentez-vous à ce sujet?'
    ],
    'de': [
      'Ich verstehe. Könnten Sie mir mehr darüber erzählen?',
      'Das ist interessant! Lass uns weiter üben.',
      'Gute Arbeit, das auszudrücken! Wie fühlst du dich dabei?'
    ]
  };
  
  const languageResponses = responses[language] || responses.en;
  const randomIndex = Math.floor(Math.random() * languageResponses.length);
  
  return languageResponses[randomIndex];
}

function generateFeedback(userInput, aiResponse) {
  return {
    title: 'Learning Tip',
    grammar: 'Watch your sentence structure and verb conjugation.',
    vocabulary: 'Try expanding your vocabulary with more specific terms.',
    alternatives: 'Consider using different phrases for variation.',
    practice: 'Keep practicing with more complex sentences and topics.'
  };
}

export default Conversation; 