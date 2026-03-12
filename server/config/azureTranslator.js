/**
 * Azure AI Translator client helper
 *
 * Provides text translation between Turkish and English (and any other
 * supported language pair) using the Azure AI Translator REST API.
 *
 * Required appsettings / environment variables:
 *   AZURE_TRANSLATOR_ENDPOINT – e.g. "https://api.cognitive.microsofttranslator.com/"
 *   AZURE_TRANSLATOR_KEY      – Cognitive Services subscription key
 *   AZURE_TRANSLATOR_REGION   – Azure region, e.g. "eastus", "westeurope"
 *
 * Azure portal: https://portal.azure.com → Translators
 * Docs: https://learn.microsoft.com/azure/cognitive-services/translator/
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/';

/**
 * Return a configuration object sourced from process.env.
 * Throws if the mandatory credentials are absent.
 */
function getTranslatorConfig() {
  const apiKey = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;
  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || DEFAULT_ENDPOINT;

  if (!apiKey || !region) {
    throw new Error(
      'Azure Translator credentials not configured. ' +
      'Set AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION.'
    );
  }

  return { apiKey, region, endpoint };
}

/**
 * Translate one or more text strings.
 *
 * @param {string|string[]} texts  – Text(s) to translate (max 50 items / 50 000 chars per call)
 * @param {string}          to     – Target language code (e.g. 'en', 'tr')
 * @param {string}          [from] – Source language code; omit for auto-detect
 * @returns {Promise<Array>}       – Array of translation result objects from the API
 */
async function translateText(texts, to, from) {
  if (!texts) throw new Error('texts is required');
  if (!to) throw new Error('to (target language) is required');

  const { apiKey, region, endpoint } = getTranslatorConfig();

  const body = (Array.isArray(texts) ? texts : [texts]).map(t => ({ Text: t }));

  const params = new URLSearchParams({ 'api-version': '3.0', to });
  if (from) params.append('from', from);

  const url = `${endpoint.replace(/\/$/, '')}/translate?${params}`;
  const response = await axios.post(url, body, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type': 'application/json',
      'X-ClientTraceId': uuidv4(),
    },
    timeout: 15000,
  });

  return response.data;
}

/**
 * Convenience wrapper – translate a single string and return the translated text.
 *
 * @param {string} text   – Source text
 * @param {string} to     – Target language (e.g. 'en' or 'tr')
 * @param {string} [from] – Source language (omit for auto-detect)
 * @returns {Promise<string>} Translated string
 */
async function translateOne(text, to, from) {
  const results = await translateText(text, to, from);
  return results?.[0]?.translations?.[0]?.text ?? text;
}

/**
 * Detect the language of one or more text strings.
 *
 * @param {string|string[]} texts – Text(s) to analyse
 * @returns {Promise<Array>} Array of detection result objects
 */
async function detectLanguage(texts) {
  if (!texts) throw new Error('texts is required');

  const { apiKey, region, endpoint } = getTranslatorConfig();

  const body = (Array.isArray(texts) ? texts : [texts]).map(t => ({ Text: t }));
  const url = `${endpoint.replace(/\/$/, '')}/detect?api-version=3.0`;

  const response = await axios.post(url, body, {
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Ocp-Apim-Subscription-Region': region,
      'Content-Type': 'application/json',
      'X-ClientTraceId': uuidv4(),
    },
    timeout: 10000,
  });

  return response.data;
}

module.exports = {
  getTranslatorConfig,
  translateText,
  translateOne,
  detectLanguage,
};
