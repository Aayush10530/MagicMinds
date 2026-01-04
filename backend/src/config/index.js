/**
 * Configuration settings for the Magic Minds backend
 */
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimit: {
      windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP
    }
  },
  
  // API Keys
  apiKeys: {
    huggingface: process.env.HUGGINGFACE_API_KEY,
    elevenlabs: process.env.ELEVENLABS_API_KEY,
    google: process.env.GOOGLE_API_KEY
  },
  
  // Audio processing
  audio: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'],
    tempDir: 'temp'
  },
  
  // AI models
  ai: {
    chatModel: 'gpt-4-turbo',
    whisperModel: 'whisper-1',
    ttsModel: 'eleven_multilingual_v2'
  },
  
  // Supported languages
  languages: [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ta', name: 'Tamil' }
  ]
};

module.exports = config;