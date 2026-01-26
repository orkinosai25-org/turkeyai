const express = require('express');
const router = express.Router();
const Resort = require('../models/Resort');

/**
 * GET /api/resorts
 * Get all resorts with optional filters
 * Query params: destination_id, star_rating, region
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      destination_id: req.query.destination_id,
      region: req.query.region
    };
    
    // Validate and parse star_rating if provided
    if (req.query.star_rating !== undefined) {
      const starRating = parseInt(req.query.star_rating);
      if (isNaN(starRating) || starRating < 1 || starRating > 5) {
        return res.status(400).json({
          error: 'Invalid star_rating',
          message: 'star_rating must be a number between 1 and 5'
        });
      }
      filters.star_rating = starRating;
    }
    
    // Remove null/undefined filters
    Object.keys(filters).forEach(key => 
      (filters[key] === null || filters[key] === undefined) && delete filters[key]
    );
    
    const resorts = await Resort.getAll(filters);
    res.json({
      resorts,
      count: resorts.length,
      filters,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/resorts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resorts',
      message: error.message 
    });
  }
});

/**
 * GET /api/resorts/region/:region
 * Get resorts by region
 */
router.get('/region/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const resorts = await Resort.getByRegion(region);
    
    res.json({
      region,
      resorts,
      count: resorts.length,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/region/:region:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resorts by region',
      message: error.message 
    });
  }
});

/**
 * GET /api/resorts/search/:term
 * Search resorts by name or description
 */
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const resorts = await Resort.search(term);
    
    res.json({
      resorts,
      count: resorts.length,
      searchTerm: term,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/search/:term:', error);
    res.status(500).json({ 
      error: 'Failed to search resorts',
      message: error.message 
    });
  }
});

/**
 * GET /api/resorts/:id
 * Get a specific resort by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resort = await Resort.getById(id);
    
    if (!resort) {
      return res.status(404).json({ 
        error: 'Resort not found',
        id 
      });
    }
    
    res.json({
      resort,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/:id:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resort',
      message: error.message 
    });
  }
});

/**
 * GET /api/resorts/:id/amenities
 * Get amenities for a specific resort
 */
router.get('/:id/amenities', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if resort exists
    const resort = await Resort.getById(id);
    if (!resort) {
      return res.status(404).json({ 
        error: 'Resort not found',
        id 
      });
    }
    
    const amenities = await Resort.getAmenities(id);
    
    res.json({
      resort_id: id,
      resort_name: resort.name,
      amenities,
      count: amenities.length,
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/:id/amenities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resort amenities',
      message: error.message 
    });
  }
});

module.exports = router;
