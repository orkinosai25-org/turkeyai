const express = require('express');
const router = express.Router();
const { getSearchClient } = require('../config/azureSearch');

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
      // Fall back to mock results if Azure Search is not configured
      console.warn('Azure AI Search not available, using mock results:', searchError.message);
      
      const mockResults = [
        {
          id: '1',
          resort_name: 'Sample Luxury Beach Resort',
          region: 'Bodrum',
          description: 'Bodrum is best visited between May and October when the weather is warm and sunny.',
          score: 0.95,
          amenities: ['Pool', 'Spa', 'Beach Access'],
          vibe_tags: ['luxury', 'beach'],
          star_rating: 5
        },
        {
          id: '2',
          resort_name: 'Family-Friendly Seaside Hotel',
          region: 'Antalya',
          description: 'Perfect resort for families with children, featuring kids club and family activities.',
          score: 0.88,
          amenities: ['Kids Club', 'Pool', 'Restaurant'],
          vibe_tags: ['family', 'beach'],
          star_rating: 4
        }
      ];

      res.json({
        results: mockResults,
        query,
        count: mockResults.length,
        brand: 'TürkiyeAI - Powered by OrkinosAI',
        note: 'Using mock data. Configure Azure AI Search for production semantic search.'
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
