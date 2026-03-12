/**
 * Azure Machine Learning client helper
 *
 * Provides a thin wrapper for invoking Azure Machine Learning managed online
 * endpoints (real-time inference) via the AML REST API.
 *
 * Required appsettings / environment variables:
 *   AZURE_ML_ENDPOINT        – Scoring URI, e.g.
 *                               "https://your-endpoint.inference.ml.azure.com/score"
 *   AZURE_ML_API_KEY         – Primary or secondary key for the endpoint
 *   AZURE_ML_SUBSCRIPTION_ID – Azure subscription ID (used for management calls)
 *   AZURE_ML_RESOURCE_GROUP  – Resource group containing the AML workspace
 *   AZURE_ML_WORKSPACE_NAME  – AML workspace name
 *
 * Azure portal: https://portal.azure.com → Azure Machine Learning
 * Docs: https://learn.microsoft.com/azure/machine-learning/
 */

const axios = require('axios');

/**
 * Return a configuration object sourced from process.env.
 * Throws if the mandatory inference endpoint credentials are absent.
 */
function getMachineLearningConfig() {
  const endpoint = process.env.AZURE_ML_ENDPOINT;
  const apiKey = process.env.AZURE_ML_API_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure Machine Learning endpoint credentials not configured. ' +
      'Set AZURE_ML_ENDPOINT and AZURE_ML_API_KEY.'
    );
  }

  return {
    endpoint,
    apiKey,
    subscriptionId: process.env.AZURE_ML_SUBSCRIPTION_ID,
    resourceGroup: process.env.AZURE_ML_RESOURCE_GROUP,
    workspaceName: process.env.AZURE_ML_WORKSPACE_NAME,
  };
}

/**
 * Call an Azure ML managed online endpoint with an arbitrary JSON payload.
 *
 * @param {Object} inputData – Data to send to the scoring endpoint
 * @returns {Promise<any>}   – Parsed JSON response from the endpoint
 */
async function invokeEndpoint(inputData) {
  if (!inputData) throw new Error('inputData is required');

  const { endpoint, apiKey } = getMachineLearningConfig();

  const response = await axios.post(endpoint, inputData, {
    headers: {
      // Azure ML managed online endpoints support two authentication schemes:
      //   1. Key-based auth  – set AZURE_ML_API_KEY to the endpoint primary/secondary key;
      //      the key is sent as a Bearer token (this is the AML REST API convention).
      //   2. Azure AD tokens – replace the header value with an AAD bearer token obtained
      //      via @azure/identity (e.g. DefaultAzureCredential) for stricter environments.
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'azureml-model-deployment': process.env.AZURE_ML_DEPLOYMENT_NAME || 'default',
    },
    timeout: 30000,
  });

  return response.data;
}

/**
 * Request personalised resort/destination recommendations for a user.
 *
 * This is a convenience wrapper that sends a recommendation request in the
 * shape expected by the TürkiyeAI personalisation endpoint.
 *
 * @param {Object} userContext – User preferences and context
 * @param {string} [userContext.userId]          – Anonymised user identifier
 * @param {string} [userContext.preferredRegion] – Preferred Turkish region
 * @param {string} [userContext.vibe]            – Desired vibe (luxury, family, etc.)
 * @param {string[]} [userContext.interests]     – Interest tags (beach, culture, etc.)
 * @param {string} [userContext.budgetLevel]     – Budget level
 * @returns {Promise<any>} Recommendation payload from the ML endpoint
 */
async function getRecommendations(userContext) {
  return invokeEndpoint({ type: 'recommendation', input: userContext });
}

module.exports = {
  getMachineLearningConfig,
  invokeEndpoint,
  getRecommendations,
};
