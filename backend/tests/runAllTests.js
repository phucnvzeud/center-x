// Script to run all tests
require('dotenv').config();

// Ensure we're in test mode
process.env.NODE_ENV = 'test';

const { execSync } = require('child_process');

console.log('====== Running Database Tests ======');
try {
  execSync('node tests/database.test.js', { stdio: 'inherit' });
  console.log('✅ Database tests passed!');
} catch (error) {
  console.error('❌ Database tests failed!');
  process.exit(1);
}

console.log('\n====== Running API Tests ======');
try {
  execSync('node tests/api.test.js', { stdio: 'inherit' });
  console.log('✅ API tests passed!');
} catch (error) {
  console.error('❌ API tests failed!');
  process.exit(1);
}

console.log('\n✨ All tests completed successfully! ✨'); 