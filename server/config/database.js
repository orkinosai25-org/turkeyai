const { Pool } = require('pg');

/**
 * Returns the password to use for the PostgreSQL connection.
 *
 * When DB_USE_AAD_AUTH=true the password is a short-lived Azure AD access token
 * fetched via @azure/identity DefaultAzureCredential (works with Managed Identity
 * on Azure App Service, or az CLI / environment credentials locally).
 * When DB_USE_AAD_AUTH is not set the static DB_PASSWORD env var is used.
 */
async function getPassword() {
  if (process.env.DB_USE_AAD_AUTH === 'true') {
    const { DefaultAzureCredential } = require('@azure/identity');
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken(
      'https://ossrdbms-aad.database.windows.net/.default'
    );
    return tokenResponse.token;
  }
  return process.env.DB_PASSWORD;
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: getPassword,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to Azure PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

module.exports = pool;
