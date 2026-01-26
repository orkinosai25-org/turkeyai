/**
 * AI Travel Agent Tool Handlers
 * 
 * This file contains the implementation of tool functions that the AI agent can call.
 * Each function interacts with the backend API or database to retrieve information.
 */

const Resort = require('../models/Resort');
const { getSearchClient } = require('./azureSearch');

/**
 * Search for resorts based on filters
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Search results with resorts
 */
async function searchResorts(params) {
  try {
    const {
      region,
      min_star_rating,
      family_friendly,
      adults_only,
      vibe,
      max_results = 10
    } = params;

    // Build filters for database query
    const filters = {};
    if (region) filters.region = region;
    if (min_star_rating) filters.star_rating = min_star_rating;

    // Get resorts from database
    let resorts = await Resort.getAll(filters);

    // Apply additional filters
    if (family_friendly !== undefined) {
      resorts = resorts.filter(r => r.family_friendly === family_friendly);
    }
    if (adults_only !== undefined) {
      resorts = resorts.filter(r => r.adults_only === adults_only);
    }
    if (vibe) {
      resorts = resorts.filter(r => {
        const tags = r.vibe_tags || [];
        return tags.includes(vibe);
      });
    }

    // Limit results
    resorts = resorts.slice(0, max_results);

    return {
      success: true,
      count: resorts.length,
      resorts: resorts.map(r => ({
        id: r.id,
        name: r.name,
        region: r.region,
        star_rating: r.star_rating,
        description: r.description,
        price_range: r.price_range,
        family_friendly: r.family_friendly,
        adults_only: r.adults_only,
        vibe_tags: r.vibe_tags,
        beach_type: r.beach_type
      })),
      filters: params
    };
  } catch (error) {
    console.error('Error in searchResorts tool:', error);
    return {
      success: false,
      error: 'Failed to search resorts',
      message: error.message
    };
  }
}

/**
 * Get detailed information about a specific resort
 * @param {Object} params - Parameters with resort_id
 * @returns {Promise<Object>} Resort details
 */
async function getResort(params) {
  try {
    const { resort_id } = params;

    if (!resort_id) {
      return {
        success: false,
        error: 'resort_id is required'
      };
    }

    const resort = await Resort.getById(resort_id);
    
    if (!resort) {
      return {
        success: false,
        error: 'Resort not found',
        resort_id
      };
    }

    // Get amenities for this resort
    const amenities = await Resort.getAmenities(resort_id);

    return {
      success: true,
      resort: {
        id: resort.id,
        name: resort.name,
        region: resort.region,
        star_rating: resort.star_rating,
        description: resort.description,
        price_range: resort.price_range,
        family_friendly: resort.family_friendly,
        adults_only: resort.adults_only,
        vibe_tags: resort.vibe_tags,
        beach_type: resort.beach_type,
        season_notes: resort.season_notes,
        distance_to_airport: resort.distance_to_airport,
        amenities: amenities.map(a => a.name)
      }
    };
  } catch (error) {
    console.error('Error in getResort tool:', error);
    return {
      success: false,
      error: 'Failed to get resort details',
      message: error.message
    };
  }
}

/**
 * Compare multiple resorts side-by-side
 * @param {Object} params - Parameters with resort_ids array
 * @returns {Promise<Object>} Comparison results
 */
async function compareResorts(params) {
  try {
    const { resort_ids, comparison_criteria = [] } = params;

    if (!resort_ids || !Array.isArray(resort_ids) || resort_ids.length < 2) {
      return {
        success: false,
        error: 'At least 2 resort IDs are required for comparison'
      };
    }

    if (resort_ids.length > 5) {
      return {
        success: false,
        error: 'Maximum 5 resorts can be compared at once'
      };
    }

    // Fetch all resorts
    const resortPromises = resort_ids.map(id => Resort.getById(id));
    const resorts = await Promise.all(resortPromises);

    // Fetch amenities for all resorts
    const amenitiesPromises = resort_ids.map(id => Resort.getAmenities(id));
    const amenitiesResults = await Promise.all(amenitiesPromises);

    // Build comparison data
    const comparison = resorts.map((resort, index) => {
      if (!resort) {
        return {
          id: resort_ids[index],
          error: 'Resort not found'
        };
      }

      const amenities = amenitiesResults[index] || [];
      return {
        id: resort.id,
        name: resort.name,
        region: resort.region,
        star_rating: resort.star_rating,
        description: resort.description,
        price_range: resort.price_range,
        family_friendly: resort.family_friendly,
        adults_only: resort.adults_only,
        vibe_tags: resort.vibe_tags,
        beach_type: resort.beach_type,
        distance_to_airport: resort.distance_to_airport,
        amenities: amenities.map(a => a.name)
      };
    });

    // Add comparison summary
    const summary = {
      total_compared: comparison.length,
      star_ratings: comparison.map(r => ({ name: r.name, rating: r.star_rating })),
      family_friendly_count: comparison.filter(r => r.family_friendly).length,
      adults_only_count: comparison.filter(r => r.adults_only).length,
      regions: [...new Set(comparison.map(r => r.region))]
    };

    return {
      success: true,
      comparison,
      summary,
      criteria: comparison_criteria
    };
  } catch (error) {
    console.error('Error in compareResorts tool:', error);
    return {
      success: false,
      error: 'Failed to compare resorts',
      message: error.message
    };
  }
}

