const express = require('express');
const multer = require('multer');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  indexKnowledgeItem,
  deleteKnowledgeItem,
  searchKnowledge
} = require('../config/knowledgeSearch');

// Rate limiter for write operations (upload, url, note, delete)
const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many knowledge item requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for read operations (list, search)
const readRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Supported text-based MIME types
const ALLOWED_MIMETYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/html'
];

// Multer config – in-memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase().split('.').pop();
    const allowedExts = ['txt', 'md', 'csv', 'json', 'html', 'htm'];
    if (ALLOWED_MIMETYPES.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: .txt, .md, .csv, .json, .html`));
    }
  }
});

// Helper – try to get the DB pool if configured
let pool = null;
function getPool() {
  if (!pool) {
    try {
      pool = require('../config/database');
    } catch {
      pool = null;
    }
  }
  return pool;
}

/**
 * Generate a simple UUID-like id without the crypto module's named export
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Persist a knowledge item to the database (if available) and index it in Azure Search
 */
async function saveKnowledgeItem(item) {
  const db = getPool();

  // Attempt DB insert
  if (db) {
    try {
      const { rows } = await db.query(
        `INSERT INTO knowledge_items
           (id, title, content, source_type, source_url, original_filename,
            location_tags, content_category, is_indexed, indexed_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          item.id,
          item.title,
          item.content,
          item.source_type,
          item.source_url || null,
          item.original_filename || null,
          item.location_tags || [],
          item.content_category || 'general',
          false,
          null,
          item.created_by || 'admin'
        ]
      );
      item = rows[0];
    } catch (dbErr) {
      console.warn('⚠️  DB insert failed, proceeding without DB persistence:', dbErr.message);
    }
  }

  // Index in Azure Search
  let indexed = false;
  try {
    await indexKnowledgeItem(item);
    indexed = true;

    // Update indexed flag in DB
    if (db) {
      await db.query(
        `UPDATE knowledge_items SET is_indexed = TRUE, indexed_at = NOW() WHERE id = $1`,
        [item.id]
      ).catch(() => {});
    }
  } catch (searchErr) {
    console.warn('⚠️  Azure Search indexing failed:', searchErr.message);
  }

  return { ...item, indexed };
}

// ─── GET /api/knowledge ───────────────────────────────────────────────────────
/**
 * List all knowledge items (paginated)
 */
router.get('/', readRateLimit, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const source_type = req.query.source_type || null;
  const location_tag = req.query.location_tag || null;

  const db = getPool();
  if (!db) {
    return res.json({
      items: [],
      total: 0,
      note: 'Database not configured. Knowledge items require a PostgreSQL connection.'
    });
  }

  try {
    const conditions = ['is_active = TRUE'];
    const params = [];

    if (source_type) {
      params.push(source_type);
      conditions.push(`source_type = $${params.length}`);
    }
    if (location_tag) {
      params.push(location_tag);
      conditions.push(`$${params.length} = ANY(location_tags)`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) FROM knowledge_items ${where}`;
    const dataQuery = `
      SELECT id, title, source_type, source_url, original_filename,
             location_tags, content_category, is_indexed, created_at, created_by,
             LEFT(content, 200) AS content_preview
      FROM knowledge_items ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params),
      db.query(dataQuery, [...params, limit, offset])
    ]);

    res.json({
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset
    });
  } catch (err) {
    console.error('Knowledge list error:', err);
    res.status(500).json({ error: 'Failed to fetch knowledge items', details: err.message });
  }
});

// ─── POST /api/knowledge/upload ──────────────────────────────────────────────
/**
 * Upload a text file as a knowledge item
 */
router.post('/upload', writeRateLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a file in the "file" field.' });
    }

    const content = req.file.buffer.toString('utf8');
    if (!content.trim()) {
      return res.status(400).json({ error: 'Uploaded file is empty.' });
    }

    const locationTags = req.body.location_tags
      ? req.body.location_tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const item = {
      id: generateId(),
      title: req.body.title || req.file.originalname,
      content: content.trim(),
      source_type: 'file',
      source_url: null,
      original_filename: req.file.originalname,
      location_tags: locationTags,
      content_category: req.body.content_category || 'general',
      created_by: req.body.created_by || 'admin',
      created_at: new Date().toISOString()
    };

    const saved = await saveKnowledgeItem(item);

    res.status(201).json({
      success: true,
      message: 'File uploaded and indexed successfully.',
      item: { ...saved, content: undefined, content_preview: content.slice(0, 200) },
      indexed: saved.indexed
    });
  } catch (err) {
    console.error('Knowledge upload error:', err);
    if (err.message && err.message.startsWith('Unsupported file type')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to upload knowledge item', details: err.message });
  }
});

// ─── POST /api/knowledge/url ─────────────────────────────────────────────────
/**
 * Fetch content from a URL and add it as a knowledge item
 */
