/**
 * AI Travel Agent Tool Handlers
 * 
 * This file contains the implementation of tool functions that the AI agent can call.
 * Each function interacts with the backend API or database to retrieve information.
 */

const Resort = require('../models/Resort');
const { getSearchClient } = require('./azureSearch');
const { haversineKm } = require('../utils/geoUtils');
const { EXCURSION_CATALOG, PACKAGE_CATALOG, AIRPORT_ROUTES, CAR_RENTAL_CATALOG, CRUISE_CATALOG, PRIVATE_AVIATION_CATALOG, YACHT_CATALOG } = require('../data/travelCatalogs');

/**
 * Search for resorts based on filters
 * 
 * NOTE: This function queries the PostgreSQL database. For advanced filtering
 * (family_friendly, adults_only, vibe_tags), use Azure AI Search which has
 * these fields in the index schema. The database only has basic fields like
 * name, description, star_rating, and destination_id.
 * 
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

    // Build filters for database query (only supports basic fields)
    const filters = {};
    if (region) filters.region = region;
    if (min_star_rating) filters.star_rating = min_star_rating;

    // Get resorts from database
    let resorts = await Resort.getAll(filters);

    // Apply additional filters (will be undefined in DB but may exist in Search index)
    // Note: These filters work best with Azure AI Search which has these fields
    if (family_friendly !== undefined) {
      // Only filter if we have explicit values in the database
      resorts = resorts.filter(r => {
        if (r.family_friendly !== undefined) {
          return r.family_friendly === family_friendly;
        }
        // If field is undefined, include it (no data to filter on)
        return true;
      });
    }
    if (adults_only !== undefined) {
      resorts = resorts.filter(r => {
        if (r.adults_only !== undefined) {
          return r.adults_only === adults_only;
        }
        // If field is undefined, include it (no data to filter on)
        return true;
      });
    }
    if (vibe) {
      resorts = resorts.filter(r => {
        const tags = r.vibe_tags || [];
        // Only filter if we have tags
        if (Array.isArray(tags) && tags.length > 0) {
          return tags.includes(vibe);
        }
        // If no tags, include it (no data to filter on)
        return true;
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
        price_range: r.price_range || 'Contact for pricing',
        // These fields may be undefined if not in database
        family_friendly: r.family_friendly,
        adults_only: r.adults_only,
        vibe_tags: r.vibe_tags || [],
        beach_type: r.beach_type
      })),
      filters: params,
      note: 'For advanced filtering, Azure AI Search integration is recommended'
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
 * 
 * NOTE: Extended fields (family_friendly, adults_only, vibe_tags, etc.) may be
 * undefined in PostgreSQL. Use Azure AI Search for complete resort data.
 * 
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
        price_range: resort.price_range || 'Contact for pricing',
        // Extended fields - may be undefined if not in database
        family_friendly: resort.family_friendly,
        adults_only: resort.adults_only,
        vibe_tags: resort.vibe_tags || [],
        beach_type: resort.beach_type,
        season_notes: resort.season_notes,
        distance_to_airport: resort.distance_to_airport,
        amenities: amenities.map(a => a.amenity_name || a.name)
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
        price_range: resort.price_range || 'Contact for pricing',
        // Extended fields - may be undefined if not in database
        family_friendly: resort.family_friendly,
        adults_only: resort.adults_only,
        vibe_tags: resort.vibe_tags || [],
        beach_type: resort.beach_type,
        distance_to_airport: resort.distance_to_airport,
        amenities: amenities.map(a => a.amenity_name || a.name)
      };
    });

    // Add comparison summary (handle undefined values gracefully)
    const summary = {
      total_compared: comparison.length,
      star_ratings: comparison.map(r => ({ name: r.name, rating: r.star_rating })),
      family_friendly_count: comparison.filter(r => r.family_friendly === true).length,
      adults_only_count: comparison.filter(r => r.adults_only === true).length,
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
 * Get comprehensive deep-dive profile for a resort
 */
async function getResortDeepDive(params) {
  try {
    const { resort_id } = params;
    if (!resort_id) {
      return { success: false, error: 'resort_id is required' };
    }

    const [resort, amenities] = await Promise.all([
      Resort.getById(resort_id),
      Resort.getAmenities(resort_id),
    ]);

    if (!resort) {
      return { success: false, error: 'Resort not found', resort_id };
    }

    return {
      success: true,
      resort: {
        id: resort.id,
        name: resort.name,
        destination: resort.destination_name,
        region: resort.destination_region,
        star_rating: resort.star_rating,
        description: resort.description,
        price_range: resort.price_range || 'Contact for pricing',
        amenities: amenities.map(a => a.amenity_name),
        latitude: resort.latitude,
        longitude: resort.longitude,
      },
      deep_dive_url: `/api/resorts/${resort_id}/deep-dive`,
      note: 'Full proximity and AI insight data available at the deep-dive endpoint.',
    };
  } catch (error) {
    return { success: false, error: 'Failed to get resort deep dive', message: error.message };
  }
}

/**
 * Get nearby resorts using proximity AI learning
 */
