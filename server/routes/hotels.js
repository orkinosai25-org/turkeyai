const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { getConfig, getAuthHeaders, isConfigured } = require('../config/hotelbeds');
const { ensureHotelBedsConfigured } = require('../config/settingsProvider');

// Destination name (lowercase) → HotelBeds destination code
const DEST_CODE_MAP = {
  bodrum: 'BOD',
  antalya: 'ANT',
  istanbul: 'IST',
  marmaris: 'MAR',
  fethiye: 'FET',
  kusadasi: 'KUS',
  izmir: 'IZM',
  cappadocia: 'CAP',
};

// Static hotel data used when HotelBeds is not configured (demo / fallback)
const STATIC_HOTELS = {
  BOD: [
    { code: '43841', name: 'Kempinski Hotel Barbaros Bay Bodrum', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Yalıkavak', address: 'Gerenkuyu Mevkii, Bodrum', minRate: '420.00', currency: 'GBP' },
    { code: '75431', name: 'Mandarin Oriental Bodrum', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Paradise Bay', address: 'Göltürkbükü, Bodrum', minRate: '580.00', currency: 'GBP' },
    { code: '25847', name: 'Voyage Bodrum Resort & Spa', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Bitez', address: 'Bitez, Bodrum', minRate: '210.00', currency: 'GBP' },
    { code: '62145', name: 'Bodrum Bay Resort', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Turgutreis', address: 'Turgutreis, Bodrum', minRate: '170.00', currency: 'GBP' },
    { code: '83612', name: 'Lujo Hotel Bodrum', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Türkbükü', address: 'Türkbükü, Bodrum', minRate: '350.00', currency: 'GBP' },
    { code: '51230', name: 'Caresse Resort & Spa Bodrum', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Yalıkavak', address: 'Yalıkavak, Bodrum', minRate: '280.00', currency: 'GBP' },
    { code: '39475', name: 'Xanadu Island Hotel', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Türkbükü', address: 'Türkbükü, Bodrum', minRate: '195.00', currency: 'GBP' },
    { code: '47861', name: 'Jumeirah Bodrum Palace', categoryCode: '5', destinationName: 'Bodrum', zoneName: 'Yalıkavak Marina', address: 'Yalıkavak Marina, Bodrum', minRate: '490.00', currency: 'GBP' },
  ],
  FET: [
    { code: '31547', name: 'Hillside Beach Club', categoryCode: '5', destinationName: 'Fethiye', zoneName: 'Ölüdeniz', address: 'Kalemya Bay, Fethiye', minRate: '310.00', currency: 'GBP' },
    { code: '22318', name: 'Yacht Classic Hotel', categoryCode: '4', destinationName: 'Fethiye', zoneName: 'Fethiye Centre', address: 'Kordon Caddesi, Fethiye', minRate: '95.00', currency: 'GBP' },
    { code: '59871', name: 'Lykia World Ölüdeniz', categoryCode: '5', destinationName: 'Fethiye', zoneName: 'Ölüdeniz', address: 'Ölüdeniz, Fethiye', minRate: '220.00', currency: 'GBP' },
    { code: '45623', name: 'Ekici Hotel', categoryCode: '4', destinationName: 'Fethiye', zoneName: 'Hisarönü', address: 'Hisarönü, Fethiye', minRate: '85.00', currency: 'GBP' },
    { code: '37814', name: 'Montana Pine Resort', categoryCode: '5', destinationName: 'Fethiye', zoneName: 'Ölüdeniz', address: 'Ölüdeniz, Fethiye', minRate: '175.00', currency: 'GBP' },
    { code: '66290', name: 'Ölüdeniz Beach Hotel', categoryCode: '4', destinationName: 'Fethiye', zoneName: 'Ölüdeniz', address: 'Belcekız Beach, Fethiye', minRate: '120.00', currency: 'GBP' },
    { code: '72481', name: 'Unique Hotel Fethiye', categoryCode: '5', destinationName: 'Fethiye', zoneName: 'Çalış Beach', address: 'Çalış Beach, Fethiye', minRate: '145.00', currency: 'GBP' },
    { code: '84532', name: 'Letoonia Golf Resort', categoryCode: '5', destinationName: 'Fethiye', zoneName: 'Fethiye Bay', address: 'Fethiye Bay, Fethiye', minRate: '255.00', currency: 'GBP' },
  ],
  ANT: [
    { code: '11234', name: 'Titanic Mardan Palace', categoryCode: '5', destinationName: 'Antalya', zoneName: 'Lara', address: 'Lara Beach, Antalya', minRate: '195.00', currency: 'GBP' },
    { code: '12345', name: 'Rixos Premium Belek', categoryCode: '5', destinationName: 'Antalya', zoneName: 'Belek', address: 'Belek, Antalya', minRate: '310.00', currency: 'GBP' },
    { code: '13456', name: 'Regnum Carya Golf & Spa Resort', categoryCode: '5', destinationName: 'Antalya', zoneName: 'Belek', address: 'Belek, Antalya', minRate: '275.00', currency: 'GBP' },
    { code: '14567', name: 'Cornelia Diamond Golf Resort', categoryCode: '5', destinationName: 'Antalya', zoneName: 'Belek', address: 'Belek, Antalya', minRate: '230.00', currency: 'GBP' },
    { code: '15678', name: 'Ela Excellence Resort', categoryCode: '5', destinationName: 'Antalya', zoneName: 'Belek', address: 'Belek, Antalya', minRate: '210.00', currency: 'GBP' },
  ],
  MAR: [
    { code: '21001', name: 'Maxx Royal Marmaris Resort', categoryCode: '5', destinationName: 'Marmaris', zoneName: 'Marmaris', address: 'Marmaris Bay, Marmaris', minRate: '220.00', currency: 'GBP' },
    { code: '21002', name: 'Grand Yazıcı Marmaris Palace', categoryCode: '5', destinationName: 'Marmaris', zoneName: 'Içmeler', address: 'Içmeler, Marmaris', minRate: '165.00', currency: 'GBP' },
    { code: '21003', name: 'TUI BLUE Grand Azur', categoryCode: '5', destinationName: 'Marmaris', zoneName: 'Marmaris', address: 'Marmaris, Turkey', minRate: '150.00', currency: 'GBP' },
  ],
  IST: [
    { code: '31001', name: 'Four Seasons Hotel Istanbul at Sultanahmet', categoryCode: '5', destinationName: 'Istanbul', zoneName: 'Sultanahmet', address: 'Tevkifhane Sokak 1, Istanbul', minRate: '380.00', currency: 'GBP' },
    { code: '31002', name: 'Shangri-La Bosphorus Istanbul', categoryCode: '5', destinationName: 'Istanbul', zoneName: 'Beşiktaş', address: 'Çırağan Caddesi, Istanbul', minRate: '290.00', currency: 'GBP' },
    { code: '31003', name: 'The Ritz-Carlton Istanbul', categoryCode: '5', destinationName: 'Istanbul', zoneName: 'Şişli', address: 'Elmadağ, Istanbul', minRate: '250.00', currency: 'GBP' },
  ],
};

/**
 * Make an HTTP/HTTPS request to the HotelBeds API.
 * Returns a Promise that resolves with the parsed JSON response body.
 */
function hotelbedsRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const { baseUrl } = getConfig();
    const url = new URL(path, baseUrl);
    const headers = getAuthHeaders();
    const payload = body ? JSON.stringify(body) : null;

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    };

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(
              (parsed && parsed.error && parsed.error.message) ||
              `HotelBeds API error ${res.statusCode}`
            );
            err.status = res.statusCode;
            err.body = parsed;
            reject(err);
          }
        } catch (parseErr) {
          reject(new Error(`Failed to parse HotelBeds response: ${parseErr.message}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * GET /api/hotels/search
 * Search hotels by destination name.
 * Returns static hotel data when HotelBeds is not configured.
 * Returns Hotel Content API results when HotelBeds is configured.
 *
 * Query params:
 *   destination  {string}  Destination name (e.g. "Bodrum", "Fethiye")
 */
router.get('/search', async (req, res) => {
  const { destination } = req.query;

  const destKey = destination ? destination.toLowerCase().trim() : '';
  const destCode = DEST_CODE_MAP[destKey] || null;

  const configured = await ensureHotelBedsConfigured();

  if (!configured) {
    // Return static hotels filtered by destination
    let hotels;
    if (destCode && STATIC_HOTELS[destCode]) {
      hotels = STATIC_HOTELS[destCode];
    } else if (!destination) {
      hotels = Object.values(STATIC_HOTELS).flat();
    } else {
      hotels = [];
    }
    return res.json({
      hotels,
      total: hotels.length,
      destination: destination || null,
      source: 'static',
      brand: 'TürkiyeAI - Powered by OrkinosAI',
    });
  }

  // HotelBeds Hotel Content API search – destCode is required for API call
  if (!destCode) {
    // Unknown or missing destination: return static fallback or empty
    const hotels = destination
      ? []
      : Object.values(STATIC_HOTELS).flat();
    return res.json({
      hotels,
      total: hotels.length,
      destination: destination || null,
      source: 'static',
      brand: 'TürkiyeAI - Powered by OrkinosAI',
    });
  }

  const { language } = getConfig();

  try {
    const data = await hotelbedsRequest(
      'GET',
      `/hotel-content-api/1.0/hotels?destinationCode=${destCode}&countryCode=TR&language=${language}&useSecondaryLanguage=false&from=1&to=50`,
      null
    );
    const hotels = (data.hotels || []).map(h => ({
      code: String(h.code),
      name: h.name ? h.name.content : '',
      categoryCode: h.categoryCode || '',
      destinationName: h.destinationName || destination,
      zoneName: h.zoneName || '',
      address: h.address ? h.address.content : '',
    }));
    res.json({
      hotels,
      total: data.total || hotels.length,
      destination,
      source: 'hotelbeds',
      brand: 'TürkiyeAI - Powered by OrkinosAI',
    });
  } catch (err) {
    console.error('HotelBeds hotel search error:', err.message);
    // Fall back to static hotels on API error
    const hotels = STATIC_HOTELS[destCode] || [];
    res.json({
      hotels,
      total: hotels.length,
      destination,
      source: 'static',
      brand: 'TürkiyeAI - Powered by OrkinosAI',
    });
  }
});

/**
 * POST /api/hotels/availability
 * Search for available hotels via HotelBeds Hotel Booking API.
 *
 * Body:
 *   destination  {string}  HotelBeds destination code  (e.g. "PMI")
 *   checkIn      {string}  ISO date string             (e.g. "2026-06-01")
 *   checkOut     {string}  ISO date string             (e.g. "2026-06-08")
 *   adults       {number}  Number of adults            (default 2)
 *   children     {number}  Number of children          (default 0)
 *   rooms        {number}  Number of rooms             (default 1)
 */
router.post('/availability', async (req, res) => {
  const configured = await ensureHotelBedsConfigured();
  if (!configured) {
    return res.status(503).json({
      error: 'HotelBeds API is not configured',
      message: 'Set HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET in appsettings.json or environment variables.',
    });
  }

  const { destination, checkIn, checkOut, adults = 2, children = 0, rooms = 1 } = req.body;

  if (!destination || !checkIn || !checkOut) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'destination, checkIn and checkOut are required.',
    });
  }

  // Validate date format (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(checkIn) || !datePattern.test(checkOut)) {
    return res.status(400).json({
      error: 'Invalid date format',
      message: 'checkIn and checkOut must be in YYYY-MM-DD format.',
    });
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    return res.status(400).json({
      error: 'Invalid date range',
      message: 'checkOut must be after checkIn.',
    });
  }

  // Validate and sanitise numeric inputs
  const adultsRaw = parseInt(adults, 10);
  const childrenRaw = parseInt(children, 10);
  const roomsRaw = parseInt(rooms, 10);

  if (isNaN(adultsRaw) || isNaN(childrenRaw) || isNaN(roomsRaw)) {
    return res.status(400).json({
      error: 'Invalid numeric input',
      message: 'adults, children and rooms must be valid integers.',
    });
  }

  const adultsNum = Math.max(1, Math.min(adultsRaw, 20));
  const childrenNum = Math.max(0, Math.min(childrenRaw, 10));
  const roomsNum = Math.max(1, Math.min(roomsRaw, 10));

  const { language, currency } = getConfig();

  const requestBody = {
    stay: { checkIn, checkOut },
    occupancies: [
      {
        rooms: roomsNum,
        adults: adultsNum,
        children: childrenNum,
      },
    ],
    destination: { code: destination },
    language,
    currency,
  };

  try {
    const data = await hotelbedsRequest('POST', '/hotel-api/1.0/hotels', requestBody);
    res.json({
      hotels: data.hotels ? data.hotels.hotels : [],
      total: data.hotels ? data.hotels.total : 0,
      checkIn,
      checkOut,
      destination,
      brand: 'TürkiyeAI - Powered by OrkinosAI',
    });
  } catch (err) {
    console.error('HotelBeds availability error:', err.message);
    res.status(err.status || 502).json({
      error: 'Failed to fetch hotel availability',
      message: err.message,
    });
  }
});

/**
 * Convert a simple static hotel entry to the HotelBeds Content API shape
 * that HotelDetails.js expects.
 */
function staticHotelToDetails(h) {
  const stars = Math.max(0, Math.min(parseInt(h.categoryCode, 10) || 0, 5));
  return {
    code: Number(h.code),
    name: { content: h.name },
    categoryCode: h.categoryCode,
    categoryName: { content: `${stars} Star${stars !== 1 ? 's' : ''}` },
    destinationName: h.destinationName,
    zoneName: h.zoneName,
    address: h.address ? { content: h.address } : null,
    description: { content: `${h.name} is a ${h.categoryCode}-star hotel located in ${h.zoneName ? `${h.zoneName}, ` : ''}${h.destinationName}, Turkey.` },
    coordinates: null,
    phones: null,
    email: null,
    facilities: [],
    images: [],
    checkIn: null,
    checkOut: null,
  };
}

/**
 * Look up a hotel by numeric code across all static hotel lists.
 * Returns null if not found.
 */
function findStaticHotel(code) {
  for (const hotels of Object.values(STATIC_HOTELS)) {
    const found = hotels.find(h => h.code === code);
    if (found) return found;
  }
  return null;
}

/**
 * GET /api/hotels/:code
 * Retrieve static hotel details from HotelBeds Hotel Content API.
 */
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  // Hotel codes are numeric strings (1-6 digits)
  if (!/^\d{1,6}$/.test(code)) {
    return res.status(400).json({
      error: 'Invalid hotel code',
      message: 'Hotel code must be a numeric string of 1 to 6 digits.',
    });
  }

  const configured = await ensureHotelBedsConfigured();

  if (!configured) {
    // Try static fallback
    const staticHotel = findStaticHotel(code);
    if (staticHotel) {
      return res.json({
        hotel: staticHotelToDetails(staticHotel),
        source: 'static',
        brand: 'TürkiyeAI - Powered by OrkinosAI',
      });
    }
    return res.status(503).json({
      error: 'HotelBeds API is not configured',
      message: 'Set HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET in appsettings.json or environment variables.',
    });
  }

  const { language } = getConfig();

  try {
    const data = await hotelbedsRequest(
      'GET',
      `/hotel-content-api/1.0/hotels/${code}/details?language=${language}&useSecondaryLanguage=false`,
      null
    );
    res.json({
      hotel: data.hotel || null,
      brand: 'TürkiyeAI - Powered by OrkinosAI',
    });
  } catch (err) {
    console.error('HotelBeds hotel details error:', err.message);
    // Fall back to static data on API error
    const staticHotel = findStaticHotel(code);
    if (staticHotel) {
      return res.json({
        hotel: staticHotelToDetails(staticHotel),
        source: 'static',
        brand: 'TürkiyeAI - Powered by OrkinosAI',
      });
    }
    const status = err.status === 404 ? 404 : 502;
    res.status(status).json({
      error: status === 404 ? 'Hotel not found' : 'Failed to fetch hotel details',
      message: err.message,
    });
  }
});

module.exports = router;
