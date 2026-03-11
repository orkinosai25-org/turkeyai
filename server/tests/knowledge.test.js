/**
 * Tests for Knowledge Management Route and Search
 *
 * Validates route structure, request validation, and graceful degradation
 * when Azure Search / DB are not configured.
 */

const express = require('express');

console.log('🧪 Testing Knowledge Management\n');

let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ Test ${++testsPassed}: ${testName}`);
    if (details) console.log(`   ${details}`);
  } else {
    console.log(`❌ Test: ${testName}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

// Test 1: Knowledge route exports correctly
console.log('Test 1: Knowledge Route Export');
let knowledgeRouter;
try {
  knowledgeRouter = require('../routes/knowledge');
  logTest('knowledge route module loads', typeof knowledgeRouter === 'function');
} catch (err) {
  logTest('knowledge route module loads', false, err.message);
  process.exit(1);
}

// Test 2: Route can be mounted on Express app
console.log('\nTest 2: Route Mounting');
try {
  const app = express();
  app.use(express.json());
  app.use('/api/knowledge', knowledgeRouter);
  logTest('knowledge route mounts without error', true);
} catch (err) {
  logTest('knowledge route mounts without error', false, err.message);
}

// Test 3: Knowledge search config loads
console.log('\nTest 3: Knowledge Search Config');
let knowledgeSearch;
try {
  knowledgeSearch = require('../config/knowledgeSearch');
  logTest('knowledgeSearch module loads', typeof knowledgeSearch === 'object');
  logTest('getKnowledgeSearchClient is a function', typeof knowledgeSearch.getKnowledgeSearchClient === 'function');
  logTest('getKnowledgeIndexClient is a function', typeof knowledgeSearch.getKnowledgeIndexClient === 'function');
  logTest('createKnowledgeIndex is a function', typeof knowledgeSearch.createKnowledgeIndex === 'function');
  logTest('indexKnowledgeItem is a function', typeof knowledgeSearch.indexKnowledgeItem === 'function');
  logTest('deleteKnowledgeItem is a function', typeof knowledgeSearch.deleteKnowledgeItem === 'function');
  logTest('searchKnowledge is a function', typeof knowledgeSearch.searchKnowledge === 'function');
  logTest('KNOWLEDGE_INDEX_NAME is defined', typeof knowledgeSearch.KNOWLEDGE_INDEX_NAME === 'string');
} catch (err) {
  logTest('knowledgeSearch module loads', false, err.message);
}

// Test 4: Knowledge index schema structure
console.log('\nTest 4: Knowledge Index Schema');
try {
  const { KNOWLEDGE_INDEX_SCHEMA } = require('../config/knowledgeSearch');
  logTest('KNOWLEDGE_INDEX_SCHEMA is defined', typeof KNOWLEDGE_INDEX_SCHEMA === 'object');
  logTest('Schema has name field', typeof KNOWLEDGE_INDEX_SCHEMA.name === 'string');
  logTest('Schema has fields array', Array.isArray(KNOWLEDGE_INDEX_SCHEMA.fields));
  logTest('Schema has required fields', KNOWLEDGE_INDEX_SCHEMA.fields.length >= 7);

  const fieldNames = KNOWLEDGE_INDEX_SCHEMA.fields.map(f => f.name);
  logTest('Schema has id field (key)', fieldNames.includes('id'));
  logTest('Schema has title field', fieldNames.includes('title'));
  logTest('Schema has content field', fieldNames.includes('content'));
  logTest('Schema has source_type field', fieldNames.includes('source_type'));
  logTest('Schema has location_tags field', fieldNames.includes('location_tags'));
  logTest('Schema has semantic search config', !!KNOWLEDGE_INDEX_SCHEMA.semanticSearch);
} catch (err) {
  logTest('KNOWLEDGE_INDEX_SCHEMA is defined', false, err.message);
}

// Test 5: Agent config includes searchKnowledgeBase
console.log('\nTest 5: Agent Config Integration');
try {
  const { getAgentTools } = require('../config/agentConfig');
  const tools = getAgentTools();
  const kbTool = tools.find(t => t.function.name === 'searchKnowledgeBase');
  logTest('searchKnowledgeBase tool is in agent tools', !!kbTool);
  logTest('searchKnowledgeBase has description', !!kbTool?.function.description);
  logTest('searchKnowledgeBase requires query param', kbTool?.function.parameters.required.includes('query'));
  logTest('searchKnowledgeBase has location_tag param', !!kbTool?.function.parameters.properties.location_tag);
  logTest('searchKnowledgeBase has top param', !!kbTool?.function.parameters.properties.top);
} catch (err) {
  logTest('Agent config integration check', false, err.message);
}

// Test 6: searchKnowledgeBase tool handler
console.log('\nTest 6: searchKnowledgeBase Tool Handler');

async function testKnowledgeToolHandler() {
  try {
    const { searchKnowledgeBase, executeTool } = require('../config/agentTools');

    logTest('searchKnowledgeBase is exported from agentTools', typeof searchKnowledgeBase === 'function');

    // Missing query should return validation error
    const missingQuery = await searchKnowledgeBase({});
    logTest('searchKnowledgeBase rejects empty query', !missingQuery.success && !!missingQuery.error);

    // With a query - Azure Search not configured so should return failure gracefully
    const withQuery = await searchKnowledgeBase({ query: 'Bodrum restaurants near marina' });
    logTest('searchKnowledgeBase returns object', typeof withQuery === 'object');
    logTest('searchKnowledgeBase has success field', 'success' in withQuery);

    // executeTool routes to knowledge base handler
    const execResult = await executeTool('searchKnowledgeBase', { query: 'Gumbet nightlife' });
    logTest('executeTool routes to searchKnowledgeBase', typeof execResult === 'object' && 'success' in execResult);

  } catch (err) {
    logTest('searchKnowledgeBase tool handler tests', false, err.message);
  }
}

// Test 7: createKnowledgeIndex script loads
console.log('\nTest 7: createKnowledgeIndex Script');
try {
  const createKnowledgeIndex = require('../config/createKnowledgeIndex');
  logTest('createKnowledgeIndex module loads', typeof createKnowledgeIndex === 'object');
  logTest('createKnowledgeIndex exports createKnowledgeIndex fn', typeof createKnowledgeIndex.createKnowledgeIndex === 'function');
  logTest('createKnowledgeIndex exports getIndexInfo fn', typeof createKnowledgeIndex.getIndexInfo === 'function');
  logTest('createKnowledgeIndex exports deleteIndex fn', typeof createKnowledgeIndex.deleteIndex === 'function');
} catch (err) {
  logTest('createKnowledgeIndex module loads', false, err.message);
}

testKnowledgeToolHandler().then(() => {
  console.log('\n═══════════════════════════════════════');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log('═══════════════════════════════════════');

  if (testsFailed === 0) {
    console.log('\n🎉 All Knowledge Management Tests Passed!\n');
    console.log('📝 Note: Full integration tests require Azure AI Search to be configured.');
    console.log('   Run "npm run knowledge:create-index" after configuring Azure credentials.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
});
