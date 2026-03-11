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
const AGENT_SYSTEM_PROMPT = `You are TürkiyeAI, an expert AI travel assistant specialising in Turkish travel destinations.
You are powered by OrkinosAI, an Azure-native AI platform.

## Your Expertise
You are a knowledgeable Turkish travel expert covering:
- Turkish destinations: Bodrum, Marmaris, Fethiye, Antalya, Cappadocia, Istanbul, Izmir, Kusadasi, and more
- Resort and hotel recommendations with deep AI analysis (hotel availability via TBO, PROVAB APIs)
- Hotel proximity learning – understanding which hotels are closest to beaches, airports, cultural sites
- Travel service verticals: excursions, day trips, transfers, holiday packages, flight routes
- Car hire at all major Turkish airports via the Carnect GDS
- Cruises – ocean liners and traditional gulet Blue Voyages around the Turkish coast and Aegean
- Private aviation – turboprop to large-cabin jet charters between UK and Turkish airports
- Private boats & yachts – gulets, motor yachts, catamarans, and superyachts (villa/yacht links via GRN)
- Local experiences, cultural insights, and authentic Turkish traditions
- Trip planning and itinerary suggestions
- Weather patterns, best times to visit, and seasonal activities
- Transportation options within Turkey
- Turkish cuisine and dining experiences
- Historical sites and cultural landmarks

## Your Role and Behaviour
- Act as a warm, enthusiastic, and knowledgeable Turkish travel expert
- Ask clarifying questions to understand traveller preferences:
  * Travel dates and duration
  * Budget range (use "from prices" and "indicative pricing")
  * Departure airport and transportation needs
  * Number of travellers and their ages
  * Preferred vibe (luxury, family-friendly, adults-only, adventure, cultural, relaxation)
  * Special requirements (halal-friendly, accessibility needs, dietary restrictions)
- Use available tools to:
  * Search for resorts, get deep dive profiles, compare options, and build itineraries
  * Find nearby hotels using proximity AI learning
  * Search excursions and experiences by destination and type
  * Recommend holiday packages by destination, board basis, and category
  * Provide airport transfer options and indicative pricing
  * Search car hire options by airport and vehicle category (powered by Carnect GDS)
  * Discover cruise itineraries departing from or calling at Turkish ports
  * Explore private aviation charter options to Turkish airports
  * Browse private boats and yacht charters along the Turkish coast
- Provide practical, actionable travel advice with specific recommendations
- Be enthusiastic about Turkish culture and destinations while remaining professional

## Critical Guidelines
- You provide recommendations and information ONLY – you do NOT book or process payments
- NEVER invent prices or availability – always use "from prices" and "indicative pricing"
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
      name: "getResortDeepDive",
      description: "Get a comprehensive AI deep-dive profile for a specific resort, including proximity to beaches, airports, and cultural sites, amenity breakdown, and AI-generated travel insights. Use this when users want detailed resort information or want to understand a resort's location advantages.",
      parameters: {
        type: "object",
        properties: {
          resort_id: {
            type: "string",
            description: "The unique identifier of the resort to deep-dive into"
          }
        },
        required: ["resort_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getNearbyResorts",
      description: "Find hotels and resorts near a given resort using proximity AI learning. Returns nearby alternatives sorted by distance and similarity score. Use this when users want to compare nearby options or find alternatives.",
      parameters: {
        type: "object",
        properties: {
          resort_id: {
            type: "string",
            description: "The reference resort ID to find nearby hotels for"
          },
          radius_km: {
            type: "number",
            description: "Search radius in kilometres (default: 15, max: 50)",
            minimum: 1,
            maximum: 50,
            default: 15
          }
        },
        required: ["resort_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchExcursions",
      description: "Search for excursions, day trips, and authentic Turkish experiences. Use this when users ask about activities, tours, things to do, or experiences in a Turkish destination.",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
            description: "Turkish destination for excursions",
            enum: ["Bodrum", "Antalya", "Marmaris", "Fethiye", "Istanbul", "Cappadocia", "Kusadasi"]
          },
          type: {
            type: "string",
            description: "Type of excursion",
            enum: ["Cultural", "Adventure", "Boat Tour", "Culinary", "Wellness"]
          },
          difficulty: {
            type: "string",
            description: "Difficulty level",
            enum: ["Easy", "Moderate", "Challenging"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchPackages",
      description: "Search for curated Turkish holiday packages including all-inclusive and tailor-made options. Use this when users ask about holiday packages, deals, or all-inclusive options.",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
            description: "Turkish destination",
            enum: ["Bodrum", "Antalya", "Marmaris", "Fethiye", "Istanbul", "Cappadocia", "Kusadasi"]
          },
          category: {
            type: "string",
            description: "Package category or theme",
            enum: ["Beach & Relaxation", "Cultural & Adventure", "Family", "City & Culture", "Wellness & Spa", "Adventure"]
          },
          board_basis: {
            type: "string",
            description: "Board basis preference",
            enum: ["All Inclusive", "Half Board", "Bed & Breakfast", "Room Only"]
          },
          duration_min: {
            type: "integer",
            description: "Minimum number of nights",
            minimum: 1
          },
          duration_max: {
            type: "integer",
            description: "Maximum number of nights",
            maximum: 21
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getTransferOptions",
      description: "Get airport transfer options for a Turkish destination. Returns private, shared, and luxury vehicle options with indicative pricing. Use this when users ask about getting from the airport to their hotel.",
      parameters: {
        type: "object",
        properties: {
          destination: {
            type: "string",
            description: "The resort destination to get transfers for",
            enum: ["Bodrum", "Antalya", "Marmaris", "Fethiye", "Istanbul", "Cappadocia", "Kusadasi", "Izmir"]
          }
        },
        required: ["destination"]
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
  },
  {
    type: "function",
    function: {
      name: "searchCarRentals",
      description: "Search for car hire options at Turkish airports via the Carnect GDS. Use this when users ask about renting a car, car hire, self-drive options, or getting around Turkey independently.",
      parameters: {
        type: "object",
        properties: {
          airport: {
            type: "string",
            description: "IATA airport code for pickup (e.g. AYT, BJV, IST, DLM, ADB)",
            enum: ["AYT", "BJV", "DLM", "ADB", "IST", "SAW", "ESB", "GZP"]
          },
          category: {
            type: "string",
            description: "Car category",
            enum: ["Economy", "Compact", "SUV", "Luxury", "Minivan / People Carrier"]
          },
          seats_min: {
            type: "integer",
            description: "Minimum number of seats required",
            minimum: 1,
            maximum: 9
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchCruises",
      description: "Search for cruise itineraries departing from or calling at Turkish ports, including ocean cruises and traditional gulet Blue Voyages. Use this when users ask about cruises, sailing holidays, or gulet charters.",
      parameters: {
        type: "object",
        properties: {
          departure_port: {
            type: "string",
            description: "Departure port name or city (e.g. Istanbul, Bodrum, Marmaris)"
          },
          ship_type: {
            type: "string",
            description: "Type of vessel",
            enum: ["Ocean Cruise", "Traditional Gulet", "River / Coastal Cruise"]
          },
          duration_min: {
            type: "integer",
            description: "Minimum cruise duration in nights",
            minimum: 1
          },
          duration_max: {
            type: "integer",
            description: "Maximum cruise duration in nights",
            maximum: 21
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchPrivateAviation",
      description: "Search for private jet and charter aircraft options flying to Turkish airports. Use this when users ask about private jets, charter flights, or private aviation to Turkey.",
      parameters: {
        type: "object",
        properties: {
          aircraft_type: {
            type: "string",
            description: "Type of aircraft",
            enum: ["Turboprop", "Light Jet", "Mid-Size Jet", "Large Cabin Jet"]
          },
          max_passengers_min: {
            type: "integer",
            description: "Minimum passenger capacity required",
            minimum: 1,
            maximum: 20
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchYachts",
      description: "Search for private boat and yacht charters along the Turkish coast, including gulets, motor yachts, catamarans, and superyachts. Use this when users ask about yacht charters, boat hire, gulet holidays, or private sailing.",
      parameters: {
        type: "object",
        properties: {
          vessel_type: {
            type: "string",
            description: "Type of vessel",
            enum: ["Gulet", "Motor Yacht", "Superyacht", "Sailing Catamaran"]
          },
          home_port: {
            type: "string",
            description: "Charter home port",
            enum: ["Bodrum", "Marmaris", "Göcek", "Fethiye"]
          },
          max_guests_min: {
            type: "integer",
            description: "Minimum guest capacity required",
            minimum: 1,
            maximum: 20
          }
        },
        required: []
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
