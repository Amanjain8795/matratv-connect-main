/**
 * Debug utility for admin authentication
 * This will help us diagnose the login issue
 */

import { supabase } from './supabase'
import { hashPassword, verifyPassword } from './password-utils'

const DEFAULT_PASSWORD = 'Admin@123!'

export const debugAdminAuth = async (email: string, password: string = DEFAULT_PASSWORD) => {
  try {
    console.log('🔍 DEBUG: Starting admin authentication debug for:', email)
    
    // Step 1: Check if admin exists
    const { data: admin, error: fetchError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()
    
    if (fetchError) {
      console.error('❌ DEBUG: Admin fetch error:', fetchError)
      return { success: false, error: 'Admin not found' }
    }
    
    if (!admin) {
      console.error('❌ DEBUG: No admin found with email:', email)
      return { success: false, error: 'No admin found' }
    }
    
    console.log('✅ DEBUG: Admin found:', {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      is_active: admin.is_active,
      has_password_hash: !!admin.password_hash,
      has_password_salt: !!admin.password_salt,
      password_hash_preview: admin.password_hash?.substring(0, 20) + '...',
      salt_preview: admin.password_salt?.substring(0, 10) + '...'
    })
    
    // Step 2: Check password fields
    if (!admin.password_hash || !admin.password_salt) {
      console.error('❌ DEBUG: Missing password fields')
      return { success: false, error: 'Missing password data' }
    }
    
    // Step 3: Test password verification
    console.log('🔐 DEBUG: Testing password verification...')
    console.log('🔐 DEBUG: Input password:', password)
    console.log('🔐 DEBUG: Stored hash format:', admin.password_hash.split(':').length === 3 ? 'Valid format' : 'Invalid format')
    
    try {
      const isValid = await verifyPassword(password, admin.password_hash, admin.password_salt)
      console.log('🔐 DEBUG: Password verification result:', isValid)
      
      if (isValid) {
        console.log('✅ DEBUG: Authentication successful!')
        return { success: true, admin }
      } else {
        console.log('❌ DEBUG: Password verification failed')
        
        // Let's try to regenerate the password hash and see if it matches
        console.log('🔄 DEBUG: Testing hash generation...')
        const { hash: newHash, salt: newSalt } = await hashPassword(password)
        console.log('🔐 DEBUG: New hash format:', newHash.split(':').length === 3 ? 'Valid format' : 'Invalid format')
        
        // Test verification with new hash
        const newVerification = await verifyPassword(password, newHash, newSalt)
        console.log('🔐 DEBUG: New hash verification:', newVerification)
        
        return { success: false, error: 'Password verification failed', debugging: {
          originalVerification: isValid,
          newHashGeneration: newVerification,
          originalHash: admin.password_hash.substring(0, 30) + '...',
          newHash: newHash.substring(0, 30) + '...'
        }}
      }
    } catch (verifyError) {
      console.error('❌ DEBUG: Password verification threw error:', verifyError)
      return { success: false, error: 'Verification error', verifyError }
    }
    
  } catch (error) {
    console.error('❌ DEBUG: Overall debug error:', error)
    return { success: false, error: 'Debug failed', originalError: error }
  }
}

// Fix admin password by regenerating proper hash
export const fixAdminPassword = async (email: string, password: string = DEFAULT_PASSWORD) => {
  try {
    console.log('🔧 FIXING: Admin password for:', email)
    
    // Generate proper hash
    const { hash, salt } = await hashPassword(password)
    console.log('✅ FIXING: Generated new hash format:', hash.split(':').length === 3 ? 'Valid' : 'Invalid')
    
    // Update the admin
    const { error } = await supabase
      .from('admins')
      .update({
        password_hash: hash,
        password_salt: salt,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
    
    if (error) {
      console.error('❌ FIXING: Update failed:', error)
      return false
    }
    
    console.log('✅ FIXING: Password updated successfully')
    
    // Test the fix
    const testResult = await debugAdminAuth(email, password)
    console.log('🧪 FIXING: Test result:', testResult.success ? 'SUCCESS' : 'FAILED')
    
    return testResult.success
  } catch (error) {
    console.error('❌ FIXING: Fix failed:', error)
    return false
  }
}

// Auto-run debug removed to prevent console errors
// Use debugAdminAuth() manually when needed
