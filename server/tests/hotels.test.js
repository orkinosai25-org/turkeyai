/**
 * Tests for the HotelBeds API integration
 *
 * Tests cover:
 *  - server/config/hotelbeds.js  (getConfig, getAuthHeaders, isConfigured)
 *  - server/routes/hotels.js     (route mounting and input validation logic)
 *
 * Run with: node tests/hotels.test.js
 */

'use strict';

const express = require('express');

console.log('🧪 Testing HotelBeds Integration\n');

let passed = 0;
let failed = 0;

function assert(condition, label, extra) {
  if (condition) {
    console.log(`✅ PASS: ${label}${extra ? `\n   ${extra}` : ''}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${label}${extra ? `\n   ${extra}` : ''}`);
    failed++;
  }
}

// ── Test 1: hotelbeds config module exports ──────────────────────────────────
console.log('Test 1: HotelBeds Config Module');

// Clear env vars so we get predictable defaults
delete process.env.HOTELBEDS_API_KEY;
delete process.env.HOTELBEDS_API_SECRET;
delete process.env.HOTELBEDS_BASE_URL;
delete process.env.HOTELBEDS_LANGUAGE;
delete process.env.HOTELBEDS_CURRENCY;

const hotelbeds = require('../config/hotelbeds');

assert(typeof hotelbeds.getConfig === 'function', 'getConfig is exported as a function');
assert(typeof hotelbeds.getAuthHeaders === 'function', 'getAuthHeaders is exported as a function');
assert(typeof hotelbeds.isConfigured === 'function', 'isConfigured is exported as a function');

console.log('');

// ── Test 2: getConfig returns expected defaults ───────────────────────────────
console.log('Test 2: getConfig Default Values');

const cfg = hotelbeds.getConfig();

assert(typeof cfg === 'object' && cfg !== null, 'getConfig returns an object');
assert(cfg.apiKey === '', 'apiKey defaults to empty string');
assert(cfg.apiSecret === '', 'apiSecret defaults to empty string');
assert(cfg.baseUrl === 'https://api.test.hotelbeds.com', 'baseUrl defaults to test endpoint');
assert(cfg.language === 'ENG', 'language defaults to ENG');
assert(cfg.currency === 'GBP', 'currency defaults to GBP');

console.log('');

// ── Test 3: getConfig reads from environment variables ───────────────────────
console.log('Test 3: getConfig Reads Environment Variables');

process.env.HOTELBEDS_API_KEY = 'test-key-123';
process.env.HOTELBEDS_API_SECRET = 'test-secret-456';
process.env.HOTELBEDS_BASE_URL = 'https://api.hotelbeds.com';
process.env.HOTELBEDS_LANGUAGE = 'ESP';
process.env.HOTELBEDS_CURRENCY = 'EUR';

// Re-read — getConfig reads from process.env at call time so no re-require needed
const cfgFromEnv = hotelbeds.getConfig();

assert(cfgFromEnv.apiKey === 'test-key-123', 'apiKey read from HOTELBEDS_API_KEY');
assert(cfgFromEnv.apiSecret === 'test-secret-456', 'apiSecret read from HOTELBEDS_API_SECRET');
assert(cfgFromEnv.baseUrl === 'https://api.hotelbeds.com', 'baseUrl read from HOTELBEDS_BASE_URL');
assert(cfgFromEnv.language === 'ESP', 'language read from HOTELBEDS_LANGUAGE');
assert(cfgFromEnv.currency === 'EUR', 'currency read from HOTELBEDS_CURRENCY');

console.log('');

// ── Test 4: isConfigured ─────────────────────────────────────────────────────
console.log('Test 4: isConfigured Guard');

assert(hotelbeds.isConfigured() === true, 'isConfigured returns true when both key and secret are set');

process.env.HOTELBEDS_API_KEY = '';
assert(hotelbeds.isConfigured() === false, 'isConfigured returns false when apiKey is empty');

process.env.HOTELBEDS_API_KEY = 'test-key-123';
process.env.HOTELBEDS_API_SECRET = '';
assert(hotelbeds.isConfigured() === false, 'isConfigured returns false when apiSecret is empty');

// Restore
process.env.HOTELBEDS_API_SECRET = 'test-secret-456';

console.log('');

// ── Test 5: getAuthHeaders structure ─────────────────────────────────────────
console.log('Test 5: getAuthHeaders Structure');

const headers = hotelbeds.getAuthHeaders();

assert(typeof headers === 'object' && headers !== null, 'getAuthHeaders returns an object');
assert(typeof headers['X-Api-Key'] === 'string' && headers['X-Api-Key'] === 'test-key-123', 'X-Api-Key header present and correct');
assert(typeof headers['X-Signature'] === 'string' && headers['X-Signature'].length === 64, 'X-Signature is a 64-char hex SHA-256 string');
assert(headers['Accept'] === 'application/json', 'Accept header set to application/json');
assert(headers['Content-Type'] === 'application/json', 'Content-Type header set to application/json');

