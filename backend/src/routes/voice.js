const express = require('express');
const multer = require('multer');
const router = express.Router();
const config = require('../config');
const speechToText = require('../services/speechToText');
const aiChat = require('../services/aiChat');
const textToSpeech = require('../services/textToSpeech');

// Configure multer for audio uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: config.audio.maxSizeBytes
  },
  fileFilter: (req, file, cb) => {
    if (config.audio.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

/**
 * POST /api/voice/chat
 * Process voice input for free-flow chat mode
 */
router.post('/chat', upload.single('audio'), async (req, res, next) => {
  try {
    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      const error = new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
      error.statusCode = 500;
      error.code = 'API_KEY_MISSING';
      throw error;
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const language = req.body.language || 'en';
    const conversationHistory = req.body.history ? JSON.parse(req.body.history) : [];
    
    // Step 1: Convert speech to text
    const transcription = await speechToText.transcribe(req.file.buffer, language);
    
    // Step 2: Generate AI response
    const aiResponse = await aiChat.generateChatResponse(transcription, language, conversationHistory);
    
    // Step 3: Convert AI response to speech
    const audioBuffer = await textToSpeech.synthesize(aiResponse, language);
    
    // Return response
    res.json({
      success: true,
      userMessage: transcription,
      aiMessage: aiResponse,
      audio: audioBuffer.toString('base64')
    });
  } catch (error) {
    console.error('Voice chat error:', error);
    next(error); // Pass to error handler middleware
  }
});

/**
 * POST /api/voice/roleplay
 * Process voice input for roleplay mode
 */
router.post('/roleplay', upload.single('audio'), async (req, res, next) => {
  try {
    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      const error = new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
      error.statusCode = 500;
      error.code = 'API_KEY_MISSING';
      throw error;
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { language = 'en', scenarioId, scenarioContext, currentPrompt } = req.body;
    
    // Step 1: Convert speech to text
    const transcription = await speechToText.transcribe(req.file.buffer, language);
    
    // Step 2: Generate AI roleplay response
    const aiResponse = await aiChat.generateRoleplayResponse(
      transcription,
      scenarioContext,
      currentPrompt,
      language
    );
    
    // Step 3: Convert AI response to speech
    const audioBuffer = await textToSpeech.synthesize(aiResponse, language);
    
    // Return response
    res.json({
      success: true,
      userMessage: transcription,
      aiMessage: aiResponse,
      audio: audioBuffer.toString('base64'),
      scenarioId
    });
  } catch (error) {
    console.error('Roleplay error:', error);
    next(error); // Pass to error handler middleware
  }
});

module.exports = router;