const sarvamService = require('./sarvamService');

/**
 * Service for converting text to speech using Sarvam AI
 */
class TextToSpeechService {
  /**
   * Convert text to speech using Sarvam AI
   * @param {string} text - Text to convert to speech
   * @param {string} text - Text to convert to speech
   * @param {string} language - Language code (for voice selection)
   * @param {string} voiceId - Optional voice ID/speaker name to override default
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async synthesize(text, language = 'en', voiceId = null) {
    try {
      // Get the appropriate configuration for the language
      const { code, speaker } = this.getVoiceConfigForLanguage(language);

      // Use provided voiceId or fallback to default speaker for language
      const finalSpeaker = voiceId || speaker;



      // Call Sarvam Service
      const buffer = await sarvamService.synthesize(text, code, finalSpeaker);
      if (!buffer) {
        throw new Error("Sarvam Service returned no audio");
      }
      return buffer;

    } catch (error) {
      console.warn('TTS execution warning:', error.message);
      return null; // Return null explicitly to signal failure
    }
  }

  /**
   * Get appropriate Sarvam voice config based on language
   * @param {string} language - Language code
   * @returns {Object} - { code, speaker }
   */
  getVoiceConfigForLanguage(language) {
    // Current assumption: 'abhilash' is a versatile male voice for Indian languages.
    // If specific voices are needed per language, map them here.
    // Sarvam docs suggest 10+ languages.
    const defaultSpeaker = 'abhilash'; // Male voice

    const configMap = {
      'en': { code: 'en-IN', speaker: defaultSpeaker },
      'hi': { code: 'hi-IN', speaker: defaultSpeaker },
      'mr': { code: 'mr-IN', speaker: defaultSpeaker },
      'gu': { code: 'gu-IN', speaker: defaultSpeaker },
      'ta': { code: 'ta-IN', speaker: defaultSpeaker },
      'te': { code: 'te-IN', speaker: defaultSpeaker },
      'kn': { code: 'kn-IN', speaker: defaultSpeaker },
      'pa': { code: 'pa-IN', speaker: defaultSpeaker },
      'bn': { code: 'bn-IN', speaker: defaultSpeaker },
      'ml': { code: 'ml-IN', speaker: defaultSpeaker },
      'od': { code: 'od-IN', speaker: defaultSpeaker }
    };

    return configMap[language] || configMap['en'];
  }
}

module.exports = new TextToSpeechService();