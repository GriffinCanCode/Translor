# Translor

Translor is a desktop application built with Electron and React that provides real-time conversational translation and language learning tools with gamification elements.

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

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/translor.git
   cd translor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Building for Production

To build the app for production:

```
npm run build
```

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

## License

MIT

## Acknowledgments

- This project was inspired by language learning apps like Duolingo and is built for educational purposes. 