const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * TürkiyeAI Authentication Routes
 * 
 * Implements:
 *  - POST /api/auth/register          3-step registration (email + social)
 *  - POST /api/auth/login             Email/password login
 *  - POST /api/auth/social/:provider  Social login (Google / Facebook / LinkedIn)
 *  - POST /api/auth/forgot-password   Initiate password reset
 *  - POST /api/auth/verify            Verify a JWT session token
 * 
 * Note: This module uses a lightweight in-process JWT-style token based on
 * HMAC-SHA256 so no external jwt library is required. Swap for a full JWT
 * library (e.g. jsonwebtoken) when deploying to production.
 */

const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// ─── Rate-limit middleware ────────────────────────────────────────────────────
// Limits auth attempts to 20 per IP per 15-minute window to prevent brute-force.
// In multi-instance production deployments, configure a Redis store via express-rate-limit.
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// ─── Token Helpers ────────────────────────────────────────────────────────────

const TOKEN_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production.');
  }
  console.warn('[Auth] WARNING: JWT_SECRET not set. Using insecure default – do NOT deploy to production without setting JWT_SECRET.');
  return 'turkiyeai-dev-secret-change-in-production';
})();

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Input Validation Helpers ─────────────────────────────────────────────────

function validateEmail(email) {
  // RFC-5322 simplified – requires local@domain.tld with at least 2-char TLD
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test((email || '').trim());
}

function validatePassword(password) {
  const p = (password || '').trim();
  if (p.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(p)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(p)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(p)) return 'Password must include at least one number.';
  return null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * 3-step registration payload submitted as a single call on Step 3 completion.
 * 
 * Body:
 *   step1: { first_name, last_name, email, password, confirm_password }
 *   step2: { phone, country_code, address, postcode }
 *   step3: { travel_interests[], newsletter_opt_in, terms_accepted }
 */
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, confirm_password,
            phone, country_code, address, postcode,
            travel_interests, newsletter_opt_in, terms_accepted } = req.body;

    // ── Validate Step 1
    if (!first_name || first_name.trim().length < 2) {
      return res.status(400).json({ error: 'First name must be at least 2 characters.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      return res.status(400).json({ error: pwdError });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // ── Validate Step 3
    if (!terms_accepted) {
      return res.status(400).json({ error: 'You must accept the Terms & Conditions.' });
    }

    // ── Create user
    let user;
    try {
      user = await User.create({
        email, password, first_name, last_name,
        phone, country_code, address, postcode,
        travel_interests, newsletter_opt_in,
        creation_source: 'email',
      });
    } catch (createError) {
      if (createError.code === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'This email address is already registered. Please log in.' });
      }
      throw createError;
    }

    const token = signToken({ sub: user.id, email: user.email, name: user.first_name });

    return res.status(201).json({
      success: true,
      message: 'Welcome to TürkiyeAI! Your account has been created.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      token,
      brand: 'TürkiyeAI – Powered by OrkinosAI',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user;
    try {
      user = await User.findByEmail(email);
    } catch {
      // DB unavailable – return graceful degradation
      return res.status(503).json({ error: 'Authentication service temporarily unavailable.' });
    }

    // Always run password verification to mitigate timing-based user enumeration
    const DUMMY_HASH = 'a'.repeat(128);
    const DUMMY_SALT = 'b'.repeat(32);
    const passwordValid = user
      ? await User.verifyPassword(password, user.password_hash, user.password_salt)
      : await User.verifyPassword(password, DUMMY_HASH, DUMMY_SALT).then(() => false);

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ sub: user.id, email: user.email, name: user.first_name });

    return res.json({
      success: true,
      message: `Welcome back, ${user.first_name}!`,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      token,
      brand: 'TürkiyeAI – Powered by OrkinosAI',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/social/:provider
 * Social login / registration via Google, Facebook, or LinkedIn.
 * In production this endpoint is called after the OAuth flow completes on the frontend.
 * 
 * Body: { email, name, provider_user_id, access_token (optional, for server-side validation) }
 */
router.post('/social/:provider', async (req, res) => {
  const { provider } = req.params;
  const SUPPORTED_PROVIDERS = ['google', 'facebook', 'linkedin'];

  if (!SUPPORTED_PROVIDERS.includes(provider.toLowerCase())) {
    return res.status(400).json({ error: `Unsupported provider: ${provider}. Supported: ${SUPPORTED_PROVIDERS.join(', ')}.` });
  }

  try {
    const { email, name, provider_user_id } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required for social login.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address from social provider.' });
    }

    const nameTrimmed = (name || '').trim();
    const nameParts = nameTrimmed.split(/\s+/).filter(Boolean);
    const first_name = nameParts[0] || email.split('@')[0];
    const last_name = nameParts.slice(1).join(' ') || '';

    let user;
    try {
      user = await User.findOrCreateSocial({
        email,
        first_name,
        last_name,
        provider: provider.toLowerCase(),
      });
    } catch {
      // DB unavailable – demo mode
      user = { id: provider_user_id || 'demo', email, first_name, last_name };
    }

    const token = signToken({ sub: user.id, email: user.email, name: user.first_name, provider: provider.toLowerCase() });

    return res.json({
      success: true,
      message: `Welcome${user.first_name ? `, ${user.first_name}` : ''}! Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        provider: provider.toLowerCase(),
      },
      token,
      brand: 'TürkiyeAI – Powered by OrkinosAI',
    });
  } catch (error) {
    console.error(`Social login error (${provider}):`, error);
    res.status(500).json({ error: `Social login failed. Please try again or use email registration.` });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Returns a reset token (in production, email this link to the user).
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Always return success to avoid email enumeration
    let user = null;
    try {
      user = await User.findByEmail(email);
    } catch {
      // DB unavailable – still return success
    }

    if (user) {
      // Generate a short-lived reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&uid=${user.id}`;
      // In production: send resetLink via email
      console.log(`[Password Reset] Reset link for ${email}: ${resetLink}`);
    }

    return res.json({
      success: true,
      message: 'If this email is registered, you will receive a password reset link shortly.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to initiate password reset. Please try again.' });
  }
});

/**
 * POST /api/auth/verify
 * Verify a session token.
 * Header: Authorization: Bearer <token>
 */
router.post('/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.body.token;

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ valid: false, error: 'Invalid or expired token.' });
  }

  return res.json({
    valid: true,
    user: { id: payload.sub, email: payload.email, name: payload.name },
  });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
