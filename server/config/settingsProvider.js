const axios = require('axios');

/**
 * Settings Provider
 * Fetches Azure OpenAI settings from the orkinosai website or falls back to local env variables
 */

let cachedSettings = null;
let lastFetchTime = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch Azure OpenAI settings from the website
 */
async function fetchSettingsFromWebsite() {
  const websiteUrl = process.env.SETTINGS_SOURCE_URL || 'https://raw.githubusercontent.com/orkinosai25-org/orkinosai-website/main/src/orkinosaiCMS.Server/appsettings.json';
  
  try {
    console.log(`Fetching Azure settings from website: ${websiteUrl}`);
    const response = await axios.get(websiteUrl, { timeout: 5000 });
    
    if (response.data && response.data.AzureOpenAI) {
      const azureConfig = response.data.AzureOpenAI;
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
 * Get Azure OpenAI settings with caching
 * First tries to fetch from website, falls back to local env variables
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
  
  // Fall back to local environment variables if website fetch failed or disabled
  if (!settings || !settings.endpoint || !settings.apiKey) {
    console.log('📋 Using local environment variables for Azure settings');
    settings = getLocalSettings();
  }
  
  // Validate that we have required settings
  if (!settings.endpoint || !settings.apiKey) {
    throw new Error('Azure OpenAI credentials not configured. Please set environment variables or configure website settings URL.');
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
  clearCache
};
