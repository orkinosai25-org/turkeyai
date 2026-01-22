const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

let client = null;

/**
 * Initialize Azure OpenAI client
 */
function getAzureOpenAIClient() {
  if (!client) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }
    
    client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
  }
  
  return client;
}

/**
 * Get deployment name
 */
function getDeploymentName() {
  return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';
}

module.exports = {
  getAzureOpenAIClient,
  getDeploymentName
};
