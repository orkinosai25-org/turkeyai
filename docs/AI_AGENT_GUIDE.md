# TürkiyeAI AI Travel Agent - Usage Guide

## Overview

The TürkiyeAI AI Travel Agent is an intelligent assistant powered by Azure OpenAI that helps users discover and plan their perfect trip to Türkiye. It uses advanced function calling to search resorts, compare options, and build personalized itineraries.

## Features

### 🤖 Intelligent Agent Capabilities

The AI agent can:
- **Understand natural language queries** about Turkish travel
- **Ask clarifying questions** to understand preferences
- **Search for resorts** based on user criteria
- **Get detailed information** about specific resorts
- **Compare multiple resorts** side-by-side
- **Build personalized itineraries** with day-by-day suggestions
- **Provide cultural insights** and travel tips

### 🛠️ Available Tools

The agent has access to four powerful tools:

1. **searchResorts** - Find resorts matching specific criteria
2. **getResort** - Get detailed information about a resort
3. **compareResorts** - Compare 2-5 resorts side-by-side
4. **buildItinerary** - Create personalized travel itineraries

## API Usage

### Chat Endpoint

**POST** `/api/chat`

Send messages to the AI travel agent and receive intelligent responses.

#### Request Body

```json
{
  "message": "I'm looking for family-friendly resorts in Bodrum",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Merhaba! How can I help you plan your trip to Türkiye?"
    }
  ]
}
```

#### Response

```json
{
  "response": "I'd be happy to help you find family-friendly resorts in Bodrum! Let me search for some great options...",
  "toolCalls": [
    {
      "id": "call_123",
      "function": "searchResorts",
      "arguments": {
        "region": "Bodrum",
        "family_friendly": true
      },
      "result": {
        "success": true,
        "count": 5,
        "resorts": [...]
      }
    }
  ],
  "conversationId": "chatcmpl-xyz",
  "model": "gpt-4o",
  "brand": "TürkiyeAI - Powered by OrkinosAI"
}
```

## Example Conversations

### Example 1: Finding a Resort

**User:** "I want to visit Bodrum in July with my family. We have two kids aged 5 and 8."

**Agent:** Uses `searchResorts` tool with:
```javascript
{
  region: "Bodrum",
  family_friendly: true
}
```

**Response:** "Great choice! Bodrum in July is perfect for families. I found several excellent family-friendly resorts..."

### Example 2: Comparing Resorts

**User:** "Can you compare the three resorts you mentioned?"

**Agent:** Uses `compareResorts` tool with:
```javascript
{
  resort_ids: ["1", "2", "3"],
  comparison_criteria: ["amenities", "price", "family-friendly"]
}
```

**Response:** "Here's a detailed comparison of these three resorts..."

### Example 3: Building an Itinerary

**User:** "I'd like a 7-day itinerary in Antalya focusing on beaches and history"

**Agent:** Uses `buildItinerary` tool with:
```javascript
{
  duration_days: 7,
  primary_region: "Antalya",
  traveler_profile: "family",
  interests: ["beach", "history"]
}
```

**Response:** "Perfect! Here's a 7-day itinerary for Antalya combining beach relaxation with historical exploration..."

## Agent Behavior

### Personality

The AI agent acts as a:
- **Warm and enthusiastic** Turkish travel expert
- **Professional yet friendly** advisor
- **Knowledgeable** about Turkish culture and destinations
- **Helpful** in understanding traveler needs

### Guidelines

The agent follows these principles:
- ✅ Provides information and recommendations
- ✅ Asks clarifying questions
- ✅ Uses tools to get accurate data
- ✅ Acknowledges when it doesn't know something
- ❌ Does NOT make bookings
- ❌ Does NOT invent prices or availability
- ❌ Does NOT process payments

### Safety & Disclaimers

The agent includes important disclaimers:
- TürkiyeAI is a discovery and planning platform, not a travel agency
- Bookings must be completed through licensed third-party providers
- Prices and availability should be confirmed with providers
- Uses "from prices" and "indicative pricing" terminology

## Testing the Agent

### Manual Testing

```bash
# Start the server
cd server
npm start

# In another terminal, test the chat endpoint
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about Bodrum resorts"
  }'
```

### Automated Testing

```bash
cd server
npm test
```

This runs all tests including:
- Settings Provider Tests
- Model Tests
- Route Tests
- **AI Agent Configuration Tests** (NEW)

## Configuration

### Environment Variables

Set up Azure OpenAI credentials in `.env`:

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### Agent Configuration

Customize the agent in `/server/config/agentConfig.js`:

- **System Prompt**: Modify `AGENT_SYSTEM_PROMPT` to change personality, expertise, or guidelines
- **Tool Definitions**: Add or modify tools in `AGENT_TOOLS` array
- **Parameters**: Adjust tool parameter schemas and constraints

### Tool Handlers

Implement tool logic in `/server/config/agentTools.js`:

- Add new tool functions
- Modify existing tool behavior
- Integrate with additional data sources

## Best Practices

### For Users

1. **Be specific** about preferences (dates, budget, travelers)
2. **Ask follow-up questions** to refine results
3. **Request comparisons** when deciding between options
4. **Confirm details** with travel providers before booking

### For Developers

1. **Monitor tool calls** in server logs
2. **Track popular queries** to improve tools
3. **Update tool schemas** based on user needs
4. **Test thoroughly** after any changes
5. **Keep prompts clear** and concise
6. **Validate all inputs** in tool handlers
7. **Handle errors gracefully** with informative messages

## Troubleshooting

### Agent not using tools

- Check that tools are properly defined in `agentConfig.js`
- Verify tool descriptions are clear and specific
- Ensure Azure OpenAI deployment supports function calling
- Check server logs for errors

### Tool execution errors

- Verify database connection is working
- Check tool handler implementations in `agentTools.js`
- Review error messages in tool results
- Test tools individually with `executeTool()`

### Unexpected responses

- Review system prompt clarity
- Check if tools are returning expected data
- Verify conversation history is maintained
- Look for errors in tool results

## Architecture

```
User Message
    ↓
Chat API (/api/chat)
    ↓
Azure OpenAI with Tools
    ↓
[Decision: Use Tool or Direct Response]
    ↓
Tool Execution (agentTools.js)
    ↓
Database Query (Resort models)
    ↓
Tool Result
    ↓
Azure OpenAI (with tool results)
    ↓
Final Response to User
```

## Future Enhancements

Potential improvements:
- [ ] Add more tools (flights, transfers, activities)
- [ ] Integration with real-time availability APIs
- [ ] Multi-language support
- [ ] User preference learning
- [ ] Advanced semantic search with Azure AI Search
- [ ] Image generation for destinations
- [ ] Voice interface support

## Support

For issues or questions:
- Check server logs for errors
- Review test output: `npm test`
- See configuration docs: `/server/config/README.md`
- Raise an issue in the repository

---

**TürkiyeAI** - AI-Powered Turkish Travel Discovery
Powered by **OrkinosAI** - Azure-native AI & SaaS platform
