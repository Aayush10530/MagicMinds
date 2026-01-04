const groqService = require('./groqService');
const { HfInference } = require('@huggingface/inference');

/**
 * Service for generating AI responses using Groq Cloud API
 * Replaces the local Ollama integration
 */
class AIService {
  constructor() {
    this.hf = new HfInference(process.env.HF_ACCESS_TOKEN);
  }

  /**
   * Generate AI response for free-flow chat
   * @param {string} userMessage - User's message
   * @param {string} language - Language code
   * @param {Array} conversationHistory - Previous messages in the conversation
   * @returns {Promise<string>} - AI response
   */
  async generateChatResponse(userMessage, language = 'en', conversationHistory = []) {
    try {
      // Prepare system message
      const systemInstruction = this.getSystemPrompt(language, 'chat');

      const messages = [
        { role: 'system', content: systemInstruction },
        // Map history to OpenAI/Groq format
        ...conversationHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: userMessage }
      ];

      console.log('Sending to Groq:', JSON.stringify(messages, null, 2));

      // Call Groq Service
      const aiResponse = await groqService.generateResponse(messages);

      console.log('Groq response:', aiResponse);
      return aiResponse;

    } catch (error) {
      console.error('Groq AI chat error:', error);
      return this.getFallbackResponse(language, userMessage);
    }
  }

  /**
   * Generate AI response for roleplay scenario
   * @param {string} userMessage - User's message
   * @param {string} scenarioContext - Context of the roleplay scenario
   * @param {string} currentPrompt - Current AI prompt in the scenario
   * @param {string} language - Language code
   * @returns {Promise<string>} - AI response
   */
  async generateRoleplayResponse(userMessage, scenarioContext, currentPrompt, language = 'en') {
    try {
      // Prepare system message
      const systemInstruction = this.getSystemPrompt(language, 'roleplay', scenarioContext);

      const messages = [
        { role: 'system', content: systemInstruction },
        { role: 'assistant', content: currentPrompt }, // Context of what AI just asked
        { role: 'user', content: userMessage }
      ];

      console.log('Sending roleplay to Groq:', JSON.stringify(messages, null, 2));

      const aiResponse = await groqService.generateResponse(messages);

      console.log('Groq roleplay response:', aiResponse);
      return aiResponse;

    } catch (error) {
      console.error('Groq AI roleplay error:', error);
      return this.getFallbackResponse(language, userMessage);
    }
  }

  /**
   * Generate vector embedding for text
   * @param {string} text 
   * @returns {Promise<Array<number>>}
   */
  async generateEmbedding(text) {
    try {
      if (!text) return null;
      // Use efficient sentence-transformers model
      const result = await this.hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text
      });
      return result;
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      return null; // Fail gracefully (continue without memory)
    }
  }

  /**
   * Get system prompt based on language and mode
   */
  getSystemPrompt(language, mode, scenarioContext = '') {
    const languageInstructions = {
      'en': 'Respond in English',
      'hi': 'हिंदी में जवाब दें',
      'mr': 'मराठी मध्ये प्रतिसाद द्या',
      'gu': 'ગુજરાતી માં જવાબ આપો',
      'ta': 'தமிழில் பதிலளிக்கவும்'
    };

    const languageInstruction = languageInstructions[language] || languageInstructions['en'];

    if (mode === 'chat') {
      return `You are David, a friendly and magical AI voice tutor for children aged 5-10. 
      ${languageInstruction}. Use simple language appropriate for young children. 
      Be encouraging, positive, and educational. Keep responses brief (1-3 sentences). 
      Include emojis occasionally to make your responses engaging. 
      Focus on being helpful and making learning fun.`;
    } else {
      return `You are David, a friendly and magical AI voice tutor for children aged 5-10. 
      ${languageInstruction}. You are in a roleplay scenario: ${scenarioContext}. 
      Keep responses very brief (1-2 sentences). Be encouraging and stay in character. 
      Guide the child through the conversation naturally. 
      Include emojis occasionally to make your responses engaging.`;
    }
  }

  getFallbackResponse(language, userMessage) {
    const fallbackResponses = {
      'en': [
        "I'm having a little trouble thinking right now, but you're doing great! 🌟",
        "Can you say that again? My magic ears missed it! ✨"
      ],
      'hi': [
        "मुझे अभी सोचने में थोड़ी परेशानी हो रही है, लेकिन आप बहुत अच्छा कर रहे हैं! 🌟",
        "क्या आप इसे फिर से कह सकते हैं? मेरे जादुई कानों ने इसे मिस कर दिया! ✨"
      ]
    };

    const responses = fallbackResponses[language] || fallbackResponses['en'];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = new AIService();