async function getNearbyResorts(params) {
  try {
    const { resort_id, radius_km = 15 } = params;
    if (!resort_id) {
      return { success: false, error: 'resort_id is required' };
    }

    const pivot = await Resort.getById(resort_id);
    if (!pivot) {
      return { success: false, error: 'Resort not found', resort_id };
    }

    if (!pivot.latitude || !pivot.longitude) {
      return {
        success: true,
        pivot_resort: { id: pivot.id, name: pivot.name },
        nearby_resorts: [],
        note: 'Coordinate data not available – proximity calculation unavailable for this resort.',
      };
    }

    const allResorts = await Resort.getAll({ region: pivot.destination_region });

    const nearby = allResorts
      .filter(r => r.id !== resort_id && r.latitude && r.longitude)
      .map(r => {
        const dist = haversineKm(
          parseFloat(pivot.latitude), parseFloat(pivot.longitude),
          parseFloat(r.latitude), parseFloat(r.longitude)
        );
        return {
          id: r.id,
          name: r.name,
          star_rating: r.star_rating,
          destination: r.destination_name,
          distance_km: Math.round(dist * 10) / 10,
        };
      })
      .filter(r => r.distance_km <= radius_km)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 10);

    return {
      success: true,
      pivot_resort: { id: pivot.id, name: pivot.name, destination: pivot.destination_name },
      nearby_resorts: nearby,
      count: nearby.length,
      radius_km,
    };
  } catch (error) {
    return { success: false, error: 'Failed to find nearby resorts', message: error.message };
  }
}

/**
 * Search excursions catalog
 */
async function searchExcursions(params) {
  let results = [...EXCURSION_CATALOG];
  if (params.destination) results = results.filter(e => e.destination.toLowerCase() === params.destination.toLowerCase());
  if (params.type) results = results.filter(e => e.type.toLowerCase() === params.type.toLowerCase());
  if (params.difficulty) results = results.filter(e => e.difficulty.toLowerCase() === params.difficulty.toLowerCase());

  return {
    success: true,
    excursions: results,
    count: results.length,
    note: 'Prices are indicative. Bookings via licensed providers.',
  };
}

/**
 * Search holiday packages catalog
 */
async function searchPackages(params) {
  let results = [...PACKAGE_CATALOG];
  if (params.destination) results = results.filter(p => p.destination.toLowerCase() === params.destination.toLowerCase());
  if (params.category) results = results.filter(p => p.category.toLowerCase().includes(params.category.toLowerCase()));
  if (params.board_basis) results = results.filter(p => p.board_basis.toLowerCase().includes(params.board_basis.toLowerCase()));
  if (params.duration_min) results = results.filter(p => p.duration_nights >= parseInt(params.duration_min, 10));
  if (params.duration_max) results = results.filter(p => p.duration_nights <= parseInt(params.duration_max, 10));

  return {
    success: true,
    packages: results,
    count: results.length,
    note: 'Prices are per person (pp) and indicative. Bookings via ATOL-protected licensed providers.',
  };
}

/**
 * Get airport transfer options for a destination
 */
async function getTransferOptions(params) {
  const { destination } = params;

  // Build a consistent route lookup from shared AIRPORT_ROUTES catalog
  const ROUTE_OVERRIDES = {
    Izmir: { airport: 'ADB', airport_name: 'Adnan Menderes Airport', base_eur: 20, distance_km: 18 },
    Cappadocia: { airport: 'ESB', airport_name: 'Nevşehir Airport', base_eur: 60, distance_km: 75 },
  };

  let route = AIRPORT_ROUTES.find(r => r.destination.toLowerCase() === (destination || '').toLowerCase());
  if (!route) {
    const override = ROUTE_OVERRIDES[destination];
    if (override) {
      route = { destination, from: override.airport, base_price_eur: override.base_eur, distance_km: override.distance_km };
    }
  }

  if (!route) {
    return {
      success: false,
      error: `No transfer data for destination: ${destination}`,
      available_destinations: [
        ...AIRPORT_ROUTES.map(r => r.destination),
        ...Object.keys(ROUTE_OVERRIDES),
      ],
    };
  }

  const override = ROUTE_OVERRIDES[route.destination];
  const airportCode = override ? override.airport : route.from;
  const airportName = override ? override.airport_name : `${airportCode} Airport`;
  const baseEur = route.base_price_eur;

  return {
    success: true,
    destination: route.destination,
    nearest_airport: { code: airportCode, name: airportName, distance_km: route.distance_km },
    transfer_options: [
      { type: 'Shared Shuttle', vehicle: 'Minibus', approx_price_eur: Math.round(baseEur * 0.4), capacity: 16 },
      { type: 'Private Transfer', vehicle: 'Executive Saloon', approx_price_eur: baseEur, capacity: 3 },
      { type: 'Private Transfer', vehicle: 'MPV / Minivan', approx_price_eur: Math.round(baseEur * 1.3), capacity: 7 },
      { type: 'Private Transfer', vehicle: 'Luxury SUV', approx_price_eur: Math.round(baseEur * 1.6), capacity: 5 },
    ],
    note: 'Prices are indicative. Final pricing confirmed at booking via licensed ground transport providers.',
  };
}

