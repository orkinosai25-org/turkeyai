const express = require('express');
const router = express.Router();
const {
  TURKISH_AIRPORTS,
  EXCURSION_CATALOG,
  TRANSFER_TYPES,
  AIRPORT_ROUTES,
  PACKAGE_CATALOG,
  CAR_RENTAL_CATALOG,
  CRUISE_CATALOG,
  PRIVATE_AVIATION_CATALOG,
  YACHT_CATALOG,
} = require('../data/travelCatalogs');

/**
 * Travel Service Verticals for TürkiyeAI
 * GDS/supplier integrations: Amadeus (flights), TBO/PROVAB (hotels),
 * Carnect (cars), GRN (villas/yachts), plus Cruises & Private Aviation.
 * Covers: flights, hotels, cars, transfers, excursions, packages,
 *         cruises, private aviation, private boats & yachts
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
        supplier_note: 'Hotel availability via TBO, PROVAB contracted supplier APIs.',
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
        supplier_note: 'Live flight search via Amadeus GDS integration.',
      },
      {
        vertical: 'cars',
        title: 'Car Hire',
        description: 'Car rental at all major Turkish airports via Carnect GDS.',
        icon: '🚗',
        endpoint: '/api/services/cars',
        supplier_note: 'Powered by Carnect GDS – aggregating top car rental suppliers.',
      },
      {
        vertical: 'cruises',
        title: 'Cruises',
        description: 'Ocean and gulet cruises departing from or calling at Turkish ports.',
        icon: '🚢',
        endpoint: '/api/services/cruises',
      },
      {
        vertical: 'private-aviation',
        title: 'Private Aviation',
        description: 'Private jet and turboprop charter flights to Turkish airports.',
        icon: '✈️',
        endpoint: '/api/services/private-aviation',
      },
      {
        vertical: 'yachts',
        title: 'Private Boats & Yachts',
        description: 'Luxury gulets, motor yachts, catamarans and superyachts along the Turkish coast.',
        icon: '🛥️',
        endpoint: '/api/services/yachts',
        supplier_note: 'Yacht and villa connections via GRN (Global Resort Network).',
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
      r.from.toUpperCase() === airport.toUpperCase()
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
    message: 'TürkiyeAI provides airport and route guidance. Live flight search is powered by the Amadeus GDS integration.',
    airports: TURKISH_AIRPORTS,
    popular_uk_routes: [
      { from: 'London (LHR/LGW)', to: 'Istanbul (IST)', airlines: ['Turkish Airlines', 'British Airways', 'easyJet'], approx_flight_time: '3h 50m' },
      { from: 'London (LGW)', to: 'Antalya (AYT)', airlines: ['TUI', 'Jet2', 'easyJet'], approx_flight_time: '4h 15m' },
      { from: 'London (LGW)', to: 'Bodrum (BJV)', airlines: ['TUI', 'Jet2', 'easyJet'], approx_flight_time: '4h 05m' },
      { from: 'Manchester (MAN)', to: 'Antalya (AYT)', airlines: ['Jet2', 'TUI', 'Ryanair'], approx_flight_time: '4h 20m' },
      { from: 'Birmingham (BHX)', to: 'Dalaman (DLM)', airlines: ['TUI', 'Jet2'], approx_flight_time: '4h 10m' },
    ],
    gds_supplier: 'Amadeus',
    note: 'All flight durations are approximate. Availability and pricing from licensed flight providers.',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
  });
});

/**
 * GET /api/services/cars
 * Car rental options via Carnect GDS
 * Query params: airport (IATA code), category, seats_min
 */
