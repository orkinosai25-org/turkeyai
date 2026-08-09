const { AzureOpenAI } = require("openai");
const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");
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
    currentApiKey !== (settings.apiKey || null) ||
    currentApiVersion !== settings.apiVersion
  );
}

/**
 * Initialize Azure OpenAI client with dynamic settings.
 * When an API key is provided it is used directly; otherwise the client
 * authenticates via Azure Managed Identity (DefaultAzureCredential).
 */
async function getAzureOpenAIClient() {
  const settings = await getAzureSettings();

  if (!settings.endpoint || !settings.apiVersion) {
    throw new Error('Azure OpenAI configuration is incomplete: endpoint and apiVersion are required.');
  }

  // Recreate client if settings have changed
  if (hasSettingsChanged(settings)) {
    console.log('🔄 Initializing Azure OpenAI client with updated settings');

    if (settings.apiKey) {
      // API key authentication
      client = new AzureOpenAI({
        endpoint: settings.endpoint,
        apiKey: settings.apiKey,
        apiVersion: settings.apiVersion
      });
    } else {
      // Managed Identity / DefaultAzureCredential authentication (keyless)
      console.log('🔑 No API key configured – using Azure Managed Identity (DefaultAzureCredential)');
      const credential = new DefaultAzureCredential();
      const azureADTokenProvider = getBearerTokenProvider(
        credential,
        'https://cognitiveservices.azure.com/.default'
      );
      client = new AzureOpenAI({
        endpoint: settings.endpoint,
        azureADTokenProvider,
        apiVersion: settings.apiVersion
      });
    }

    currentEndpoint = settings.endpoint;
    currentApiKey = settings.apiKey || null;
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
    max_completion_tokens: settings.maxTokens,
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
