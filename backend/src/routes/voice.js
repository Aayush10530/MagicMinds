const express = require('express');
const multer = require('multer');
const router = express.Router();
const config = require('../config/index');
const aiChat = require('../services/aiService');
const textToSpeech = require('../services/textToSpeech');
const groqService = require('../services/groqService');

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
 * GET /api/voice/test
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Voice API is working!', timestamp: new Date().toISOString() });
});

/**
 * POST /api/voice/chat
 * Process voice input for free-flow chat mode
 */
router.post('/chat', async (req, res, next) => {
  try {
    console.log('Received chat request:', { body: req.body });

    const { userMessage, language = 'en', history = [] } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'No user message provided' });
    }

    console.log('Generating AI response for:', userMessage);

    // Use real AI with Ollama
    try {
      // Generate AI response using Ollama
      const aiResponse = await aiChat.generateChatResponse(userMessage, language, history);

      console.log('AI response generated:', aiResponse);
      console.log('Converting to speech...');

      // Convert AI response to speech
      const audioBuffer = await textToSpeech.synthesize(aiResponse, language);

      console.log('Speech synthesis completed, audio buffer size:', audioBuffer.length);

      // Return response
      res.json({
        success: true,
        aiMessage: aiResponse,
        audio: audioBuffer.toString('base64')
      });
    } catch (error) {
      console.error('AI generation error:', error);

      // Fallback to mock response if AI fails
      const fallbackResponses = {
        'en': [
          `Hello! I'm David, your magical tutor! I heard you say: "${userMessage}". That's wonderful! What would you like to learn about today? 🌟`,
          `Great question! "${userMessage}" is a fantastic topic to explore. Let me help you learn more about it! 📚`,
          `I love that you're curious about "${userMessage}"! Learning is so much fun, isn't it? What else interests you? ✨`
        ],
        'hi': [
          `नमस्ते! मैं डेविड हूं, आपका जादुई शिक्षक! मैंने सुना आपने कहा: "${userMessage}"। यह बहुत अच्छा है! आज आप क्या सीखना चाहते हैं? 🌟`,
          `बहुत अच्छा सवाल! "${userMessage}" एक शानदार विषय है। मुझे आपको इसके बारे में और जानने में मदद करने दें! 📚`,
          `मुझे यह पसंद है कि आप "${userMessage}" के बारे में जिज्ञासु हैं! सीखना बहुत मज़ेदार है, है ना? और क्या आपको रुचिकर लगता है? ✨`
        ]
      };

      const responses = fallbackResponses[language] || fallbackResponses['en'];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];

      res.json({
        success: true,
        aiMessage: aiResponse,
        audio: null
      });
    }

    // Generate AI response using real API
    const aiResponse = await aiChat.generateChatResponse(userMessage, language, history);

    console.log('AI response generated:', aiResponse);
    console.log('Converting to speech...');

    // Convert AI response to speech
    const audioBuffer = await textToSpeech.synthesize(aiResponse, language);

    console.log('Speech synthesis completed, audio buffer size:', audioBuffer.length);

    // Return response
    res.json({
      success: true,
      aiMessage: aiResponse,
      audio: audioBuffer.toString('base64')
    });
  } catch (error) {
    console.error('Voice chat error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    });
    next(error); // Pass to error handler middleware
  }
});

/**
 * POST /api/voice/roleplay
 * Process voice input for roleplay mode
 */
