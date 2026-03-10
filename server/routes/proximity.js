const express = require('express');
const router = express.Router();
const Resort = require('../models/Resort');
const { haversineKm, estimateTransferMinutes, proximityScore } = require('../utils/geoUtils');

/**
 * Resort Deep Dive & Hotel Proximity AI Learning
 *
 * Provides comprehensive resort profiles and geospatial proximity analysis
 * to help travellers and the AI agent understand which hotels are nearest
 * to key attractions, beaches, airports, and one another.
 */

// ─── Static Attraction Data (used when DB is unavailable) ────────────────────

const ATTRACTIONS_BY_DESTINATION = {
  Bodrum: [
    { name: 'Bodrum Castle', type: 'Cultural', lat: 37.0344, lng: 27.4303 },
    { name: 'Bodrum Marina', type: 'Marina', lat: 37.0320, lng: 27.4289 },
    { name: 'Bardakçı Beach', type: 'Beach', lat: 37.0382, lng: 27.4103 },
    { name: 'Milas-Bodrum Airport (BJV)', type: 'Airport', lat: 37.2506, lng: 27.6643 },
  ],
  Antalya: [
    { name: 'Old Town (Kaleiçi)', type: 'Cultural', lat: 36.8841, lng: 30.7056 },
    { name: 'Konyaaltı Beach', type: 'Beach', lat: 36.8773, lng: 30.6467 },
    { name: 'Düden Waterfalls', type: 'Nature', lat: 36.9138, lng: 30.7530 },
    { name: 'Antalya Airport (AYT)', type: 'Airport', lat: 36.8987, lng: 30.8005 },
  ],
  Marmaris: [
    { name: 'Marmaris Castle', type: 'Cultural', lat: 36.8527, lng: 28.2716 },
    { name: 'Marmaris Beach', type: 'Beach', lat: 36.8530, lng: 28.2785 },
    { name: 'Datça Peninsula', type: 'Nature', lat: 36.7631, lng: 27.6886 },
    { name: 'Dalaman Airport (DLM)', type: 'Airport', lat: 36.7131, lng: 28.7925 },
  ],
  Fethiye: [
    { name: 'Ölüdeniz Beach', type: 'Beach', lat: 36.5503, lng: 29.1215 },
    { name: 'Butterfly Valley', type: 'Nature', lat: 36.5444, lng: 29.0979 },
    { name: 'Tlos Ancient City', type: 'Cultural', lat: 36.5443, lng: 29.4152 },
    { name: 'Dalaman Airport (DLM)', type: 'Airport', lat: 36.7131, lng: 28.7925 },
  ],
  Istanbul: [
    { name: 'Hagia Sophia', type: 'Cultural', lat: 41.0086, lng: 28.9802 },
    { name: 'Grand Bazaar', type: 'Shopping', lat: 41.0105, lng: 28.9680 },
    { name: 'Bosphorus', type: 'Nature', lat: 41.0638, lng: 29.0327 },
    { name: 'Istanbul Airport (IST)', type: 'Airport', lat: 41.2753, lng: 28.7519 },
  ],
  Cappadocia: [
    { name: 'Göreme Open Air Museum', type: 'Cultural', lat: 38.6431, lng: 34.8333 },
    { name: 'Üçhisar Castle', type: 'Cultural', lat: 38.6312, lng: 34.8151 },
    { name: 'Devrent Valley', type: 'Nature', lat: 38.6870, lng: 34.8673 },
    { name: 'Nevşehir Kapadokya Airport', type: 'Airport', lat: 38.7719, lng: 34.5353 },
  ],
  Kusadasi: [
    { name: 'Ephesus Ancient City', type: 'Cultural', lat: 37.9397, lng: 27.3417 },
    { name: 'Kusadasi Beach', type: 'Beach', lat: 37.8570, lng: 27.2605 },
    { name: 'Pigeon Island', type: 'Nature', lat: 37.8590, lng: 27.2484 },
    { name: 'Izmir Airport (ADB)', type: 'Airport', lat: 38.2924, lng: 27.1570 },
  ],
};

// ─── Helper: AI-style Deep-Dive Insights ─────────────────────────────────────

