/**
 * Test AI Agent Configuration and Tools
 * 
 * This test verifies that the agent configuration and tool handlers
 * are properly structured and functional.
 */

const { getAgentPrompt, getAgentTools, getToolConfig } = require('../config/agentConfig');
const { searchResorts, getResort, compareResorts, buildItinerary, getResortDeepDive, getNearbyResorts, searchExcursions, searchPackages, getTransferOptions, searchCarRentals, searchCruises, searchPrivateAviation, searchYachts, searchKnowledgeBase, analyzeVideo, translateText, analyzeHotelImage, analyzeReviewSentiment, executeTool } = require('../config/agentTools');

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

const expectedTools = [
  'searchResorts', 'getResort', 'compareResorts', 'buildItinerary',
  'getResortDeepDive', 'getNearbyResorts', 'searchExcursions', 'searchPackages', 'getTransferOptions',
  'searchCarRentals', 'searchCruises', 'searchPrivateAviation', 'searchYachts', 'searchKnowledgeBase',
  'analyzeVideo', 'translateText', 'analyzeHotelImage', 'analyzeReviewSentiment'
];

logTest('getAgentPrompt returns string', typeof prompt === 'string' && prompt.length > 0);
logTest('Prompt includes TürkiyeAI', prompt.includes('TürkiyeAI'));
logTest('Prompt includes OrkinosAI', prompt.includes('OrkinosAI'));
logTest('getAgentTools returns array', Array.isArray(tools));
logTest('Tools array has 18 tools', tools.length === expectedTools.length);
logTest('getToolConfig returns object', typeof toolConfig === 'object');
console.log('');

// Test 2: Tool Definitions Structure
console.log('Test 2: Tool Definitions Structure');
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

const deepDiveTool = tools.find(t => t.function.name === 'getResortDeepDive');
logTest('getResortDeepDive requires resort_id',
  deepDiveTool?.function.parameters.required.includes('resort_id'));

const nearbyTool = tools.find(t => t.function.name === 'getNearbyResorts');
logTest('getNearbyResorts requires resort_id',
  nearbyTool?.function.parameters.required.includes('resort_id'));

const transferTool = tools.find(t => t.function.name === 'getTransferOptions');
logTest('getTransferOptions requires destination',
  transferTool?.function.parameters.required.includes('destination'));
console.log('');

