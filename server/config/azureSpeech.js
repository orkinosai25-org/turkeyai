/**
 * Azure Cognitive Services – Speech client helper
 *
 * Provides helpers for speech-to-text (STT) and text-to-speech (TTS) using
 * the Azure Cognitive Services Speech SDK REST API.
 *
 * Required appsettings / environment variables:
 *   AZURE_SPEECH_KEY    – Cognitive Services subscription key
 *   AZURE_SPEECH_REGION – Azure region, e.g. "eastus", "westeurope"
 *
 * Azure portal: https://portal.azure.com → Speech Services
 * Docs: https://learn.microsoft.com/azure/cognitive-services/speech-service/
 */

const axios = require('axios');

/**
 * Return a configuration object sourced from process.env.
 * Throws if the mandatory credentials are absent.
 */
function getSpeechConfig() {
  const subscriptionKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!subscriptionKey || !region) {
    throw new Error(
      'Azure Speech credentials not configured. ' +
      'Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.'
    );
  }

  return { subscriptionKey, region };
}

/**
 * Escape text for safe embedding inside an SSML XML element.
 * Replaces the five XML special characters with their entity equivalents.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert text to speech using the Azure Speech REST API (short-audio endpoint).
 * Returns the raw audio buffer (WAV/MP3 depending on outputFormat).
 *
 * @param {string} text           – Text to synthesise (max ~3 000 characters)
 * @param {string} [language='tr-TR'] – BCP-47 language/locale code
 * @param {string} [voiceName]    – Azure neural voice name; defaults to the
 *                                  standard Turkish female voice
 * @returns {Promise<Buffer>}     – Raw audio bytes
 */
async function textToSpeech(text, language = 'tr-TR', voiceName) {
  if (!text) throw new Error('text is required');

  const { subscriptionKey, region } = getSpeechConfig();

  // Default neural voices per language
  const defaultVoices = {
    'tr-TR': 'tr-TR-EmelNeural',
    'en-US': 'en-US-JennyNeural',
    'en-GB': 'en-GB-SoniaNeural',
  };
  const voice = voiceName || defaultVoices[language] || 'tr-TR-EmelNeural';

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
      <voice name="${voice}">${escapeXml(text)}</voice>
    </speak>`.trim();

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await axios.post(url, ssml, {
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    responseType: 'arraybuffer',
    timeout: 20000,
  });

  return Buffer.from(response.data);
}

/**
 * Return a list of available neural voices for Turkish and English via the
 * Speech REST API voices/list endpoint.
 *
 * @returns {Promise<Array>} Array of voice objects
 */
async function listVoices() {
  const { subscriptionKey, region } = getSpeechConfig();

  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;
  const response = await axios.get(url, {
    headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey },
    timeout: 10000,
  });

  return (response.data || []).filter(v =>
    v.Locale && (v.Locale.startsWith('tr') || v.Locale.startsWith('en'))
  );
}

module.exports = {
  getSpeechConfig,
  textToSpeech,
  listVoices,
  escapeXml,
};
