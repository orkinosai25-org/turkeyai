const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { getAzureSettings } = require("./settingsProvider");

let client = null;
let currentEndpoint = null;
let currentApiKey = null;

/**
 * Initialize Azure OpenAI client with dynamic settings
 */
async function getAzureOpenAIClient() {
  const settings = await getAzureSettings();
  
  // Recreate client if settings have changed
  if (!client || currentEndpoint !== settings.endpoint || currentApiKey !== settings.apiKey) {
    console.log('🔄 Initializing Azure OpenAI client with updated settings');
    client = new OpenAIClient(
      settings.endpoint,
      new AzureKeyCredential(settings.apiKey),
      { apiVersion: settings.apiVersion }
    );
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
