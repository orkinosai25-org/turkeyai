const crypto = require('crypto');

/**
 * HotelBeds API client helper.
 *
 * Authentication uses HMAC-SHA256:
 *   X-Signature = SHA256( apiKey + apiSecret + unixTimestampSeconds )
 *
 * Docs: https://developer.hotelbeds.com/documentation/hotels/booking-api/
 */

function getConfig() {
  return {
    apiKey: process.env.HOTELBEDS_API_KEY || '',
    apiSecret: process.env.HOTELBEDS_API_SECRET || '',
    baseUrl: process.env.HOTELBEDS_BASE_URL || 'https://api.test.hotelbeds.com',
    language: process.env.HOTELBEDS_LANGUAGE || 'ENG',
    currency: process.env.HOTELBEDS_CURRENCY || 'GBP',
  };
}

/**
 * Build the authentication headers required by every HotelBeds API call.
 * @returns {{ 'X-Api-Key': string, 'X-Signature': string, 'Accept': string, 'Accept-Encoding': string }}
 */
function getAuthHeaders() {
  const { apiKey, apiSecret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash('sha256')
    .update(apiKey + apiSecret + timestamp)
    .digest('hex');

  return {
    'X-Api-Key': apiKey,
    'X-Signature': signature,
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'Content-Type': 'application/json',
  };
}

/**
 * Returns true if the HotelBeds API key and secret are configured.
 */
function isConfigured() {
  const { apiKey, apiSecret } = getConfig();
  return Boolean(apiKey && apiSecret);
}

module.exports = { getConfig, getAuthHeaders, isConfigured };
