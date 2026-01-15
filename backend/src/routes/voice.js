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
    const { sessionId, textInput } = req.body;
    const audioFile = req.file;

    // 1. Validation
    if (!sessionId) throw { statusCode: 400, message: "Session ID required" };
    if (!audioFile && !textInput) throw { statusCode: 400, message: "Audio or Text input required" };

    let userText = textInput;

    try {
        // 2. Transcribe (if Audio)
        if (audioFile) {
            console.log(`🎤 Processing Audio: ${audioFile.path}`);
            try {
                userText = await voiceService.transcribe(audioFile.path);
            } catch (sttErr) {
                console.error('❌ STT Service Failed:', sttErr);
                throw { statusCode: 502, message: "Speech-to-Text Service Failed", cause: sttErr.message };
            }

            // Cleanup temp file immediately
            try { fs.unlinkSync(audioFile.path); } catch (e) { }
        }

        if (!userText) throw { statusCode: 400, message: "Could not interpret input" };

        // 3. Save User Message
        try {
            await ChatMessage.create({
                session_id: sessionId,
                sender: 'user',
                content: userText
            });
        } catch (dbErr) {
            console.error('❌ Database Write Failed (User Msg):', dbErr);
            throw { statusCode: 503, message: "Database Save Failed", cause: dbErr.message };
        }

        // 3.5 Fetch Context
        let messages = [];
        try {
            const session = await ChatSession.findByPk(sessionId);
            const history = await ChatMessage.findAll({
                where: { session_id: sessionId },
                order: [['timestamp', 'DESC']],
                limit: 10
            });

            const systemPrompt = session?.system_prompt || 'You are David, an intelligent and friendly AI assistant. Always stay on topic, maintain context from previous messages, and answer the user\'s specific questions accurately.';
            messages.push({ role: 'system', content: systemPrompt });

            history.reverse().forEach(msg => {
                messages.push({
                    role: msg.sender === 'ai' ? 'assistant' : 'user',
                    content: msg.content
                });
            });
        } catch (ctxErr) {
            console.error('❌ Context Fetch Failed:', ctxErr);
            // Non-fatal? No, we need context.
            // Fallback to simple prompt if DB read fails but write worked?
            // Let's degrade gracefully:
            messages = [{ role: 'user', content: userText }];
        }

        // 4. Generate AI Response
        let aiText;
        try {
            aiText = await generateResponse(messages);
        } catch (aiErr) {
            console.error('❌ AI Service Failed:', aiErr);
            throw { statusCode: 502, message: "AI Generation Failed", cause: aiErr.message };
        }

        // 5. Synthesize Speech (TTS)
        let audioBuffer = null;
        try {
            audioBuffer = await voiceService.synthesize(aiText);
        } catch (ttsErr) {
            console.error('❌ TTS Service Failed:', ttsErr);
            // TTS failure is non-fatal, we can still return text.
            audioBuffer = null;
        }

        // 6. Save AI Message
        try {
            await ChatMessage.create({
                session_id: sessionId,
                sender: 'ai',
                content: aiText
            });
        } catch (dbErr) {
            console.error('❌ Database Write Failed (AI Msg):', dbErr);
            // Non-fatal, response is ready
        }

        // 7. Update User Progress (Async/Fire-and-forget)
        if (req.user) {
            UserProgress.increment('chat_sessions_count', { where: { user_id: req.user.id } }).catch(e => console.error('Progress Update Failed:', e.message));
        }

        // 8. Respond
        res.json({
            text: aiText,
            userTranscript: userText,
            audio: audioBuffer ? audioBuffer.toString('base64') : null,
            audioFormat: 'wav'
        });

    } catch (err) {
        // Ensure cleanup on error
        if (audioFile && fs.existsSync(audioFile.path)) {
            try { fs.unlinkSync(audioFile.path); } catch (e) { }
        }
        throw err; // Global handler will catch this and log strict stack
    }
}));

module.exports = router;