// Test 4: Tool Handler Functions
console.log('Test 4: Tool Handler Functions');
logTest('searchResorts is a function', typeof searchResorts === 'function');
logTest('getResort is a function', typeof getResort === 'function');
logTest('compareResorts is a function', typeof compareResorts === 'function');
logTest('buildItinerary is a function', typeof buildItinerary === 'function');
logTest('getResortDeepDive is a function', typeof getResortDeepDive === 'function');
logTest('getNearbyResorts is a function', typeof getNearbyResorts === 'function');
logTest('searchExcursions is a function', typeof searchExcursions === 'function');
logTest('searchPackages is a function', typeof searchPackages === 'function');
logTest('getTransferOptions is a function', typeof getTransferOptions === 'function');
logTest('searchCarRentals is a function', typeof searchCarRentals === 'function');
logTest('searchCruises is a function', typeof searchCruises === 'function');
logTest('searchPrivateAviation is a function', typeof searchPrivateAviation === 'function');
logTest('searchYachts is a function', typeof searchYachts === 'function');
logTest('searchKnowledgeBase is a function', typeof searchKnowledgeBase === 'function');
logTest('analyzeVideo is a function', typeof analyzeVideo === 'function');
logTest('translateText is a function', typeof translateText === 'function');
logTest('analyzeHotelImage is a function', typeof analyzeHotelImage === 'function');
logTest('analyzeReviewSentiment is a function', typeof analyzeReviewSentiment === 'function');
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

    // Test getResortDeepDive without ID
    const deepDiveResult = await getResortDeepDive({});
    logTest('getResortDeepDive handles missing resort_id', !deepDiveResult.success && deepDiveResult.error);

    // Test getNearbyResorts without ID
    const nearbyResult = await getNearbyResorts({});
    logTest('getNearbyResorts handles missing resort_id', !nearbyResult.success && nearbyResult.error);

    // Test searchExcursions with destination filter
    const excResult = await searchExcursions({ destination: 'Istanbul' });
    logTest('searchExcursions returns results for Istanbul', excResult.success && excResult.count > 0);

    // Test searchExcursions with unknown destination returns empty
    const excEmpty = await searchExcursions({ destination: 'NonExistent' });
    logTest('searchExcursions returns 0 for unknown destination', excEmpty.success && excEmpty.count === 0);

    // Test searchPackages with destination
    const pkgResult = await searchPackages({ destination: 'Bodrum' });
    logTest('searchPackages returns Bodrum packages', pkgResult.success && pkgResult.count > 0);

    // Test getTransferOptions with valid destination
    const transferResult = await getTransferOptions({ destination: 'Bodrum' });
    logTest('getTransferOptions returns Bodrum transfers', transferResult.success && transferResult.transfer_options.length > 0);

    // Test getTransferOptions with unknown destination
    const transferUnknown = await getTransferOptions({ destination: 'Nowhere' });
    logTest('getTransferOptions handles unknown destination', !transferUnknown.success);

    // Test executeTool with valid function
    const execResult = await executeTool('buildItinerary', {
      duration_days: 3,
      primary_region: 'Antalya',
      traveler_profile: 'couple'
    });
    logTest('executeTool routes to correct handler', execResult.success);

    // Test executeTool with new tool
    const excExec = await executeTool('searchExcursions', { destination: 'Marmaris' });
    logTest('executeTool routes searchExcursions correctly', excExec.success);

    // Test searchCarRentals - no filters returns all
    const carAll = await searchCarRentals({});
    logTest('searchCarRentals returns all categories', carAll.success && carAll.count > 0);

    // Test searchCarRentals - filter by airport
    const carAYT = await searchCarRentals({ airport: 'AYT' });
    logTest('searchCarRentals filters by airport AYT', carAYT.success && carAYT.count > 0);

    // Test searchCarRentals - filter by category
    const carSUV = await searchCarRentals({ category: 'SUV' });
    logTest('searchCarRentals filters by SUV category', carSUV.success && carSUV.count > 0);

    // Test searchCarRentals - filter by seats
    const carSeats = await searchCarRentals({ seats_min: 7 });
    logTest('searchCarRentals filters by minimum seats', carSeats.success && carSeats.cars.every(c => c.seats >= 7));

    // Test searchCruises - no filters returns all
    const cruiseAll = await searchCruises({});
    logTest('searchCruises returns all cruises', cruiseAll.success && cruiseAll.count > 0);

    // Test searchCruises - filter by departure port
    const cruiseIst = await searchCruises({ departure_port: 'Istanbul' });
    logTest('searchCruises filters by Istanbul departure', cruiseIst.success && cruiseIst.count > 0);

    // Test searchCruises - filter by ship type
    const cruiseGulet = await searchCruises({ ship_type: 'Traditional Gulet' });
    logTest('searchCruises filters by gulet ship type', cruiseGulet.success && cruiseGulet.count > 0);

    // Test searchPrivateAviation - no filters returns all
    const pavAll = await searchPrivateAviation({});
    logTest('searchPrivateAviation returns all aircraft types', pavAll.success && pavAll.count > 0);

    // Test searchPrivateAviation - filter by aircraft type
    const pavJet = await searchPrivateAviation({ aircraft_type: 'Light Jet' });
    logTest('searchPrivateAviation filters by Light Jet', pavJet.success && pavJet.count > 0);

    // Test searchPrivateAviation - filter by passenger min
    const pavLarge = await searchPrivateAviation({ max_passengers_min: 10 });
    logTest('searchPrivateAviation filters by passenger capacity', pavLarge.success && pavLarge.private_aviation.every(a => a.max_passengers >= 10));

    // Test searchYachts - no filters returns all
    const yachtAll = await searchYachts({});
    logTest('searchYachts returns all vessels', yachtAll.success && yachtAll.count > 0);

    // Test searchYachts - filter by vessel type
    const yachtGulet = await searchYachts({ vessel_type: 'Gulet' });
    logTest('searchYachts filters by Gulet type', yachtGulet.success && yachtGulet.count > 0);

    // Test searchYachts - filter by home port
    const yachtBodrum = await searchYachts({ home_port: 'Bodrum' });
    logTest('searchYachts filters by Bodrum home port', yachtBodrum.success && yachtBodrum.count > 0);

    // Test executeTool routes to new car rental handler
    const carExec = await executeTool('searchCarRentals', { airport: 'BJV' });
    logTest('executeTool routes searchCarRentals correctly', carExec.success);

    // Test executeTool routes to new cruise handler
    const cruiseExec = await executeTool('searchCruises', {});
    logTest('executeTool routes searchCruises correctly', cruiseExec.success);

    // Test executeTool routes to private aviation handler
    const pavExec = await executeTool('searchPrivateAviation', {});
    logTest('executeTool routes searchPrivateAviation correctly', pavExec.success);

    // Test executeTool routes to yacht handler
    const yachtExec = await executeTool('searchYachts', { vessel_type: 'Motor Yacht' });
    logTest('executeTool routes searchYachts correctly', yachtExec.success);

    // Test searchKnowledgeBase - missing query returns error
    const kbMissing = await searchKnowledgeBase({});
    logTest('searchKnowledgeBase validates missing query', !kbMissing.success && kbMissing.error);

    // Test searchKnowledgeBase - Azure Search unavailable returns graceful failure
    const kbResult = await searchKnowledgeBase({ query: 'Bodrum beach bars', location_tag: 'Bodrum' });
    logTest('searchKnowledgeBase returns object with success field', typeof kbResult === 'object' && 'success' in kbResult);

    // Test executeTool routes to knowledge base handler
    const kbExec = await executeTool('searchKnowledgeBase', { query: 'Gumbet restaurants' });
    logTest('executeTool routes searchKnowledgeBase correctly', typeof kbExec === 'object' && 'success' in kbExec);

    // Test analyzeVideo - missing URL returns error
    const videoMissing = await analyzeVideo({});
    logTest('analyzeVideo validates missing video_url', !videoMissing.success && videoMissing.error);

    // Test analyzeVideo - unavailable service returns graceful failure
    const videoResult = await analyzeVideo({ video_url: 'https://www.youtube.com/watch?v=test', language: 'tr' });
    logTest('analyzeVideo returns object with success field', typeof videoResult === 'object' && 'success' in videoResult);

    // Test translateText - missing text returns error
    const transNoText = await translateText({});
    logTest('translateText validates missing text', !transNoText.success && transNoText.error);

    // Test translateText - missing to returns error
    const transNoTo = await translateText({ text: 'Merhaba' });
    logTest('translateText validates missing target language', !transNoTo.success && transNoTo.error);

    // Test translateText - unavailable service returns graceful failure
    const transResult = await translateText({ text: 'Merhaba', to: 'en' });
    logTest('translateText returns object with success field', typeof transResult === 'object' && 'success' in transResult);

    // Test analyzeHotelImage - missing URL returns error
    const imgMissing = await analyzeHotelImage({});
    logTest('analyzeHotelImage validates missing image_url', !imgMissing.success && imgMissing.error);

    // Test analyzeHotelImage - unavailable service returns graceful failure
    const imgResult = await analyzeHotelImage({ image_url: 'https://example.com/hotel.jpg' });
    logTest('analyzeHotelImage returns object with success field', typeof imgResult === 'object' && 'success' in imgResult);

    // Test analyzeReviewSentiment - missing reviews returns error
    const sentMissing = await analyzeReviewSentiment({});
    logTest('analyzeReviewSentiment validates missing reviews', !sentMissing.success && sentMissing.error);

    // Test analyzeReviewSentiment - empty array returns error
    const sentEmpty = await analyzeReviewSentiment({ reviews: [] });
    logTest('analyzeReviewSentiment validates empty reviews array', !sentEmpty.success && sentEmpty.error);

    // Test analyzeReviewSentiment - unavailable service returns graceful failure
    const sentResult = await analyzeReviewSentiment({ reviews: ['Great hotel!', 'Amazing view.'] });
    logTest('analyzeReviewSentiment returns object with success field', typeof sentResult === 'object' && 'success' in sentResult);

    // Test executeTool routes to new handlers
    const videoExec = await executeTool('analyzeVideo', { video_url: 'https://example.com/video' });
    logTest('executeTool routes analyzeVideo correctly', typeof videoExec === 'object' && 'success' in videoExec);

    const transExec = await executeTool('translateText', { text: 'Bodrum', to: 'en' });
    logTest('executeTool routes translateText correctly', typeof transExec === 'object' && 'success' in transExec);

    const imgExec = await executeTool('analyzeHotelImage', { image_url: 'https://example.com/img.jpg' });
    logTest('executeTool routes analyzeHotelImage correctly', typeof imgExec === 'object' && 'success' in imgExec);

    const sentExec = await executeTool('analyzeReviewSentiment', { reviews: ['Good!'] });
    logTest('executeTool routes analyzeReviewSentiment correctly', typeof sentExec === 'object' && 'success' in sentExec);

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