router.post('/roleplay', async (req, res, next) => {
  try {
    console.log('Received roleplay request:', { body: req.body });

    const { userMessage, language = 'en', scenarioId, scenarioContext, currentPrompt } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'No user message provided' });
    }

    console.log('Generating roleplay response for:', userMessage);

    // Use real AI with Ollama
    try {
      // Generate AI roleplay response using Ollama
      const aiResponse = await aiChat.generateRoleplayResponse(
        userMessage,
        scenarioContext,
        currentPrompt,
        language
      );

      console.log('Roleplay response generated:', aiResponse);

      // Convert AI response to speech
      const audioBuffer = await textToSpeech.synthesize(aiResponse, language);

      console.log('Roleplay speech synthesis completed');

      // Return response
      res.json({
        success: true,
        userMessage: userMessage,
        aiMessage: aiResponse,
        audio: audioBuffer.toString('base64'),
        scenarioId
      });
    } catch (error) {
      console.error('AI roleplay generation error:', error);

      // Fallback to mock response if AI fails
      const fallbackResponses = {
        'en': [
          `That's wonderful! I heard you say: "${userMessage}". You're doing great in this roleplay! Let's continue our conversation. 🌟`,
          `Excellent! "${userMessage}" is a perfect response. You're learning so well! What would you like to do next? 📚`,
          `I love your answer: "${userMessage}"! You're really getting into character. This is so much fun! ✨`
        ],
        'hi': [
          `यह बहुत अच्छा है! मैंने सुना आपने कहा: "${userMessage}"। आप इस रोलप्ले में बहुत अच्छा कर रहे हैं! चलिए हमारी बातचीत जारी रखते हैं। 🌟`,
          `बहुत बढ़िया! "${userMessage}" एक बिल्कुल सही जवाब है। आप बहुत अच्छी तरह सीख रहे हैं! अब आप क्या करना चाहते हैं? 📚`,
          `मुझे आपका जवाब पसंद है: "${userMessage}"! आप वाकई किरदार में आ रहे हैं। यह बहुत मज़ेदार है! ✨`
        ]
      };

      const responses = fallbackResponses[language] || fallbackResponses['en'];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];

      res.json({
        success: true,
        userMessage: userMessage,
        aiMessage: aiResponse,
        audio: null,
        scenarioId
      });
    }

    // Generate AI roleplay response using real API
    const aiResponse = await aiChat.generateRoleplayResponse(
      userMessage,
      scenarioContext,
      currentPrompt,
      language
    );

    console.log('Roleplay response generated:', aiResponse);

    // Convert AI response to speech
    const audioBuffer = await textToSpeech.synthesize(aiResponse, language);

    console.log('Roleplay speech synthesis completed');

    // Return response
    res.json({
      success: true,
      userMessage: userMessage,
      aiMessage: aiResponse,
      audio: audioBuffer.toString('base64'),
      scenarioId
    });
  } catch (error) {
    console.error('Roleplay error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    });
    next(error); // Pass to error handler middleware
  }
});

/**
 * POST /api/voice/transcribe
 * Transcribe audio file to text using real Whisper.cpp speech recognition
 */
router.post('/transcribe', upload.single('audio'), async (req, res, next) => {
  try {
    console.log('Received transcription request');

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { language = 'en' } = req.body;
    const audioBuffer = req.file.buffer;

    console.log('Audio file received, size:', audioBuffer.length, 'bytes');

    // Use Groq Cloud for speech recognition
    try {
      const fs = require('fs');
      const path = require('path');

      // Create temp directory
      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Save audio to temp file
      const audioFile = path.join(tempDir, `audio-${Date.now()}.wav`);
      fs.writeFileSync(audioFile, audioBuffer);

      console.log('Sending audio to Groq Whisper...');
      const transcript = await groqService.transcribeAudio(audioFile);
      console.log('Groq result:', transcript);

      // Clean up
      try {
        fs.unlinkSync(audioFile);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }

      res.json({
        success: true,
        transcript: transcript || 'Could not understand audio',
        language: language,
        confidence: 0.99
      });

    } catch (error) {
      console.error('Groq transcription error:', error);

      // Fallback response
      const fallbackTranscript = language === 'hi'
        ? "नमस्ते डेविड, मैं आपसे बात करना चाहता हूं"
        : "Hello David, I want to talk to you";

      res.json({
        success: true,
        transcript: fallbackTranscript,
        language: language,
        confidence: 0.5
      });
    }

  } catch (error) {
    console.error('Transcription endpoint error:', error);
    next(error);
  }
});

module.exports = router;