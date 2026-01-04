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
      // Map language to voice ID
      // Defaulting to "BashkarNeural" (Bengali India) as requested by user
      // with custom rate and pitch
      let voice = 'en-US-AnaNeural';
      let rate = '0%';
      let pitch = '+0Hz';

      // Override for specific request
      // We will use BashkarNeural for everything for now as per user request, 
      // or logic to switch back to Ana for English if they prefer?
      // User said "I want the same voice to be implemented", showing Bashkar.
      // Assuming this overrides everything or just Hindi? 
      // The screenshot has "bn-IN-BashkarNeural" selected.
      // I will set it as default or high priority.

      voice = 'bn-IN-BashkarNeural';
      rate = '-9%';
      pitch = '+11Hz';

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
      'en': 'en-US-AnaNeural',      // Child-friendly female
      'hi': 'hi-IN-SwaraNeural',    // Excellent Hindi Neural
      'mr': 'mr-IN-AarohiNeural',   // Marathi Neural
      'gu': 'gu-IN-DhwaniNeural',   // Gujarati Neural
      'ta': 'ta-IN-PallaviNeural'   // Tamil Neural
    };

    return voiceMap[language] || voiceMap['en'];
  }
}

module.exports = new TextToSpeechService();