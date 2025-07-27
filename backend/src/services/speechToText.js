const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Service for converting speech to text using OpenAI Whisper API
 */
class SpeechToTextService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * @param {Buffer} audioBuffer - Audio buffer to transcribe
   * @param {string} language - Language code (optional)
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioBuffer, language = 'en') {
    try {
      // Create temporary file
      const tempFilePath = path.join(__dirname, '..', '..', 'temp', `audio-${Date.now()}.wav`);
      const tempDir = path.dirname(tempFilePath);
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, audioBuffer);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFilePath));
      formData.append('model', 'whisper-1');
      
      // Add language if provided
      if (language && language !== 'en') {
        formData.append('language', language);
      }
      
      // Make API request
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      return response.data.text;
    } catch (error) {
      console.error('Speech to text error:', error.response?.data || error.message);
      throw new Error('Failed to transcribe audio');
    }
  }
}

module.exports = new SpeechToTextService();