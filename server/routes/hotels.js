const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { getConfig, getAuthHeaders, isConfigured } = require('../config/hotelbeds');
const { ensureHotelBedsConfigured } = require('../config/settingsProvider');

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
 * GET /api/hotels/:code
 * Retrieve static hotel details from HotelBeds Hotel Content API.
 */
router.get('/:code', async (req, res) => {
  const configured = await ensureHotelBedsConfigured();
  if (!configured) {
    return res.status(503).json({
      error: 'HotelBeds API is not configured',
      message: 'Set HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET in appsettings.json or environment variables.',
    });
  }

  const { code } = req.params;

  // Hotel codes are numeric strings (1-6 digits)
  if (!/^\d{1,6}$/.test(code)) {
    return res.status(400).json({
      error: 'Invalid hotel code',
      message: 'Hotel code must be a numeric string of 1 to 6 digits.',
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
    const status = err.status === 404 ? 404 : 502;
    res.status(status).json({
      error: status === 404 ? 'Hotel not found' : 'Failed to fetch hotel details',
      message: err.message,
    });
  }
});

module.exports = router;
