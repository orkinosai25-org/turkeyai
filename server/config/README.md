# TürkiyeAI Travel Agent Configuration

This directory contains the AI Travel Agent configuration for TürkiyeAI, including system prompts, tool definitions, and tool handlers.

## Overview

The TürkiyeAI AI Travel Agent is powered by Azure OpenAI and uses function calling to interact with the backend API. This enables the AI to:

- Search for resorts based on user preferences
- Get detailed resort information
- Compare multiple resorts side-by-side
- Build personalized travel itineraries

## Files

### `agentConfig.js`

Defines the AI agent's system prompt and tool/function schemas.

**Key Components:**
- `AGENT_SYSTEM_PROMPT`: Comprehensive system prompt defining the agent's personality, expertise, and behavior
- `AGENT_TOOLS`: Array of tool definitions following OpenAI function calling schema
- Helper functions to access configuration

**Available Tools:**
1. **searchResorts** - Search for resorts with filters (region, star rating, family-friendly, etc.)
2. **getResort** - Get detailed information about a specific resort
3. **compareResorts** - Compare 2-5 resorts side-by-side
4. **buildItinerary** - Build a personalized day-by-day travel itinerary

### `agentTools.js`

Implements the actual tool handlers that execute when the AI calls a function.

**Key Functions:**
- `searchResorts(params)` - Queries the database for resorts matching filters
- `getResort(params)` - Retrieves detailed resort information including amenities
- `compareResorts(params)` - Fetches and compares multiple resorts
- `buildItinerary(params)` - Generates a personalized itinerary based on preferences
- `executeTool(functionName, args)` - Router function that executes the appropriate tool

## How It Works

### 1. Function Calling Flow

```
User Message → Azure OpenAI with Tools → AI decides to call function
    ↓
Tool Call (e.g., searchResorts) → executeTool() → Query Database
    ↓
Tool Result → Back to Azure OpenAI → AI generates response with data
    ↓
Final Response → User
```

### 2. Example Interaction

**User:** "I'm looking for family-friendly resorts in Bodrum"

**AI Decision:** Call `searchResorts({ region: "Bodrum", family_friendly: true })`

**Tool Execution:** Query database for matching resorts

**Tool Result:** Returns list of family-friendly Bodrum resorts

**AI Response:** "I found several great family-friendly options in Bodrum! Here are my top recommendations..."

## Usage

### In Chat API

The chat route (`/api/chat`) automatically integrates the agent configuration:

```javascript
const { getAgentPrompt, getAgentTools } = require('../config/agentConfig');
const { executeTool } = require('../config/agentTools');

// Build messages with system prompt
const messages = [
  { role: 'system', content: getAgentPrompt() },
  ...conversationHistory,
  { role: 'user', content: message }
];

// Include tools in chat options
const optionsWithTools = {
  ...chatOptions,
  tools: getAgentTools(),
  tool_choice: "auto"
};

// Get completion with function calling support
const result = await client.getChatCompletions(deploymentName, messages, optionsWithTools);
```

## Tool Schemas

Each tool is defined with a JSON schema that describes:
- **name**: Function name
- **description**: What the function does (helps AI decide when to use it)
- **parameters**: Input parameters with types, constraints, and descriptions

Example:
```javascript
{
  type: "function",
  function: {
    name: "searchResorts",
    description: "Search for resorts based on filters...",
    parameters: {
      type: "object",
      properties: {
        region: { type: "string", enum: [...] },
        min_star_rating: { type: "integer", minimum: 1, maximum: 5 }
      }
    }
  }
}
```

## Customization

### Adding a New Tool

1. **Define the tool schema** in `agentConfig.js`:
```javascript
{
  type: "function",
  function: {
    name: "yourToolName",
    description: "What your tool does",
    parameters: { /* schema */ }
  }
}
```

2. **Implement the tool handler** in `agentTools.js`:
```javascript
async function yourToolName(params) {
  // Implementation
  return { success: true, data: ... };
}
```

3. **Add to executeTool** function:
```javascript
const tools = {
  searchResorts,
  getResort,
  compareResorts,
  buildItinerary,
  yourToolName  // Add here
};
```

### Modifying the System Prompt

Edit `AGENT_SYSTEM_PROMPT` in `agentConfig.js` to:
- Change the agent's personality
- Add new expertise areas
- Modify behavior guidelines
- Update disclaimers

## Best Practices

1. **Tool Descriptions**: Write clear, detailed descriptions so the AI knows when to use each tool
2. **Parameter Schemas**: Use enums and constraints to guide valid inputs
3. **Error Handling**: Always return `{ success: false, error: ... }` for errors
4. **Logging**: Log tool calls for debugging and monitoring
5. **Validation**: Validate tool parameters before execution
6. **Security**: Never expose sensitive data in tool results

## Security Considerations

- All tool inputs are validated before execution
- SQL injection protection through parameterized queries
- OData injection protection in search filters
- No direct database access from AI - all through defined tools
- Tool results are sanitized before returning to AI

## Testing

Test the agent and tools:
```bash
npm test
```

Test specific tool:
```bash
node -e "
const { searchResorts } = require('./config/agentTools');
searchResorts({ region: 'Bodrum' }).then(console.log);
"
```

## Monitoring

Tool calls are logged with:
```javascript
console.log(`🔧 AI Agent calling tool: ${functionName}`, functionArgs);
```

Monitor these logs to understand:
- Which tools are being used most
- What parameters users are requesting
- Potential issues or missing functionality
