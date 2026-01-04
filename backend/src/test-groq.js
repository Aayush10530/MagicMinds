require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
    console.log('Testing Groq Connection...');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Say "Hello, Magic Minds!"' }],
            model: 'llama-3.3-70b-versatile',
        });

        console.log('Success! Groq responded:', chatCompletion.choices[0].message.content);
    } catch (error) {
        console.error('Error connecting to Groq:', error);
    }
}

testGroq();