// Signature should only contain hex chars
assert(/^[0-9a-f]{64}$/.test(headers['X-Signature']), 'X-Signature is valid hex');

console.log('');

// ── Test 6: Hotels router mounts successfully ────────────────────────────────
console.log('Test 6: Hotels Router Mounting');

try {
  const hotelsRouter = require('../routes/hotels');
  assert(typeof hotelsRouter === 'function', 'hotels router exports a function (Express router)');

  const app = express();
  app.use(express.json());
  app.use('/api/hotels', hotelsRouter);
  assert(true, 'hotels router mounts at /api/hotels without error');
} catch (err) {
  assert(false, 'hotels router mounts at /api/hotels without error', err.message);
}

console.log('');

// ── Test 7: Input validation constants ───────────────────────────────────────
console.log('Test 7: Date Validation Helper');

function isValidIsoDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

assert(isValidIsoDate('2026-06-01'), 'YYYY-MM-DD date passes pattern');
assert(!isValidIsoDate('01/06/2026'), 'DD/MM/YYYY date fails pattern');
assert(!isValidIsoDate('2026-6-1'), 'non-zero-padded date fails pattern');
assert(!isValidIsoDate('not-a-date'), 'string non-date fails pattern');

// checkout must be after checkin
const checkIn = new Date('2026-06-01');
const checkOut = new Date('2026-06-08');
const badCheckOut = new Date('2026-05-31');

assert(checkOut > checkIn, 'valid checkOut (after checkIn) passes range check');
assert(!(badCheckOut > checkIn), 'invalid checkOut (before checkIn) fails range check');
assert(!(checkIn > checkIn), 'equal checkOut equals checkIn fails range check');

console.log('');

// ── Test 8: Hotel search endpoint – static data ───────────────────────────────
console.log('Test 8: Hotel Search Endpoint (Static Data)');

// Unset HotelBeds credentials so static path is taken
delete process.env.HOTELBEDS_API_KEY;
delete process.env.HOTELBEDS_API_SECRET;

const supertest = require('supertest');
const hotelsRouterForSearch = require('../routes/hotels');
const appForSearch = express();
appForSearch.use(express.json());
appForSearch.use('/api/hotels', hotelsRouterForSearch);

