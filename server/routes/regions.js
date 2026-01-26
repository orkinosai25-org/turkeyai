const express = require('express');
const router = express.Router();
const Region = require('../models/Region');

/**
 * GET /api/regions
 * Get all distinct regions
 */
router.get('/', async (req, res) => {
  try {
    const regions = await Region.getAll();
    res.json({
      regions,
      count: regions.length,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/regions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch regions',
      message: error.message 
    });
  }
});

/**
 * GET /api/regions/:name
 * Get a specific region with its destinations
 */
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const destinations = await Region.getByName(name);
    
    if (destinations.length === 0) {
      return res.status(404).json({ 
        error: 'Region not found',
        region: name
      });
    }
    
    res.json({
      region: name,
      destinations,
      count: destinations.length,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/regions/:name:', error);
    res.status(500).json({ 
      error: 'Failed to fetch region',
      message: error.message 
    });
  }
});

/**
 * GET /api/regions/search/:term
 * Search regions by name
 */
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const regions = await Region.search(term);
    
    res.json({
      regions,
      count: regions.length,
      searchTerm: term,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/regions/search/:term:', error);
    res.status(500).json({ 
      error: 'Failed to search regions',
      message: error.message 
    });
  }
});

module.exports = router;
