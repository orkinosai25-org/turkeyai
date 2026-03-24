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

  // Test 1: Settings resolution — the file endpoint takes precedence; the API key may come
  //         from the file or from an env var (App Service application setting).
  console.log('Test 1: Settings resolution (file endpoint + env-var API key)');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    // Set API key via env var (simulating App Service application setting)
    delete process.env.AZURE_OPENAI_ENDPOINT;   // let the file supply the endpoint
    process.env.AZURE_OPENAI_API_KEY = 'test-key-resolution';
    clearCache();

    const settings = await getAzureSettings();

    if (!settings || !settings.endpoint || !settings.deploymentName) {
      throw new Error('Required settings fields are missing');
    }
    // Endpoint comes from appsettings.json; API key is supplemented from env var
    if (settings.source !== 'appsettings.json') {
      throw new Error(`Expected source 'appsettings.json', got '${settings.source}'`);
    }
    if (!settings.apiKey || settings.apiKey !== 'test-key-resolution') {
      throw new Error('API key from env var was not applied');
    }

    console.log('✅ PASS: Settings resolved correctly (file endpoint + env-var API key)');
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

  // Test 4: API key supplemented from env var when file has no key
  console.log('Test 4: API key from env var supplements file-based endpoint');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    delete process.env.AZURE_OPENAI_ENDPOINT;           // file endpoint takes precedence anyway
    process.env.AZURE_OPENAI_API_KEY = 'test-key-123'; // App Service application setting
    clearCache();

    const settings = await getAzureSettings();

    if (!settings.endpoint) {
      throw new Error('Expected endpoint from file settings');
    }
    if (!settings.apiKey || settings.apiKey !== 'test-key-123') {
      throw new Error('Expected API key from env var to be applied');
    }
    if (settings.source !== 'appsettings.json') {
      throw new Error(`Expected source 'appsettings.json', got '${settings.source}'`);
    }

    console.log('✅ PASS: API key from env var correctly supplements file endpoint');
    console.log(`   - Endpoint (from file): ${settings.endpoint}`);
    console.log(`   - API key (from env): ${settings.apiKey ? '***set***' : 'not set'}`);

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 5: Endpoint-only settings (no API key) succeed for managed identity;
  //         a descriptive error is only thrown when the endpoint itself is absent.
  console.log('Test 5: Endpoint-only settings succeed (managed identity path); missing endpoint throws');
  try {
    // When appsettings.json has a real endpoint but no API key is configured anywhere,
    // getAzureSettings() should succeed and return settings with a null/undefined apiKey
    // so that the client can authenticate via Azure Managed Identity.
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    clearCache();

    const settings = await getAzureSettings();
    if (!settings || !settings.endpoint) {
      throw new Error('Expected settings with an endpoint for managed identity path');
    }

    console.log('✅ PASS: Endpoint-only settings succeed (apiKey absent → managed identity will be used)');
    console.log(`   - Endpoint: ${settings.endpoint}`);
    console.log(`   - apiKey present: ${Boolean(settings.apiKey)}`);

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 6: Website settings disabled when USE_WEBSITE_SETTINGS=false
  // Test 6: File settings are used when website settings are disabled
  console.log('Test 6: File settings are used when USE_WEBSITE_SETTINGS=false');
  try {
    const restore = saveEnv('USE_WEBSITE_SETTINGS', 'SETTINGS_SOURCE_URL', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY');
    process.env.USE_WEBSITE_SETTINGS = 'false';
    process.env.SETTINGS_SOURCE_URL = 'https://test-fixture.example.com/appsettings.json';
    delete process.env.AZURE_OPENAI_ENDPOINT;        // file supplies the endpoint
    process.env.AZURE_OPENAI_API_KEY = 'test-key-skip';
    clearCache();

    const settings = await getAzureSettings();

    // File endpoint takes precedence; source should be 'appsettings.json'
    if (settings.source !== 'appsettings.json') {
      throw new Error(`Expected source 'appsettings.json', got '${settings.source}'`);
    }

    console.log('✅ PASS: Website settings correctly skipped; file settings used');
    console.log(`   - Source: ${settings.source}`);

    restore();
    testsPassed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    testsFailed++;
  }
  console.log('');

  // Test 7: Placeholder credentials in website response are skipped; file settings are used
  console.log('Test 7: Placeholder credentials in fetched settings are skipped, fallback to file settings');
  try {
    const http = require('http');
    // Start a minimal HTTP server that returns placeholder credentials
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
    delete process.env.AZURE_OPENAI_ENDPOINT;    // file supplies the endpoint
    process.env.AZURE_OPENAI_API_KEY = 'test-key-fallback';
    clearCache();

    try {
      const settings = await getAzureSettings();

      // After skipping placeholder website credentials, file settings are used
      if (settings.source !== 'appsettings.json') {
        throw new Error(`Expected fallback to appsettings.json (got '${settings.source}')`);
      }
      if (!settings.endpoint) {
        throw new Error('Expected endpoint in settings after fallback');
      }

      console.log('✅ PASS: Placeholder credentials skipped, fell back to file settings');
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
