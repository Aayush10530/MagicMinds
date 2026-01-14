const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Services & Middleware
const authenticateSupabase = require('../middleware/authenticateSupabase');
const voiceService = require('../services/voiceService');
const { generateResponse } = require('../services/aiService');
const { ChatSession, ChatMessage, UserProgress } = require('../db');
const asyncWrapper = require('../utils/asyncWrapper');

// Multer Config (Temp storage for audio processing)
const upload = multer({
    dest: path.join(__dirname, '../../temp'),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure temp dir exists
if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
    fs.mkdirSync(path.join(__dirname, '../../temp'), { recursive: true });
}

/**
 * POST /session/start
 * Initialize a new chat session
 */
router.post('/session/start', authenticateSupabase, asyncWrapper(async (req, res) => {
    const { language = 'en', type = 'chat' } = req.body;

    // Create Session in DB
    const session = await ChatSession.create({
        user_id: req.user.id, // From Supabase Token
        language,
        type,
        voice_id: 'abhilash'
    });

    res.json({
        sessionId: session.id,
        message: "Session Started",
        voiceConfig: {
            service: 'sarvam',
            id: 'abhilash'
        }
    });
}));

/**
 * POST /chat
 * The Core Loop: Audio -> Text -> AI -> Text -> Audio
 */
router.post('/chat', authenticateSupabase, upload.single('audio'), asyncWrapper(async (req, res) => {
    const { sessionId, textInput } = req.body; // Can accept text OR audio
    const audioFile = req.file;

    // 1. Validation
    if (!sessionId) throw { statusCode: 400, message: "Session ID required" };
    if (!audioFile && !textInput) throw { statusCode: 400, message: "Audio or Text input required" };

    let userText = textInput;

    try {
        // 2. Transcribe (if Audio)
        if (audioFile) {
            console.log(`🎤 Processing Audio: ${audioFile.path}`);
            userText = await voiceService.transcribe(audioFile.path);

            // Cleanup temp file immediately
            try { fs.unlinkSync(audioFile.path); } catch (e) { }
        }

        if (!userText) throw { statusCode: 400, message: "Could not interpret input" };

        // 3. Save User Message
        await ChatMessage.create({
            session_id: sessionId,
            sender: 'user',
            content: userText
        });

        // 4. Generate AI Response
        const aiText = await generateResponse(userText);

        // 5. Synthesize Speech (TTS)
        // We get a Buffer back
        const audioBuffer = await voiceService.synthesize(aiText);

        // 6. Save AI Message
        await ChatMessage.create({
            session_id: sessionId,
            sender: 'ai',
            content: aiText
        });

        // 7. Update User Progress (Async/Fire-and-forget)
        // We don't await this to keep response fast
        if (req.user) {
            UserProgress.increment('chat_sessions_count', { where: { user_id: req.user.id } }).catch(console.error);
        }

        // 8. Respond
        res.json({
            text: aiText,
            userTranscript: userText,
            audio: audioBuffer ? audioBuffer.toString('base64') : null, // Send Base64 to frontend
            audioFormat: 'wav'
        });

    } catch (err) {
        // Ensure cleanup on error
        if (audioFile && fs.existsSync(audioFile.path)) {
            try { fs.unlinkSync(audioFile.path); } catch (e) { }
        }
        throw err;
    }
}));

module.exports = router;
