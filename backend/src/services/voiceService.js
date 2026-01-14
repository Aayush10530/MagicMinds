const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

class VoiceService {
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY;
        if (!this.apiKey) {
            console.warn('⚠️ SARVAM_API_KEY missing. Voice features will fail.');
        }

        // Endpoints
        this.ttsUrl = 'https://api.sarvam.ai/text-to-speech';
        this.sttUrl = 'https://api.sarvam.ai/speech-to-text-translate';
    }

    /**
     * Synthesize Audio (TTS)
     * @param {string} text - Text to speak
     * @param {string} languageCode - 'hi-IN' or 'en-IN' (default)
     * @returns {Promise<Buffer|null>} - Audio buffer or null on failure
     */
    async synthesize(text, languageCode = 'en-IN') {
        if (!this.apiKey) return null;

        try {
            // Default to 'bulbul:v1' or 'chi-chi:v1' as per previous code?
            // Previous code used 'bulbul:v2' and 'abhilash'
            const payload = {
                inputs: [text],
                target_language_code: languageCode === 'hi' ? 'hi-IN' : 'en-IN',
                speaker: 'abhilash', // Consistent male voice
                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                speech_sample_rate: 16000,
                enable_preprocessing: true,
                model: 'bulbul:v1' // v1 is often more stable for pure TTS, checking archive it was v2
            };

            const response = await axios.post(this.ttsUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey
                },
                timeout: 10000 // 10s timeout
            });

            if (response.data && response.data.audios && response.data.audios[0]) {
                return Buffer.from(response.data.audios[0], 'base64');
            }
            throw new Error('Invalid response format from Sarvam TTS');

        } catch (error) {
            console.error('❌ VoiceService TTS Error:', error.message);
            return null; // Graceful degradation (Frontend will show text only)
        }
    }

    /**
     * Transcribe Audio (STT)
     * @param {string} filePath - Path to audio file
     * @returns {Promise<string>} - Transcribed text
     */
    async transcribe(filePath) {
        if (!this.apiKey) throw new Error('Voice Service Disabled (No Key)');

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('model', 'saaras:v1');
            // prompt is optional

            const response = await axios.post(this.sttUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'api-subscription-key': this.apiKey
                },
                timeout: 15000 // 15s timeout for upload
            });

            if (response.data && response.data.transcript) {
                return response.data.transcript;
            }
            throw new Error('No transcript in response');

        } catch (error) {
            console.error('❌ VoiceService STT Error:', error.message);
            throw new Error('Failed to process audio message.');
        }
    }
}

module.exports = new VoiceService();
