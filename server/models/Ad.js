const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Ad Model
 * Manages advertising slots for TürkiyeAI.
 *
 * Primary storage: JSON file (server/data/ads.json) – always available.
 * Optional: PostgreSQL via pool (ads table) – used when DB is configured.
 *
 * Ad Zones:
 *   header_banner  – Full-width leaderboard below site header (728×90)
 *   home_top       – Homepage top banner (970×250 billboard)
 *   home_mid       – Homepage mid-section banner (728×90)
 *   home_bottom    – Homepage bottom banner (728×90)
 *   search_top     – Above search results (728×90)
 *   search_sidebar – Beside search results (300×250)
 *   listing_top    – Top of destinations/listing page (728×90)
 *   listing_sidebar– Beside destinations listing (300×250)
 *   detail_top     – Top of hotel / destination detail page (728×90)
 *   detail_bottom  – Bottom of hotel / destination detail page (728×90)
 *   footer_banner  – Full-width banner above footer (728×90)
 *
 * Ad Types: image | text | html
 *
 * Ad Packages:
 *   bronze   – Text only, ≤50 words, max 3 zones
 *   silver   – Image (≤300×250) + text (≤100 words), max 5 zones
 *   gold     – Image (≤728×90) + text (≤200 words) + video (≤30 s), all zones
 *   platinum – All formats, video ≤60 s, all zones, priority placement
 */

const ADS_FILE = path.join(__dirname, '../data/ads.json');

// ─── Package constraints ───────────────────────────────────────────────────────
const PACKAGE_CONSTRAINTS = {
  bronze:   { maxWords: 50,  maxImageWidth: 0,   maxImageHeight: 0,   maxVideoSeconds: 0,  maxZones: 3 },
  silver:   { maxWords: 100, maxImageWidth: 300,  maxImageHeight: 250, maxVideoSeconds: 0,  maxZones: 5 },
  gold:     { maxWords: 200, maxImageWidth: 728,  maxImageHeight: 90,  maxVideoSeconds: 30, maxZones: 99 },
  platinum: { maxWords: 500, maxImageWidth: 1200, maxImageHeight: 400, maxVideoSeconds: 60, maxZones: 99 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function readAds() {
  try {
    const raw = fs.readFileSync(ADS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAds(ads) {
  fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf8');
}

// ─── Ad Model ─────────────────────────────────────────────────────────────────

class Ad {
  /**
   * List all ads (optionally filtered).
   * @param {{ zone?: string, isActive?: boolean }} filters
   */
  static list({ zone = null, isActive = null } = {}) {
    let ads = readAds();
    if (zone) ads = ads.filter(a => a.zone === zone);
    if (isActive !== null) ads = ads.filter(a => a.is_active === isActive);
    return ads.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  /**
   * Get a single ad by ID.
   */
  static findById(id) {
    return readAds().find(a => a.id === id) || null;
  }

  /**
   * Get active ads for a specific zone (used by the frontend to render banners).
   * Respects date range (start_date / end_date) if set.
   * Date comparisons are done at day granularity so an ad is shown throughout its end_date.
   */
  static getActiveByZone(zone) {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    return readAds()
      .filter(a => {
        if (a.zone !== zone) return false;
        if (!a.is_active) return false;
        if (a.start_date && a.start_date > today) return false;
        if (a.end_date && a.end_date < today) return false;
        return true;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  /**
   * Create a new ad.
   */
  static create(data) {
    const ads = readAds();
    const now = new Date().toISOString();
    const ad = {
      id: generateId(),
      zone: data.zone || 'header_banner',
      ad_type: data.ad_type || 'text',
      title: (data.title || '').trim(),
      body_text: (data.body_text || '').trim(),
      image_url: data.image_url || null,
      link_url: data.link_url || null,
      alt_text: (data.alt_text || '').trim(),
      advertiser_name: (data.advertiser_name || '').trim(),
      package_type: data.package_type || 'bronze',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      display_order: parseInt(data.display_order, 10) || 0,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_at: now,
      updated_at: now,
    };
    ads.push(ad);
    writeAds(ads);
    return ad;
  }

  /**
   * Update an existing ad.
   */
  static update(id, data) {
    const ads = readAds();
    const idx = ads.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    const updated = {
      ...ads[idx],
      ...data,
      id,                        // never overwrite id
      created_at: ads[idx].created_at, // never overwrite created_at
      updated_at: now,
    };
    if (data.is_active !== undefined) updated.is_active = Boolean(data.is_active);
    if (data.display_order !== undefined) updated.display_order = parseInt(data.display_order, 10) || 0;

    ads[idx] = updated;
    writeAds(ads);
    return updated;
  }

  /**
   * Delete an ad by ID.
   */
  static delete(id) {
    const ads = readAds();
    const idx = ads.findIndex(a => a.id === id);
    if (idx === -1) return false;
    ads.splice(idx, 1);
    writeAds(ads);
    return true;
  }

  /**
   * Return the constraints for a given package type.
   */
  static packageConstraints(packageType) {
    return PACKAGE_CONSTRAINTS[packageType] || PACKAGE_CONSTRAINTS.bronze;
  }

  /**
   * Return all available package types with their constraints.
   */
  static allPackages() {
    return Object.entries(PACKAGE_CONSTRAINTS).map(([type, constraints]) => ({
      type,
      ...constraints,
    }));
  }

  /**
   * Return all valid zone identifiers with descriptions.
   */
  static allZones() {
    return [
      { id: 'header_banner',   label: 'Header Banner',          description: 'Full-width leaderboard below site header',     width: 728,  height: 90  },
      { id: 'home_top',        label: 'Homepage – Top',          description: 'Large billboard at top of homepage',           width: 970,  height: 250 },
      { id: 'home_mid',        label: 'Homepage – Middle',       description: 'Banner between homepage content sections',     width: 728,  height: 90  },
      { id: 'home_bottom',     label: 'Homepage – Bottom',       description: 'Banner at bottom of homepage',                 width: 728,  height: 90  },
      { id: 'search_top',      label: 'Search – Top',            description: 'Banner above search results',                  width: 728,  height: 90  },
      { id: 'search_sidebar',  label: 'Search – Sidebar',        description: 'Medium rectangle beside search results',       width: 300,  height: 250 },
      { id: 'listing_top',     label: 'Destinations – Top',      description: 'Banner at top of destinations listing',        width: 728,  height: 90  },
      { id: 'listing_sidebar', label: 'Destinations – Sidebar',  description: 'Medium rectangle beside destination cards',    width: 300,  height: 250 },
      { id: 'detail_top',      label: 'Hotel Detail – Top',      description: 'Banner at top of hotel/detail page',           width: 728,  height: 90  },
      { id: 'detail_bottom',   label: 'Hotel Detail – Bottom',   description: 'Banner at bottom of hotel/detail page',        width: 728,  height: 90  },
      { id: 'footer_banner',   label: 'Footer Banner',           description: 'Full-width banner directly above footer',      width: 728,  height: 90  },
    ];
  }
}

module.exports = Ad;
module.exports.PACKAGE_CONSTRAINTS = PACKAGE_CONSTRAINTS;
