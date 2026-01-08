/**
 * Audio Utility for Magic Minds
 * Handles recording, downsampling to 16kHz mono, and WAV encoding.
 */

export interface AudioRecorder {
    start: () => Promise<void>;
    stop: () => Promise<Blob>;
}

export const createAudioRecorder = (): AudioRecorder => {
    let audioContext: AudioContext | null = null;
    let mediaStream: MediaStream | null = null;
    let processor: ScriptProcessorNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let audioChunks: Float32Array[] = [];

    const start = async () => {
        audioChunks = [];

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000, // Request 16kHz context if possible
            });

            source = audioContext.createMediaStreamSource(mediaStream);

            // Use ScriptProcessor for broad compatibility (AudioWorklet is better but more complex to setup with bundlers sometimes)
            // Buffer size 4096 gives good balance between latency and performance
            processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Clone the data to avoid reference issues
                audioChunks.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination); // Needed for script processor to run

        } catch (error) {
            console.error('Error starting audio recording:', error);
            throw error;
        }
    };

    const stop = async (): Promise<Blob> => {
        if (processor && source && mediaStream && audioContext) {
            processor.disconnect();
            source.disconnect();
            mediaStream.getTracks().forEach(track => track.stop());

            // Close context to release resources
            if (audioContext.state !== 'closed') {
                await audioContext.close();
            }
        }

        // Merge chunks
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // Encode to WAV
        return encodeWAV(combinedBuffer, 16000);
    };

    return { start, stop };
};

// WAV Encoding Utility
const encodeWAV = (samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    // Write PCM samples
    floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};
