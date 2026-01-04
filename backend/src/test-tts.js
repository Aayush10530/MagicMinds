const ttsService = require('./services/textToSpeech');
const fs = require('fs');
const path = require('path');

async function testTTS() {
    console.log('Testing Edge TTS...');
    try {
        const text = "Hello! This is a test of the free Microsoft Edge neural voice.";
        const buffer = await ttsService.synthesize(text, 'en');

        if (buffer && buffer.length > 0) {
            console.log(`Success! Generated audio buffer of size: ${buffer.length} bytes`);
            fs.writeFileSync(path.join(__dirname, 'test-tts.mp3'), buffer);
            console.log('Saved to src/test-tts.mp3');
        } else {
            console.error('Failed: Audio buffer is empty');
        }
    } catch (error) {
        console.error('Error testing TTS:', error);
    }
}

testTTS();
