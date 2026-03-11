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
    highlights: [
      {
        title: 'Bodrum Castle',
        description: 'The iconic 15th-century crusader castle overlooking the turquoise bay, housing the Museum of Underwater Archaeology.',
        image: 'https://source.unsplash.com/featured/800x500/?bodrum,castle,turkey'
      },
      {
        title: 'Beach Clubs',
        description: 'World-class beach clubs along the Aegean shores, perfect for sunbathing, swimming and sunset cocktails.',
        image: 'https://source.unsplash.com/featured/800x500/?aegean,beach,club'
      },
      {
        title: 'Ancient Theater',
        description: 'A 2,000-year-old open-air theater with stunning panoramic views over the bay and surrounding hillsides.',
        image: 'https://source.unsplash.com/featured/800x500/?ancient,theater,turkey'
      },
      {
        title: 'Marina',
        description: 'Spectacular marina filled with luxury yachts, lined with waterfront restaurants and boutique shops.',
        image: 'https://source.unsplash.com/featured/800x500/?bodrum,marina,yacht'
      }
    ],
    bestTime: 'May to October',
    type: 'Beach & Culture'
  },
  {
    id: 2,
    name: 'Cappadocia',
    region: 'Central Anatolia',
    description: 'Famous for its unique rock formations, hot air balloon rides, and underground cities.',
    highlights: [
      {
        title: 'Hot Air Balloons',
        description: 'Magical sunrise balloon rides drifting above thousands of fairy chimneys – the most iconic experience in all of Türkiye.',
        image: 'https://source.unsplash.com/featured/800x500/?cappadocia,balloon,sunrise'
      },
      {
        title: 'Göreme Open Air Museum',
        description: 'Ancient rock-cut cave churches adorned with extraordinary Byzantine frescoes, a UNESCO World Heritage Site.',
        image: 'https://source.unsplash.com/featured/800x500/?cappadocia,goreme,cave,church'
      },
      {
        title: 'Underground Cities',
        description: 'Explore Derinkuyu or Kaymaklı – vast underground cities carved into volcanic rock, sheltering thousands of people in ancient times.',
        image: 'https://source.unsplash.com/featured/800x500/?cappadocia,underground,cave'
      },
      {
        title: 'Fairy Chimneys',
        description: 'Otherworldly rock formations sculpted over millions of years from volcanic ash, creating a truly extraordinary landscape.',
        image: 'https://source.unsplash.com/featured/800x500/?cappadocia,fairy,chimneys,rocks'
      }
    ],
    bestTime: 'April to June, September to November',
    type: 'Nature & Culture'
  },
  {
    id: 3,
    name: 'Antalya',
    region: 'Mediterranean Coast',
    description: 'Turkey\'s tourism capital with beautiful beaches and ancient ruins.',
    highlights: [
      {
        title: 'Old Town (Kaleiçi)',
        description: 'Charming historic quarter with Roman-era harbour walls, narrow cobbled streets, and beautifully preserved Ottoman mansions.',
        image: 'https://source.unsplash.com/featured/800x500/?antalya,old,town,harbour'
      },
      {
        title: 'Düden Waterfalls',
        description: 'Spectacular cascading waterfalls that dramatically plunge into the Mediterranean Sea from towering limestone cliffs.',
        image: 'https://source.unsplash.com/featured/800x500/?waterfall,mediterranean,turkey'
      },
      {
        title: 'Ancient Ruins',
        description: 'The ancient cities of Perge, Aspendos, and Side are all within easy reach, offering remarkable glimpses into Roman life.',
        image: 'https://source.unsplash.com/featured/800x500/?roman,ruins,turkey,ancient'
      },
      {
        title: 'Beaches',
        description: 'Pristine stretches of turquoise water along the Turkish Riviera – from Lara Beach to Konyaaltı – with fine sand and crystal-clear seas.',
        image: 'https://source.unsplash.com/featured/800x500/?antalya,beach,turquoise,sea'
      }
    ],
    bestTime: 'April to October',
    type: 'Beach & History'
  },
  {
    id: 4,
    name: 'Marmaris',
    region: 'Aegean Coast',
    description: 'Popular resort town with a beautiful marina and vibrant atmosphere.',
    highlights: [
      {
        title: 'Marmaris Marina',
        description: 'One of Turkey\'s largest marinas with hundreds of berths, perfect as a base for Blue Cruise gulet tours along the Aegean.',
        image: 'https://source.unsplash.com/featured/800x500/?marmaris,marina,boats,turkey'
      },
      {
        title: 'Beach Promenade',
        description: 'The vibrant palm-lined promenade stretching along the seafront, buzzing with cafes, bars, shops and evening strollers.',
        image: 'https://source.unsplash.com/featured/800x500/?promenade,beach,resort,summer'
      },
      {
        title: 'Boat Tours',
        description: 'Discover hidden coves, sea caves, and deserted beaches on a classic Blue Cruise gulet, the perfect way to explore the coastline.',
        image: 'https://source.unsplash.com/featured/800x500/?blue,cruise,gulet,aegean,sea'
      },
      {
        title: 'Nightlife',
        description: 'One of Turkey\'s most celebrated nightlife destinations, with the legendary Bar Street alive with music and energy until sunrise.',
        image: 'https://source.unsplash.com/featured/800x500/?resort,nightlife,summer,lights'
      }
    ],
    bestTime: 'May to October',
    type: 'Beach & Resort'
  },
  {
    id: 5,
    name: 'Fethiye',
    region: 'Mediterranean Coast',
    description: 'Gateway to the Turquoise Coast with stunning beaches and ancient Lycian sites.',
    highlights: [
      {
        title: 'Ölüdeniz',
        description: 'The most picturesque place in Türkiye – the iconic Blue Lagoon with impossibly turquoise water, powdery white sand and a dramatic mountain backdrop.',
        image: 'https://source.unsplash.com/featured/800x500/?oludeniz,blue,lagoon,turkey'
      },
      {
        title: 'Katranci Bay',
        description: 'Popular for camping along its pine-forested shores; a tranquil bay with a beautiful beach that is well worth the trip for its peace and natural beauty.',
        image: 'https://source.unsplash.com/featured/800x500/?fethiye,bay,camping,pine,beach'
      },
      {
        title: 'Butterfly Valley',
        description: 'A secluded paradise accessible only by boat, where hundreds of rare butterfly species inhabit a lush green canyon with a hidden waterfall.',
        image: 'https://source.unsplash.com/featured/800x500/?butterfly,valley,canyon,turkey'
      },
      {
        title: 'Lycian Tombs',
        description: 'Spectacular ancient Lycian tombs dramatically carved into the cliff face high above the town, visible from the harbour below.',
        image: 'https://source.unsplash.com/featured/800x500/?lycian,tomb,fethiye,cliff'
      }
    ],
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
