const pool = require('../config/database');

/**
 * Resort Model (Hotels)
 * Handles database operations for resorts/hotels
 */
class Resort {
  /**
   * Get all resorts with optional filters
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        h.id, h.name, h.slug, h.description, h.star_rating,
        h.address, h.latitude, h.longitude, h.phone, h.email,
        h.website_url, h.booking_url, h.price_range, h.room_count,
        h.check_in_time, h.check_out_time,
        d.name as destination_name, d.region as destination_region
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      WHERE h.is_active = true
    `;
    
    const params = [];
    let paramCount = 1;

    // Filter by destination
    if (filters.destination_id) {
      query += ` AND h.destination_id = $${paramCount}`;
      params.push(filters.destination_id);
      paramCount++;
    }

    // Filter by star rating
    if (filters.star_rating) {
      query += ` AND h.star_rating = $${paramCount}`;
      params.push(filters.star_rating);
      paramCount++;
    }

    // Filter by region
    if (filters.region) {
      query += ` AND d.region = $${paramCount}`;
      params.push(filters.region);
      paramCount++;
    }

    query += ' ORDER BY h.star_rating DESC, h.name ASC';

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching resorts:', error);
      throw error;
    }
  }

  /**
   * Get a specific resort by ID
   */
  static async getById(id) {
    const query = `
      SELECT 
        h.*,
        d.name as destination_name, d.region as destination_region,
        d.slug as destination_slug
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      WHERE h.id = $1 AND h.is_active = true
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching resort:', error);
      throw error;
    }
  }

  /**
   * Get a specific resort by slug
   */
  static async getBySlug(slug) {
    const query = `
      SELECT 
        h.*,
        d.name as destination_name, d.region as destination_region,
        d.slug as destination_slug
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      WHERE h.slug = $1 AND h.is_active = true
    `;
    
    try {
      const result = await pool.query(query, [slug]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching resort:', error);
      throw error;
    }
  }

  /**
   * Get amenities for a specific resort
   */
  static async getAmenities(resortId) {
    const query = `
      SELECT 
        id, amenity_name, amenity_category, icon
      FROM hotel_amenities
      WHERE hotel_id = $1
      ORDER BY amenity_category, amenity_name
    `;
    
    try {
      const result = await pool.query(query, [resortId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching resort amenities:', error);
      throw error;
    }
  }

  /**
   * Search resorts by name or description
   */
  static async search(searchTerm) {
    const query = `
      SELECT 
        h.id, h.name, h.slug, h.description, h.star_rating,
        h.price_range, h.latitude, h.longitude,
        d.name as destination_name, d.region as destination_region
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      WHERE h.is_active = true
        AND (h.name ILIKE $1 OR h.description ILIKE $1)
      ORDER BY h.star_rating DESC, h.name ASC
    `;
    
    try {
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error searching resorts:', error);
      throw error;
    }
  }

  /**
   * Get resorts by region
   */
  static async getByRegion(region) {
    const query = `
      SELECT 
        h.id, h.name, h.slug, h.description, h.star_rating,
        h.price_range, h.latitude, h.longitude,
        d.name as destination_name, d.region as destination_region
      FROM hotels h
      LEFT JOIN destinations d ON h.destination_id = d.id
      WHERE h.is_active = true AND d.region = $1
      ORDER BY h.star_rating DESC, h.name ASC
    `;
    
    try {
      const result = await pool.query(query, [region]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching resorts by region:', error);
      throw error;
    }
  }
}

module.exports = Resort;
