const pool = require('../config/database');
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

/**
 * User Model
 * Handles database operations for user registration and authentication.
 *
 * Password hashing: uses Node's built-in `crypto.scrypt` (memory-hard,
 * resistant to GPU/ASIC attacks). Swap for `bcrypt` or `argon2` when an
 * external dependency can be added in production.
 */
class User {
  /**
   * Hash a plain-text password using scrypt + random salt.
   * @param {string} password
   * @param {string|null} salt  – supply only when verifying (stored salt)
   * @returns {Promise<{hash: string, salt: string}>}
   */
  static async hashPassword(password, salt = null) {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, usedSalt, 64);
    return { hash: derivedKey.toString('hex'), salt: usedSalt };
  }

  /**
   * Verify a password against a stored hash + salt.
   * Uses a constant-time comparison to mitigate timing attacks.
   * @param {string} password
   * @param {string} storedHash
   * @param {string} salt
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(password, storedHash, salt) {
    try {
      const { hash } = await User.hashPassword(password, salt);
      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(storedHash, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Synchronous hash (for tests only – not for production request paths).
   */
  static hashPasswordSync(password, salt = null) {
    const usedSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .createHmac('sha256', usedSalt)
      .update(password)
      .digest('hex');
    return { hash, salt: usedSalt };
  }

  /**
   * Create a new user account.
   */
  static async create({ email, password, first_name, last_name, phone, country_code, address, postcode,
                         travel_interests, newsletter_opt_in, creation_source }) {
    const isSocialUser = !password;
    let hash = null;
    let salt = null;

    if (!isSocialUser) {
      const hashed = await User.hashPassword(password);
      hash = hashed.hash;
      salt = hashed.salt;
    }

    const query = `
      INSERT INTO users (
        email, password_hash, password_salt,
        first_name, last_name, phone, country_code,
        address, postcode,
        travel_interests, newsletter_opt_in, creation_source,
        status, created_at, updated_at
      )
      VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9,
        $10, $11, $12,
        'active', NOW(), NOW()
      )
      RETURNING id, email, first_name, last_name, created_at
    `;

    const params = [
      email.toLowerCase().trim(),
      hash,
      salt,
      first_name.trim(),
      (last_name || '').trim(),
      (phone || '').trim(),
      (country_code || 'GB').trim(),
      (address || '').trim(),
      (postcode || '').trim(),
      JSON.stringify(travel_interests || []),
      !!newsletter_opt_in,
      creation_source || 'email',
    ];

    try {
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        const err = new Error('Email already registered');
        err.code = 'EMAIL_EXISTS';
        throw err;
      }
      throw error;
    }
  }

  /**
   * Find a user by email.
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, password_salt,
             first_name, last_name, phone, country_code,
             address, postcode, travel_interests, creation_source, status
      FROM users
      WHERE email = $1 AND status = 'active'
    `;
    try {
      const result = await pool.query(query, [email.toLowerCase().trim()]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find or create a user via social login (Google / Facebook / LinkedIn).
   * Social users have NULL password hashes.
   */
  static async findOrCreateSocial({ email, first_name, last_name, provider }) {
    let user = await User.findByEmail(email);
    if (user) return user;

    return User.create({
      email,
      password: null,   // NULL password for social-only accounts
      first_name: first_name || email.split('@')[0],
      last_name,
      creation_source: provider,
    });
  }

  /**
   * Update a user's password (for forgot-password flow).
   */
  static async updatePassword(userId, newPassword) {
    const { hash, salt } = await User.hashPassword(newPassword);
    const query = `
      UPDATE users
      SET password_hash = $1, password_salt = $2, updated_at = NOW()
      WHERE id = $3
    `;
    try {
      await pool.query(query, [hash, salt, userId]);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
