/**
 * Basic tests for Azure settings provider
 * 
 * Run with: node tests/settingsProvider.test.js
 */

const { getAzureSettings, clearCache } = require('../config/settingsProvider');

async function runTests() {
  console.log('🧪 Running Settings Provider Tests\n');
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Fetch settings from website
  console.log('Test 1: Fetch settings from website');
  try {
    clearCache(); // Start fresh
    const settings = await getAzureSettings();
    
    if (!settings) {
      throw new Error('Settings are null');
    }
    
    if (!settings.endpoint || !settings.apiKey || !settings.deploymentName) {
      throw new Error('Required settings fields are missing');
    }
    
    console.log('✅ PASS: Successfully fetched settings from website');
    console.log(`   - Endpoint: ${settings.endpoint}`);
    console.log(`   - Deployment: ${settings.deploymentName}`);
    console.log(`   - API Version: ${settings.apiVersion}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 2: Settings caching
  console.log('Test 2: Settings caching');
  try {
    const settings1 = await getAzureSettings();
    const settings2 = await getAzureSettings();
    
    if (settings1.endpoint !== settings2.endpoint) {
      throw new Error('Cached settings do not match');
    }
    
    console.log('✅ PASS: Settings are properly cached');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 3: Cache clear
  console.log('Test 3: Cache clear functionality');
  try {
    await getAzureSettings(); // Populate cache
    clearCache();
    const settings = await getAzureSettings(); // Should fetch fresh
    
    if (!settings) {
      throw new Error('Failed to fetch after cache clear');
    }
    
    console.log('✅ PASS: Cache clear and re-fetch works');
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 4: Local fallback (when website is disabled)
  console.log('Test 4: Local environment variable fallback');
  try {
    // Temporarily disable website settings
    const originalValue = process.env.USE_WEBSITE_SETTINGS;
    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-local.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-123';
    
    clearCache();
    const settings = await getAzureSettings();
    
    if (settings.endpoint !== 'https://test-local.openai.azure.com/') {
      throw new Error('Did not use local environment variables');
    }
    
    console.log('✅ PASS: Local fallback works correctly');
    console.log(`   - Used endpoint: ${settings.endpoint}`);
    
    // Restore original value or delete if it was undefined
    if (originalValue === undefined) {
      delete process.env.USE_WEBSITE_SETTINGS;
    } else {
      process.env.USE_WEBSITE_SETTINGS = originalValue;
    }
    clearCache();
    
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test summary
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log('═══════════════════════════════════════');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
