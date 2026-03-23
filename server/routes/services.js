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

/**
 * Supplier / API registry used by the services overview and the
 * dedicated /api/services/suppliers endpoint.
 *
 * Each entry documents:
 *   - vertical        : which travel service this supplier powers
 *   - supplier        : commercial name of the GDS / API / affiliate
 *   - model           : 'affiliate' (earn commission, no licence needed) or
 *                       'b2b' (direct API, B2B contract required)
 *   - integration     : current integration status
 *   - commission_rate : affiliate commission rate (where applicable)
 *   - avg_commission  : estimated earnings per booking (affiliate programmes)
 *   - data_provided   : what information the supplier delivers
 *   - gbp_support     : whether GBP pricing is natively available
 *   - uk_compliance   : headline UK-compliance notes
 *   - portal_url      : developer / partner portal
 *   - lar_validated   : true if confirmed live in OrkinosAI LAR reference system
 */
const SUPPLIER_REGISTRY = [
  // ─── AFFILIATE PROGRAMMES (Start earning today – no licence, no B2B contract) ───
  {
    vertical: 'packages',
    supplier: 'Jet2holidays (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Awin to activate',
    commission_rate: '2–3%',
    avg_commission_gbp: '£40–180 per booking',
    data_provided: ['ATOL-protected UK packages', 'Turkish all-inclusive resorts', 'Family holidays', 'Affiliate deep-links via Awin'],
    gbp_support: true,
    uk_compliance: 'ATOL-licensed; Package Travel Regulations 2018 compliant; YOU need no ATOL as referrer',
    portal_url: 'https://www.awin.com',
    affiliate_network: 'Awin',
  },
  {
    vertical: 'packages',
    supplier: 'TUI UK (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Awin to activate',
    commission_rate: '2–3%',
    avg_commission_gbp: '£36–150 per booking',
    data_provided: ['ATOL-protected UK packages', 'Turkish all-inclusive resorts', 'Affiliate programme'],
    gbp_support: true,
    uk_compliance: 'ATOL-licensed; Package Travel Regulations 2018 compliant; YOU need no ATOL as referrer',
    portal_url: 'https://www.tui.co.uk',
    affiliate_network: 'Awin',
  },
  {
    vertical: 'packages',
    supplier: 'On the Beach (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Awin to activate',
    commission_rate: '2–3%',
    avg_commission_gbp: '£24–120 per booking',
    data_provided: ['Beach holidays to Turkey', 'ATOL-protected packages', 'Flight + hotel combinations'],
    gbp_support: true,
    uk_compliance: 'ATOL-licensed; no licence needed from you as referrer',
    portal_url: 'https://www.onthebeach.co.uk',
    affiliate_network: 'Awin',
  },
  {
    vertical: 'packages',
    supplier: 'Love Holidays (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Awin to activate',
    commission_rate: '2–3%',
    avg_commission_gbp: '£20–105 per booking',
    data_provided: ['Very popular UK holiday brand', 'Turkish resorts', 'Competitive pricing'],
    gbp_support: true,
    uk_compliance: 'ATOL-licensed; no licence needed from you as referrer',
    portal_url: 'https://www.loveholidays.com',
    affiliate_network: 'Awin',
  },
  {
    vertical: 'hotels',
    supplier: 'Booking.com (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Booking.com Partner to activate',
    commission_rate: '~25% of Booking.com commission (approx 4–6% of booking value)',
    avg_commission_gbp: '£8–30 per hotel booking',
    data_provided: ['Every Turkish hotel and resort', 'Real-time availability', 'Instant deep-links per property', 'Consumer-trusted brand'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; ICO-registered; Booking.com is the ATOL/ABTA holder',
    portal_url: 'https://www.booking.com/affiliate-program.html',
    affiliate_network: 'Booking.com Partner',
  },
  {
    vertical: 'excursions',
    supplier: 'Viator (TripAdvisor) affiliate',
    model: 'affiliate',
    integration: 'recommended – join Viator Affiliate to activate',
    commission_rate: '8%',
    avg_commission_gbp: '£4–16 per excursion booking',
    data_provided: ['Thousands of Turkish excursions & tours', 'Live availability', 'Deep-link & embedded booking'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; ICO-registered; no licence needed from you',
    portal_url: 'https://partnerresources.viator.com',
    // lar_validated applies to the B2B sightseeing API integration confirmed in LAR (see B2B section)
  },
  {
    vertical: 'excursions',
    supplier: 'GetYourGuide (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join GYG Affiliate to activate',
    commission_rate: '8%',
    avg_commission_gbp: '£3–14 per activity booking',
    data_provided: ['Turkish tours & activities', 'Instant booking', 'GBP pricing'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; EU-headquartered',
    portal_url: 'https://partner.getyourguide.com',
  },
  {
    vertical: 'cars',
    supplier: 'Rentalcars.com (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Rentalcars.com affiliate to activate',
    commission_rate: '6%',
    avg_commission_gbp: '£9–24 per rental',
    data_provided: ['All major Turkish airports', 'Top suppliers (Hertz, Avis, Sixt)', 'Consumer-trusted brand'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; no licence needed from you',
    portal_url: 'https://www.rentalcars.com/affiliates',
  },
  {
    vertical: 'transfers',
    supplier: 'Hoppa / HolidayTaxis (affiliate)',
    model: 'affiliate',
    integration: 'recommended – join Hoppa affiliate to activate',
    commission_rate: '8–10%',
    avg_commission_gbp: '£5–20 per transfer',
    data_provided: ['Turkish airport transfers', 'Private and shared options', 'Live pricing'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; UK brand trusted by UK holidaymakers',
    portal_url: 'https://www.hoppa.com/en/partners',
  },
  // ─── B2B APIs (Higher margin; require contract/registration) ──────────────────
  {
    vertical: 'hotels',
    supplier: 'TBO (Travel Boutique Online)',
    model: 'b2b',
    integration: 'contracted – live activation pending',
    data_provided: ['Hotel availability', 'Live rates', 'Room types', 'Cancellation policies'],
    gbp_support: true,
    uk_compliance: 'GDPR-aware; data processing agreement required',
    portal_url: 'https://www.tbo.com',
  },
  {
    vertical: 'hotels',
    supplier: 'PROVAB',
    model: 'b2b',
    integration: 'contracted – live activation pending',
    data_provided: ['Hotel availability', 'Net rates', 'Static content'],
    gbp_support: true,
    uk_compliance: 'GDPR-aware; data processing agreement required',
    portal_url: 'https://www.provab.com',
  },
  {
    vertical: 'hotels',
    supplier: 'Hotelbeds API',
    model: 'b2b',
    integration: 'recommended – not yet integrated',
    data_provided: ['180,000+ properties globally', 'Turkish Riviera depth', 'Live rates', 'Transfers API', 'Static content API'],
    gbp_support: true,
    uk_compliance: 'UK-registered entity; GDPR-compliant; widely used by ATOL holders',
    portal_url: 'https://developer.hotelbeds.com',
    lar_validated: true, // confirmed live in OrkinosAI LAR reference system
  },
  {
    vertical: 'hotels',
    supplier: 'RateHawk / WorldOta',
    model: 'b2b',
    integration: 'recommended – not yet integrated',
    data_provided: ['Strong Turkish hotel inventory', 'All-inclusive & resort properties', 'Affiliate/white-label programme', 'Live rates'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; data processed in EU',
    portal_url: 'https://www.worldota.net',
    lar_validated: true, // confirmed live in OrkinosAI LAR reference system
  },
  {
    vertical: 'flights',
    supplier: 'Amadeus GDS',
    model: 'b2b',
    integration: 'referenced – live Amadeus Self-Service API activation pending',
    data_provided: ['Flight offers search', 'Live pricing', 'Seat availability', 'Airport/city lookup', 'Flight inspiration'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; standard B2B data processing agreement',
    portal_url: 'https://developers.amadeus.com',
    lar_validated: true, // confirmed live in OrkinosAI LAR reference system
  },
  {
    vertical: 'cars',
    supplier: 'Carnect GDS',
    model: 'b2b',
    integration: 'referenced – static catalog; live search activation pending',
    data_provided: ['Car rental categories', 'Indicative daily rates (EUR/GBP)', 'Airport availability', 'Supplier aggregation (Hertz, Avis, Sixt, Enterprise)'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; standard B2B data processing',
    portal_url: 'https://www.carnect.com/en/for-partners',
    lar_validated: true, // confirmed live in OrkinosAI LAR reference system
  },
  {
    vertical: 'excursions',
    supplier: 'Viator (TripAdvisor) sightseeing API',
    model: 'b2b',
    integration: 'referenced – B2B API activation pending',
    data_provided: ['Turkish excursions & tours', 'Live availability', 'Embedded booking flow'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; ICO-registered',
    portal_url: 'https://partnerresources.viator.com',
    lar_validated: true, // confirmed live in OrkinosAI LAR reference system (sightseeing + transfers)
  },
  {
    integration: 'recommended – not yet integrated',
    data_provided: ['Airport-to-resort transfers', 'Private and shared options', 'Live pricing'],
    gbp_support: true,
    uk_compliance: 'GDPR-compliant; same contract as Hotelbeds Hotels',
    portal_url: 'https://developer.hotelbeds.com',
  },
  {
    vertical: 'yachts',
    supplier: 'GRN (Global Resort Network)',
    model: 'b2b',
    integration: 'referenced – static catalog; live availability pending',
    data_provided: ['Villa & yacht accommodation', 'Turkish coast charter inventory'],
    gbp_support: true,
    uk_compliance: 'Standard B2B data processing agreement required',
    portal_url: 'https://www.grn.com',
    lar_validated: true, // GRN Connect confirmed live in OrkinosAI LAR reference system
  },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/services
 * Overview of all available service verticals
 */
router.get('/', (req, res) => {
  const affiliateCount = SUPPLIER_REGISTRY.filter(s => s.model === 'affiliate').length;
  const b2bCount = SUPPLIER_REGISTRY.filter(s => s.model === 'b2b').length;
  res.json({
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    monetisation: {
      strategy: 'Affiliate-first (no ATOL licence required)',
      summary: `${affiliateCount} affiliate programmes registered. Join Awin + Booking.com Partner + Viator to start earning commissions today without any travel licence.`,
      affiliate_programmes: `GET /api/services/suppliers?model=affiliate`,
      revenue_guide: '/docs/API_SOURCES_AND_RECOMMENDATIONS.md#1-how-to-make-money-with-türkiyeai-affiliate-first-strategy',
    },
    suppliers_overview: `${SUPPLIER_REGISTRY.length} supplier/API integrations registered (${affiliateCount} affiliate, ${b2bCount} B2B). See GET /api/services/suppliers for full details.`,
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
 * GET /api/services/suppliers
 * Full registry of all API/GDS supplier integrations for TürkiyeAI.
 * Documents current integration status, data provided, GBP support,
 * UK compliance notes, and developer portal URLs.
 * Query params:
 *   vertical     (string)  – filter by service vertical
 *   model        (string)  – 'affiliate' or 'b2b' – filter by integration model
 *   lar_validated (boolean) – when 'true', return only suppliers confirmed
 *                             live in the OrkinosAI LAR reference system
 */
router.get('/suppliers', (req, res) => {
  const { vertical, model, lar_validated } = req.query;

  let results = [...SUPPLIER_REGISTRY];

  if (vertical) {
    results = results.filter(s =>
      s.vertical.toLowerCase() === vertical.toLowerCase()
    );
  }

  if (model) {
    results = results.filter(s =>
      (s.model || '').toLowerCase() === model.toLowerCase()
    );
  }

  if (lar_validated === 'true') {
    results = results.filter(s => s.lar_validated === true);
  }
  // Note: only lar_validated=true is a supported filter value;
  // omitting the parameter or passing any other value returns all results.

  res.json({
    suppliers: results,
    count: results.length,
    filters: { vertical, model, lar_validated },
    documentation: '/docs/API_SOURCES_AND_RECOMMENDATIONS.md',
    lar_reference: 'https://github.com/orkinosai25-org/lar_system',
    brand: 'TürkiyeAI – Powered by OrkinosAI',
    note: 'Use ?model=affiliate to see programmes you can join for free today (no ATOL or B2B contract needed). Suppliers marked lar_validated:true are confirmed live in the OrkinosAI LAR reference system.',
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
