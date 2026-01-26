const pool = require('../config/database');

/**
 * Region Model
 * Handles database operations for regions (derived from destinations table)
 */
class Region {
  /**
   * Get all distinct regions from destinations
   */
  static async getAll() {
    const query = `
      SELECT DISTINCT region, COUNT(id) as destination_count
      FROM destinations
      WHERE is_active = true
      GROUP BY region
      ORDER BY region ASC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  /**
   * Get a specific region with its destinations
   */
  static async getByName(regionName) {
    const query = `
      SELECT 
        id, name, slug, region, description, destination_type,
        best_time_to_visit, latitude, longitude, image_url
      FROM destinations
      WHERE region = $1 AND is_active = true
      ORDER BY name ASC
    `;
    
    try {
      const result = await pool.query(query, [regionName]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching region:', error);
      throw error;
    }
  }

  /**
   * Search regions by name
   */
  static async search(searchTerm) {
    const query = `
      SELECT DISTINCT region, COUNT(id) as destination_count
      FROM destinations
      WHERE region ILIKE $1 AND is_active = true
      GROUP BY region
      ORDER BY region ASC
    `;
    
    try {
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error searching regions:', error);
      throw error;
    }
  }
}

module.exports = Region;
