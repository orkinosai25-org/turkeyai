const express = require('express');
const router = express.Router();
const {
  TURKISH_AIRPORTS,
  EXCURSION_CATALOG,
  TRANSFER_TYPES,
  AIRPORT_ROUTES,
  PACKAGE_CATALOG,
} = require('../data/travelCatalogs');

/**
 * Travel Service Verticals for TürkiyeAI
 * Inspired by LAR system service architecture
 * Covers: flights, transfers, excursions, packages, cars
 */

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/services
 * Overview of all available service verticals
 */
router.get('/', (req, res) => {
  res.json({
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    service_verticals: [
      {
        vertical: 'hotels',
        title: 'Hotels & Resorts',
        description: 'Luxury and boutique hotels across Turkey\'s finest destinations.',
        icon: '🏨',
        endpoint: '/api/resorts',
      },
      {
        vertical: 'excursions',
        title: 'Excursions & Experiences',
        description: 'Curated day trips, tours, and authentic Turkish experiences.',
        icon: '🗺️',
        endpoint: '/api/services/excursions',
      },
      {
        vertical: 'transfers',
        title: 'Airport Transfers',
        description: 'Private, shared, and luxury airport transfers across Turkey.',
        icon: '🚗',
        endpoint: '/api/services/transfers',
      },
      {
        vertical: 'packages',
        title: 'Holiday Packages',
        description: 'Curated all-inclusive and tailor-made holiday packages.',
        icon: '🎒',
        endpoint: '/api/services/packages',
      },
      {
        vertical: 'flights',
        title: 'Flight Information',
        description: 'Airport information and flight route guidance for Turkey.',
        icon: '✈️',
        endpoint: '/api/services/flights',
      },
    ],
  });
});

/**
 * GET /api/services/excursions
 * Excursions & experiences catalog
 * Query params: destination, type, difficulty, min_age
 */
router.get('/excursions', (req, res) => {
  const { destination, type, difficulty } = req.query;

  let results = [...EXCURSION_CATALOG];

  if (destination) {
    results = results.filter(e =>
      e.destination.toLowerCase() === destination.toLowerCase()
    );
  }
  if (type) {
    results = results.filter(e =>
      e.type.toLowerCase() === type.toLowerCase()
    );
  }
  if (difficulty) {
    results = results.filter(e =>
      e.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  res.json({
    excursions: results,
    count: results.length,
    filters: { destination, type, difficulty },
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Excursion prices are indicative. Final pricing confirmed at booking via licensed providers.',
  });
});

/**
 * GET /api/services/excursions/:id
 * Single excursion detail
 */
router.get('/excursions/:id', (req, res) => {
  const excursion = EXCURSION_CATALOG.find(e => e.id === req.params.id);
  if (!excursion) {
    return res.status(404).json({ error: 'Excursion not found', id: req.params.id });
  }
  res.json({
    excursion,
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Prices are indicative. Bookings completed via licensed providers.',
  });
});

/**
 * GET /api/services/transfers
 * Airport transfer options
 * Query params: airport (IATA code), destination
 */
router.get('/transfers', (req, res) => {
  const { airport, destination } = req.query;

  let routes = [...AIRPORT_ROUTES];

  if (airport) {
    routes = routes.filter(r =>
      r.from.toLowerCase() === airport.toUpperCase()
    );
  }
  if (destination) {
    routes = routes.filter(r =>
      r.destination.toLowerCase().includes(destination.toLowerCase())
    );
  }

  // Enrich routes with vehicle options
  const enrichedRoutes = routes.map(route => ({
    ...route,
    vehicles: TRANSFER_TYPES.map(v => ({
      ...v,
      price_eur: Math.round(route.base_price_eur * v.price_multiplier),
    })),
  }));

  res.json({
    transfers: enrichedRoutes,
    count: enrichedRoutes.length,
    airports: TURKISH_AIRPORTS,
    filters: { airport, destination },
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Transfer prices are indicative. Bookings via licensed ground transport providers.',
  });
});

/**
 * GET /api/services/packages
 * Holiday packages catalog
 * Query params: destination, category, duration_min, duration_max, board_basis
 */
router.get('/packages', (req, res) => {
  const { destination, category, duration_min, duration_max, board_basis } = req.query;

  let results = [...PACKAGE_CATALOG];

  if (destination) {
    results = results.filter(p =>
      p.destination.toLowerCase() === destination.toLowerCase()
    );
  }
  if (category) {
    results = results.filter(p =>
      p.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (board_basis) {
    results = results.filter(p =>
      p.board_basis.toLowerCase().includes(board_basis.toLowerCase())
    );
  }
  if (duration_min) {
    const min = parseInt(duration_min, 10);
    if (!isNaN(min)) results = results.filter(p => p.duration_nights >= min);
  }
  if (duration_max) {
    const max = parseInt(duration_max, 10);
    if (!isNaN(max)) results = results.filter(p => p.duration_nights <= max);
  }

  res.json({
    packages: results,
    count: results.length,
    filters: { destination, category, duration_min, duration_max, board_basis },
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Prices are indicative from prices per person (pp). Final pricing via licensed ATOL-protected providers.',
  });
});

/**
 * GET /api/services/packages/:id
 * Single package detail
 */
router.get('/packages/:id', (req, res) => {
  const pkg = PACKAGE_CATALOG.find(p => p.id === req.params.id);
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found', id: req.params.id });
  }
  res.json({
    package: pkg,
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'TürkiyeAI is an AI discovery platform. Bookings are completed via licensed travel providers.',
  });
});

/**
 * GET /api/services/flights
 * Turkish airport information and key route guidance
 */
router.get('/flights', (req, res) => {
  res.json({
    message: 'TürkiyeAI provides airport and route guidance. For live flight search, connect to a licensed GDS (e.g. Amadeus, Sabre).',
    airports: TURKISH_AIRPORTS,
    popular_uk_routes: [
      { from: 'London (LHR/LGW)', to: 'Istanbul (IST)', airlines: ['Turkish Airlines', 'British Airways', 'easyJet'], approx_flight_time: '3h 50m' },
      { from: 'London (LGW)', to: 'Antalya (AYT)', airlines: ['TUI', 'Jet2', 'easyJet'], approx_flight_time: '4h 15m' },
      { from: 'London (LGW)', to: 'Bodrum (BJV)', airlines: ['TUI', 'Jet2', 'easyJet'], approx_flight_time: '4h 05m' },
      { from: 'Manchester (MAN)', to: 'Antalya (AYT)', airlines: ['Jet2', 'TUI', 'Ryanair'], approx_flight_time: '4h 20m' },
      { from: 'Birmingham (BHX)', to: 'Dalaman (DLM)', airlines: ['TUI', 'Jet2'], approx_flight_time: '4h 10m' },
    ],
    note: 'All flight durations are approximate. Availability and pricing from licensed flight providers.',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
  });
});

module.exports = router;