router.get('/cars', (req, res) => {
  const { airport, category, seats_min } = req.query;

  let results = [...CAR_RENTAL_CATALOG];

  if (airport) {
    const iata = airport.toUpperCase();
    results = results.filter(c => c.available_airports.includes(iata));
  }
  if (category) {
    results = results.filter(c =>
      c.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (seats_min) {
    const min = parseInt(seats_min, 10);
    if (!isNaN(min)) results = results.filter(c => c.seats >= min);
  }

  res.json({
    cars: results,
    count: results.length,
    airports: TURKISH_AIRPORTS,
    filters: { airport, category, seats_min },
    gds_supplier: 'Carnect',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Car hire prices are indicative per-day rates. Live availability and final pricing via Carnect GDS at booking.',
  });
});

/**
 * GET /api/services/cars/:id
 * Single car category detail
 */
router.get('/cars/:id', (req, res) => {
  const car = CAR_RENTAL_CATALOG.find(c => c.id === req.params.id);
  if (!car) {
    return res.status(404).json({ error: 'Car category not found', id: req.params.id });
  }
  res.json({
    car,
    gds_supplier: 'Carnect',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Prices are indicative. Final rates confirmed via Carnect GDS at booking.',
  });
});

/**
 * GET /api/services/cruises
 * Cruise itineraries calling at Turkish ports
 * Query params: departure_port, ship_type, duration_min, duration_max
 */
router.get('/cruises', (req, res) => {
  const { departure_port, ship_type, duration_min, duration_max } = req.query;

  let results = [...CRUISE_CATALOG];

  if (departure_port) {
    results = results.filter(c =>
      c.departure_port.toLowerCase().includes(departure_port.toLowerCase())
    );
  }
  if (ship_type) {
    results = results.filter(c =>
      c.ship_type.toLowerCase().includes(ship_type.toLowerCase())
    );
  }
  if (duration_min) {
    const min = parseInt(duration_min, 10);
    if (!isNaN(min)) results = results.filter(c => c.duration_nights >= min);
  }
  if (duration_max) {
    const max = parseInt(duration_max, 10);
    if (!isNaN(max)) results = results.filter(c => c.duration_nights <= max);
  }

  res.json({
    cruises: results,
    count: results.length,
    filters: { departure_port, ship_type, duration_min, duration_max },
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Cruise prices are indicative from prices per person (pp). Final pricing via licensed cruise operators.',
  });
});

/**
 * GET /api/services/cruises/:id
 * Single cruise detail
 */
router.get('/cruises/:id', (req, res) => {
  const cruise = CRUISE_CATALOG.find(c => c.id === req.params.id);
  if (!cruise) {
    return res.status(404).json({ error: 'Cruise not found', id: req.params.id });
  }
  res.json({
    cruise,
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'TürkiyeAI is an AI discovery platform. Bookings are completed via licensed cruise operators.',
  });
});

/**
 * GET /api/services/private-aviation
 * Private jet and charter flight options to Turkish airports
 * Query params: aircraft_type, max_passengers_min
 */
router.get('/private-aviation', (req, res) => {
  const { aircraft_type, max_passengers_min } = req.query;

  let results = [...PRIVATE_AVIATION_CATALOG];

  if (aircraft_type) {
    results = results.filter(a =>
      a.aircraft_type.toLowerCase().includes(aircraft_type.toLowerCase())
    );
  }
  if (max_passengers_min) {
    const min = parseInt(max_passengers_min, 10);
    if (!isNaN(min)) results = results.filter(a => a.max_passengers >= min);
  }

  res.json({
    private_aviation: results,
    count: results.length,
    filters: { aircraft_type, max_passengers_min },
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Charter prices are indicative per-sector from prices. Actual quotes vary by date, routing, and operator. Bookings via licensed air charter brokers.',
  });
});

/**
 * GET /api/services/private-aviation/:id
 * Single aircraft type detail
 */
router.get('/private-aviation/:id', (req, res) => {
  const aircraft = PRIVATE_AVIATION_CATALOG.find(a => a.id === req.params.id);
  if (!aircraft) {
    return res.status(404).json({ error: 'Aircraft category not found', id: req.params.id });
  }
  res.json({
    aircraft,
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Charter quotes are indicative. Confirmed pricing via licensed air charter brokers.',
  });
});

/**
 * GET /api/services/yachts
 * Private boats & yacht charters along the Turkish coast
 * Query params: vessel_type, home_port, max_guests_min
 */
router.get('/yachts', (req, res) => {
  const { vessel_type, home_port, max_guests_min } = req.query;

  let results = [...YACHT_CATALOG];

  if (vessel_type) {
    results = results.filter(y =>
      y.vessel_type.toLowerCase().includes(vessel_type.toLowerCase())
    );
  }
  if (home_port) {
    results = results.filter(y =>
      y.home_port.toLowerCase().includes(home_port.toLowerCase())
    );
  }
  if (max_guests_min) {
    const min = parseInt(max_guests_min, 10);
    if (!isNaN(min)) results = results.filter(y => y.max_guests >= min);
  }

  res.json({
    yachts: results,
    count: results.length,
    filters: { vessel_type, home_port, max_guests_min },
    gds_supplier: 'GRN (Global Resort Network)',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'Yacht charter prices are indicative per-week from prices. Final pricing confirmed with vessel owner/manager. Bookings via licensed yacht charter brokers.',
  });
});

/**
 * GET /api/services/yachts/:id
 * Single yacht/vessel detail
 */
router.get('/yachts/:id', (req, res) => {
  const yacht = YACHT_CATALOG.find(y => y.id === req.params.id);
  if (!yacht) {
    return res.status(404).json({ error: 'Yacht not found', id: req.params.id });
  }
  res.json({
    yacht,
    gds_supplier: 'GRN (Global Resort Network)',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    disclaimer: 'TürkiyeAI is an AI discovery platform. Yacht bookings are completed via licensed charter brokers.',
  });
});

module.exports = router;
