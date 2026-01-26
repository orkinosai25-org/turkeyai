const express = require('express');
const router = express.Router();
const { getAzureSettings, clearCache } = require('../config/settingsProvider');

/**
 * GET /api/settings/status
 * Get the status of Azure settings configuration
 */
router.get('/status', async (req, res) => {
  try {
    const settings = await getAzureSettings();
    
    // Return status without exposing sensitive data
    res.json({
      status: 'configured',
      source: settings.endpoint.includes('your-resource') ? 'local-env' : 'website',
      endpoint: settings.endpoint.replace(/https:\/\/([^.]+).*/, 'https://$1.***'),
      deploymentName: settings.deploymentName,
      apiVersion: settings.apiVersion,
      settings: {
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
        topP: settings.topP,
        frequencyPenalty: settings.frequencyPenalty,
        presencePenalty: settings.presencePenalty
      },
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Settings Status Error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * POST /api/settings/refresh
 * Clear settings cache to force refresh from source
 */
router.post('/refresh', (req, res) => {
  try {
    clearCache();
    res.json({
      status: 'success',
      message: 'Settings cache cleared. Next request will fetch fresh settings.',
      brand: 'TürkiyeAI - Powered by OrkinosAI'
    });
  } catch (error) {
    console.error('Settings Refresh Error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
