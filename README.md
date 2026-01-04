# Magic Minds - AI Voice Tutor for Children

## Project Overview

**Magic Minds** is an AI-powered voice tutor for children that provides:
- **Free-flow AI chatbot** with voice interaction
- **Interactive roleplay scenarios** for real-life conversations
- **Multi-language support** (English, Hindi, Marathi, Gujarati, Tamil)
- **Child-friendly, educational responses**

## Project Structure

This project is organized into two main directories:

```
MagicMinds/
├── frontend/          # React + TypeScript frontend application
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   ├── package.json  # Frontend dependencies
│   └── ...          # Frontend configuration files
│
└── backend/          # Node.js backend application (to be developed)
    ├── BACKEND_SUMMARY.md    # Backend development plan
    └── CHAT_HISTORY.md       # Development history
```

## Getting Started

### Frontend Development

The frontend is a complete React + TypeScript application with modern UI components.

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:8080`

### Backend Development

The backend is planned and ready for development. See the `backend/` folder for:
- `BACKEND_SUMMARY.md` - Comprehensive backend development guide
- `CHAT_HISTORY.md` - Development history and decisions

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation

### Backend (Planned)
- **Node.js/Express** - Main backend framework
- **OpenAI Whisper** - Speech-to-Text processing
- **OpenAI GPT-4** - AI response generation
- **ElevenLabs** - Text-to-Speech with multiple voices
- **Socket.io** - Real-time communication

## Development Status

- ✅ **Frontend**: Complete and production-ready
- 🚧 **Backend**: Ready for development (see backend documentation)

## Features

### Frontend Features
- Voice chat interface with David (AI tutor)
- Interactive roleplay scenarios
- Multi-language support
- Progress tracking
- Modern, responsive UI
- Child-friendly design

### Backend Features (Planned)
- Speech-to-text processing
- AI response generation
- Text-to-speech synthesis
- Real-time communication
- Multi-language support
- User progress tracking

## Contributing

1. Frontend changes: Work in the `frontend/` directory
2. Backend development: Work in the `backend/` directory
3. Follow the existing code style and patterns
4. Update documentation as needed

## License

This project is proprietary and confidential.

---

**Last Updated**: July 2025
**Status**: Frontend Complete, Backend Ready for Development 