router.post('/url', writeRateLimit, async (req, res) => {
  try {
    const { url, title, location_tags = [], content_category = 'general', created_by = 'admin' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required.' });
    }

    // Basic URL validation
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported.' });
    }

    // Fetch the URL content
    let content;
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'TürkiyeAI-KnowledgeBot/1.0' },
        maxContentLength: 5 * 1024 * 1024 // 5 MB
      });

      const rawContent = typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data);

      // Strip script/style blocks, all HTML tags, then encode any residual angle brackets.
      // The final replace ensures no <tag> sequences survive, preventing any HTML injection.
      content = rawContent
        .replace(/<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style[^>]*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/</g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!content) {
        return res.status(422).json({ error: 'No text content could be extracted from the URL.' });
      }
    } catch (fetchErr) {
      return res.status(422).json({
        error: 'Failed to fetch URL content.',
        details: fetchErr.message
      });
    }

    const tags = Array.isArray(location_tags)
      ? location_tags.map(t => String(t).trim()).filter(Boolean)
      : String(location_tags).split(',').map(t => t.trim()).filter(Boolean);

    const item = {
      id: generateId(),
      title: title || url,
      content: content.slice(0, 100000), // Cap at 100 KB of text
      source_type: 'url',
      source_url: url,
      original_filename: null,
      location_tags: tags,
      content_category,
      created_by,
      created_at: new Date().toISOString()
    };

    const saved = await saveKnowledgeItem(item);

    res.status(201).json({
      success: true,
      message: 'URL content fetched and indexed successfully.',
      item: { ...saved, content: undefined, content_preview: content.slice(0, 200) },
      indexed: saved.indexed,
      content_length: content.length
    });
  } catch (err) {
    console.error('Knowledge URL error:', err);
    res.status(500).json({ error: 'Failed to add URL knowledge item', details: err.message });
  }
});

// ─── POST /api/knowledge/note ────────────────────────────────────────────────
/**
 * Add a free-text note as a knowledge item (e.g., quick updates via chat)
 */
router.post('/note', writeRateLimit, async (req, res) => {
  try {
    const { title, content, location_tags = [], content_category = 'general', created_by = 'admin' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required.' });
    }

    const tags = Array.isArray(location_tags)
      ? location_tags.map(t => String(t).trim()).filter(Boolean)
      : String(location_tags).split(',').map(t => t.trim()).filter(Boolean);

    const item = {
      id: generateId(),
      title: (title || content.slice(0, 100)).trim(),
      content: content.trim(),
      source_type: 'note',
      source_url: null,
      original_filename: null,
      location_tags: tags,
      content_category,
      created_by,
      created_at: new Date().toISOString()
    };

    const saved = await saveKnowledgeItem(item);

    res.status(201).json({
      success: true,
      message: 'Note added and indexed successfully.',
      item: { ...saved, content: undefined, content_preview: content.slice(0, 200) },
      indexed: saved.indexed
    });
  } catch (err) {
    console.error('Knowledge note error:', err);
    res.status(500).json({ error: 'Failed to add knowledge note', details: err.message });
  }
});

// ─── DELETE /api/knowledge/:id ───────────────────────────────────────────────
/**
 * Delete a knowledge item by ID
 */
router.delete('/:id', writeRateLimit, async (req, res) => {
  const { id } = req.params;

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid knowledge item ID.' });
  }

  const db = getPool();
  let removedFromDb = false;
  let removedFromSearch = false;

  // Remove from database
  if (db) {
    try {
      const result = await db.query(
        `UPDATE knowledge_items SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
        [id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Knowledge item not found.' });
      }
      removedFromDb = true;
    } catch (dbErr) {
      console.warn('⚠️  DB delete failed:', dbErr.message);
    }
  }

  // Remove from Azure Search
  try {
    await deleteKnowledgeItem(id);
    removedFromSearch = true;
  } catch (searchErr) {
    console.warn('⚠️  Azure Search delete failed:', searchErr.message);
  }

  res.json({
    success: true,
    message: 'Knowledge item deleted.',
    id,
    removedFromDb,
    removedFromSearch
  });
});

// ─── GET /api/knowledge/search ───────────────────────────────────────────────
/**
 * Search knowledge items – primarily used internally by the AI agent tool,
 * but also exposed for direct use.
 */
router.get('/search', readRateLimit, async (req, res) => {
  const query = req.query.q || req.query.query || '';
  const location_tag = req.query.location_tag || null;
  const source_type = req.query.source_type || null;
  const top = Math.min(parseInt(req.query.top, 10) || 5, 20);

  if (!query.trim()) {
    return res.status(400).json({ error: 'Search query (q) is required.' });
  }

  try {
    const results = await searchKnowledge(query, { location_tag, source_type, top });
    return res.json({ results, query, count: results.length });
  } catch (searchErr) {
    console.warn('Azure Search not available for knowledge search:', searchErr.message);
    return res.json({
      results: [],
      query,
      count: 0,
      note: 'Azure AI Search is not configured or the knowledge index does not exist yet.'
    });
  }
});

module.exports = router;
