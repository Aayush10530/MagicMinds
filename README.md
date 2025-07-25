# 🧞‍♂️ Genie Voice Tutor - Real-Time AI Learning Companion

A magical, interactive AI voice tutor designed specifically for children, featuring real-time voice interaction, engaging roleplay scenarios, and multilingual support.

![Genie Voice Tutor](src/assets/genie-mascot.png)

## ✨ Features

### 🗣️ Free-Flow AI Chatbot
- **Voice Input**: Children can speak naturally to Genie
- **Smart Responses**: AI-powered, age-appropriate answers using GPT
- **Voice Output**: Text-to-Speech in multiple languages
- **Interactive UI**: Animated mascot, emoji feedback, and encouraging tips

### 🎭 Interactive Roleplay Adventures
- **Real-Life Scenarios**: Practice conversations for school, store, and home
- **Guided Learning**: Step-by-step conversation practice
- **Progress Tracking**: Visual progress bars and completion rewards
- **Scenario Variety**: Multiple themed environments with unique backgrounds

### 🌍 Multilingual Support
- **5 Languages**: English, Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), Tamil (தமிழ்)
- **Native TTS**: Speak responses in the child's preferred language
- **Cultural Sensitivity**: Age-appropriate content for diverse backgrounds

### 🎯 Child-Safe Features
- **Content Moderation**: AI responses filtered for child safety
- **Encouraging Interface**: Positive reinforcement and emoji reactions
- **Progress Rewards**: Badges, streaks, and achievement system
- **Parental Oversight**: Session history and progress tracking

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom child-friendly design system
- **Shadcn/UI** components with magical customizations
- **Web Audio API** for voice recording

### AI & Voice
- **OpenAI Whisper** for speech-to-text
- **GPT-4** for conversational AI
- **Web Speech API** for text-to-speech
- **ElevenLabs** integration ready for premium TTS

### Design Features
- **Gradient Backgrounds** with floating animations
- **Interactive Animations** using CSS transforms and keyframes
- **Responsive Design** for all device sizes
- **Accessibility First** with large buttons and clear typography

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Modern web browser with microphone support
- Optional: API keys for OpenAI, ElevenLabs

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd genie-voice-tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup (Optional)**
   ```bash
   # Create .env.local file
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 🎮 How to Use

### For Children:
1. **Choose Your Adventure**: Select between Free Chat or Roleplay mode
2. **Meet Genie**: Your magical AI tutor will greet you
3. **Start Speaking**: Click the microphone and talk naturally
4. **Learn & Play**: Complete conversations and earn badges
5. **Switch Languages**: Choose your preferred language for responses

### For Parents/Educators:
- Monitor progress through the built-in tracker
- Review conversation history
- Adjust language preferences
- Track learning milestones and achievements

## 🧪 Development Features

### Interactive Components
- `GenieAvatar`: Animated mascot with mood states
- `VoiceChat`: Real-time voice interaction system
- `RoleplayScenarios`: Guided conversation practice
- `LanguageSelector`: Multi-language switching
- `ProgressTracker`: Achievement and progress system
- `EmojiReactions`: Child-friendly feedback system

### Design System
- **Color Palette**: Purple, pink, blue gradients optimized for children
- **Typography**: Large, readable fonts with playful styling
- **Animations**: Bounce, float, glow effects for engagement
- **Responsive**: Mobile-first design with touch-friendly controls

### Safety Features
- Content filtering before AI responses
- Microphone permission handling
- Error handling with child-friendly messages
- No personal data storage beyond session

## 🔧 Customization

### Adding New Roleplay Scenarios
```typescript
// In src/components/RoleplayScenarios.tsx
const newScenario = {
  id: 'library',
  title: 'At the Library',
  icon: <Book className="w-8 h-8" />,
  description: 'Learn to find books and talk to librarians!',
  background: 'from-green-400 to-teal-600',
  steps: [
    {
      id: '1',
      aiPrompt: "Welcome to the library! What book are you looking for?",
      tips: "Tell the librarian what type of book you want to read!"
    }
  ]
};
```

### Adding New Languages
```typescript
// In src/components/LanguageSelector.tsx
{ code: 'fr' as Language, name: 'Français', flag: '🇫🇷', color: 'from-blue-400 to-red-500' }
```

### Customizing AI Responses
The system uses prompt engineering to ensure child-appropriate responses:
- Simple vocabulary
- Encouraging tone
- Educational focus
- Cultural sensitivity

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support with Web Audio API
- **Firefox**: Full support
- **Safari**: Supported with some TTS limitations
- **Mobile**: Responsive design for tablets and phones

## 🤝 Contributing

We welcome contributions to make Genie even more magical for children!

### Areas for Enhancement:
- Additional roleplay scenarios
- More language support
- Advanced speech recognition
- Educational content expansion
- Accessibility improvements

### Development Guidelines:
1. Maintain child-safe design principles
2. Test with various age groups
3. Ensure accessibility compliance
4. Follow existing code patterns
5. Add comprehensive error handling

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT and Whisper APIs
- ElevenLabs for high-quality text-to-speech
- Shadcn/UI for beautiful component library
- The open-source community for inspiration

## 📞 Support

For issues, questions, or feature requests:
- Create an issue in this repository
- Follow our development guidelines
- Check existing documentation

---

**Made with ❤️ for young learners everywhere** 🌟

Transform learning into a magical adventure with Genie! ✨