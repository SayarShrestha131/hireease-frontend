// Simple test to verify config loads without errors
console.log('Testing config loading...');

try {
  console.log('1. Testing api config import...');
  const config = require('./src/config/api.ts');
  console.log('✅ Config imported successfully');
  console.log('   baseURL:', config.default.baseURL);
  console.log('   timeout:', config.default.timeout);
  
  console.log('\n2. Testing apiClient import...');
  const apiClient = require('./src/services/apiClient.ts');
  console.log('✅ API Client imported successfully');
  
  console.log('\n3. All imports successful!');
  console.log('   If you see this, the module loading is working correctly.');
  console.log('   The issue might be in React Native runtime initialization.');
  
} catch (error) {
  console.error('❌ Error during import:', error);
  console.error('   Stack:', error.stack);
}