/**
 * Search car rental options at Turkish airports via Carnect GDS
 */
async function searchCarRentals(params) {
  let results = [...CAR_RENTAL_CATALOG];
  if (params.airport) {
    const iata = params.airport.toUpperCase();
    results = results.filter(c => c.available_airports.includes(iata));
  }
  if (params.category) {
    results = results.filter(c => c.category.toLowerCase().includes(params.category.toLowerCase()));
  }
  if (params.seats_min) {
    const min = parseInt(params.seats_min, 10);
    if (!isNaN(min)) results = results.filter(c => c.seats >= min);
  }

  return {
    success: true,
    cars: results,
    count: results.length,
    gds_supplier: 'Carnect',
    note: 'Prices are indicative per-day rates. Live availability and final pricing via Carnect GDS at booking.',
  };
}

/**
 * Search cruise itineraries departing from or calling at Turkish ports
 */
async function searchCruises(params) {
  let results = [...CRUISE_CATALOG];
  if (params.departure_port) {
    results = results.filter(c => c.departure_port.toLowerCase().includes(params.departure_port.toLowerCase()));
  }
  if (params.ship_type) {
    results = results.filter(c => c.ship_type.toLowerCase().includes(params.ship_type.toLowerCase()));
  }
  if (params.duration_min) {
    const min = parseInt(params.duration_min, 10);
    if (!isNaN(min)) results = results.filter(c => c.duration_nights >= min);
  }
  if (params.duration_max) {
    const max = parseInt(params.duration_max, 10);
    if (!isNaN(max)) results = results.filter(c => c.duration_nights <= max);
  }

  return {
    success: true,
    cruises: results,
    count: results.length,
    note: 'Prices are per person (pp) and indicative. Bookings via licensed cruise operators.',
  };
}

/**
 * Search private aviation charter options to Turkish airports
 */
async function searchPrivateAviation(params) {
  let results = [...PRIVATE_AVIATION_CATALOG];
  if (params.aircraft_type) {
    results = results.filter(a => a.aircraft_type.toLowerCase().includes(params.aircraft_type.toLowerCase()));
  }
  if (params.max_passengers_min) {
    const min = parseInt(params.max_passengers_min, 10);
    if (!isNaN(min)) results = results.filter(a => a.max_passengers >= min);
  }

  return {
    success: true,
    private_aviation: results,
    count: results.length,
    note: 'Charter prices are indicative per-sector from prices. Actual quotes vary by date, routing, and operator.',
  };
}

/**
 * Search private boat and yacht charters along the Turkish coast
 */
async function searchYachts(params) {
  let results = [...YACHT_CATALOG];
  if (params.vessel_type) {
    results = results.filter(y => y.vessel_type.toLowerCase().includes(params.vessel_type.toLowerCase()));
  }
  if (params.home_port) {
    results = results.filter(y => y.home_port.toLowerCase().includes(params.home_port.toLowerCase()));
  }
  if (params.max_guests_min) {
    const min = parseInt(params.max_guests_min, 10);
    if (!isNaN(min)) results = results.filter(y => y.max_guests >= min);
  }

  return {
    success: true,
    yachts: results,
    count: results.length,
    gds_supplier: 'GRN (Global Resort Network)',
    note: 'Prices are indicative per-week from prices. Final pricing confirmed with vessel owner/manager.',
  };
}

/**
 * Search the live knowledge base for destination-specific or recent information
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} Knowledge search results
 */
async function searchKnowledgeBase(params) {
  const { query, location_tag, top = 5 } = params;

  if (!query) {
    return { success: false, error: 'query is required for knowledge base search' };
  }

  try {
    const { searchKnowledge } = require('./knowledgeSearch');
    const results = await searchKnowledge(query, { location_tag, top });

    if (results.length === 0) {
      return {
        success: true,
        results: [],
        count: 0,
        message: 'No relevant knowledge base entries found for this query.'
      };
    }

    return {
      success: true,
      results: results.map(r => ({
        title: r.title,
        content: r.content,
        source_type: r.source_type,
        source_url: r.source_url || null,
        location_tags: r.location_tags || [],
        content_category: r.content_category,
        created_at: r.created_at
      })),
      count: results.length
    };
  } catch (err) {
    console.warn('Knowledge base search unavailable:', err.message);
    return {
      success: false,
      error: 'Knowledge base is not available at this time.',
      details: err.message
    };
  }
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
    buildItinerary,
    getResortDeepDive,
    getNearbyResorts,
    searchExcursions,
    searchPackages,
    getTransferOptions,
    searchCarRentals,
    searchCruises,
    searchPrivateAviation,
    searchYachts,
    searchKnowledgeBase,
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
  getResortDeepDive,
  getNearbyResorts,
  searchExcursions,
  searchPackages,
  getTransferOptions,
  searchCarRentals,
  searchCruises,
  searchPrivateAviation,
  searchYachts,
  searchKnowledgeBase,
  executeTool
};
