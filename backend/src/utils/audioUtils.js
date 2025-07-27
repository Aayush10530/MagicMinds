const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

/**
 * Utility functions for audio processing
 */
const audioUtils = {
  /**
   * Convert audio buffer to a readable stream
   * @param {Buffer} buffer - Audio buffer
   * @returns {Readable} - Readable stream
   */
  bufferToStream(buffer) {
    const readable = new Readable();
    readable._read = () => {}; // _read is required but we don't need to implement it
    readable.push(buffer);
    readable.push(null);
    return readable;
  },

  /**
   * Save audio buffer to a temporary file
   * @param {Buffer} buffer - Audio buffer
   * @param {string} extension - File extension (e.g., 'mp3', 'wav')
   * @returns {Promise<string>} - Path to the saved file
   */
  async saveBufferToTemp(buffer, extension = 'mp3') {
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, `audio-${Date.now()}.${extension}`);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, buffer, (err) => {
        if (err) return reject(err);
        resolve(filePath);
      });
    });
  },

  /**
   * Clean up temporary files older than a specified time
   * @param {number} maxAgeMs - Maximum age in milliseconds
   */
  cleanupTempFiles(maxAgeMs = 3600000) { // Default: 1 hour
    const tempDir = path.join(__dirname, '..', '..', 'temp');
    
    if (!fs.existsSync(tempDir)) return;
    
    const now = Date.now();
    
    fs.readdir(tempDir, (err, files) => {
      if (err) return console.error('Error reading temp directory:', err);
      
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return console.error(`Error getting stats for ${file}:`, err);
          
          const fileAge = now - stats.mtimeMs;
          
          if (fileAge > maxAgeMs) {
            fs.unlink(filePath, err => {
              if (err) console.error(`Error deleting ${file}:`, err);
            });
          }
        });
      });
    });
  }
};

module.exports = audioUtils;