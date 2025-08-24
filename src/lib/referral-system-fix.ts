/**
 * Referral System Diagnosis and Fix Utility
 * This will check if the required database functions exist and provide helpful error messages
 */

import { supabase } from './supabase'

export const diagnoseReferralSystem = async () => {
  try {
    console.log('🔍 Diagnosing referral system...')

    // Simple test - try to call the function directly instead of checking information_schema
    try {
      const { data: testData, error: testError } = await supabase.rpc('process_referral_rewards', {
        new_active_user_id: '00000000-0000-0000-0000-000000000000', // fake UUID for test
        trigger_type_param: 'subscription_activation'
      })

      if (testError) {
        // If function doesn't exist, this will fail
        if (testError.message?.includes('function') && testError.message?.includes('does not exist')) {
          console.error('❌ process_referral_rewards function not found')
          return {
            status: 'missing_function',
            message: 'The process_referral_rewards database function is missing.',
            solution: 'Function needs to be created in the database.'
          }
        }

        console.log('⚠️ Function exists but has issues:', testError)
        return {
          status: 'function_error',
          message: `The process_referral_rewards function has an error: ${testError.message}`,
          error: testError,
          solution: 'Check if the function implementation is correct and all required tables exist.'
        }
      }

      console.log('✅ process_referral_rewards function is working')
      return {
        status: 'working',
        message: 'Referral system is functional',
        testResult: testData
      }

    } catch (callError: any) {
      console.error('❌ Error calling function:', callError)
      return {
        status: 'call_error',
        message: 'Cannot execute the process_referral_rewards function',
        error: callError,
        solution: 'Check database permissions and function implementation.'
      }
    }

  } catch (error: any) {
    console.error('❌ Diagnosis failed:', error)
    return {
      status: 'diagnosis_failed',
      message: 'Could not diagnose referral system',
      error
    }
  }
}

// Enhanced processReferralRewards with better error handling and fallback
export const safeProcessReferralRewards = async (
  newActiveUserId: string,
  trigger: 'subscription_activation' = 'subscription_activation'
): Promise<boolean> => {
  try {
    console.log(`🔄 Starting safe referral rewards processing for user: ${newActiveUserId}`)
    
    // First diagnose the system
    const diagnosis = await diagnoseReferralSystem()
    
    if (diagnosis.status !== 'working') {
      console.error('❌ Referral system not ready:', diagnosis.message)
      console.error('💡 Solution:', diagnosis.solution)
      
      // For now, log the issue but don't fail the parent operation
      console.log('⚠️ Skipping referral rewards due to system issues')
      return false
    }
    
    // If system is working, proceed with normal processing
    const { data, error } = await supabase.rpc('process_referral_rewards', {
      new_active_user_id: newActiveUserId,
      trigger_type_param: trigger
    })
    
    if (error) {
      console.error('❌ Error calling process_referral_rewards:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return false
    }
    
    if (data) {
      console.log('✅ Referral rewards processed successfully:', data)
      if (data.total_distributed) {
        console.log(`💰 Total distributed: ₹${data.total_distributed}`)
      }
      if (data.levels_processed) {
        console.log(`📊 Levels processed: ${data.levels_processed}`)
      }
    }
    
    return true
    
  } catch (error: any) {
    console.error('❌ Safe referral processing failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return false
  }
}

// Auto-run diagnosis removed to prevent console errors
// Use diagnoseReferralSystem() manually when needed
