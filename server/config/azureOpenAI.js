const { AzureOpenAI } = require("openai");
const { getAzureSettings } = require("./settingsProvider");

let client = null;
let currentEndpoint = null;
let currentApiKey = null;
let currentApiVersion = null;

/**
 * Initialize Azure OpenAI client with dynamic settings
 */
async function getAzureOpenAIClient() {
  const settings = await getAzureSettings();
  
  // Recreate client if settings have changed
  if (
    !client ||
    currentEndpoint !== settings.endpoint ||
    currentApiKey !== settings.apiKey ||
    currentApiVersion !== settings.apiVersion
  ) {
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
