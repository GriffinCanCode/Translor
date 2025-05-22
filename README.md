# Translor - Language Learning App

Translor is a language learning application built with Electron that helps users practice conversations in their target language using AI-powered interactions.

## Features

- Conversational practice with AI language tutors
- Speech-to-text for voice input
- Text-to-speech for pronunciation examples
- Intelligent feedback on language usage
- Progress tracking with XP and streaks

## New: ChatGPT Integration

Translor now features integration with OpenAI's GPT-4 Turbo for more natural and intelligent conversations. The AI adapts to your language proficiency level and provides contextually relevant responses.

### Setup

To use the ChatGPT integration, you need to:

1. Create a `.env` file in the root directory with the following variables:

```
# OpenAI API Configuration
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Environment Config
NODE_ENV=development

# Text-to-Speech Configuration
REACT_APP_TTS_PROVIDER=elevenlabs
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Speech-to-Text Configuration
REACT_APP_STT_PROVIDER=whisper
```

2. Get an API key from [OpenAI](https://platform.openai.com/account/api-keys)
3. (Optional) Get an API key from [ElevenLabs](https://elevenlabs.io/) for high-quality text-to-speech

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/translor.git
cd translor

# Install dependencies
npm install

# Start the development server
npm run dev
```

## How the ChatGPT Integration Works

### Components

1. **ChatGPTService**: Handles communication with the OpenAI API, manages conversation history, and provides feedback on user language.

2. **Conversation Component**: Main interface for user interactions, handling both text and voice inputs, displaying AI responses with translations.

3. **TranslationService**: Provides translation, text-to-speech, and speech-to-text capabilities with fallbacks to browser APIs.

### User Experience Flow

1. User speaks or types in their native language
2. Input is translated to the target language
3. ChatGPT generates a contextually appropriate response in the target language
4. Response is spoken aloud and displayed with a translation to the user's native language
5. AI provides feedback on grammar, vocabulary, and suggestions for improvement

### Conversation Memory

The application maintains conversation history to provide context for natural dialogue. This allows the AI to:

- Reference previous exchanges
- Maintain topic continuity
- Adapt to the user's language level
- Provide personalized feedback

## License

[MIT](https://opensource.org/licenses/MIT)

## Key Features

- **Real-time Conversational Translation**: Speak or type in your native language, and the app translates to the target language in real-time.
- **Interactive Learning**: Get grammar explanations, vocabulary suggestions, and pronunciation feedback integrated into conversations.
- **Gamification System**: Earn XP, track streaks, unlock achievements, and progress through levels to make learning fun.
- **Structured Lessons**: Learn through organized chapters and lessons focusing on different themes and concepts.

## Technologies

- **Electron**: Cross-platform desktop app framework
- **React**: UI library for building the interface
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Firebase**: Cloud database for user data and synchronization (optional)
- **Translation APIs**: Integration with services like Google Cloud Translation, Speech-to-Text, and Text-to-Speech

## Project Structure

```
translor/
├── assets/                 # Static assets (icons, images)
├── translor/
│   ├── src/                # Frontend source code
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── styles/         # CSS styles
│   │   ├── utils/          # Utility functions
│   │   └── lessons/        # Lesson content
├── main.js                 # Electron main process
├── preload.js              # Electron preload script
└── package.json
```

## Acknowledgments

- This project was inspired by language learning apps like Duolingo and is built for educational purposes. 