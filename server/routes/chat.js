const express = require('express');
const router = express.Router();
const { getAzureOpenAIClient, getDeploymentName, getChatOptions } = require('../config/azureOpenAI');

/**
 * System prompt for TürkiyeAI travel agent
 */
const SYSTEM_PROMPT = `You are TürkiyeAI, an expert AI travel assistant specializing in Turkish travel destinations.
You are powered by OrkinosAI, an Azure-native AI platform.

Your expertise covers:
- Turkish destinations: Bodrum, Marmaris, Fethiye, Antalya, Cappadocia, Istanbul, and more
- Resort and hotel information
- Local experiences and cultural insights
- Trip planning and itinerary suggestions
- Weather, best times to visit, and seasonal activities
- Transportation options within Turkey

Key guidelines:
- You provide recommendations and information only - you do NOT book or process payments
- For bookings, direct users to licensed travel providers or official booking platforms
- Be enthusiastic and knowledgeable about Turkish culture and destinations
- Provide practical, actionable travel advice
- Use a friendly, helpful tone

Remember: TürkiyeAI is a SaaS AI travel agent, not a tour operator or travel agency.`;

/**
 * POST /api/chat
 * Send a message to the AI travel agent
 */
router.post('/', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const client = await getAzureOpenAIClient();
    const deploymentName = await getDeploymentName();
    const chatOptions = await getChatOptions();

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Get completion from Azure OpenAI
    const result = await client.getChatCompletions(deploymentName, messages, chatOptions);

    const response = result.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    res.json({
      response,
      conversationId: result.id,
      model: deploymentName,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

module.exports = router;
