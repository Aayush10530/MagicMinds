const EdgeTTS = require('./EdgeTTSClient');

/**
 * Service for converting text to speech using Microsoft Edge's Free Neural TTS
 * Replaces the paid ElevenLabs integration
 */
class TextToSpeechService {
  /**
   * Convert text to speech using Edge TTS
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code (for voice selection)
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async synthesize(text, language = 'en') {
    try {
      // Get the appropriate voice for the language
      const voice = this.getVoiceForLanguage(language);

      // Default settings
      let rate = '0%';
      let pitch = '+0Hz';

      // Custom settings for specific voices if needed
      if (voice === 'bn-IN-BashkarNeural') { // David's voice
        rate = '-9%';
        pitch = '+11Hz';
      }

      console.log(`Synthesizing speech with Edge TTS using voice: ${voice}, rate: ${rate}, pitch: ${pitch}`);

      const tts = new EdgeTTS();
      // Use clean text for SSML to avoid XML errors (basic escaping)
      const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const buffer = await tts.synthesize(safeText, voice, rate, pitch);
      return buffer;

    } catch (error) {
      console.error('Edge TTS error:', error);
      return Buffer.from('');
    }
  }

  /**
   * Get appropriate Neural voice ID based on language
   * @param {string} language - Language code
   * @returns {string} - Edge TTS voice ID
   */
  getVoiceForLanguage(language) {
    const voiceMap = {
      'en': 'bn-IN-BashkarNeural',  // User selected "David" (actually Bashkar) for English
      'hi': 'hi-IN-SwaraNeural',    // Excellent Hindi Neural
      'mr': 'mr-IN-AarohiNeural',   // Marathi Neural
      'gu': 'gu-IN-DhwaniNeural',   // Gujarati Neural
      'ta': 'ta-IN-PallaviNeural'   // Tamil Neural
    };

    return voiceMap[language] || voiceMap['en'];
  }
}

module.exports = new TextToSpeechService();