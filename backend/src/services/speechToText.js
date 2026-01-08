const fs = require('fs');
const path = require('path');
const groqService = require('./groqService');

/**
 * Service for converting speech to text using Groq Whisper API
 */
class SpeechToTextService {
    /**
     * Transcribe audio using Groq Whisper API
     * @param {Buffer} audioBuffer - Audio buffer to transcribe
     * @param {string} language - Language code (optional)
     * @returns {Promise<string>} - Transcribed text
     */
    async transcribe(audioBuffer, language = 'en') {
        let tempFilePath = null;
        try {
            // Create temporary file
            tempFilePath = path.join(__dirname, '..', '..', 'temp', `audio-${Date.now()}.wav`);
            const tempDir = path.dirname(tempFilePath);

            // Ensure temp directory exists
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Write buffer to temp file
            fs.writeFileSync(tempFilePath, audioBuffer);

            console.log(`Sending audio to Groq for transcription: ${tempFilePath}`);

            // Call Groq Service
            // Note: groqService.transcribeAudio expects a file path
            const transcript = await groqService.transcribeAudio(tempFilePath, language);

            return transcript;
        } catch (error) {
            console.error('Speech to text error:', error.message);
            throw new Error('Failed to transcribe audio');
        } finally {
            // Clean up temp file
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {
                    console.error('Failed to delete temp file:', e);
                }
            }
        }
    }
}

module.exports = new SpeechToTextService();
