const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const transcribeAudio = async (filePath, language = 'en') => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-large-v3",
            response_format: "json",
            language: language, // Use dynamic language
            temperature: 0.0,
        });

        return transcription.text;
    } catch (error) {
        console.error("Groq Transcription Error:", error.message);
        throw new Error("Groq Transcription Failed: " + error.message);
    }
};

const generateResponse = async (messages) => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null
        });

        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq Chat Completion Error:", error.message);
        throw new Error("Groq AI Service Failed: " + error.message);
    }
};

module.exports = {
    transcribeAudio,
    generateResponse
};
