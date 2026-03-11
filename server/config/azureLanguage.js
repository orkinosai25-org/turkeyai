/**
 * Azure Cognitive Services – Language client helper
 *
 * Provides sentiment analysis, key phrase extraction, named-entity recognition,
 * and text summarisation using the Azure AI Language REST API.
 *
 * Required appsettings / environment variables:
 *   AZURE_LANGUAGE_ENDPOINT – e.g. "https://your-resource.cognitiveservices.azure.com/"
 *   AZURE_LANGUAGE_KEY      – Cognitive Services subscription key
 *
 * Azure portal: https://portal.azure.com → Language
 * Docs: https://learn.microsoft.com/azure/cognitive-services/language-service/
 */

const axios = require('axios');

const LANGUAGE_API_VERSION = '2023-04-01';

/**
 * Return a configuration object sourced from process.env.
 * Throws if the mandatory credentials are absent.
 */
function getLanguageConfig() {
  const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;
  const apiKey = process.env.AZURE_LANGUAGE_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure Language credentials not configured. ' +
      'Set AZURE_LANGUAGE_ENDPOINT and AZURE_LANGUAGE_KEY.'
    );
  }

  return { endpoint: endpoint.replace(/\/$/, ''), apiKey };
}

/**
 * POST a batch request to the Language service.
 *
 * @param {string} task  – Task kind, e.g. "SentimentAnalysis"
 * @param {Array}  docs  – Array of { id, text, language? } objects
 * @param {Object} [taskParams] – Optional task-specific parameters
 * @returns {Promise<Object>} Raw API response body
 */
async function languageRequest(task, docs, taskParams = {}) {
  const { endpoint, apiKey } = getLanguageConfig();

  const url = `${endpoint}/language/:analyze-text?api-version=${LANGUAGE_API_VERSION}`;
  const body = {
    kind: task,
    parameters: taskParams,
    analysisInput: {
      documents: docs.map((d, i) => ({
        id: d.id || String(i + 1),
        text: d.text,
        language: d.language || 'tr',
      })),
    },
  };

  const response = await axios.post(url, body, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });

  return response.data;
}

/**
 * Analyse the sentiment of one or more texts.
 * Each document should contain { text, language? } (language defaults to 'tr').
 *
 * @param {Array<{text:string,language?:string}>} documents
 * @returns {Promise<Array>} Array of sentiment result objects
 */
async function analyzeSentiment(documents) {
  if (!documents?.length) throw new Error('documents array is required');

  const result = await languageRequest('SentimentAnalysis', documents, {
    opinionMining: true,
  });

  return result?.results?.documents ?? [];
}

/**
 * Extract key phrases from one or more texts.
 *
 * @param {Array<{text:string,language?:string}>} documents
 * @returns {Promise<Array>} Array of key phrase result objects
 */
async function extractKeyPhrases(documents) {
  if (!documents?.length) throw new Error('documents array is required');

  const result = await languageRequest('KeyPhraseExtraction', documents);
  return result?.results?.documents ?? [];
}

/**
 * Recognise named entities (locations, organisations, people, etc.) in texts.
 *
 * @param {Array<{text:string,language?:string}>} documents
 * @returns {Promise<Array>} Array of NER result objects
 */
async function recognizeEntities(documents) {
  if (!documents?.length) throw new Error('documents array is required');

  const result = await languageRequest('EntityRecognition', documents);
  return result?.results?.documents ?? [];
}

/**
 * Detect the language of one or more texts using the Language service.
 *
 * @param {string[]} texts – Plain strings (language unknown)
 * @returns {Promise<Array>} Array of language detection result objects
 */
async function detectLanguage(texts) {
  if (!texts?.length) throw new Error('texts array is required');

  const docs = (Array.isArray(texts) ? texts : [texts]).map((t, i) => ({
    id: String(i + 1),
    text: t,
  }));

  const { endpoint, apiKey } = getLanguageConfig();
  const url = `${endpoint}/language/:analyze-text?api-version=${LANGUAGE_API_VERSION}`;

  const body = {
    kind: 'LanguageDetection',
    analysisInput: { documents: docs },
  };

  const response = await axios.post(url, body, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  return response.data?.results?.documents ?? [];
}

module.exports = {
  getLanguageConfig,
  analyzeSentiment,
  extractKeyPhrases,
  recognizeEntities,
  detectLanguage,
};
