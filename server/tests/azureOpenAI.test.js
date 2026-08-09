/**
 * Focused tests for Azure OpenAI chat option mapping.
 *
 * Run with: node tests/azureOpenAI.test.js
 */

const settingsProviderPath = require.resolve('../config/settingsProvider');
const azureOpenAIPath = require.resolve('../config/azureOpenAI');
const originalSettingsProvider = require(settingsProviderPath);

async function runTests() {
  console.log('🧪 Running Azure OpenAI Chat Options Tests\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`✅ PASS: ${label}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${label}`);
      failed++;
    }
  }

  try {
    require.cache[settingsProviderPath].exports = {
      ...originalSettingsProvider,
      getAzureSettings: async () => ({
        temperature: 0.4,
        maxTokens: 321,
        topP: 0.8,
        frequencyPenalty: 0.1,
        presencePenalty: 0.2
      })
    };

    delete require.cache[azureOpenAIPath];
    const { getChatOptions } = require('../config/azureOpenAI');
    const options = await getChatOptions();

    assert(options.max_completion_tokens === 321, 'Uses max_completion_tokens for chat requests');
    assert(!Object.prototype.hasOwnProperty.call(options, 'max_tokens'), 'Does not send deprecated max_tokens');
    assert(options.temperature === 0.4, 'Preserves temperature setting');
    assert(options.top_p === 0.8, 'Preserves top_p setting');
    assert(options.frequency_penalty === 0.1, 'Preserves frequency_penalty setting');
    assert(options.presence_penalty === 0.2, 'Preserves presence_penalty setting');
  } catch (error) {
    console.error('❌ FAIL: Test execution error', error);
    failed++;
  } finally {
    require.cache[settingsProviderPath].exports = originalSettingsProvider;
    delete require.cache[azureOpenAIPath];
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
