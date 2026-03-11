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
 * Fetch Azure OpenAI settings from the website.
 * Supports both plain HTTP endpoints and GitHub raw content URLs.
 * When SETTINGS_API_TOKEN is set and the URL is a GitHub raw URL, the
 * request is automatically upgraded to the GitHub Contents API so that
 * private repository files can be retrieved.
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

    if (configData && configData.AzureOpenAI) {
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

    throw new Error('Invalid settings format from website');
  } catch (error) {
    console.warn('⚠️ Failed to fetch settings from website:', error.message);
    return null;
  }
}

/**
 * Get Azure OpenAI settings from a local appsettings.json file.
 * Returns null if the file is missing or does not contain an AzureOpenAI section.
 */
function getSettingsFromFile() {
  try {
    const filePath = path.join(__dirname, '..', 'appsettings.json');
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(raw);

    if (!config.AzureOpenAI) return null;

    const az = config.AzureOpenAI;
    if (!az.Endpoint || !az.ApiKey) return null;

    console.log('📋 Using Azure settings from local appsettings.json');
    return {
      endpoint: az.Endpoint,
      apiKey: az.ApiKey,
      deploymentName: az.DeploymentName || 'gpt-4',
      apiVersion: az.ApiVersion || '2024-02-15-preview',
      maxTokens: az.MaxTokens || 800,
      temperature: az.Temperature !== undefined ? az.Temperature : 0.7,
      topP: az.TopP !== undefined ? az.TopP : 0.95,
      frequencyPenalty: az.FrequencyPenalty !== undefined ? az.FrequencyPenalty : 0,
      presencePenalty: az.PresencePenalty !== undefined ? az.PresencePenalty : 0,
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
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
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
  
  // Try local appsettings.json next
  if (!settings || !settings.endpoint || !settings.apiKey) {
    settings = getSettingsFromFile();
  }

  // Fall back to environment variables
  if (!settings || !settings.endpoint || !settings.apiKey) {
    console.log('📋 Using local environment variables for Azure settings');
    settings = getLocalSettings();
  }
  
  // Validate that we have required settings
  if (!settings.endpoint || !settings.apiKey) {
    throw new Error('Azure OpenAI credentials not configured. Please set environment variables, appsettings.json, or configure website settings URL.');
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

module.exports = {
  getAzureSettings,
  clearCache,
  toGitHubApiUrl
};
