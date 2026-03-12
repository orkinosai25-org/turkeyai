const express = require('express');
const router = express.Router();
const { getAzureOpenAIClient, getDeploymentName, getChatOptions } = require('../config/azureOpenAI');
const { getAgentPrompt, getAgentTools } = require('../config/agentConfig');
const { executeTool } = require('../config/agentTools');

/**
 * POST /api/chat
 * Send a message to the AI travel agent with function calling support
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
    const agentPrompt = getAgentPrompt();
    const agentTools = getAgentTools();

    // Build messages array
    const messages = [
      { role: 'system', content: agentPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Add tools to chat options
    const optionsWithTools = {
      ...chatOptions,
      tools: agentTools,
      toolChoice: "auto" // Let the model decide when to use tools
    };

    // Get completion from Azure OpenAI
    let result = await client.getChatCompletions(deploymentName, messages, optionsWithTools);
    let responseMessage = result.choices[0]?.message;
    
    // Handle function calls
    const toolCalls = [];
    let finalResponse = responseMessage?.content || '';

    // Check if the model wants to call functions
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      // Execute each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs;
        
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error(`❌ Failed to parse tool arguments:`, parseError);
          // Store error result
          toolCalls.push({
            id: toolCall.id,
            function: functionName,
            arguments: null,
            result: {
              success: false,
              error: 'Invalid function arguments',
              message: parseError.message
            }
          });
          continue; // Skip this tool call
        }
        
        console.log(`🔧 AI Agent calling tool: ${functionName}`, functionArgs);
        
        // Execute the tool
        const toolResult = await executeTool(functionName, functionArgs);
        
        // Store tool call info
        toolCalls.push({
          id: toolCall.id,
          function: functionName,
          arguments: functionArgs,
          result: toolResult
        });

        // Add function result to messages
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: [toolCall]
        });
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      // Get final response from the model with tool results
      const finalResult = await client.getChatCompletions(deploymentName, messages, optionsWithTools);
      finalResponse = finalResult.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    }

    res.json({
      response: finalResponse,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
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
