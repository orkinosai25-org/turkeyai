const express = require('express');
const router = express.Router();
const { getSearchClient } = require('../config/azureSearch');

/**
 * POST /api/search
 * Semantic search for Turkish travel content
 */
router.post('/', async (req, res) => {
  try {
    const { query, top = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // For demo purposes without actual Azure Search configured
    // This would use Azure AI Search in production
    const mockResults = [
      {
        id: '1',
        title: 'Best Time to Visit Bodrum',
        content: 'Bodrum is best visited between May and October when the weather is warm and sunny.',
        score: 0.95,
        category: 'destination'
      },
      {
        id: '2',
        title: 'Cappadocia Hot Air Balloon Tours',
        content: 'Experience the magical sunrise over Cappadocia\'s unique landscape from a hot air balloon.',
        score: 0.88,
        category: 'activity'
      }
    ];

    res.json({
      results: mockResults,
      query,
      count: mockResults.length,
      brand: 'TürkiyeAI - Powered by OrkinosAI',
      note: 'Configure Azure AI Search for production semantic search'
    });

  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform search',
      details: error.message 
    });
  }
});

module.exports = router;
