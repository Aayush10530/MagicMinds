const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Service for converting text to speech using ElevenLabs API
 */
class TextToSpeechService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech';
    this.voiceId = 'pNInz6obpgDQGcFmaJgB'; // Default ElevenLabs voice ID for a friendly male voice
  }

  /**
   * Convert text to speech using ElevenLabs API
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code (for voice selection)
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async synthesize(text, language = 'en') {
    try {
      // Select appropriate voice based on language
      const voiceId = this.getVoiceIdForLanguage(language);
      
      // Make API request
      const response = await axios.post(
        `${this.apiUrl}/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Text to speech error:', error.response?.data || error.message);
      
      // Fallback to Google TTS if ElevenLabs fails
      return this.fallbackToGoogleTTS(text, language);
    }
  }

  /**
   * Fallback to Google Text-to-Speech API
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async fallbackToGoogleTTS(text, language = 'en') {
    try {
      // Map language codes to Google TTS language codes
      const languageMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'ta': 'ta-IN'
      };
      
      const googleLanguage = languageMap[language] || 'en-US';
      
      // Use Google TTS API
      const response = await axios.post(
        'https://texttospeech.googleapis.com/v1/text:synthesize',
        {
          input: { text },
          voice: { languageCode: googleLanguage, ssmlGender: 'MALE' },
          audioConfig: { audioEncoding: 'MP3' }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Decode base64 audio content
      return Buffer.from(response.data.audioContent, 'base64');
    } catch (error) {
      console.error('Google TTS fallback error:', error.response?.data || error.message);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Get appropriate voice ID based on language
   * @param {string} language - Language code
   * @returns {string} - ElevenLabs voice ID
   */
  getVoiceIdForLanguage(language) {
    // These are example voice IDs - replace with actual ElevenLabs voice IDs
    const voiceMap = {
      'en': 'pNInz6obpgDQGcFmaJgB', // English voice
      'hi': 'pNInz6obpgDQGcFmaJgB', // Hindi voice
      'mr': 'pNInz6obpgDQGcFmaJgB', // Marathi voice
      'gu': 'pNInz6obpgDQGcFmaJgB', // Gujarati voice
      'ta': 'pNInz6obpgDQGcFmaJgB'  // Tamil voice
    };
    
    return voiceMap[language] || voiceMap['en'];
  }
}

module.exports = new TextToSpeechService();