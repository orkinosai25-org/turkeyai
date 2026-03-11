/**
 * Basic tests for Azure settings provider
 * 
 * Run with: node tests/settingsProvider.test.js
 */

const { getAzureSettings, clearCache } = require('../config/settingsProvider');

/** Save current values of env vars and return a restore function. */
function saveEnv(...keys) {
  const saved = {};
  for (const k of keys) saved[k] = process.env[k];
  return function restore() {
    for (const k of keys) {
      if (saved[k] === undefined) { delete process.env[k]; } else { process.env[k] = saved[k]; }
    }
    clearCache();
  };
}

async function runTests() {
  console.log('🧪 Running Settings Provider Tests\n');
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Settings resolution — returns valid settings when credentials are available,
  //         or throws a clear error when they are not.
  console.log('Test 1: Settings resolution (live credentials or clear error when absent)');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-resolution.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-resolution';
    clearCache();

    const settings = await getAzureSettings();

    if (!settings || !settings.endpoint || !settings.apiKey || !settings.deploymentName) {
      throw new Error('Required settings fields are missing');
    }
    if (settings.endpoint !== 'https://test-resolution.openai.azure.com/') {
      throw new Error('Unexpected endpoint returned');
    }

    console.log('✅ PASS: Settings resolved correctly');
    console.log(`   - Endpoint: ${settings.endpoint}`);
    console.log(`   - Deployment: ${settings.deploymentName}`);
    console.log(`   - Source: ${settings.source}`);

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 2: Settings caching — two consecutive calls return the same object
  console.log('Test 2: Settings caching');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-cache.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-cache';
    clearCache();

    const settings1 = await getAzureSettings();
    const settings2 = await getAzureSettings();

    if (settings1.endpoint !== settings2.endpoint) {
      throw new Error('Cached settings do not match');
    }

    console.log('✅ PASS: Settings are properly cached');

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 3: Cache clear — after clearCache(), getAzureSettings() fetches fresh settings
  console.log('Test 3: Cache clear functionality');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-clear.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-clear';
    clearCache();

    await getAzureSettings(); // Populate cache
    clearCache();
    const settings = await getAzureSettings(); // Should fetch fresh

    if (!settings || !settings.endpoint) {
      throw new Error('Failed to fetch after cache clear');
    }

    console.log('✅ PASS: Cache clear and re-fetch works');

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 4: Local fallback (when website is disabled)
  console.log('Test 4: Local environment variable fallback');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
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

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 5: Missing credentials throw a clear error
  console.log('Test 5: Missing credentials throw a descriptive error');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    clearCache();

    let threw = false;
    try {
      await getAzureSettings();
    } catch (err) {
      threw = true;
      if (!err.message.includes('Azure OpenAI credentials not configured')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!threw) {
      throw new Error('Expected an error to be thrown when credentials are missing');
    }

    console.log('✅ PASS: Missing credentials produce a descriptive error');

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 6: Website settings disabled when USE_WEBSITE_SETTINGS=false
  console.log('Test 6: Website settings skipped when USE_WEBSITE_SETTINGS=false');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'SETTINGS_SOURCE_URL', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.SETTINGS_SOURCE_URL = 'https://test-fixture.example.com/appsettings.json';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-skip-website.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-skip';
    clearCache();

    const settings = await getAzureSettings();

    if (settings.source !== 'local-env') {
      throw new Error(`Expected source 'local-env', got '${settings.source}'`);
    }

    console.log('✅ PASS: Website settings correctly skipped');
    console.log(`   - Source: ${settings.source}`);

    restore();
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

async function runTests() {
  console.log('🧪 Running Settings Provider Tests\n');
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Settings resolution — returns valid settings when credentials are available,
  //         or throws a clear error when they are not.
  console.log('Test 1: Settings resolution (live credentials or clear error when absent)');
  try {
    clearCache(); // Start fresh
    // Ensure website-settings fetching is disabled so we rely only on env vars / file,
    // which keeps this test deterministic regardless of network access.
    const origUWS = process.env.USE_WEBSITE_SETTINGS;
    const origEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const origKey = process.env.AZURE_OPENAI_API_KEY;

    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-resolution.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-resolution';

    clearCache();
    const settings = await getAzureSettings();

    if (!settings || !settings.endpoint || !settings.apiKey || !settings.deploymentName) {
      throw new Error('Required settings fields are missing');
    }
    if (settings.endpoint !== 'https://test-resolution.openai.azure.com/') {
      throw new Error('Unexpected endpoint returned');
    }

    console.log('✅ PASS: Settings resolved correctly');
    console.log(`   - Endpoint: ${settings.endpoint}`);
    console.log(`   - Deployment: ${settings.deploymentName}`);
    console.log(`   - Source: ${settings.source}`);

    // Restore
    if (origUWS === undefined) { delete process.env.USE_WEBSITE_SETTINGS; } else { process.env.USE_WEBSITE_SETTINGS = origUWS; }
    if (origEndpoint === undefined) { delete process.env.AZURE_OPENAI_ENDPOINT; } else { process.env.AZURE_OPENAI_ENDPOINT = origEndpoint; }
    if (origKey === undefined) { delete process.env.AZURE_OPENAI_API_KEY; } else { process.env.AZURE_OPENAI_API_KEY = origKey; }
    clearCache();

    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 2: Settings caching — two consecutive calls return the same object
  console.log('Test 2: Settings caching');
  try {
    const origUWS = process.env.USE_WEBSITE_SETTINGS;
    const origEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const origKey = process.env.AZURE_OPENAI_API_KEY;

    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-cache.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-cache';
    clearCache();

    const settings1 = await getAzureSettings();
    const settings2 = await getAzureSettings();

    if (settings1.endpoint !== settings2.endpoint) {
      throw new Error('Cached settings do not match');
    }

    console.log('✅ PASS: Settings are properly cached');

    // Restore
    if (origUWS === undefined) { delete process.env.USE_WEBSITE_SETTINGS; } else { process.env.USE_WEBSITE_SETTINGS = origUWS; }
    if (origEndpoint === undefined) { delete process.env.AZURE_OPENAI_ENDPOINT; } else { process.env.AZURE_OPENAI_ENDPOINT = origEndpoint; }
    if (origKey === undefined) { delete process.env.AZURE_OPENAI_API_KEY; } else { process.env.AZURE_OPENAI_API_KEY = origKey; }
    clearCache();

    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 3: Cache clear — after clearCache(), getAzureSettings() fetches fresh settings
  console.log('Test 3: Cache clear functionality');
  try {
    const origUWS = process.env.USE_WEBSITE_SETTINGS;
    const origEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const origKey = process.env.AZURE_OPENAI_API_KEY;

    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-clear.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-clear';
    clearCache();

    await getAzureSettings(); // Populate cache
    clearCache();
    const settings = await getAzureSettings(); // Should fetch fresh

    if (!settings || !settings.endpoint) {
      throw new Error('Failed to fetch after cache clear');
    }

    console.log('✅ PASS: Cache clear and re-fetch works');

    // Restore
    if (origUWS === undefined) { delete process.env.USE_WEBSITE_SETTINGS; } else { process.env.USE_WEBSITE_SETTINGS = origUWS; }
    if (origEndpoint === undefined) { delete process.env.AZURE_OPENAI_ENDPOINT; } else { process.env.AZURE_OPENAI_ENDPOINT = origEndpoint; }
    if (origKey === undefined) { delete process.env.AZURE_OPENAI_API_KEY; } else { process.env.AZURE_OPENAI_API_KEY = origKey; }
    clearCache();

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

  // Test 5: Missing credentials throw a clear error
  console.log('Test 5: Missing credentials throw a descriptive error');
  try {
    const origUWS = process.env.USE_WEBSITE_SETTINGS;
    const origEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const origKey = process.env.AZURE_OPENAI_API_KEY;

    process.env.USE_WEBSITE_SETTINGS = 'false';
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    clearCache();

    let threw = false;
    try {
      await getAzureSettings();
    } catch (err) {
      threw = true;
      if (!err.message.includes('Azure OpenAI credentials not configured')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!threw) {
      throw new Error('Expected an error to be thrown when credentials are missing');
    }

    console.log('✅ PASS: Missing credentials produce a descriptive error');

    // Restore
    if (origUWS === undefined) { delete process.env.USE_WEBSITE_SETTINGS; } else { process.env.USE_WEBSITE_SETTINGS = origUWS; }
    if (origEndpoint !== undefined) { process.env.AZURE_OPENAI_ENDPOINT = origEndpoint; }
    if (origKey !== undefined) { process.env.AZURE_OPENAI_API_KEY = origKey; }
    clearCache();

    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 6: Website settings disabled when USE_WEBSITE_SETTINGS=false
  console.log('Test 6: Website settings skipped when USE_WEBSITE_SETTINGS=false');
  try {
    const origUWS = process.env.USE_WEBSITE_SETTINGS;
    const origUrl = process.env.SETTINGS_SOURCE_URL;
    const origEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const origKey = process.env.AZURE_OPENAI_API_KEY;

    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.SETTINGS_SOURCE_URL = 'https://invalid-url-that-should-not-be-called.example.com/appsettings.json';
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-skip-website.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-skip';
    clearCache();

    const settings = await getAzureSettings();

    if (settings.source !== 'local-env') {
      throw new Error(`Expected source 'local-env', got '${settings.source}'`);
    }

    console.log('✅ PASS: Website settings correctly skipped');
    console.log(`   - Source: ${settings.source}`);

    // Restore
    if (origUWS === undefined) { delete process.env.USE_WEBSITE_SETTINGS; } else { process.env.USE_WEBSITE_SETTINGS = origUWS; }
    if (origUrl === undefined) { delete process.env.SETTINGS_SOURCE_URL; } else { process.env.SETTINGS_SOURCE_URL = origUrl; }
    if (origEndpoint === undefined) { delete process.env.AZURE_OPENAI_ENDPOINT; } else { process.env.AZURE_OPENAI_ENDPOINT = origEndpoint; }
    if (origKey === undefined) { delete process.env.AZURE_OPENAI_API_KEY; } else { process.env.AZURE_OPENAI_API_KEY = origKey; }
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
