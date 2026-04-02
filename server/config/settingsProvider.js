const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Settings Provider
 * Fetches Azure OpenAI settings from the orkinosai website, then tries the
 * local appsettings.json, and finally falls back to plain environment variables.
 */

let cachedSettings = null;
let lastFetchTime = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Known placeholder credential values used in example/template files.
 * If a fetched settings source contains any of these exact strings, the
 * credentials are treated as unconfigured and the next source is tried.
 */
const PLACEHOLDER_VALUES = new Set([
  'your-api-key-here',
  'your-openai-api-key',
  'your-api-key',
  'https://your-resource.openai.azure.com/',
  'https://your-resource-name.openai.azure.com/',
  'https://your-resource.services.ai.azure.com/api/projects/your-project-name',
]);

/**
 * Return true if the value is empty/null or is an exact match for a known
 * unfilled placeholder string from the example configuration files.
 */
function isPlaceholderValue(value) {
  if (!value || typeof value !== 'string') return true;
  return PLACEHOLDER_VALUES.has(value.trim());
}

/**
 * Convert a raw.githubusercontent.com URL to a GitHub API contents URL so
 * that an optional bearer token can be used to access private repositories.
 *
 * Input:  https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path...}
 * Output: https://api.github.com/repos/{owner}/{repo}/contents/{path...}?ref={ref}
 *
 * Returns null when the URL is not a raw GitHub URL.
 */
function toGitHubApiUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname !== 'raw.githubusercontent.com') return null;

    // pathname: /{owner}/{repo}/{ref}/{path...}
    const parts = url.pathname.replace(/^\//, '').split('/');
    if (parts.length < 4) return null;

    const [owner, repo, ref, ...pathParts] = parts;
    const filePath = pathParts.join('/');
    return `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;
  } catch {
    return null;
  }
}

/**
 * Apply a single setting to process.env if the key is not already set and
 * the value is a non-empty, non-placeholder string.
 */
function setEnvIfMissing(envKey, value) {
  if (!value || typeof value !== 'string') return;
  if (process.env[envKey] !== undefined) return;
  if (PLACEHOLDER_VALUES.has(value.trim())) return;
  process.env[envKey] = value;
}

/**
 * Apply HotelBeds settings from a raw config object to process.env.
 * Mirrors the mapping in server/config/appSettings.js but works on an
 * object that was fetched at runtime (e.g. from the remote settings URL).
 */
function applyHotelBedsEnvVars(config) {
  if (!config || !config.HotelBeds) return;
  const hb = config.HotelBeds;
  setEnvIfMissing('HOTELBEDS_API_KEY',    hb.ApiKey);
  setEnvIfMissing('HOTELBEDS_API_SECRET', hb.ApiSecret);
  setEnvIfMissing('HOTELBEDS_BASE_URL',   hb.BaseUrl);
  setEnvIfMissing('HOTELBEDS_LANGUAGE',   hb.Language);
  setEnvIfMissing('HOTELBEDS_CURRENCY',   hb.Currency);
}

/**
 * Apply Bing Search settings from a raw config object to process.env.
 * Enables the hotel AI chat to perform live web searches when BingSearch.ApiKey
 * is present in appsettings.json or the remote settings source.
 */
function applyBingSearchEnvVars(config) {
  if (!config || !config.BingSearch) return;
  setEnvIfMissing('BING_SEARCH_API_KEY', config.BingSearch.ApiKey);
}

/**
 * Fetch Azure OpenAI settings from the website.
 * Supports both plain HTTP endpoints and GitHub raw content URLs.
 * When SETTINGS_API_TOKEN is set and the URL is a GitHub raw URL, the
 * request is automatically upgraded to the GitHub Contents API so that
 * private repository files can be retrieved.
 *
 * As a side-effect, any HotelBeds settings present in the remote config
 * are also applied to process.env (so the HotelBeds routes can use them
 * without needing a separate fetch).
 */
async function fetchSettingsFromWebsite() {
  const websiteUrl = process.env.SETTINGS_SOURCE_URL;

  if (!websiteUrl) {
    return null;
  }

  const apiToken = process.env.SETTINGS_API_TOKEN;
  const githubApiUrl = toGitHubApiUrl(websiteUrl);

  try {
    let configData;

    if (githubApiUrl && apiToken) {
      // Use the authenticated GitHub Contents API for private repositories
      console.log(`Fetching Azure settings via GitHub API: ${githubApiUrl}`);
      const response = await axios.get(githubApiUrl, {
        timeout: 5000,
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      if (response.data && response.data.content) {
        const decoded = Buffer.from(response.data.content, 'base64').toString('utf8');
        configData = JSON.parse(decoded);
      } else {
        throw new Error('Unexpected GitHub API response format');
      }
    } else {
      // Plain HTTP fetch (works for public URLs or non-GitHub endpoints)
      console.log(`Fetching Azure settings from: ${websiteUrl}`);
      const response = await axios.get(websiteUrl, { timeout: 5000 });
      configData = response.data;
    }

    if (configData) {
      // Apply HotelBeds and BingSearch settings from the remote source to env vars so that
      // the /api/hotels routes and hotel AI chat can pick them up without a separate fetch.
      applyHotelBedsEnvVars(configData);
      applyBingSearchEnvVars(configData);

      if (configData.AzureOpenAI) {
        const azureConfig = configData.AzureOpenAI;

        // Skip placeholder values that indicate the file has not been populated
        if (isPlaceholderValue(azureConfig.Endpoint) || isPlaceholderValue(azureConfig.ApiKey)) {
          console.warn('⚠️ Settings source contains placeholder credentials – skipping');
          return null;
        }

        console.log('✅ Successfully fetched Azure settings from website');
        return {
          endpoint: azureConfig.Endpoint,
          apiKey: azureConfig.ApiKey,
          deploymentName: azureConfig.DeploymentName,
          apiVersion: azureConfig.ApiVersion,
          maxTokens: azureConfig.MaxTokens,
          temperature: azureConfig.Temperature,
          topP: azureConfig.TopP,
          frequencyPenalty: azureConfig.FrequencyPenalty,
          presencePenalty: azureConfig.PresencePenalty,
          source: 'website'
        };
      }
    }

    throw new Error('Invalid settings format from website');
  } catch (error) {
    console.warn('⚠️ Failed to fetch settings from website:', error.message);
    return null;
  }
}

/**
 * Get Azure OpenAI settings from local appsettings.json (and an optional
 * environment-specific overlay such as appsettings.development.json).
 * Any values that are absent or empty in the files are supplemented from
 * the matching process.env variable so that secrets set via App Service
 * application settings or a .env file are picked up without triggering the
 * "local environment variables" fallback path.
 *
 * Returns null if neither the files nor the environment provide a usable
 * endpoint and API key.
 */
function getSettingsFromFile() {
  try {
    const dir = path.join(__dirname, '..');
    const basePath = path.join(dir, 'appsettings.json');
    if (!fs.existsSync(basePath)) return null;

    const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));

    // Apply environment-specific overlay (e.g. appsettings.development.json)
    const env = process.env.NODE_ENV || 'development';
    const overlayPath = path.join(dir, `appsettings.${env}.json`);
    let merged = base;
    if (fs.existsSync(overlayPath)) {
      try {
        const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf8'));
        merged = Object.assign({}, base);
        for (const section of Object.keys(overlay)) {
          if (typeof overlay[section] === 'object' && !Array.isArray(overlay[section])) {
            merged[section] = Object.assign({}, merged[section] || {}, overlay[section]);
          } else {
            merged[section] = overlay[section];
          }
        }
      } catch {
        // overlay parse failure is non-fatal
      }
    }

    if (!merged.AzureOpenAI) return null;

    const az = merged.AzureOpenAI;

    // Supplement empty/missing values from environment variables so that
    // secrets provided via App Service application settings are honoured
    // without treating the whole settings block as "from environment variables".
    // isPlaceholderValue rejects empty strings and known template values
    // (e.g. 'your-openai-api-key', 'https://your-resource.openai.azure.com/').
    const endpoint = (!isPlaceholderValue(az.Endpoint) ? az.Endpoint : null) || process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey   = (!isPlaceholderValue(az.ApiKey)   ? az.ApiKey   : null) || process.env.AZURE_OPENAI_API_KEY;

    // Endpoint is required; API key is optional (absence means managed identity will be used).
    if (!endpoint) return null;

    // Helper: parse a numeric env var, returning defaultVal when absent or NaN
    const envNum = (key, defaultVal) => {
      const n = Number(process.env[key]);
      return Number.isFinite(n) ? n : defaultVal;
    };

    console.log('📋 Using Azure settings from local appsettings.json');
    return {
      endpoint,
      apiKey,
      deploymentName: az.DeploymentName || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
      apiVersion: az.ApiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
      maxTokens: az.MaxTokens !== undefined ? az.MaxTokens : envNum('AZURE_OPENAI_MAX_TOKENS', 800),
      temperature: az.Temperature !== undefined ? az.Temperature : envNum('AZURE_OPENAI_TEMPERATURE', 0.7),
      topP: az.TopP !== undefined ? az.TopP : envNum('AZURE_OPENAI_TOP_P', 0.95),
      frequencyPenalty: az.FrequencyPenalty !== undefined ? az.FrequencyPenalty : envNum('AZURE_OPENAI_FREQUENCY_PENALTY', 0),
      presencePenalty: az.PresencePenalty !== undefined ? az.PresencePenalty : envNum('AZURE_OPENAI_PRESENCE_PENALTY', 0),
      source: 'appsettings.json'
    };
  } catch (err) {
    console.warn('⚠️ Failed to read local appsettings.json:', err.message);
    return null;
  }
}

/**
 * Get Azure OpenAI settings from local environment variables
 */
function getLocalSettings() {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview',
    maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS, 10) || 800,
    temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE) || 0.7,
    topP: parseFloat(process.env.AZURE_OPENAI_TOP_P) || 0.95,
    frequencyPenalty: parseFloat(process.env.AZURE_OPENAI_FREQUENCY_PENALTY) || 0,
    presencePenalty: parseFloat(process.env.AZURE_OPENAI_PRESENCE_PENALTY) || 0,
    source: 'local-env'
  };
}

/**
 * Get Azure OpenAI settings with caching.
 * Resolution order:
 *   1. Website (remote appsettings.json via SETTINGS_SOURCE_URL env var, only when
 *      USE_WEBSITE_SETTINGS is not 'false' AND SETTINGS_SOURCE_URL is non-empty)
 *   2. Local appsettings.json / appsettings.<env>.json
 *   3. Environment variables (.env or host settings)
 *
 * An API key is optional — when absent the Azure OpenAI client will authenticate
 * via Azure Managed Identity (DefaultAzureCredential).  Only the endpoint is
 * strictly required.
 */
async function getAzureSettings() {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION_MS) {
    return cachedSettings;
  }
  
  // Check if website fetching is enabled
  const useWebsiteSettings = process.env.USE_WEBSITE_SETTINGS !== 'false';
  
  let settings = null;
  
  if (useWebsiteSettings) {
    // Try to fetch from website first
    settings = await fetchSettingsFromWebsite();
  }
  
  // Try local appsettings.json next (a valid endpoint is sufficient to stop the chain)
  if (!settings || !settings.endpoint) {
    settings = getSettingsFromFile();
  }

  // Fall back to environment variables
  if (!settings || !settings.endpoint) {
    console.log('📋 Using local environment variables for Azure settings');
    settings = getLocalSettings();
  }

  // If we now have an endpoint but the API key is still missing, check whether the
  // env var was set without going through getLocalSettings() (e.g. the endpoint came
  // from appsettings.json but the key was injected via App Service application settings).
  if (settings && settings.endpoint && !settings.apiKey) {
    const envKey = process.env.AZURE_OPENAI_API_KEY;
    if (envKey) {
      settings = { ...settings, apiKey: envKey };
    }
  }
  
  // Validate that we have required settings (endpoint is required; API key is optional — absence
  // means the client will authenticate via Azure Managed Identity / DefaultAzureCredential).
  if (!settings || !settings.endpoint) {
    throw new Error('Azure OpenAI credentials not configured. Please set AZURE_OPENAI_ENDPOINT in appsettings.json, a .env file, or via App Service application settings.');
  }
  
  // Cache the settings
  cachedSettings = settings;
  lastFetchTime = now;
  
  return settings;
}

/**
 * Clear the settings cache (useful for testing or forced refresh)
 */
function clearCache() {
  cachedSettings = null;
  lastFetchTime = null;
}

/**
 * Ensure HotelBeds settings are resolved by:
 *   1. Returning immediately if already configured in env vars (set at startup
 *      by server/config/appSettings.js reading appsettings.json).
 *   2. Checking the local appsettings.json as a safety-net for values that may
 *      have been added after the server started.
 *
 * Config is ALWAYS sourced from the local appsettings.json file only.
 * No remote fetch, no Key Vault, no URL is ever used for dev/CI/MVP.
 *
 * Returns true when HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET are set after
 * this call, false otherwise.
 */
async function ensureHotelBedsConfigured() {
  // Fast path — already in env vars (set at startup from appsettings.json)
  if (process.env.HOTELBEDS_API_KEY && process.env.HOTELBEDS_API_SECRET) {
    return true;
  }

  // Safety-net: re-read local appsettings.json in case the env vars were not
  // populated at startup (e.g. the file was updated without a server restart).
  // Always populate config from local `appsettings.json` only.
  try {
    const filePath = path.join(__dirname, '..', 'appsettings.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      applyHotelBedsEnvVars(JSON.parse(raw));
    }
  } catch (err) {
    console.warn('⚠️  Could not read local appsettings.json for HotelBeds settings:', err.message);
  }

  const missingKeys = [
    !process.env.HOTELBEDS_API_KEY    && 'HOTELBEDS_API_KEY',
    !process.env.HOTELBEDS_API_SECRET && 'HOTELBEDS_API_SECRET',
  ].filter(Boolean);

  if (missingKeys.length > 0) {
    console.error(
      `❌ Missing HotelBeds credential(s): ${missingKeys.join(', ')}. ` +
      'Add them to server/appsettings.json under the "HotelBeds" section. ' +
      'Hotel search will fall back to static demo data until they are configured.'
    );
    return false;
  }
  return true;
}

module.exports = {
  getAzureSettings,
  ensureHotelBedsConfigured,
  clearCache,
  toGitHubApiUrl
};