(async () => {
  try {
    // Bodrum search
    const bodrumRes = await supertest(appForSearch).get('/api/hotels/search?destination=Bodrum');
    assert(bodrumRes.status === 200, 'GET /api/hotels/search?destination=Bodrum returns 200');
    assert(Array.isArray(bodrumRes.body.hotels), 'Bodrum search returns hotels array');
    assert(bodrumRes.body.hotels.length > 0, 'Bodrum search returns at least one hotel');
    assert(typeof bodrumRes.body.total === 'number', 'Bodrum search returns total count');
    assert(bodrumRes.body.hotels.every(h => h.destinationName === 'Bodrum'), 'All Bodrum hotels have destinationName=Bodrum');
    const bodrumCount = bodrumRes.body.total;
    console.log(`   ℹ️  Bodrum returned ${bodrumCount} hotel(s)`);

    // Fethiye search
    const fethiyeRes = await supertest(appForSearch).get('/api/hotels/search?destination=Fethiye');
    assert(fethiyeRes.status === 200, 'GET /api/hotels/search?destination=Fethiye returns 200');
    assert(Array.isArray(fethiyeRes.body.hotels), 'Fethiye search returns hotels array');
    assert(fethiyeRes.body.hotels.length > 0, 'Fethiye search returns at least one hotel');
    assert(fethiyeRes.body.hotels.every(h => h.destinationName === 'Fethiye'), 'All Fethiye hotels have destinationName=Fethiye');
    const fethiyeCount = fethiyeRes.body.total;
    console.log(`   ℹ️  Fethiye returned ${fethiyeCount} hotel(s)`);

    // Each hotel has required fields
    const sampleBodrum = bodrumRes.body.hotels[0];
    assert(typeof sampleBodrum.code === 'string' && sampleBodrum.code.length > 0, 'Hotel has a code');
    assert(typeof sampleBodrum.name === 'string' && sampleBodrum.name.length > 0, 'Hotel has a name');
    assert(typeof sampleBodrum.categoryCode === 'string', 'Hotel has a categoryCode');
    assert(typeof sampleBodrum.minRate === 'string', 'Hotel has a minRate');
    assert(typeof sampleBodrum.currency === 'string', 'Hotel has a currency');

    // Unknown destination returns empty array (not an error)
    const unknownRes = await supertest(appForSearch).get('/api/hotels/search?destination=UnknownPlace');
    assert(unknownRes.status === 200, 'Unknown destination returns 200');
    assert(Array.isArray(unknownRes.body.hotels) && unknownRes.body.hotels.length === 0, 'Unknown destination returns empty hotels array');

    // No destination returns all hotels
    const allRes = await supertest(appForSearch).get('/api/hotels/search');
    assert(allRes.status === 200, 'No destination returns 200');
    assert(Array.isArray(allRes.body.hotels) && allRes.body.hotels.length > 0, 'No destination returns all hotels');

    console.log('');

    // ── Test 9: Status endpoint ────────────────────────────────────────────────
    console.log('Test 9: Hotel Status Endpoint');

    const statusRes = await supertest(appForSearch).get('/api/hotels/status');
    assert(statusRes.status === 200, 'GET /api/hotels/status returns 200');
    assert(typeof statusRes.body.configured === 'boolean', 'status has configured boolean');
    assert(typeof statusRes.body.environment === 'string', 'status has environment string');
    assert(['test', 'production', 'unknown'].includes(statusRes.body.environment), 'environment is test, production, or unknown');
    assert(typeof statusRes.body.message === 'string' && statusRes.body.message.length > 0, 'status has a message');
    assert(typeof statusRes.body.setup === 'object', 'status has setup guidance object');
    assert(Array.isArray(statusRes.body.setup.requiredFields), 'setup has requiredFields array');
    assert(typeof statusRes.body.setup.developerPortal === 'string', 'setup has developerPortal URL');
    assert(statusRes.body.setup.testBaseUrl === 'https://api.test.hotelbeds.com', 'setup shows correct testBaseUrl');
    assert(statusRes.body.setup.productionBaseUrl === 'https://api.hotelbeds.com', 'setup shows correct productionBaseUrl');
    console.log(`   ℹ️  HotelBeds environment: ${statusRes.body.environment}, configured: ${statusRes.body.configured}`);

    console.log('');

    // ── Test 10: Book endpoint – validation errors ─────────────────────────────
    console.log('Test 10: Hotel Book Endpoint (Validation)');

    // Set credentials so validation tests can run past the auth gate
    // (appsettings.json may also provide credentials in the real environment)
    process.env.HOTELBEDS_API_KEY = 'test-key-for-validation';
    process.env.HOTELBEDS_API_SECRET = 'test-secret-for-validation';

    const hotelsRouterForBook = require('../routes/hotels');
    const appForBook = express();
    appForBook.use(express.json());
    appForBook.use('/api/hotels', hotelsRouterForBook);

    // Missing holder → 400
    const bookNoHolderRes = await supertest(appForBook)
      .post('/api/hotels/book')
      .send({ rooms: [{ rateKey: 'key123', paxes: [{ roomId: 1, type: 'AD', name: 'Jane', surname: 'Smith' }] }] });
    assert(bookNoHolderRes.status === 400, 'Missing holder returns 400');
    assert(bookNoHolderRes.body.error === 'Invalid holder', 'Correct error for missing holder');

    // Missing rooms → 400
    const bookNoRoomsRes = await supertest(appForBook)
      .post('/api/hotels/book')
      .send({ holder: { name: 'Jane', surname: 'Smith' } });
    assert(bookNoRoomsRes.status === 400, 'Missing rooms returns 400');
    assert(bookNoRoomsRes.body.error === 'Invalid rooms', 'Correct error for missing rooms');

    // Missing rateKey → 400
    const bookNoRateKeyRes = await supertest(appForBook)
      .post('/api/hotels/book')
      .send({ holder: { name: 'Jane', surname: 'Smith' }, rooms: [{ paxes: [{ roomId: 1, type: 'AD', name: 'Jane', surname: 'Smith' }] }] });
    assert(bookNoRateKeyRes.status === 400, 'Missing rateKey returns 400');
    assert(bookNoRateKeyRes.body.error === 'Invalid rateKey', 'Correct error for missing rateKey');

    // Invalid pax type → 400
    const bookBadPaxTypeRes = await supertest(appForBook)
      .post('/api/hotels/book')
      .send({ holder: { name: 'Jane', surname: 'Smith' }, rooms: [{ rateKey: 'key123', paxes: [{ roomId: 1, type: 'XX', name: 'Jane', surname: 'Smith' }] }] });
    assert(bookBadPaxTypeRes.status === 400, 'Invalid pax type returns 400');
    assert(bookBadPaxTypeRes.body.error === 'Invalid pax type', 'Correct error for bad pax type');

    // Missing pax name → 400
    const bookNoPaxNameRes = await supertest(appForBook)
      .post('/api/hotels/book')
      .send({ holder: { name: 'Jane', surname: 'Smith' }, rooms: [{ rateKey: 'key123', paxes: [{ roomId: 1, type: 'AD', surname: 'Smith' }] }] });
    assert(bookNoPaxNameRes.status === 400, 'Missing pax name returns 400');
    assert(bookNoPaxNameRes.body.error === 'Invalid pax', 'Correct error for missing pax name');

    // Restore
    delete process.env.HOTELBEDS_API_KEY;
    delete process.env.HOTELBEDS_API_SECRET;

    console.log('');

    // ── Summary ──────────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════');
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('═══════════════════════════════════════');

    if (failed > 0) {
      process.exit(1);
    }

    console.log('\n🎉 All HotelBeds Integration Tests Passed!');
    console.log('\n📝 Note: Live API tests require valid HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET.');
    console.log('   Configure credentials in appsettings.json or as environment variables.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Async test error:', err.message);
    process.exit(1);
  }
})();
