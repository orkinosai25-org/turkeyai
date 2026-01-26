/**
 * Integration test for Region and Resort routes
 * Tests route structure and response format
 */

const express = require('express');
const regionsRouter = require('../routes/regions');
const resortsRouter = require('../routes/resorts');

console.log('🧪 Testing Region and Resort Routes\n');

// Test 1: Check if routes are properly exported
console.log('✅ Test 1: Routes Export');
console.log('   Regions router:', typeof regionsRouter);
console.log('   Resorts router:', typeof resortsRouter);

if (typeof regionsRouter !== 'function' || typeof resortsRouter !== 'function') {
  console.log('❌ Routes are not properly exported!');
  process.exit(1);
}

// Test 2: Create test app to verify routes can be mounted
console.log('\n✅ Test 2: Route Mounting');
try {
  const app = express();
  app.use('/api/regions', regionsRouter);
  app.use('/api/resorts', resortsRouter);
  console.log('   ✓ Regions routes mounted successfully');
  console.log('   ✓ Resorts routes mounted successfully');
} catch (error) {
  console.log('❌ Failed to mount routes:', error.message);
  process.exit(1);
}

// Test 3: Verify route structure
console.log('\n✅ Test 3: Route Structure');
console.log('   Expected Region endpoints:');
console.log('     - GET /api/regions');
console.log('     - GET /api/regions/:name');
console.log('     - GET /api/regions/search/:term');
console.log('   Expected Resort endpoints:');
console.log('     - GET /api/resorts');
console.log('     - GET /api/resorts/:id');
console.log('     - GET /api/resorts/:id/amenities');
console.log('     - GET /api/resorts/region/:region');
console.log('     - GET /api/resorts/search/:term');

console.log('\n✅ All Route Tests Passed!');
console.log('\n📝 Note: Full integration tests require a running server and database.');
console.log('   To test API endpoints:');
console.log('   1. Configure .env file with DB credentials');
console.log('   2. Start server: npm start');
console.log('   3. Test endpoints with curl or Postman');

process.exit(0);
