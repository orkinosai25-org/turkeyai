/**
 * Azure Computer Vision client helper
 *
 * Provides image analysis (caption, tags, objects, colour) and optical
 * character recognition (OCR) using the Azure AI Vision REST API v4.
 *
 * Required appsettings / environment variables:
 *   AZURE_VISION_ENDPOINT – e.g. "https://your-resource.cognitiveservices.azure.com/"
 *   AZURE_VISION_KEY      – Cognitive Services subscription key
 *
 * Azure portal: https://portal.azure.com → Computer Vision
 * Docs: https://learn.microsoft.com/azure/cognitive-services/computer-vision/
 */

const axios = require('axios');

const VISION_API_VERSION = '2024-02-01';

/**
 * Return a configuration object sourced from process.env.
 * Throws if the mandatory credentials are absent.
 */
function getVisionConfig() {
  const endpoint = process.env.AZURE_VISION_ENDPOINT;
  const apiKey = process.env.AZURE_VISION_KEY;

  if (!endpoint || !apiKey) {
    throw new Error(
      'Azure Computer Vision credentials not configured. ' +
      'Set AZURE_VISION_ENDPOINT and AZURE_VISION_KEY.'
    );
  }

  return { endpoint: endpoint.replace(/\/$/, ''), apiKey };
}

/**
 * Analyse an image from a public URL.
 *
 * @param {string}   imageUrl – Publicly accessible image URL
 * @param {string[]} [features=['Caption','Tags','Objects','Color']]
 *                   – Analysis features to request
 * @returns {Promise<Object>} Analysis result from the Vision API
 */
async function analyzeImageUrl(imageUrl, features = ['Caption', 'Tags', 'Objects', 'Color']) {
  if (!imageUrl) throw new Error('imageUrl is required');

  const { endpoint, apiKey } = getVisionConfig();

  const params = new URLSearchParams({
    'api-version': VISION_API_VERSION,
    features: features.join(','),
    language: 'en',
  });

  const url = `${endpoint}/computervision/imageanalysis:analyze?${params}`;
  const response = await axios.post(
    url,
    { url: imageUrl },
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return response.data;
}

/**
 * Extract a human-readable caption from a Vision API analysis result.
 *
 * @param {Object} analysisResult – Object returned by analyzeImageUrl()
 * @returns {string}
 */
function extractCaption(analysisResult) {
  return analysisResult?.captionResult?.text ?? '';
}

/**
 * Extract tag names from a Vision API analysis result.
 *
 * @param {Object} analysisResult – Object returned by analyzeImageUrl()
 * @returns {string[]}
 */
function extractTags(analysisResult) {
  return (analysisResult?.tagsResult?.values ?? []).map(t => t.name);
}

/**
 * Run OCR (read) on an image to extract embedded text.
 *
 * @param {string} imageUrl – Publicly accessible image URL
 * @returns {Promise<string>} Extracted text (all lines joined by spaces)
 */
async function readTextFromImageUrl(imageUrl) {
  if (!imageUrl) throw new Error('imageUrl is required');

  const { endpoint, apiKey } = getVisionConfig();

  const params = new URLSearchParams({ 'api-version': VISION_API_VERSION });
  const url = `${endpoint}/computervision/imageanalysis:analyze?${params}&features=Read`;

  const response = await axios.post(
    url,
    { url: imageUrl },
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  const blocks = response.data?.readResult?.blocks ?? [];
  return blocks.flatMap(b => b.lines.map(l => l.text)).join(' ');
}

module.exports = {
  getVisionConfig,
  analyzeImageUrl,
  extractCaption,
  extractTags,
  readTextFromImageUrl,
};
