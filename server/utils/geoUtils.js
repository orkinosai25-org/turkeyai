/**
 * Shared geographic utility functions for TürkiyeAI
 */

/**
 * Calculate the great-circle distance between two lat/lng points (km).
 * Uses the Haversine formula.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometres
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimate transfer time in minutes given a road distance.
 * Assumes an average road speed of 60 km/h for Turkish resort transfers.
 * @param {number} distanceKm
 * @returns {number} Estimated minutes
 */
function estimateTransferMinutes(distanceKm) {
  const AVG_SPEED_KMH = 60;
  return Math.round((distanceKm / AVG_SPEED_KMH) * 60);
}

/**
 * Derive a proximity score (0–100) based on distance and attraction type.
 * Closer = higher score. Beach and airport proximity carry extra weight.
 * @param {number} distanceKm
 * @param {string} attractionType
 * @returns {number} Score 0–100
 */
function proximityScore(distanceKm, attractionType) {
  const weights = {
    Beach: 1.4,
    Airport: 1.2,
    Cultural: 1.0,
    Marina: 1.1,
    Nature: 0.9,
    Shopping: 0.9,
  };
  const weight = weights[attractionType] || 1.0;
  const raw = Math.max(0, 100 - distanceKm * 10);
  return Math.min(100, Math.round(raw * weight));
}

module.exports = { haversineKm, estimateTransferMinutes, proximityScore };
