/**
 * AI Travel Agent Configuration
 * 
 * This file contains the system prompt and tool definitions for the TürkiyeAI
 * AI Travel Agent powered by Azure OpenAI.
 */

/**
 * Enhanced system prompt for TürkiyeAI travel agent
 * Defines the agent's personality, expertise, and behavior guidelines
 */
const AGENT_SYSTEM_PROMPT = `You are TürkiyeAI, an expert AI travel assistant specializing in Turkish travel destinations.
You are powered by OrkinosAI, an Azure-native AI platform.

## Your Expertise
You are a knowledgeable Turkish travel expert covering:
- Turkish destinations: Bodrum, Marmaris, Fethiye, Antalya, Cappadocia, Istanbul, Izmir, Kusadasi, and more
- Resort and hotel recommendations
- Local experiences, cultural insights, and authentic Turkish traditions
- Trip planning and itinerary suggestions
- Weather patterns, best times to visit, and seasonal activities
- Transportation options within Turkey
- Turkish cuisine and dining experiences
- Historical sites and cultural landmarks

## Your Role and Behavior
- Act as a warm, enthusiastic, and knowledgeable Turkish travel expert
- Ask clarifying questions to understand traveler preferences:
  * Travel dates and duration
  * Budget range (use "from prices" and "indicative pricing")
  * Departure airport and transportation needs
  * Number of travelers and their ages
  * Preferred vibe (luxury, family-friendly, adults-only, adventure, cultural, relaxation)
  * Special requirements (halal-friendly, accessibility needs, dietary restrictions)
- Provide practical, actionable travel advice with specific recommendations
- Use available tools to search for resorts, get details, compare options, and build itineraries
- Be enthusiastic about Turkish culture and destinations while remaining professional

## Critical Guidelines
- You provide recommendations and information ONLY - you do NOT book or process payments
- NEVER invent prices or availability - always use "from prices" and "indicative pricing"
- For actual bookings, direct users to licensed travel providers or official booking platforms
- When you don't have specific information, acknowledge it and offer to search or suggest alternatives
- Maintain a friendly, helpful, and conversational tone
- Speak in a warm manner reminiscent of Turkish hospitality

## Important Disclaimer
Remember: TürkiyeAI is a SaaS AI travel discovery and planning platform, not a tour operator or licensed travel agency.
We help users discover and plan their perfect trip to Türkiye, but bookings are completed through licensed third-party providers.`;

/**
 * Tool/Function definitions for Azure OpenAI function calling
 * These tools enable the AI agent to interact with the backend API
 */
const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "searchResorts",
      description: "Search for Turkish resorts and hotels based on filters like region, star rating, amenities, and vibe. Use this when users ask about accommodation options or want to find resorts matching specific criteria.",
      parameters: {
        type: "object",
        properties: {
          region: {
            type: "string",
            description: "Filter by Turkish region/destination (e.g., 'Bodrum', 'Antalya', 'Marmaris', 'Fethiye', 'Kusadasi')",
            enum: ["Bodrum", "Antalya", "Marmaris", "Fethiye", "Kusadasi", "Izmir", "Istanbul", "Cappadocia"]
          },
          min_star_rating: {
            type: "integer",
            description: "Minimum star rating (1-5). Use to filter by quality level.",
            minimum: 1,
            maximum: 5
          },
          family_friendly: {
            type: "boolean",
            description: "Filter for family-friendly resorts with kids facilities"
          },
          adults_only: {
            type: "boolean",
            description: "Filter for adults-only resorts (no children allowed)"
          },
          vibe: {
            type: "string",
            description: "Desired atmosphere or vibe",
            enum: ["luxury", "family", "adventure", "relaxation", "cultural", "romantic", "budget-friendly"]
          },
          max_results: {
            type: "integer",
            description: "Maximum number of results to return (default: 10, max: 50)",
            minimum: 1,
            maximum: 50,
            default: 10
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getResort",
      description: "Get detailed information about a specific resort by its ID. Use this when users want more details about a particular resort or when you need to provide comprehensive information.",
      parameters: {
        type: "object",
        properties: {
          resort_id: {
            type: "string",
            description: "The unique identifier of the resort"
          }
        },
        required: ["resort_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "compareResorts",
      description: "Compare multiple resorts side-by-side to help users make informed decisions. Use this when users are deciding between several options or explicitly ask to compare resorts.",
      parameters: {
        type: "object",
        properties: {
          resort_ids: {
            type: "array",
            description: "Array of resort IDs to compare (minimum 2, maximum 5)",
            items: {
              type: "string"
            },
            minItems: 2,
            maxItems: 5
          },
          comparison_criteria: {
            type: "array",
            description: "Specific aspects to focus on in comparison (e.g., 'price', 'amenities', 'location', 'family-friendly')",
            items: {
              type: "string"
            }
          }
        },
        required: ["resort_ids"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buildItinerary",
      description: "Build a personalized travel itinerary based on user preferences including resorts, activities, and day-by-day suggestions. Use this when users want a complete trip plan or multi-day itinerary.",
      parameters: {
        type: "object",
        properties: {
          duration_days: {
            type: "integer",
            description: "Number of days for the trip",
            minimum: 1,
            maximum: 21
          },
          primary_region: {
            type: "string",
            description: "Main region/destination for the trip",
            enum: ["Bodrum", "Antalya", "Marmaris", "Fethiye", "Kusadasi", "Izmir", "Istanbul", "Cappadocia"]
          },
          traveler_profile: {
            type: "string",
            description: "Type of travelers",
            enum: ["solo", "couple", "family", "group", "seniors"]
          },
          interests: {
            type: "array",
            description: "Areas of interest for activities and experiences",
            items: {
              type: "string",
              enum: ["beach", "history", "culture", "adventure", "cuisine", "nightlife", "wellness", "nature", "shopping"]
            }
          },
          budget_level: {
            type: "string",
            description: "Budget level for recommendations",
            enum: ["budget", "moderate", "luxury", "ultra-luxury"]
          },
          include_resort_id: {
            type: "string",
            description: "Optional: specific resort ID to include in the itinerary"
          }
        },
        required: ["duration_days", "primary_region", "traveler_profile"]
      }
    }
  }
];

/**
 * Get the agent system prompt
 */
function getAgentPrompt() {
  return AGENT_SYSTEM_PROMPT;
}

/**
 * Get the agent tool definitions
 */
function getAgentTools() {
  return AGENT_TOOLS;
}

/**
 * Get tool configuration for Azure OpenAI API
 */
function getToolConfig() {
  return {
    tools: AGENT_TOOLS,
    tool_choice: "auto" // Let the model decide when to use tools
  };
}

module.exports = {
  AGENT_SYSTEM_PROMPT,
  AGENT_TOOLS,
  getAgentPrompt,
  getAgentTools,
  getToolConfig
};
