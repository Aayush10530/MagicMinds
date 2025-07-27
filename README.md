# Magic Minds - AI Voice Tutor for Children

Magic Minds is an interactive AI voice tutor platform designed to help children learn through natural conversation and roleplay scenarios. The platform features two main modes:

## 🌟 Features

### 1️⃣ Free-flow AI Chatbot (Voice-based tutor)
- Voice-activated AI tutor that listens to children's questions
- Processes speech using OpenAI Whisper for accurate transcription
- Generates age-appropriate responses using GPT
- Speaks back using ElevenLabs or Google TTS for natural voice interaction

### 2️⃣ Interactive Roleplay (Scenario-based learning)
- Guided conversation scenarios to build confidence and vocabulary
- Real-life situations like school, store, and home interactions
- Progressive difficulty levels to match learning progress
- Immediate feedback and encouragement

## 🚀 Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development
- TailwindCSS for styling
- Radix UI components
- Web Speech API for browser-based speech capabilities

### Backend
- Node.js with Express
- OpenAI API integration (Whisper for STT, GPT for responses)
- ElevenLabs API for high-quality TTS
- Socket.io for real-time communication

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- API keys for OpenAI, ElevenLabs, and Google (optional)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env` and add your API keys:
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `ELEVENLABS_API_KEY` - Your ElevenLabs API key
     - `GOOGLE_API_KEY` - Your Google API key (optional fallback)

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env.local` file with:
     ```
     VITE_API_URL=http://localhost:3000
     ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## 📱 Usage

### Voice Chat Mode
1. Click on the "Chat with David" option on the home screen
2. Press the microphone button and speak your question
3. Wait for David to process and respond with voice and text

### Roleplay Mode
1. Select "Practice Roleplay" on the home screen
2. Choose a scenario (School, Store, or Home)
3. Follow the guided conversation prompts
4. Speak your responses when the microphone is active

## 🔮 Future Enhancements

- User accounts and progress tracking
- More diverse roleplay scenarios
- Customizable AI tutor personalities
- Mobile app versions
- Offline mode support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.