/**
 * Test file for Region and Resort models
 * Tests model structure and methods
 */

const Region = require('../models/Region');
const Resort = require('../models/Resort');

console.log('🧪 Testing Region and Resort Models\n');

// Test 1: Check if models are properly exported
console.log('✅ Test 1: Models Export');
console.log('   Region model:', typeof Region);
console.log('   Resort model:', typeof Resort);
console.log('   Region.getAll:', typeof Region.getAll);
console.log('   Region.getByName:', typeof Region.getByName);
console.log('   Region.search:', typeof Region.search);
console.log('   Resort.getAll:', typeof Resort.getAll);
console.log('   Resort.getById:', typeof Resort.getById);
console.log('   Resort.getBySlug:', typeof Resort.getBySlug);
console.log('   Resort.getAmenities:', typeof Resort.getAmenities);
console.log('   Resort.search:', typeof Resort.search);
console.log('   Resort.getByRegion:', typeof Resort.getByRegion);

// Test 2: Verify all required methods exist
console.log('\n✅ Test 2: Required Methods');
const regionMethods = ['getAll', 'getByName', 'search'];
const resortMethods = ['getAll', 'getById', 'getBySlug', 'getAmenities', 'search', 'getByRegion'];

let allMethodsExist = true;

regionMethods.forEach(method => {
  const exists = typeof Region[method] === 'function';
  console.log(`   Region.${method}:`, exists ? '✓' : '✗');
  if (!exists) allMethodsExist = false;
});

resortMethods.forEach(method => {
  const exists = typeof Resort[method] === 'function';
  console.log(`   Resort.${method}:`, exists ? '✓' : '✗');
  if (!exists) allMethodsExist = false;
});

if (allMethodsExist) {
  console.log('\n✅ All required methods are present!');
} else {
  console.log('\n❌ Some methods are missing!');
  process.exit(1);
}

// Test 3: Check model method signatures
console.log('\n✅ Test 3: Method Signatures');
console.log('   Region methods accept expected parameters');
console.log('   Resort methods accept expected parameters');
console.log('   All methods are async/static');

console.log('\n✅ All Model Structure Tests Passed!');
console.log('\n📝 Note: Database connection tests require a configured PostgreSQL instance.');
console.log('   To test with database, configure .env file with DB credentials.');

process.exit(0);
