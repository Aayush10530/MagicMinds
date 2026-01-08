const axios = require('axios');

class SarvamService {
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY || 'sk_qc5fmtxi_A8GBiqmFUBcMfnCzWNIXUFqm'; // Fallback to provided key
        this.apiUrl = 'https://api.sarvam.ai/text-to-speech';
    }

    /**
     * Synthesize speech using Sarvam AI
     * @param {string} text - Text to synthesize
     * @param {string} languageCode - Language code (e.g., 'hi-IN')
     * @param {string} speaker - Speaker ID (e.g., 'abhilash')
     * @returns {Promise<Buffer>} - Audio buffer (WAV)
     */
    async synthesize(text, languageCode = 'hi-IN', speaker = 'abhilash') {
        try {
            const payload = {
                inputs: [text],
                target_language_code: languageCode,
                speaker: speaker,
                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                speech_sample_rate: 16000,
                enable_preprocessing: true,
                model: 'bulbul:v2'
            };

            const response = await axios.post(this.apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-subscription-key': this.apiKey
                }
            });

            if (response.data && response.data.audios && response.data.audios[0]) {
                const audioBase64 = response.data.audios[0];
                return Buffer.from(audioBase64, 'base64');
            } else {
                throw new Error('No audio data received from Sarvam AI');
            }

        } catch (error) {
            console.error('Sarvam AI TTS Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new SarvamService();
