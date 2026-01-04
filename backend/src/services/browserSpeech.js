/**
 * Service for converting speech to text using browser's built-in speech recognition
 * This is completely free and works immediately without any API keys
 */
class BrowserSpeechService {
  constructor() {
    // This service uses the browser's built-in speech recognition
    // No API keys or external services needed
  }

  /**
   * Transcribe audio using browser's speech recognition
   * Note: This is a placeholder - actual transcription happens in the frontend
   * @param {Buffer} audioBuffer - Audio buffer to transcribe
   * @param {string} language - Language code
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioBuffer, language = 'en') {
    // This is a fallback method
    // The actual transcription should happen in the frontend using browser APIs
    throw new Error('Speech recognition should be handled in the frontend using browser APIs');
  }

  /**
   * Get language code for browser speech recognition
   * @param {string} language - Language code
   * @returns {string} - Browser-compatible language code
   */
  getBrowserLanguageCode(language) {
    const languageMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'ta': 'ta-IN'
    };
    
    return languageMap[language] || 'en-US';
  }
}

module.exports = new BrowserSpeechService(); 