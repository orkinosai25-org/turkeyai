const express = require('express');
const router = express.Router();

/**
 * Sample Turkish travel destinations data
 * In production, this would come from Azure PostgreSQL
 */
const destinations = [
  {
    id: 1,
    name: 'Bodrum',
    region: 'Aegean Coast',
    description: 'A stunning coastal town known for its beaches, nightlife, and ancient history.',
    highlights: ['Bodrum Castle', 'Beach Clubs', 'Ancient Theater', 'Marina'],
    bestTime: 'May to October',
    type: 'Beach & Culture'
  },
  {
    id: 2,
    name: 'Cappadocia',
    region: 'Central Anatolia',
    description: 'Famous for its unique rock formations, hot air balloon rides, and underground cities.',
    highlights: ['Hot Air Balloons', 'Göreme Open Air Museum', 'Underground Cities', 'Fairy Chimneys'],
    bestTime: 'April to June, September to November',
    type: 'Nature & Culture'
  },
  {
    id: 3,
    name: 'Antalya',
    region: 'Mediterranean Coast',
    description: 'Turkey\'s tourism capital with beautiful beaches and ancient ruins.',
    highlights: ['Old Town (Kaleiçi)', 'Düden Waterfalls', 'Ancient Ruins', 'Beaches'],
    bestTime: 'April to October',
    type: 'Beach & History'
  },
  {
    id: 4,
    name: 'Marmaris',
    region: 'Aegean Coast',
    description: 'Popular resort town with a beautiful marina and vibrant atmosphere.',
    highlights: ['Marmaris Marina', 'Beach Promenade', 'Boat Tours', 'Nightlife'],
    bestTime: 'May to October',
    type: 'Beach & Resort'
  },
  {
    id: 5,
    name: 'Fethiye',
    region: 'Mediterranean Coast',
    description: 'Gateway to the Turquoise Coast with stunning beaches and ancient Lycian sites.',
    highlights: ['Ölüdeniz Beach', 'Blue Lagoon', 'Butterfly Valley', 'Lycian Tombs'],
    bestTime: 'May to October',
    type: 'Beach & Nature'
  }
];

/**
 * GET /api/destinations
 * Get all destinations
 */
router.get('/', (req, res) => {
  res.json({
    destinations,
    count: destinations.length,
    brand: 'TürkiyeAI - Powered by OrkinosAI'
  });
});

/**
 * GET /api/destinations/:id
 * Get a specific destination by ID
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const destination = destinations.find(d => d.id === id);
  
  if (!destination) {
    return res.status(404).json({ error: 'Destination not found' });
  }
  
  res.json({
    destination,
    brand: 'TürkiyeAI - Powered by OrkinosAI'
  });
});

module.exports = router;
