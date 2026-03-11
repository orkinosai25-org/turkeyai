const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { DefaultAzureCredential } = require("@azure/identity");
const { getAzureSettings } = require("./settingsProvider");

let client = null;
let currentEndpoint = null;
let currentApiKey = null;

/**
 * Initialize Azure OpenAI client with dynamic settings.
 * Uses AzureKeyCredential when an API key is present, otherwise falls back
 * to DefaultAzureCredential (Azure Managed Identity / AD token auth).
 */
async function getAzureOpenAIClient() {
  const settings = await getAzureSettings();
  
  // Recreate client if settings have changed
  if (!client || currentEndpoint !== settings.endpoint || currentApiKey !== settings.apiKey) {
    console.log('🔄 Initializing Azure OpenAI client with updated settings');
    const credential = settings.apiKey
      ? new AzureKeyCredential(settings.apiKey)
      : new DefaultAzureCredential();
    if (!settings.apiKey) {
      console.log('🔐 No API key found – using DefaultAzureCredential (Managed Identity / AD token)');
    }
    client = new OpenAIClient(settings.endpoint, credential);
    currentEndpoint = settings.endpoint;
    currentApiKey = settings.apiKey;
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
    maxTokens: settings.maxTokens,
    topP: settings.topP,
    frequencyPenalty: settings.frequencyPenalty,
    presencePenalty: settings.presencePenalty
  };
}

module.exports = {
  getAzureOpenAIClient,
  getDeploymentName,
  getChatOptions
};