function generateDeepDiveInsights(resort, amenities, proximityData) {
  const insights = [];

  if (resort.star_rating >= 5) {
    insights.push('Ultra-luxury property – expect world-class service and premium facilities.');
  } else if (resort.star_rating === 4) {
    insights.push('Premium 4-star property balancing quality and value.');
  }

  const beachProx = proximityData.find(p => p.type === 'Beach');
  if (beachProx && beachProx.distance_km < 0.5) {
    insights.push(`Direct beach access – the nearest beach is only ${(beachProx.distance_km * 1000).toFixed(0)} m away.`);
  } else if (beachProx && beachProx.distance_km < 2) {
    insights.push(`Short walk to the beach (${beachProx.distance_km.toFixed(1)} km).`);
  }

  const airportProx = proximityData.find(p => p.type === 'Airport');
  if (airportProx) {
    const mins = estimateTransferMinutes(airportProx.distance_km);
    insights.push(`Approximately ${mins} minutes from ${airportProx.name} (${airportProx.distance_km.toFixed(0)} km).`);
  }

  const spaAmenities = amenities.filter(a =>
    (a.amenity_category || '').toLowerCase().includes('spa') ||
    (a.amenity_name || '').toLowerCase().includes('spa') ||
    (a.amenity_name || '').toLowerCase().includes('hammam')
  );
  if (spaAmenities.length > 0) {
    insights.push('On-site spa and wellness facilities available – perfect for a restorative break.');
  }

  const poolAmenities = amenities.filter(a =>
    (a.amenity_name || '').toLowerCase().includes('pool')
  );
  if (poolAmenities.length > 1) {
    insights.push(`Multiple pool options (${poolAmenities.length}) to suit all guests.`);
  }

  if (resort.price_range) {
    insights.push(`Price range: ${resort.price_range} (indicative – confirm with licensed providers).`);
  }

  if (insights.length === 0) {
    insights.push('Great base for exploring the surrounding area.');
  }

  return insights;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/resorts/:id/deep-dive
 * Comprehensive AI-powered resort profile
 */
router.get('/:id/deep-dive', async (req, res) => {
  try {
    const { id } = req.params;

    const [resort, amenities] = await Promise.all([
      Resort.getById(id),
      Resort.getAmenities(id),
    ]);

    if (!resort) {
      return res.status(404).json({ error: 'Resort not found', id });
    }

    // Determine destination name for attraction lookup
    const destinationName = resort.destination_name || '';
    const attractions = ATTRACTIONS_BY_DESTINATION[destinationName] || [];

    // Calculate proximity to each attraction (only when coordinates are present)
    let proximityData = [];
    if (resort.latitude && resort.longitude) {
      proximityData = attractions.map(attr => {
        const dist = haversineKm(
          parseFloat(resort.latitude),
          parseFloat(resort.longitude),
          attr.lat,
          attr.lng
        );
        return {
          name: attr.name,
          type: attr.type,
          distance_km: Math.round(dist * 10) / 10,
          score: proximityScore(dist, attr.type),
        };
      });
      proximityData.sort((a, b) => a.distance_km - b.distance_km);
    }

    const insights = generateDeepDiveInsights(resort, amenities, proximityData);

    // Group amenities by category
    const amenitiesByCategory = amenities.reduce((acc, amenity) => {
      const cat = amenity.amenity_category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        name: amenity.amenity_name,
        icon: amenity.icon,
      });
      return acc;
    }, {});

    res.json({
      resort: {
        id: resort.id,
        name: resort.name,
        slug: resort.slug,
        destination: resort.destination_name,
        region: resort.destination_region,
        star_rating: resort.star_rating,
        description: resort.description,
        address: resort.address,
        latitude: resort.latitude,
        longitude: resort.longitude,
        price_range: resort.price_range,
        room_count: resort.room_count,
        check_in_time: resort.check_in_time,
        check_out_time: resort.check_out_time,
        website_url: resort.website_url,
        booking_url: resort.booking_url,
      },
      amenities_by_category: amenitiesByCategory,
      proximity_to_attractions: proximityData,
      ai_insights: insights,
      brand: 'TürkiyeAI – Powered by OrkinosAI',
      disclaimer: 'AI insights are informational. Verify details with the resort directly before booking.',
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/:id/deep-dive:', error);
    res.status(500).json({
      error: 'Failed to generate resort deep dive',
      message: error.message,
    });
  }
});

/**
 * GET /api/resorts/:id/nearby
 * Hotels near a given resort (proximity AI learning)
 * Query params: radius_km (default 15), limit (default 10)
 */
router.get('/:id/nearby', async (req, res) => {
  try {
    const { id } = req.params;
    const radiusKm = parseFloat(req.query.radius_km) || 15;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const pivot = await Resort.getById(id);
    if (!pivot) {
      return res.status(404).json({ error: 'Resort not found', id });
    }

    if (!pivot.latitude || !pivot.longitude) {
      return res.json({
        pivot_resort: { id: pivot.id, name: pivot.name },
        nearby_resorts: [],
        note: 'Coordinate data not available for this resort. Proximity calculation unavailable.',
        brand: 'TürkiyeAI – Powered by OrkinosAI',
      });
    }

    const allResorts = await Resort.getAll({ region: pivot.destination_region });

    const nearby = allResorts
      .filter(r => r.id !== id && r.latitude && r.longitude)
      .map(r => {
        const dist = haversineKm(
          parseFloat(pivot.latitude),
          parseFloat(pivot.longitude),
          parseFloat(r.latitude),
          parseFloat(r.longitude)
        );
        return {
          id: r.id,
          name: r.name,
          star_rating: r.star_rating,
          destination: r.destination_name,
          price_range: r.price_range,
          distance_km: Math.round(dist * 10) / 10,
          similarity_score: computeSimilarityScore(pivot, r, dist),
        };
      })
      .filter(r => r.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);

    res.json({
      pivot_resort: {
        id: pivot.id,
        name: pivot.name,
        destination: pivot.destination_name,
        star_rating: pivot.star_rating,
        latitude: pivot.latitude,
        longitude: pivot.longitude,
      },
      search_radius_km: radiusKm,
      nearby_resorts: nearby,
      count: nearby.length,
      brand: 'TürkiyeAI – Powered by OrkinosAI',
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/:id/nearby:', error);
    res.status(500).json({
      error: 'Failed to compute nearby resorts',
      message: error.message,
    });
  }
});

/**
 * GET /api/resorts/proximity/attractions
 * List resorts ranked by proximity to a named attraction or attraction type
 * Query params: attraction_type (Beach|Airport|Cultural|etc.), destination, limit
 */
router.get('/proximity/attractions', async (req, res) => {
  try {
    const { attraction_type, destination, limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr, 10) || 10, 50);

    if (!attraction_type && !destination) {
      return res.status(400).json({
        error: 'Provide at least one of: attraction_type, destination',
      });
    }

    // Get resorts for the destination or all
    const filters = {};
    if (destination) filters.region = destination;
    const allResorts = await Resort.getAll(filters);

    const scored = [];

    for (const resort of allResorts) {
      if (!resort.latitude || !resort.longitude) continue;

      const destAttractions = ATTRACTIONS_BY_DESTINATION[resort.destination_name] || [];
      const filtered = attraction_type
        ? destAttractions.filter(a => a.type.toLowerCase() === attraction_type.toLowerCase())
        : destAttractions;

      for (const attr of filtered) {
        const dist = haversineKm(
          parseFloat(resort.latitude),
          parseFloat(resort.longitude),
          attr.lat,
          attr.lng
        );
        scored.push({
          resort_id: resort.id,
          resort_name: resort.name,
          destination: resort.destination_name,
          star_rating: resort.star_rating,
          price_range: resort.price_range,
          attraction_name: attr.name,
          attraction_type: attr.type,
          distance_km: Math.round(dist * 10) / 10,
          proximity_score: proximityScore(dist, attr.type),
        });
      }
    }

    scored.sort((a, b) => b.proximity_score - a.proximity_score);
    const results = scored.slice(0, limit);

    res.json({
      results,
      count: results.length,
      filters: { attraction_type, destination },
      brand: 'TürkiyeAI – Powered by OrkinosAI',
    });
  } catch (error) {
    console.error('Error in GET /api/resorts/proximity/attractions:', error);
    res.status(500).json({
      error: 'Failed to compute attraction proximity',
      message: error.message,
    });
  }
});

// ─── Similarity Score Helper ──────────────────────────────────────────────────

/**
 * Compute a hotel-to-hotel similarity score (0–100).
 * Factors: distance, star rating parity, same destination.
 */
function computeSimilarityScore(pivot, candidate, distanceKm) {
  let score = 100;

  // Distance penalty
  score -= distanceKm * 4;

  // Star rating parity bonus/penalty
  const starDiff = Math.abs((pivot.star_rating || 3) - (candidate.star_rating || 3));
  score -= starDiff * 8;

  // Same destination bonus
  if (pivot.destination_name && pivot.destination_name === candidate.destination_name) {
    score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

module.exports = router;
