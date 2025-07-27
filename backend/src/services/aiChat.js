const axios = require('axios');

/**
 * Service for generating AI responses using OpenAI GPT API
 */
class AIChatService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-4-turbo';
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
      // Prepare system message based on language
      const systemMessage = this.getSystemPrompt(language, 'chat');
      
      // Prepare messages array with conversation history
      const messages = [
        { role: 'system', content: systemMessage },
        ...conversationHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: userMessage }
      ];
      
      // Make API request
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 300
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI chat error:', error.response?.data || error.message);
      throw new Error('Failed to generate AI response');
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
      // Prepare system message for roleplay
      const systemMessage = this.getSystemPrompt(language, 'roleplay', scenarioContext);
      
      // Prepare messages array
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'assistant', content: currentPrompt },
        { role: 'user', content: userMessage }
      ];
      
      // Make API request
      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI roleplay error:', error.response?.data || error.message);
      throw new Error('Failed to generate roleplay response');
    }
  }

  /**
   * Get system prompt based on language and mode
   * @param {string} language - Language code
   * @param {string} mode - 'chat' or 'roleplay'
   * @param {string} scenarioContext - Context for roleplay scenario
   * @returns {string} - System prompt
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
}

module.exports = new AIChatService();