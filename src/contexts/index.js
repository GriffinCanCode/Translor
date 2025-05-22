import React from 'react';
import { UserProvider } from './UserContext';
import { LessonProvider } from './LessonContext';
import { TranslationProvider } from './TranslationContext';
import { BrowserSpeechProvider } from './BrowserSpeechContext';
import { ChatGPTProvider } from './ChatGPTContext';
import { ElevenLabsProvider } from './ElevenLabsContext';
import { TranslationAPIProvider } from './TranslationAPIContext';
import { WhisperProvider } from './WhisperContext';

// Export individual providers
export { 
  UserProvider,
  LessonProvider,
  TranslationProvider,
  BrowserSpeechProvider,
  ChatGPTProvider,
  ElevenLabsProvider,
  TranslationAPIProvider,
  WhisperProvider
};

// Export custom hooks
export { useUser } from './UserContext';
export { useLesson } from './LessonContext';
export { useTranslation } from './TranslationContext';
export { useBrowserSpeech } from './BrowserSpeechContext';
export { useChatGPT } from './ChatGPTContext';
export { useElevenLabs } from './ElevenLabsContext';
export { useTranslationAPI } from './TranslationAPIContext';
export { useWhisper } from './WhisperContext';

/**
 * Combined provider that wraps all context providers
 * This helps to avoid provider nesting in the app component
 */
export const AppProviders = ({ children }) => {
  return (
    <UserProvider>
      <LessonProvider>
        <BrowserSpeechProvider>
          <ElevenLabsProvider>
            <WhisperProvider>
              <TranslationAPIProvider>
                <ChatGPTProvider>
                  <TranslationProvider>
                    {children}
                  </TranslationProvider>
                </ChatGPTProvider>
              </TranslationAPIProvider>
            </WhisperProvider>
          </ElevenLabsProvider>
        </BrowserSpeechProvider>
      </LessonProvider>
    </UserProvider>
  );
};

export default AppProviders; 