const express = require('express');
const router = express.Router();
const { getSearchClient } = require('../config/azureSearch');
const { HOTEL_RESORT_CATALOG } = require('../data/travelCatalogs');

// Common words to exclude from keyword matching
const SEARCH_STOP_WORDS = ['hotel', 'in', 'near', 'at', 'resort', 'the', 'a', 'and'];

// Score weights for keyword matching
const DEFAULT_STAR_RATING = 3;
const STAR_RATING_BOOST_FACTOR = 0.02;

/**
 * Perform keyword + location matching against the local hotel catalog.
 * Returns results sorted by relevance score descending.
 *
 * @param {string} query     - Raw search query from the user
 * @param {object} filters   - Optional filters: region, family_friendly, adults_only, min_rating
 * @param {number} top       - Maximum number of results to return
 * @returns {Array}          - Matched hotel objects with a `score` property (0–1)
 */
function searchHotelCatalog(query, filters = {}, top = 10) {
  // Tokenise the query into lowercase words / phrases
  const normalizedQuery = (query || '').toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const scored = HOTEL_RESORT_CATALOG.map(hotel => {
    // Build a searchable text blob from all relevant hotel fields
    const searchBlob = [
      hotel.resort_name,
      hotel.region,
      hotel.location,
      hotel.description,
      (hotel.vibe_tags || []).join(' '),
      (hotel.amenities || []).join(' '),
      hotel.beach_type,
      hotel.board_basis,
    ].join(' ').toLowerCase();

    let keywordScore = 0;

    for (const token of tokens) {
      if (!token || token.length < 2) continue;
      // Skip very common search-only words
      if (SEARCH_STOP_WORDS.includes(token)) continue;

      if (hotel.location && hotel.location.toLowerCase().includes(token)) {
        // Neighbourhood/location match is most specific — highest weight
        keywordScore += 0.5;
      } else if (hotel.region && hotel.region.toLowerCase().includes(token)) {
        // Region match
        keywordScore += 0.35;
      } else if (searchBlob.includes(token)) {
        // General text match
        keywordScore += 0.15;
      }
    }

    // Boost by star rating so higher-star hotels rank first among equals
    const score = keywordScore > 0
      ? Math.min(keywordScore + (hotel.star_rating || DEFAULT_STAR_RATING) * STAR_RATING_BOOST_FACTOR, 1)
      : 0;

    return { ...hotel, score };
  });

  // Apply optional filters
  let results = scored.filter(hotel => {
    if (hotel.score <= 0) return false;
    if (filters.region) {
      if (hotel.region.toLowerCase() !== filters.region.toLowerCase()) return false;
    }
    if (filters.family_friendly !== undefined) {
      if (hotel.family_friendly !== filters.family_friendly) return false;
    }
    if (filters.adults_only !== undefined) {
      if (hotel.adults_only !== filters.adults_only) return false;
    }
    if (filters.min_rating) {
      const rating = parseInt(filters.min_rating, 10);
      if (!isNaN(rating) && (hotel.star_rating || 0) < rating) return false;
    }
    return true;
  });

  // If the query is very generic (only stop-words stripped out) and no filter,
  // return a curated default selection so the page is never empty.
  if (results.length === 0) {
    results = scored
      .filter(h => !filters.region || h.region.toLowerCase() === filters.region.toLowerCase())
      .sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));
  }

  // Sort by score descending, cap at `top`
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

/**
 * POST /api/search
 * Semantic search for Turkish travel content using Azure AI Search
 */
router.post('/', async (req, res) => {
  try {
    const { query, filters = {}, top = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    try {
      // Try to use Azure AI Search if configured
      const searchClient = getSearchClient();
      
      // Build search options
      const searchOptions = {
        top,
        select: [
          'id', 'resort_name', 'region', 'description', 
          'amenities', 'vibe_tags', 'star_rating', 'price_range',
          'beach_type', 'season_notes', 'family_friendly', 'adults_only'
        ],
        queryType: 'semantic',
        semanticConfiguration: 'resort-semantic-config',
        includeTotalCount: true
      };

      // Add filters if provided
      const filterClauses = [];
      if (filters.region) {
        // Escape single quotes to prevent OData injection
        const escapedRegion = filters.region.replace(/'/g, "''");
        filterClauses.push(`region eq '${escapedRegion}'`);
      }
      if (filters.family_friendly !== undefined) filterClauses.push(`family_friendly eq ${filters.family_friendly}`);
      if (filters.adults_only !== undefined) filterClauses.push(`adults_only eq ${filters.adults_only}`);
      if (filters.min_rating) {
        // Ensure min_rating is a number to prevent injection
        const rating = parseInt(filters.min_rating, 10);
        if (!isNaN(rating)) {
          filterClauses.push(`star_rating ge ${rating}`);
        }
      }
      
      if (filterClauses.length > 0) {
        searchOptions.filter = filterClauses.join(' and ');
      }

      // Perform search
      const searchResults = await searchClient.search(query, searchOptions);
      
      // Collect results
      const results = [];
      for await (const result of searchResults.results) {
        results.push({
          ...result.document,
          score: result.score
        });
      }

      res.json({
        results,
        query,
        count: results.length,
        totalCount: searchResults.count,
        brand: 'TürkiyeAI - Powered by OrkinosAI'
      });

    } catch (searchError) {
      // Fall back to catalog-based search if Azure AI Search is not configured
      console.warn('Azure AI Search not available, using catalog fallback:', searchError.message);

      const results = searchHotelCatalog(query, filters, top);

      res.json({
        results,
        query,
        count: results.length,
        brand: 'TürkiyeAI - Powered by OrkinosAI',
        note: 'Using catalog data. Configure Azure AI Search for full semantic search.'
      });
    }

  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform search',
      details: error.message 
    });
  }
});

module.exports = router;
