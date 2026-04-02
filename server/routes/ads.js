const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Ad = require('../models/Ad');

// ─── Upload storage ───────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(__dirname, '../uploads/ads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Extension whitelist derived from mime type (server-controlled, not user input)
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/gif':  '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  // Filename is entirely server-generated: timestamp + random bytes + whitelisted ext.
  // No user-provided data is included, eliminating any path-injection risk.
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    const uid = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${uid}${ext}`);
  },
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported image type: ${file.mimetype}. Allowed: jpg, png, gif, webp, svg.`));
    }
  },
});

// ─── Rate limiters ────────────────────────────────────────────────────────────

const readLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const writeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests. Please try again later.' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_ZONES = Ad.allZones().map(z => z.id);
const VALID_AD_TYPES = ['image', 'text', 'html'];
const VALID_PACKAGES = ['bronze', 'silver', 'gold', 'platinum'];

function validateAdPayload(body) {
  const errors = [];
  if (!body.zone || !VALID_ZONES.includes(body.zone)) {
    errors.push(`zone must be one of: ${VALID_ZONES.join(', ')}`);
  }
  if (!body.ad_type || !VALID_AD_TYPES.includes(body.ad_type)) {
    errors.push(`ad_type must be one of: ${VALID_AD_TYPES.join(', ')}`);
  }
  if (!body.title || !body.title.trim()) {
    errors.push('title is required.');
  }
  if (body.package_type && !VALID_PACKAGES.includes(body.package_type)) {
    errors.push(`package_type must be one of: ${VALID_PACKAGES.join(', ')}`);
  }
  if (body.link_url && body.link_url.trim()) {
    try {
      const u = new URL(body.link_url.trim());
      if (!['http:', 'https:'].includes(u.protocol)) errors.push('link_url must use http or https.');
    } catch {
      errors.push('link_url is not a valid URL.');
    }
  }  return errors;
}

// ─── Safe file removal helper ──────────────────────────────────────────────────
// Filenames stored in ads.json were generated entirely by the server (timestamp + random hex + ext).
// The whitelist regex provides additional defence-in-depth.
function safeUnlinkUpload(filename) {
  if (!filename) return;
  // Whitelist: allow only alphanumeric, dots, hyphens, underscores (no separators)
  if (!/^[\w.\-]+$/.test(filename)) return;
  fs.unlink(path.join(UPLOADS_DIR, filename), () => {});
}

// ─── GET /api/ads ─────────────────────────────────────────────────────────────
/**
 * List all ads (admin use). Optional query params: zone, active (true/false).
 */
router.get('/', readLimit, (req, res) => {
  const { zone, active } = req.query;
  const isActive = active === 'true' ? true : active === 'false' ? false : null;
  const ads = Ad.list({ zone: zone || null, isActive });
  res.json({ ads, total: ads.length });
});

// ─── GET /api/ads/zones ───────────────────────────────────────────────────────
/**
 * Return metadata about all available ad zones.
 */
router.get('/zones', readLimit, (_req, res) => {
  res.json({ zones: Ad.allZones() });
});

// ─── GET /api/ads/packages ────────────────────────────────────────────────────
/**
 * Return all advertising package types with their constraints.
 */
router.get('/packages', readLimit, (_req, res) => {
  res.json({ packages: Ad.allPackages() });
});

// ─── GET /api/ads/zone/:zone ──────────────────────────────────────────────────
/**
 * Get active ads for a specific zone (used by frontend banners).
 */
router.get('/zone/:zone', readLimit, (req, res) => {
  const { zone } = req.params;
  if (!VALID_ZONES.includes(zone)) {
    return res.status(400).json({ error: `Invalid zone. Valid zones: ${VALID_ZONES.join(', ')}` });
  }
  const ads = Ad.getActiveByZone(zone);
  res.json({ ads, zone, total: ads.length });
});

// ─── GET /api/ads/:id ─────────────────────────────────────────────────────────
/**
 * Get a single ad by ID.
 */
router.get('/:id', readLimit, (req, res) => {
  const ad = Ad.findById(req.params.id);
  if (!ad) return res.status(404).json({ error: 'Ad not found.' });
  res.json({ ad });
});

// ─── POST /api/ads ────────────────────────────────────────────────────────────
/**
 * Create a new ad.
 * Supports multipart/form-data for image upload (field name: "image").
 */
router.post('/', writeLimit, upload.single('image'), (req, res) => {
  const body = req.body || {};

  const errors = validateAdPayload(body);
  if (errors.length) {
    // Remove uploaded file if validation fails
    if (req.file) safeUnlinkUpload(req.file.filename);
    return res.status(400).json({ errors });
  }

  // Attach uploaded image URL if provided
  if (req.file) {
    body.image_url = `/api/ads/uploads/${req.file.filename}`;
  }

  const ad = Ad.create(body);
  res.status(201).json({ success: true, ad });
});

// ─── PUT /api/ads/:id ─────────────────────────────────────────────────────────
/**
 * Update an existing ad. Supports optional image upload.
 */
router.put('/:id', writeLimit, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const existing = Ad.findById(id);
  if (!existing) {
    if (req.file) safeUnlinkUpload(req.file.filename);
    return res.status(404).json({ error: 'Ad not found.' });
  }

  const body = req.body || {};

  // Merge zone/ad_type from existing if not supplied (for partial updates)
  const mergedBody = { zone: existing.zone, ad_type: existing.ad_type, title: existing.title, ...body };
  const errors = validateAdPayload(mergedBody);
  if (errors.length) {
    if (req.file) safeUnlinkUpload(req.file.filename);
    return res.status(400).json({ errors });
  }

  if (req.file) {
    // Delete old image file if it was a local upload
    if (existing.image_url && existing.image_url.startsWith('/api/ads/uploads/')) {
      safeUnlinkUpload(path.basename(existing.image_url));
    }
    body.image_url = `/api/ads/uploads/${req.file.filename}`;
  }

  const updated = Ad.update(id, body);
  res.json({ success: true, ad: updated });
});

// ─── DELETE /api/ads/:id ──────────────────────────────────────────────────────
/**
 * Delete an ad and its associated uploaded image (if any).
 */
router.delete('/:id', writeLimit, (req, res) => {
  const { id } = req.params;
  const existing = Ad.findById(id);
  if (!existing) return res.status(404).json({ error: 'Ad not found.' });

  // Delete local image file
  if (existing.image_url && existing.image_url.startsWith('/api/ads/uploads/')) {
    safeUnlinkUpload(path.basename(existing.image_url));
  }

  Ad.delete(id);
  res.json({ success: true, id, message: 'Ad deleted.' });
});

// ─── Serve uploaded images ────────────────────────────────────────────────────
// Mounted at /api/ads/uploads/:filename
router.use('/uploads', express.static(UPLOADS_DIR));

module.exports = router;
