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

  // Test 5: Missing endpoint throws a clear error (apiKey alone is no longer required)
  console.log('Test 5: Missing endpoint throws a descriptive error');
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
      if (!err.message.includes('Azure OpenAI endpoint not configured')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!threw) {
      throw new Error('Expected an error to be thrown when endpoint is missing');
    }

    console.log('✅ PASS: Missing endpoint produces a descriptive error');

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

  // Test 7: Placeholder endpoint in website response causes fallback to env vars.
  //         A placeholder API key alone no longer triggers fallback (Managed Identity is valid).
  console.log('Test 7: Placeholder endpoint in fetched settings causes fallback to env vars');
  try {
    const http = require('http');
    // Start a minimal HTTP server that returns a placeholder endpoint
    const placeholderServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        AzureOpenAI: {
          Endpoint: 'https://your-resource-name.openai.azure.com/',
          ApiKey: 'your-api-key-here',
          DeploymentName: 'gpt-4o'
        }
      }));
    });

    await new Promise((resolve) => placeholderServer.listen(0, '127.0.0.1', resolve));
    const placeholderPort = placeholderServer.address().port;

    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'SETTINGS_SOURCE_URL', 'SETTINGS_API_TOKEN', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'true';
    process.env.SETTINGS_SOURCE_URL = `http://127.0.0.1:${placeholderPort}/appsettings.json`;
    delete process.env.SETTINGS_API_TOKEN;
    process.env.AZURE_OPENAI_ENDPOINT = 'https://test-fallback.openai.azure.com/';
    process.env.AZURE_OPENAI_API_KEY = 'test-key-fallback';
    clearCache();

    try {
      const settings = await getAzureSettings();

      if (settings.source !== 'local-env') {
        throw new Error(`Expected fallback to local-env (got '${settings.source}')`);
      }
      if (settings.endpoint !== 'https://test-fallback.openai.azure.com/') {
        throw new Error(`Expected env var endpoint, got '${settings.endpoint}'`);
      }

      console.log('✅ PASS: Placeholder endpoint skipped, fell back to env vars');
      console.log(`   - Source: ${settings.source}`);
      testsPassed++;
    } finally {
      restore();
      await new Promise((resolve) => placeholderServer.close(resolve));
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 7b: Placeholder API key alone does NOT cause fallback (Managed Identity path).
  console.log('Test 7b: Placeholder API key alone does not skip website settings (Managed Identity valid)');
  try {
    const http = require('http');
    // Return a real endpoint but placeholder/empty API key — should be accepted
    const managedIdServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        AzureOpenAI: {
          Endpoint: 'https://real-resource.openai.azure.com/',
          ApiKey: 'your-api-key-here',
          DeploymentName: 'gpt-4o'
        }
      }));
    });

    await new Promise((resolve) => managedIdServer.listen(0, '127.0.0.1', resolve));
    const managedIdPort = managedIdServer.address().port;

    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'SETTINGS_SOURCE_URL', 'SETTINGS_API_TOKEN', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'true';
    process.env.SETTINGS_SOURCE_URL = `http://127.0.0.1:${managedIdPort}/appsettings.json`;
    delete process.env.SETTINGS_API_TOKEN;
    process.env.AZURE_OPENAI_ENDPOINT = 'https://fallback-env.openai.azure.com/';
    delete process.env.AZURE_OPENAI_API_KEY;
    clearCache();

    try {
      const settings = await getAzureSettings();

      if (settings.source !== 'website') {
        throw new Error(`Expected source 'website' (Managed Identity path), got '${settings.source}'`);
      }
      if (settings.endpoint !== 'https://real-resource.openai.azure.com/') {
        throw new Error(`Expected website endpoint, got '${settings.endpoint}'`);
      }
      if (settings.apiKey !== '') {
        throw new Error(`Expected empty apiKey for Managed Identity path, got '${settings.apiKey}'`);
      }

      console.log('✅ PASS: Placeholder API key accepted for Managed Identity (endpoint-only) path');
      console.log(`   - Source: ${settings.source}, endpoint: ${settings.endpoint}`);
      testsPassed++;
    } finally {
      restore();
      await new Promise((resolve) => managedIdServer.close(resolve));
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 8: toGitHubApiUrl helper converts raw GitHub URL to API URL
  console.log('Test 8: GitHub raw URL conversion to API URL');
  try {
    // Access the helper via require to test it in isolation
    const { toGitHubApiUrl } = require('../config/settingsProvider');

    if (typeof toGitHubApiUrl !== 'function') {
      throw new Error('toGitHubApiUrl is not exported');
    }

    const rawUrl = 'https://raw.githubusercontent.com/myorg/myrepo/main/path/to/appsettings.json';
    const apiUrl = toGitHubApiUrl(rawUrl);

    if (!apiUrl) {
      throw new Error('Expected a converted API URL, got null');
    }
    // Validate the converted URL by parsing it properly
    const parsedApiUrl = new URL(apiUrl);
    if (parsedApiUrl.hostname !== 'api.github.com') {
      throw new Error(`Expected hostname api.github.com, got: ${parsedApiUrl.hostname}`);
    }
    if (parsedApiUrl.searchParams.get('ref') !== 'main') {
      throw new Error(`Expected ref=main query param, got: ${parsedApiUrl.searchParams.get('ref')}`);
    }
    if (!parsedApiUrl.pathname.includes('myorg/myrepo/contents/path/to/appsettings.json')) {
      throw new Error(`Expected correct path in URL, got: ${parsedApiUrl.pathname}`);
    }

    // Non-GitHub URL should return null
    const nonGithubResult = toGitHubApiUrl('https://example.com/appsettings.json');
    if (nonGithubResult !== null) {
      throw new Error(`Expected null for non-GitHub URL, got: ${nonGithubResult}`);
    }

    console.log('✅ PASS: GitHub raw URL correctly converted to API URL');
    console.log(`   - Input:  ${rawUrl}`);
    console.log(`   - Output: ${apiUrl}`);

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
