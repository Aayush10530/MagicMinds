const WebSocket = require('ws');
const crypto = require('crypto');

/**
 * Custom Edge TTS Client
 * Connects directly to Microsoft Edge Read Aloud API
 */
class EdgeTTS {
    constructor() {
        this.ws = null;
        this.TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
        this.VOICE_ENDPOINT = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${this.TRUSTED_CLIENT_TOKEN}`;
    }

    /**
     * Synthesize text to speech
     * @param {string} text - Text to speak
     * @param {string} voice - Voice ID (e.g., en-US-AnaNeural)
     * @returns {Promise<Buffer>} - Audio buffer
     */
    async synthesize(text, voice = 'en-US-AnaNeural', rate = '0%', pitch = '+0Hz') {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.VOICE_ENDPOINT, {
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            const audioChunks = [];
            const requestId = crypto.randomUUID().replace(/-/g, '');

            this.ws.on('unexpected-response', (req, res) => {
                console.error('EdgeTTS Unexpected Response:', res.statusCode, res.statusMessage);
            });

            this.ws.on('open', () => {
                console.log('EdgeTTS: Connected');
                // Did usually send speech.config
                const configMsg = this.createConfigMessage(requestId);
                this.ws.send(configMsg);

                // Send SSML
                const ssmlMsg = this.createSSMLMessage(requestId, text, voice, rate, pitch);
                this.ws.send(ssmlMsg);
            });

            this.ws.on('message', (data, isBinary) => {
                if (!isBinary) {
                    const str = data.toString();
                    console.log('EdgeTTS Msg:', str);
                    if (str.includes('Path: turn.end')) {
                        this.ws.close();
                    }
                } else {
                    // Binary data
                    // Header is 2 bytes (length) + header content + \r\n + binary
                    // We need to find the start of the audio
                    const textHeaderEnd = data.indexOf('\r\n\r\n') + 4;
                    if (textHeaderEnd > 3) {
                        const header = data.slice(0, textHeaderEnd).toString();
                        if (header.includes('Path: audio')) {
                            const audioData = data.slice(textHeaderEnd);
                            audioChunks.push(audioData);
                        }
                    }
                }
            });

            this.ws.on('close', (code, reason) => {
                console.log(`EdgeTTS: Closed Code: ${code} Reason: ${reason}`);
                const fullBuffer = Buffer.concat(audioChunks);
                if (fullBuffer.length > 0) {
                    resolve(fullBuffer);
                } else {
                    reject(new Error('No audio received (Connection closed)'));
                }
            });

            this.ws.on('error', (err) => {
                console.error('EdgeTTS Error:', err);
                reject(err);
            });
        });
    }

    createConfigMessage(requestId) {
        const configData = {
            context: {
                synthesis: {
                    audio: {
                        metadataoptions: {
                            sentenceBoundaryEnabled: "false",
                            wordBoundaryEnabled: "false"
                        },
                        outputFormat: "audio-24khz-48kbitrate-mono-mp3"
                    }
                }
            }
        };
        const json = JSON.stringify(configData);
        const date = new Date().toISOString();
        return `X-Timestamp:${date}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${json}`;
    }

    createSSMLMessage(requestId, text, voice, rate, pitch) {
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody rate='${rate}' pitch='${pitch}'>${text}</prosody></voice></speak>`;

        const date = new Date().toISOString();
        return `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}\r\nPath:ssml\r\n\r\n${ssml}`;
    }
}

module.exports = EdgeTTS;
