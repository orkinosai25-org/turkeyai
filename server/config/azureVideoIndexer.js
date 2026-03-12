/**
 * Azure AI Video Indexer client helper
 *
 * Provides utilities for submitting video URLs to Azure AI Video Indexer and
 * retrieving insights (transcripts, key phrases, visual labels, etc.) in both
 * Turkish and English.
 *
 * Required appsettings / environment variables:
 *   AZURE_VIDEO_INDEXER_ACCOUNT_ID   – Video Indexer account GUID
 *   AZURE_VIDEO_INDEXER_LOCATION     – e.g. "trial" or an Azure region such as "eastus"
 *   AZURE_VIDEO_INDEXER_API_KEY      – API key (arm-based or classic)
 *   AZURE_VIDEO_INDEXER_ACCOUNT_NAME – ARM account name (required for ARM-based auth)
 *   AZURE_VIDEO_INDEXER_SUBSCRIPTION_ID – Azure subscription ID (ARM-based auth)
 *   AZURE_VIDEO_INDEXER_RESOURCE_GROUP  – Azure resource group (ARM-based auth)
 *
 * Azure portal: https://portal.azure.com → Azure AI Video Indexer
 * Docs: https://learn.microsoft.com/azure/azure-video-indexer/
 */

const axios = require('axios');

const VI_API_BASE = 'https://api.videoindexer.ai';

/**
 * Return a configuration object sourced from process.env.
 * Throws if the mandatory account credentials are absent.
 */
function getVideoIndexerConfig() {
  const accountId = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
  const location = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'trial';
  const apiKey = process.env.AZURE_VIDEO_INDEXER_API_KEY;

  if (!accountId || !apiKey) {
    throw new Error(
      'Azure AI Video Indexer credentials not configured. ' +
      'Set AZURE_VIDEO_INDEXER_ACCOUNT_ID and AZURE_VIDEO_INDEXER_API_KEY.'
    );
  }

  return { accountId, location, apiKey };
}

/**
 * Obtain an account-level access token from Video Indexer.
 * The token is valid for ~1 hour and is required for all subsequent API calls.
 *
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  const { accountId, location, apiKey } = getVideoIndexerConfig();

  const url = `${VI_API_BASE}/auth/${location}/Accounts/${accountId}/AccessToken?allowEdit=true`;
  const response = await axios.get(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    timeout: 10000,
  });

  // Response body is a quoted JSON string: "eyJ..."
  return typeof response.data === 'string'
    ? response.data.replace(/^"|"$/g, '')
    : response.data;
}

/**
 * Submit a publicly accessible video URL for indexing.
 *
 * @param {string} videoUrl        – Public URL of the video (e.g. a YouTube link)
 * @param {string} [name]          – Optional display name for the video
 * @param {string} [language='tr'] – Primary spoken language ('tr' or 'en')
 * @returns {Promise<Object>}      – Video Indexer video object containing the video ID
 */
async function indexVideoUrl(videoUrl, name, language = 'tr') {
  if (!videoUrl) throw new Error('videoUrl is required');

  const { accountId, location } = getVideoIndexerConfig();
  const accessToken = await getAccessToken();

  const params = new URLSearchParams({
    accessToken,
    name: name || `TürkiyeAI-Video-${Date.now()}`,
    videoUrl,
    language,
    privacy: 'Private',
    indexingPreset: 'Default',
  });

  const url = `${VI_API_BASE}/${location}/Accounts/${accountId}/Videos?${params}`;
  const response = await axios.post(url, null, { timeout: 30000 });
  return response.data;
}

/**
 * Retrieve the full insights payload for an already-indexed video.
 *
 * @param {string} videoId        – Video Indexer video ID
 * @param {string} [language='tr'] – Language for returned transcript/insights
 * @returns {Promise<Object>}     – Full insights object
 */
async function getVideoInsights(videoId, language = 'tr') {
  if (!videoId) throw new Error('videoId is required');

  const { accountId, location } = getVideoIndexerConfig();
  const accessToken = await getAccessToken();

  const url =
    `${VI_API_BASE}/${location}/Accounts/${accountId}/Videos/${videoId}/Index` +
    `?accessToken=${encodeURIComponent(accessToken)}&language=${language}`;

  const response = await axios.get(url, { timeout: 15000 });
  return response.data;
}

/**
 * Extract a plain-text transcript from a Video Indexer insights object.
 * Returns an empty string when no transcript is available.
 *
 * @param {Object} insights – Insights object returned by getVideoInsights()
 * @returns {string}
 */
function extractTranscript(insights) {
  try {
    const transcript = insights?.videos?.[0]?.insights?.transcript;
    if (!Array.isArray(transcript)) return '';
    return transcript.map(t => t.text).join(' ');
  } catch {
    return '';
  }
}

/**
 * Extract key phrases / keywords from a Video Indexer insights object.
 *
 * @param {Object} insights – Insights object returned by getVideoInsights()
 * @returns {string[]}
 */
function extractKeywords(insights) {
  try {
    const keywords = insights?.videos?.[0]?.insights?.keywords;
    if (!Array.isArray(keywords)) return [];
    return keywords.map(k => k.text);
  } catch {
    return [];
  }
}

module.exports = {
  getVideoIndexerConfig,
  getAccessToken,
  indexVideoUrl,
  getVideoInsights,
  extractTranscript,
  extractKeywords,
};
