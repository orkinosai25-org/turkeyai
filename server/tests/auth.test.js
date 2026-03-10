/**
 * Auth Route Unit Tests
 * Tests the auth helpers (token signing/verification, input validation)
 * without requiring a live database.
 */

const crypto = require('crypto');

console.log('🧪 Testing TürkiyeAI Auth Module\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${++passed}: ${name}`);
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// ─── Pull in token helpers by requiring the route module ────────────────────
const authRouter = require('../routes/auth');
const { verifyToken } = authRouter;

// ─── Token secret must match the default used in auth.js ────────────────────
const TOKEN_SECRET = 'turkiyeai-dev-secret-change-in-production';

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

// ─── User Model ───────────────────────────────────────────────────────────────
const User = require('../models/User');

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runAll() {
  await test('Token: valid token verifies correctly', async () => {
    const token = signToken({ sub: 'user-123', email: 'test@turkiyeai.com', name: 'Test' });
    const payload = verifyToken(token);
    assert(payload !== null, 'verifyToken returned null');
    assert(payload.sub === 'user-123', 'sub mismatch');
    assert(payload.email === 'test@turkiyeai.com', 'email mismatch');
  });

  await test('Token: tampered token is rejected', async () => {
    const token = signToken({ sub: 'user-123', email: 'test@turkiyeai.com' });
    const parts = token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: 'attacker', email: 'hack@bad.com', iat: Date.now(), exp: Date.now() + 9999999 })).toString('base64url');
    const tampered = parts.join('.');
    const payload = verifyToken(tampered);
    assert(payload === null, 'Tampered token should be rejected');
  });

  await test('Token: expired token is rejected', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: 'user-123', iat: Date.now() - 10000, exp: Date.now() - 5000 })).toString('base64url');
    const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
    const expiredToken = `${header}.${body}.${sig}`;
    const payload = verifyToken(expiredToken);
    assert(payload === null, 'Expired token should be rejected');
  });

  await test('Token: invalid format string returns null', async () => {
    assert(verifyToken('not-a-token') === null, 'Should return null for garbage');
    assert(verifyToken('') === null, 'Should return null for empty string');
  });

  await test('User: password hash and verify round-trip (scrypt)', async () => {
    const { hash, salt } = await User.hashPassword('MySecret123!');
    assert(typeof hash === 'string' && hash.length > 0, 'hash should be a string');
    assert(typeof salt === 'string' && salt.length > 0, 'salt should be a string');
    assert(await User.verifyPassword('MySecret123!', hash, salt), 'correct password should verify');
    assert(!(await User.verifyPassword('WrongPassword!', hash, salt)), 'wrong password should fail');
  });

  await test('User: same password with same salt produces same hash', async () => {
    const { hash: h1 } = await User.hashPassword('TestPass99', 'fixed-salt-abc');
    const { hash: h2 } = await User.hashPassword('TestPass99', 'fixed-salt-abc');
    assert(h1 === h2, 'Deterministic hash with fixed salt');
  });

  await test('User: different salts produce different hashes', async () => {
    const { hash: h1 } = await User.hashPassword('TestPass99', 'salt-one-123456');
    const { hash: h2 } = await User.hashPassword('TestPass99', 'salt-two-654321');
    assert(h1 !== h2, 'Different salts should produce different hashes');
  });

  await test('User: auto-generated salts are unique', async () => {
    const { salt: s1 } = await User.hashPassword('password');
    const { salt: s2 } = await User.hashPassword('password');
    assert(s1 !== s2, 'Each call should generate a unique salt');
  });

  await test('User: hashPasswordSync provides deterministic sync hash (for tests)', async () => {
    const { hash: h1, salt } = User.hashPasswordSync('SyncTest99', 'testsalt');
    const { hash: h2 } = User.hashPasswordSync('SyncTest99', 'testsalt');
    assert(h1 === h2, 'Sync hash with same salt should be deterministic');
    const { hash: hWrong } = User.hashPasswordSync('WrongPwd', 'testsalt');
    assert(h1 !== hWrong, 'Different passwords should produce different hashes');
  });

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════\n');

  if (failed > 0) {
    console.error('💥 Some auth tests failed!');
    process.exit(1);
  } else {
    console.log('🎉 All Auth Tests Passed!');
  }
}

runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
