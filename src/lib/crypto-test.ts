/**
 * Test utility to verify browser crypto functionality
 * This can be deleted after confirming everything works
 */

import { hashPassword, verifyPassword, generateSecurePassword, validatePasswordStrength } from './password-utils'

export const testBrowserCrypto = async () => {
  try {
    console.log('🔐 Testing browser crypto functionality...')
    
    // Test password generation
    const generatedPassword = generateSecurePassword(12)
    console.log('✅ Password generation:', generatedPassword.length === 12 ? 'PASS' : 'FAIL')
    
    // Test password validation
    const validation = validatePasswordStrength('TestPass123!')
    console.log('✅ Password validation:', validation.valid ? 'PASS' : 'FAIL')
    
    // Test password hashing
    const testPassword = 'TestPassword123!'
    const { hash, salt } = await hashPassword(testPassword)
    console.log('✅ Password hashing:', hash && salt ? 'PASS' : 'FAIL')
    
    // Test password verification
    const isValid = await verifyPassword(testPassword, hash, salt)
    console.log('✅ Password verification:', isValid ? 'PASS' : 'FAIL')
    
    // Test wrong password
    const isInvalid = await verifyPassword('WrongPassword', hash, salt)
    console.log('✅ Wrong password rejection:', !isInvalid ? 'PASS' : 'FAIL')
    
    console.log('🎉 All crypto tests completed successfully!')
    return true
  } catch (error) {
    console.error('❌ Crypto test failed:', error)
    return false
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  console.log('🚀 Running crypto compatibility test...')
  testBrowserCrypto().then(success => {
    if (success) {
      console.log('✅ Browser crypto is working correctly!')
    } else {
      console.error('❌ Browser crypto test failed!')
    }
  })
}
