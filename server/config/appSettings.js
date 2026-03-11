const fs = require('fs');
const path = require('path');

/**
 * Loads configuration from appsettings.json (and optional environment-specific
 * overrides such as appsettings.development.json or appsettings.production.json)
 * and maps each value to the matching process.env variable.
 *
 * Existing environment variables are NOT overwritten, so values set by the host
 * (e.g. Azure App Service Application Settings) always take precedence.
 *
 * File resolution order (highest priority first):
 *   1. process.env  (already set by host / dotenv)
 *   2. appsettings.<NODE_ENV>.json  (e.g. appsettings.development.json)
 *   3. appsettings.json
 *
 * NODE_ENV is typically lowercase (development, production, test), so file
 * names follow the same convention: appsettings.development.json, etc.
 *
 * Call this before dotenv.config() is called so that dotenv can still be used
 * as a last resort, or call it after – the "don't overwrite" rule handles both.
 */

function setIfMissing(key, value) {
  if (value !== undefined && value !== null && process.env[key] === undefined) {
    process.env[key] = String(value);
  }
}

function mapSettings(config) {
  if (!config || typeof config !== 'object') return;

  const { App, AzureOpenAI, AzureSearch, Database, ConnectionStrings, Settings } = config;

  // App / server settings
  if (App) {
    setIfMissing('PORT', App.Port);
    setIfMissing('NODE_ENV', App.NodeEnv);
    setIfMissing('BRAND_NAME', App.BrandName);
    setIfMissing('TECH_BRAND', App.TechBrand);
    setIfMissing('DOMAIN', App.Domain);
  }

  // Azure OpenAI
  if (AzureOpenAI) {
    setIfMissing('AZURE_OPENAI_ENDPOINT', AzureOpenAI.Endpoint);
    setIfMissing('AZURE_OPENAI_API_KEY', AzureOpenAI.ApiKey);
    setIfMissing('AZURE_OPENAI_DEPLOYMENT_NAME', AzureOpenAI.DeploymentName);
    setIfMissing('AZURE_OPENAI_API_VERSION', AzureOpenAI.ApiVersion);
    setIfMissing('AZURE_OPENAI_MAX_TOKENS', AzureOpenAI.MaxTokens);
    setIfMissing('AZURE_OPENAI_TEMPERATURE', AzureOpenAI.Temperature);
    setIfMissing('AZURE_OPENAI_TOP_P', AzureOpenAI.TopP);
    setIfMissing('AZURE_OPENAI_FREQUENCY_PENALTY', AzureOpenAI.FrequencyPenalty);
    setIfMissing('AZURE_OPENAI_PRESENCE_PENALTY', AzureOpenAI.PresencePenalty);
  }

  // Azure AI Search
  if (AzureSearch) {
    setIfMissing('AZURE_SEARCH_ENDPOINT', AzureSearch.Endpoint);
    setIfMissing('AZURE_SEARCH_API_KEY', AzureSearch.ApiKey);
    setIfMissing('AZURE_SEARCH_INDEX_NAME', AzureSearch.IndexName);
  }

  // Database — individual fields take precedence over the connection string
  if (Database) {
    setIfMissing('DB_HOST', Database.Host);
    setIfMissing('DB_PORT', Database.Port);
    setIfMissing('DB_NAME', Database.Name);
    setIfMissing('DB_USER', Database.User);
    setIfMissing('DB_PASSWORD', Database.Password);
    setIfMissing('DB_SSL', Database.SSL);
    if (Database.UseAADAuth !== undefined) {
      setIfMissing('DB_USE_AAD_AUTH', Database.UseAADAuth);
    }
  }

  // ConnectionStrings.DefaultConnection — parse and apply only the fields that
  // haven't been set yet by the Database section above or by process.env.
  if (ConnectionStrings && ConnectionStrings.DefaultConnection) {
    parseConnectionString(ConnectionStrings.DefaultConnection);
  }

  // Settings provider behaviour
  if (Settings) {
    if (Settings.UseWebsiteSettings !== undefined) {
      setIfMissing('USE_WEBSITE_SETTINGS', Settings.UseWebsiteSettings);
    }
    if (Settings.SettingsSourceUrl) {
      setIfMissing('SETTINGS_SOURCE_URL', Settings.SettingsSourceUrl);
    }
  }
}

/**
 * Parse a PostgreSQL-style key=value connection string and populate env vars.
 * Handles both PostgreSQL libpq format and .NET-style semicolon-separated format.
 *
 * Examples:
 *   "Host=db.example.com;Port=5432;Database=mydb;Username=admin;Password=secret;SSL Mode=Require"
 *   "host=db.example.com port=5432 dbname=mydb user=admin password=secret sslmode=require"
 */
function parseConnectionString(connStr) {
  if (!connStr) return;

  // Normalise to semicolons then split
  const pairs = connStr.replace(/\s*;\s*/g, ';').split(';');

  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim().toLowerCase().replace(/\s/g, '');
    const value = pair.slice(eqIdx + 1).trim();

    switch (key) {
      case 'host':           setIfMissing('DB_HOST', value); break;
      case 'port':           setIfMissing('DB_PORT', value); break;
      case 'database':
      case 'initial catalog':
      case 'dbname':         setIfMissing('DB_NAME', value); break;
      case 'username':
      case 'user id':
      case 'user':           setIfMissing('DB_USER', value); break;
      case 'password':       setIfMissing('DB_PASSWORD', value); break;
      case 'ssl mode':
      case 'sslmode':
        setIfMissing('DB_SSL', value.toLowerCase() !== 'disable' ? 'true' : 'false');
        break;
      default:
        break;
    }
  }
}

/**
 * Attempt to load and parse a JSON file.  Returns null on any error.
 */
function tryLoadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Main entry point.  Call once at server startup, before dotenv if you want
 * appsettings.json to act as the primary source, or after dotenv if you want
 * .env to take precedence (the "don't overwrite" rule handles either order).
 *
 * @param {string} [baseDir]  Directory that contains appsettings.json.
 *                            Defaults to the directory of this file (server/).
 */
function loadAppSettings(baseDir) {
  const dir = baseDir || path.join(__dirname, '..');
  const env = process.env.NODE_ENV || 'development';

  // Load base file first, then environment-specific overlay (higher priority)
  const base = tryLoadJson(path.join(dir, 'appsettings.json'));
  const overlay = tryLoadJson(path.join(dir, `appsettings.${env}.json`));

  // Merge: overlay values win over base values
  const merged = Object.assign({}, base);
  if (overlay) {
    for (const section of Object.keys(overlay)) {
      if (typeof overlay[section] === 'object' && !Array.isArray(overlay[section])) {
        merged[section] = Object.assign({}, merged[section] || {}, overlay[section]);
      } else {
        merged[section] = overlay[section];
      }
    }
  }

  if (base || overlay) {
    mapSettings(merged);
    console.log(`📋 Loaded appsettings${overlay ? `+appsettings.${env}` : ''}.json`);
  }
}

module.exports = { loadAppSettings };
