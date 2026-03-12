const { AzureOpenAI } = require("openai");
const { getAzureSettings } = require("./settingsProvider");

let client = null;
let currentEndpoint = null;
let currentApiKey = null;
let currentApiVersion = null;

/**
 * Returns true when the cached client needs to be recreated because the
 * relevant settings have changed since the last initialisation.
 */
function hasSettingsChanged(settings) {
  return (
    !client ||
    currentEndpoint !== settings.endpoint ||
    currentApiKey !== settings.apiKey ||
    currentApiVersion !== settings.apiVersion
  );
}

/**
 * Initialize Azure OpenAI client with dynamic settings
 */
async function getAzureOpenAIClient() {
  const settings = await getAzureSettings();

  if (!settings.endpoint || !settings.apiKey || !settings.apiVersion) {
    throw new Error('Azure OpenAI configuration is incomplete: endpoint, apiKey, and apiVersion are required.');
  }

  // Recreate client if settings have changed
  if (hasSettingsChanged(settings)) {
    console.log('🔄 Initializing Azure OpenAI client with updated settings');
    client = new AzureOpenAI({
      endpoint: settings.endpoint,
      apiKey: settings.apiKey,
      apiVersion: settings.apiVersion
    });
    currentEndpoint = settings.endpoint;
    currentApiKey = settings.apiKey;
    currentApiVersion = settings.apiVersion;
  }
  
  return client;
}

/**
 * Get deployment name from settings
 */
async function getDeploymentName() {
  const settings = await getAzureSettings();
  return settings.deploymentName;
}

/**
 * Get chat completion options from settings
 */
async function getChatOptions() {
  const settings = await getAzureSettings();
  return {
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    top_p: settings.topP,
    frequency_penalty: settings.frequencyPenalty,
    presence_penalty: settings.presencePenalty
  };
}

module.exports = {
  getAzureOpenAIClient,
  getDeploymentName,
  getChatOptions
};
