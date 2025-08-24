/**
 * Admin Password Reset Utility
 * Use this to reset admin passwords to the default "Admin@123!" password
 */

import { supabase } from './supabase'
import { hashPassword } from './password-utils'

const DEFAULT_PASSWORD = 'Admin@123!'

export const resetAdminPasswords = async () => {
  try {
    console.log('🔐 Starting admin password reset...')
    
    // Get all admins with placeholder or missing passwords
    const { data: admins, error: fetchError } = await supabase
      .from('admins')
      .select('id, email, password_hash, password_salt')
      .or('password_hash.is.null,password_hash.like.TEMP_HASH_%')
    
    if (fetchError) {
      throw new Error(`Failed to fetch admins: ${fetchError.message}`)
    }
    
    if (!admins || admins.length === 0) {
      console.log('✅ No admins need password reset')
      return
    }
    
    console.log(`📝 Found ${admins.length} admins that need password reset`)
    
    // Reset password for each admin
    for (const admin of admins) {
      try {
        console.log(`🔄 Resetting password for: ${admin.email}`)
        
        // Generate proper password hash
        const { hash, salt } = await hashPassword(DEFAULT_PASSWORD)
        
        // Update the admin record
        const { error: updateError } = await supabase
          .from('admins')
          .update({
            password_hash: hash,
            password_salt: salt,
            updated_at: new Date().toISOString()
          })
          .eq('id', admin.id)
        
        if (updateError) {
          console.error(`❌ Failed to update ${admin.email}:`, updateError.message)
        } else {
          console.log(`✅ Password reset successful for: ${admin.email}`)
        }
      } catch (error) {
        console.error(`❌ Error processing ${admin.email}:`, error)
      }
    }
    
    console.log('🎉 Admin password reset completed!')
    console.log(`📧 All admins can now login with password: ${DEFAULT_PASSWORD}`)
    console.log('⚠️  Please ask admins to change their passwords after first login')
    
    return true
  } catch (error) {
    console.error('❌ Admin password reset failed:', error)
    return false
  }
}

// Function to test a specific admin login
export const testAdminLogin = async (email: string, password: string = DEFAULT_PASSWORD) => {
  try {
    const { authenticateAdmin } = await import('./supabase')
    const admin = await authenticateAdmin(email, password)
    console.log(`✅ Login test successful for: ${email}`)
    return admin
  } catch (error) {
    console.error(`❌ Login test failed for ${email}:`, error)
    return null
  }
}

// Auto-run password reset in development mode
if (import.meta.env.DEV) {
  console.log('🚀 Checking admin password status...')
  resetAdminPasswords().then(success => {
    if (success) {
      console.log('✅ Admin passwords are ready!')
    }
  })
}
