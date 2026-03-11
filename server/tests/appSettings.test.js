/**
 * Tests for the appsettings.json loader (server/config/appSettings.js)
 *
 * Run with: node tests/appSettings.test.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// ── Helper: dynamically require a fresh copy of the module ──────────────────
function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

// ── Helper: write a temp appsettings.json and call loadAppSettings ───────────
function loadWithConfig(config, dir) {
  const filePath = path.join(dir, 'appsettings.json');
  fs.writeFileSync(filePath, JSON.stringify(config), 'utf8');
  const { loadAppSettings } = freshRequire('../config/appSettings');
  loadAppSettings(dir);
}

// ── Test runner ──────────────────────────────────────────────────────────────
function runTests() {
  console.log('🧪 Running AppSettings Loader Tests\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, label, extra) {
    if (condition) {
      console.log(`✅ PASS: ${label}${extra ? `\n   ${extra}` : ''}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${label}${extra ? `\n   ${extra}` : ''}`);
      failed++;
    }
  }

  // ── Test 1: AzureOpenAI section is mapped to process.env ──────────────────
  console.log('Test 1: AzureOpenAI section mapped to process.env');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'appsettings-test-'));
    // Clear any pre-existing values so the loader can set them
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    loadWithConfig({
      AzureOpenAI: {
        Endpoint: 'https://test.openai.azure.com/',
        ApiKey: 'test-key',
        DeploymentName: 'gpt-4-test'
      }
    }, dir);

    assert(process.env.AZURE_OPENAI_ENDPOINT === 'https://test.openai.azure.com/', 'AZURE_OPENAI_ENDPOINT set');
    assert(process.env.AZURE_OPENAI_API_KEY === 'test-key', 'AZURE_OPENAI_API_KEY set');
    assert(process.env.AZURE_OPENAI_DEPLOYMENT_NAME === 'gpt-4-test', 'AZURE_OPENAI_DEPLOYMENT_NAME set');

    fs.rmSync(dir, { recursive: true });
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  }
  console.log('');

  // ── Test 2: Database section mapped ───────────────────────────────────────
  console.log('Test 2: Database section mapped to process.env');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'appsettings-test-'));
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_SSL;

    loadWithConfig({
      Database: {
        Host: 'db.test.postgres.azure.com',
        Port: 5432,
        Name: 'mydb',
        User: 'admin',
        Password: 'secret',
        SSL: true
      }
    }, dir);

    assert(process.env.DB_HOST === 'db.test.postgres.azure.com', 'DB_HOST set');
    assert(process.env.DB_PORT === '5432', 'DB_PORT set');
    assert(process.env.DB_NAME === 'mydb', 'DB_NAME set');
    assert(process.env.DB_USER === 'admin', 'DB_USER set');
    assert(process.env.DB_PASSWORD === 'secret', 'DB_PASSWORD set');
    assert(process.env.DB_SSL === 'true', 'DB_SSL set');

    fs.rmSync(dir, { recursive: true });
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL'].forEach(k => delete process.env[k]);
  }
  console.log('');

  // ── Test 3: ConnectionStrings.DefaultConnection parsed ────────────────────
  console.log('Test 3: ConnectionStrings.DefaultConnection parsed');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'appsettings-test-'));
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_SSL;

    loadWithConfig({
      ConnectionStrings: {
        DefaultConnection: 'Host=conn.postgres.azure.com;Port=5432;Database=conndb;Username=connuser;Password=connpass;SSL Mode=Require'
      }
    }, dir);

    assert(process.env.DB_HOST === 'conn.postgres.azure.com', 'DB_HOST from connection string');
    assert(process.env.DB_USER === 'connuser', 'DB_USER from connection string');
    assert(process.env.DB_PASSWORD === 'connpass', 'DB_PASSWORD from connection string');
    assert(process.env.DB_SSL === 'true', 'DB_SSL from connection string (Require → true)');

    fs.rmSync(dir, { recursive: true });
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL'].forEach(k => delete process.env[k]);
  }
  console.log('');

  // ── Test 4: Existing env vars are NOT overwritten ──────────────────────────
  console.log('Test 4: Existing process.env values are not overwritten');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'appsettings-test-'));
    process.env.DB_HOST = 'original-host';

    loadWithConfig({
      Database: { Host: 'new-host', Port: 5432, Name: 'db', User: 'u', Password: 'p', SSL: true }
    }, dir);

    assert(process.env.DB_HOST === 'original-host', 'Pre-existing DB_HOST not overwritten');

    fs.rmSync(dir, { recursive: true });
    delete process.env.DB_HOST;
  }
  console.log('');

  // ── Test 5: No appsettings.json — no error ────────────────────────────────
  console.log('Test 5: Missing appsettings.json does not throw');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'appsettings-test-'));
    try {
      const { loadAppSettings } = freshRequire('../config/appSettings');
      loadAppSettings(dir);   // file does not exist — should be silent
      assert(true, 'No error thrown when file is absent');
    } catch (e) {
      assert(false, 'No error thrown when file is absent', e.message);
    }
    fs.rmSync(dir, { recursive: true });
  }
  console.log('');

  // ── Test 6: Environment-specific overlay merges correctly ─────────────────
  console.log('Test 6: appsettings.<env>.json overlay merges with base');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'appsettings-test-'));
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    // Base config
    fs.writeFileSync(path.join(dir, 'appsettings.json'), JSON.stringify({
      AzureOpenAI: { Endpoint: 'https://base.openai.azure.com/', ApiKey: 'base-key', DeploymentName: 'gpt-4' }
    }), 'utf8');

    // Overlay for current NODE_ENV
    const env = process.env.NODE_ENV || 'development';
    fs.writeFileSync(path.join(dir, `appsettings.${env}.json`), JSON.stringify({
      AzureOpenAI: { DeploymentName: 'gpt-4-overlay' }
    }), 'utf8');

    const { loadAppSettings } = freshRequire('../config/appSettings');
    loadAppSettings(dir);

    assert(process.env.AZURE_OPENAI_ENDPOINT === 'https://base.openai.azure.com/', 'Base Endpoint preserved in overlay');
    assert(process.env.AZURE_OPENAI_DEPLOYMENT_NAME === 'gpt-4-overlay', 'Overlay DeploymentName applied');

    fs.rmSync(dir, { recursive: true });
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  }
  console.log('');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════');

  process.exit(failed > 0 ? 1 : 0);
}

try {
  runTests();
} catch (err) {
  console.error('Test execution error:', err);
  process.exit(1);
}
