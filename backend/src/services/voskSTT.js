const vosk = require('vosk');
const fs = require('fs');
const path = require('path');

/**
 * Service for offline speech recognition using Vosk
 * Vosk is a lightweight offline speech recognition toolkit
 */
class VoskSTTService {
  constructor() {
    this.modelPath = process.env.VOSK_MODEL_PATH || './models/vosk-model-small-en-us-0.15';
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize Vosk model
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(`Vosk model not found at: ${this.modelPath}`);
      }
      
      this.model = new vosk.Model(this.modelPath);
      this.initialized = true;
      console.log('Vosk model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Vosk model:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using Vosk
   * @param {Buffer} audioBuffer - Audio buffer to transcribe
   * @param {string} language - Language code
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioBuffer, language = 'en') {
    try {
      await this.initialize();
      
      // Create recognizer
      const recognizer = new vosk.Recognizer({
        model: this.model,
        sampleRate: 16000 // Vosk expects 16kHz audio
      });
      
      // Process audio buffer
      recognizer.acceptWaveform(audioBuffer);
      
      // Get final result
      const result = recognizer.finalResult();
      
      // Clean up
      recognizer.free();
      
      return result.text || '';
      
    } catch (error) {
      console.error('Vosk transcription error:', error);
      throw error;
    }
  }

  /**
   * Check if Vosk is available
   * @returns {Promise<boolean>} - True if Vosk is available
   */
  async isAvailable() {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new VoskSTTService(); 