/**
 * Build a personalized travel itinerary
 * @param {Object} params - Itinerary parameters
 * @returns {Promise<Object>} Itinerary with day-by-day suggestions
 */
async function buildItinerary(params) {
  try {
    const {
      duration_days,
      primary_region,
      traveler_profile,
      interests = [],
      budget_level = 'moderate',
      include_resort_id
    } = params;

    if (!duration_days || !primary_region || !traveler_profile) {
      return {
        success: false,
        error: 'duration_days, primary_region, and traveler_profile are required'
      };
    }

    // Get resort if specified
    let selectedResort = null;
    if (include_resort_id) {
      selectedResort = await Resort.getById(include_resort_id);
    }

    // Build itinerary structure
    const itinerary = {
      trip_duration: duration_days,
      region: primary_region,
      traveler_profile,
      budget_level,
      recommended_resort: selectedResort ? {
        id: selectedResort.id,
        name: selectedResort.name,
        star_rating: selectedResort.star_rating
      } : null,
      daily_plan: []
    };

    // Generate day-by-day suggestions based on interests and profile
    for (let day = 1; day <= duration_days; day++) {
      const dayPlan = {
        day: day,
        title: getDayTitle(day, duration_days, primary_region, interests),
        suggestions: getDaySuggestions(day, duration_days, primary_region, interests, traveler_profile)
      };
      itinerary.daily_plan.push(dayPlan);
    }

    return {
      success: true,
      itinerary,
      interests,
      note: 'This is a suggested itinerary. Actual availability and pricing should be confirmed with travel providers.'
    };
  } catch (error) {
    console.error('Error in buildItinerary tool:', error);
    return {
      success: false,
      error: 'Failed to build itinerary',
      message: error.message
    };
  }
}

/**
 * Helper function to generate day title
 */
function getDayTitle(day, totalDays, region, interests) {
  if (day === 1) return `Arrival in ${region}`;
  if (day === totalDays) return 'Departure Day';
  
  // Use interests to create meaningful day titles
  if (interests.includes('beach') && day <= 3) return 'Beach & Relaxation';
  if (interests.includes('history') || interests.includes('culture')) return 'Cultural Exploration';
  if (interests.includes('adventure')) return 'Adventure & Activities';
  
  return `Day ${day} - Explore ${region}`;
}

/**
 * Helper function to generate day suggestions
 */
function getDaySuggestions(day, totalDays, region, interests, profile) {
  const suggestions = [];

  if (day === 1) {
    suggestions.push('Check-in at your resort');
    suggestions.push('Welcome dinner at resort restaurant');
    if (profile === 'family') {
      suggestions.push('Explore resort facilities and kids club');
    }
  } else if (day === totalDays) {
    suggestions.push('Leisurely breakfast');
    suggestions.push('Last-minute souvenir shopping');
    suggestions.push('Check-out and transfer to airport');
  } else {
    // Mid-trip suggestions based on interests
    if (interests.includes('beach')) {
      suggestions.push('Morning at the beach or pool');
    }
    if (interests.includes('culture') || interests.includes('history')) {
      suggestions.push(`Visit historical sites in ${region}`);
    }
    if (interests.includes('cuisine')) {
      suggestions.push('Turkish cooking class or food tour');
    }
    if (interests.includes('adventure')) {
      suggestions.push('Water sports or adventure activities');
    }
    if (interests.includes('wellness')) {
      suggestions.push('Turkish bath (hamam) experience');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Explore local attractions');
      suggestions.push('Enjoy resort amenities');
    }
  }

  return suggestions;
}

/**
 * Execute a tool function by name
 * @param {string} functionName - Name of the function to execute
 * @param {Object} args - Arguments for the function
 * @returns {Promise<Object>} Function result
 */
async function executeTool(functionName, args) {
  const tools = {
    searchResorts,
    getResort,
    compareResorts,
    buildItinerary
  };

  const tool = tools[functionName];
  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${functionName}`
    };
  }

  return await tool(args);
}

module.exports = {
  searchResorts,
  getResort,
  compareResorts,
  buildItinerary,
  executeTool
};
