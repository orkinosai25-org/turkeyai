/**
 * Test AI Agent Configuration and Tools
 * 
 * This test verifies that the agent configuration and tool handlers
 * are properly structured and functional.
 */

const { getAgentPrompt, getAgentTools, getToolConfig } = require('../config/agentConfig');
const { searchResorts, getResort, compareResorts, buildItinerary, executeTool } = require('../config/agentTools');

console.log('🧪 Testing AI Agent Configuration and Tools\n');

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

// Test 1: Agent Configuration Exports
console.log('Test 1: Agent Configuration Exports');
const prompt = getAgentPrompt();
const tools = getAgentTools();
const toolConfig = getToolConfig();

logTest('getAgentPrompt returns string', typeof prompt === 'string' && prompt.length > 0);
logTest('Prompt includes TürkiyeAI', prompt.includes('TürkiyeAI'));
logTest('Prompt includes OrkinosAI', prompt.includes('OrkinosAI'));
logTest('getAgentTools returns array', Array.isArray(tools));
logTest('Tools array has 4 tools', tools.length === 4);
logTest('getToolConfig returns object', typeof toolConfig === 'object');
console.log('');

// Test 2: Tool Definitions Structure
console.log('Test 2: Tool Definitions Structure');
const expectedTools = ['searchResorts', 'getResort', 'compareResorts', 'buildItinerary'];
const actualToolNames = tools.map(t => t.function.name);

expectedTools.forEach(toolName => {
  const tool = tools.find(t => t.function.name === toolName);
  logTest(`${toolName} is defined`, !!tool);
  if (tool) {
    logTest(`${toolName} has description`, !!tool.function.description);
    logTest(`${toolName} has parameters`, !!tool.function.parameters);
  }
});
console.log('');

// Test 3: Tool Parameter Schemas
console.log('Test 3: Tool Parameter Schemas');
const searchTool = tools.find(t => t.function.name === 'searchResorts');
logTest('searchResorts has region parameter', 
  searchTool?.function.parameters.properties.region !== undefined);
logTest('searchResorts region has enum', 
  Array.isArray(searchTool?.function.parameters.properties.region.enum));

const getResortTool = tools.find(t => t.function.name === 'getResort');
logTest('getResort requires resort_id', 
  getResortTool?.function.parameters.required.includes('resort_id'));

const compareTool = tools.find(t => t.function.name === 'compareResorts');
logTest('compareResorts has resort_ids array', 
  compareTool?.function.parameters.properties.resort_ids?.type === 'array');

const itineraryTool = tools.find(t => t.function.name === 'buildItinerary');
logTest('buildItinerary has duration_days', 
  itineraryTool?.function.parameters.properties.duration_days !== undefined);
console.log('');

// Test 4: Tool Handler Functions
console.log('Test 4: Tool Handler Functions');
logTest('searchResorts is a function', typeof searchResorts === 'function');
logTest('getResort is a function', typeof getResort === 'function');
logTest('compareResorts is a function', typeof compareResorts === 'function');
logTest('buildItinerary is a function', typeof buildItinerary === 'function');
logTest('executeTool is a function', typeof executeTool === 'function');
console.log('');

// Test 5: Tool Execution (Mock Tests - No DB)
console.log('Test 5: Tool Handler Error Handling');

async function testToolHandlers() {
  try {
    // Test searchResorts with empty params
    const searchResult = await searchResorts({});
    logTest('searchResorts returns object', typeof searchResult === 'object');
    logTest('searchResorts has success field', 'success' in searchResult);

    // Test getResort without ID
    const getResult = await getResort({});
    logTest('getResort handles missing ID', !getResult.success && getResult.error);

    // Test compareResorts with invalid input
    const compareResult = await compareResorts({ resort_ids: ['1'] });
    logTest('compareResorts validates minimum resorts', 
      !compareResult.success && compareResult.error.includes('At least 2'));

    // Test compareResorts with too many
    const compareTooMany = await compareResorts({ resort_ids: ['1', '2', '3', '4', '5', '6'] });
    logTest('compareResorts validates maximum resorts', 
      !compareTooMany.success && compareTooMany.error.includes('Maximum 5'));

    // Test buildItinerary without required params
    const itineraryResult = await buildItinerary({});
    logTest('buildItinerary validates required params', 
      !itineraryResult.success && itineraryResult.error.includes('required'));

    // Test buildItinerary with valid params
    const validItinerary = await buildItinerary({
      duration_days: 5,
      primary_region: 'Bodrum',
      traveler_profile: 'family',
      interests: ['beach', 'culture']
    });
    logTest('buildItinerary generates itinerary', 
      validItinerary.success && Array.isArray(validItinerary.itinerary?.daily_plan));
    logTest('buildItinerary creates correct number of days', 
      validItinerary.itinerary?.daily_plan.length === 5);

    // Test executeTool with valid function
    const execResult = await executeTool('buildItinerary', {
      duration_days: 3,
      primary_region: 'Antalya',
      traveler_profile: 'couple'
    });
    logTest('executeTool routes to correct handler', execResult.success);

    // Test executeTool with invalid function
    const invalidExec = await executeTool('nonExistentTool', {});
    logTest('executeTool handles unknown tools', !invalidExec.success);

  } catch (error) {
    console.log(`❌ Error during tool handler tests: ${error.message}`);
    testsFailed++;
  }
}

// Run async tests
testToolHandlers().then(() => {
  console.log('\n═══════════════════════════════════════');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log('═══════════════════════════════════════');

  if (testsFailed === 0) {
    console.log('\n🎉 All AI Agent Configuration Tests Passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
});
