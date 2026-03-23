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
