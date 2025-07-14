// Test script to validate all PGP functionality
console.log('Starting comprehensive PGP testing...');

// Test 1: Check if OpenPGP is loaded
function testOpenPGPLoading() {
  console.log('Test 1: OpenPGP Library Loading');
  if (typeof window !== 'undefined' && window.openpgp) {
    console.log('✅ OpenPGP library is loaded');
    return true;
  } else {
    console.log('❌ OpenPGP library not found');
    return false;
  }
}

// Test 2: Test Key Generation
async function testKeyGeneration() {
  console.log('Test 2: Key Generation');
  try {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 2048,
      userIDs: [{ name: 'Test User', email: 'test@example.com' }],
      format: 'armored'
    });
    console.log('✅ Key generation successful');
    console.log('Public key length:', publicKey.length);
    console.log('Private key length:', privateKey.length);
    return { publicKey, privateKey };
  } catch (error) {
    console.log('❌ Key generation failed:', error.message);
    return null;
  }
}

// Test 3: Test Text Encryption/Decryption
async function testTextEncryption(keys) {
  console.log('Test 3: Text Encryption/Decryption');
  if (!keys) {
    console.log('❌ Cannot test encryption without keys');
    return false;
  }
  
  try {
    const message = 'Hello, this is a test message for PGP encryption!';
    const publicKey = await openpgp.readKey({ armoredKey: keys.publicKey });
    const privateKey = await openpgp.readPrivateKey({ armoredKey: keys.privateKey });
    
    // Encrypt
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: publicKey,
      format: 'armored'
    });
    console.log('✅ Text encryption successful');
    
    // Decrypt
    const decrypted = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: encrypted }),
      decryptionKeys: privateKey,
      format: 'utf8'
    });
    
    if (decrypted.data === message) {
      console.log('✅ Text decryption successful');
      return true;
    } else {
      console.log('❌ Decryption result mismatch');
      return false;
    }
  } catch (error) {
    console.log('❌ Text encryption/decryption failed:', error.message);
    return false;
  }
}

// Test 4: Test Key Validation
async function testKeyValidation(keys) {
  console.log('Test 4: Key Validation');
  if (!keys) {
    console.log('❌ Cannot test validation without keys');
    return false;
  }
  
  try {
    const publicKey = await openpgp.readKey({ armoredKey: keys.publicKey });
    const privateKey = await openpgp.readPrivateKey({ armoredKey: keys.privateKey });
    
    console.log('✅ Public key validation successful');
    console.log('✅ Private key validation successful');
    console.log('Key ID:', publicKey.getKeyIDs()[0].toHex());
    return true;
  } catch (error) {
    console.log('❌ Key validation failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting PGP Crypter Test Suite');
  console.log('=====================================');
  
  const results = [];
  
  // Test OpenPGP loading
  results.push(testOpenPGPLoading());
  
  // Test key generation
  const keys = await testKeyGeneration();
  results.push(keys !== null);
  
  // Test encryption/decryption
  results.push(await testTextEncryption(keys));
  
  // Test key validation
  results.push(await testKeyValidation(keys));
  
  console.log('=====================================');
  console.log('Test Results Summary:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! PGP Crypter is fully functional.');
  } else {
    console.log('⚠️ Some tests failed. Please check the logs above.');
  }
  
  return passed === total;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runPGPTests = runAllTests;
  console.log('Test suite loaded. Run window.runPGPTests() in browser console.');
} else {
  // Run in Node.js environment (not applicable here but good practice)
  runAllTests();
}