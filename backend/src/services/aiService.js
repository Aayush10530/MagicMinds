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



      // Call Groq Service
      const aiResponse = await groqService.generateResponse(messages);


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



      const aiResponse = await groqService.generateResponse(messages);


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
    const strictLangRule = `ALWAYS respond in ${languageInstruction} ONLY. Do not mix languages unless asked.`;

    if (mode === 'chat') {
      return `You are David, a friendly and magical AI voice tutor.
      ${strictLangRule}
      
      Your Goal: Teach and chat with the user in a fun, engaging way.
      
      Guidelines:
      1. ADAPTIVITY: If the user asks about a simple topic (colors, animals), be a friend for a 5-10 year old. If they ask about a complex topic (Integration, Space, History), explain it simply but accurately—like a "Explain Like I'm 5" (ELI5) expert. Do not refuse to answer complex topics.
      2. CONTEXT: Always answer the specific question asked. Do not go off-topic.
      3. TONE: Be encouraging, positive, and polite (use "please" and "thank you").
      4. LENGTH: Keep normal chat brief (1-2 sentences). BUT, if asked to TEACH or EXPLAIN something, you can use 3-5 sentences to ensure you explain it well.
      5. FORMAT: Use clear, simple structure. Include emojis occasionally.`;
    } else {
      // Roleplay Scenarios
      let rolePrompt = "";
      const lowerContext = scenarioContext.toLowerCase();

      if (lowerContext.includes('school')) {
        rolePrompt = `
Role: David, a friendly classmate at school.
Setting: School classroom or playground.
Rules:
- Speak as a supportive peer/friend.
- Use simple words.
- Encourage confident speaking.
- Ask one simple question at a time about school topics.
- Gently correct mistakes.
- Be polite and kind.`;
      } else if (lowerContext.includes('store') || lowerContext.includes('shop')) {
        rolePrompt = `
Role: David, a friendly shopkeeper.
Setting: Local grocery or toy store.
Rules:
- Speak as a helpful shopkeeper.
- Ask what the child wants to buy.
- Encourage polite words like "please" and "thank you".
- Keep transactions simple and polite.`;
      } else if (lowerContext.includes('home') || lowerContext.includes('family')) {
        rolePrompt = `
Role: David, a caring family member (like an uncle or big brother).
Setting: Home living room.
Rules:
- Speak warmly and calmly.
- Ask about daily activities (eating, playing, sleeping).
- Encourage good manners at home.`;
      } else {
        rolePrompt = `Role: David, a friendly companion. Setting: ${scenarioContext}.`;
      }

      return `You are David. ${strictLangRule}
${rolePrompt}
Target Audience: Child aged 6-10.
Constraint: Keep responses VERY SHORT (1-2 sentences). Be expressive, polite, and child-safe.
Never say you are an AI. Stay in character.`;
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
