const Groq = require('groq-sdk');
require('dotenv').config();

// Initialize Groq Client
let groq;
try {
    if (process.env.GROQ_API_KEY) {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    } else {
        console.warn('⚠️ GROQ_API_KEY missing. AI Service disabled.');
    }
} catch (err) {
    console.warn('⚠️ Groq Init Failed:', err.message);
}

/**
 * Generate AI Response
 * @param {string} prompt - User message
 * @param {string} systemPrompt - Persona/Context
 * @returns {Promise<string>} - AI response text
 */
const generateResponse = async (prompt, systemPrompt = 'You are David, a helpful AI assistant.') => {
    if (!groq) {
        return "I am currently offline (API Key Missing).";
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            model: 'llama3-70b-8192', // Or 'mixtral-8x7b-32768'
            temperature: 0.7,
            max_tokens: 1024,
        });

        return completion.choices[0]?.message?.content || "Thinking...";

    } catch (error) {
        console.error('❌ AI Service Error:', error.message);
        // Fail Gracefully
        if (error.status === 429) return "I am overwhelmed right now. Please try again in a moment.";
        return "I had trouble thinking of a response.";
    }
};

module.exports = { generateResponse };
