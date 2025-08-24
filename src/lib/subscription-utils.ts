import { supabase } from './supabase'
import { SubscriptionPlan, SubscriptionRequest } from './supabase'

// Get subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price')

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching subscription plans:', error)
    throw error
  }
}

// Create subscription request
export const createSubscriptionRequest = async (
  userId: string,
  amount: number,
  upiTransactionId: string,
  paymentProofFile?: File
): Promise<SubscriptionRequest> => {
  try {
    let paymentProofUrl = null
    let paymentProofFilename = null

    // Upload payment proof if provided
    if (paymentProofFile) {
      try {
        const fileExt = paymentProofFile.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProofFile)

        if (uploadError) {
          console.warn('Failed to upload payment proof:', uploadError.message)
        } else {
          paymentProofUrl = uploadData.path
          paymentProofFilename = paymentProofFile.name
        }
      } catch (uploadError) {
        console.warn('Error uploading payment proof:', uploadError)
      }
    }

    const { data, error } = await supabase
      .from('subscription_requests')
      .insert({
        user_id: userId,
        amount,
        upi_transaction_id: upiTransactionId,
        payment_proof_url: paymentProofUrl,
        payment_proof_filename: paymentProofFilename,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Error creating subscription request:', error)
    throw error
  }
}

// Get user's subscription requests
export const getUserSubscriptionRequests = async (userId: string): Promise<SubscriptionRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching user subscription requests:', error)
    return []
  }
}

// Check user subscription status
export const checkUserSubscriptionStatus = async (userId: string): Promise<'active' | 'inactive'> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_status')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data?.subscription_status || 'inactive'
  } catch (error: any) {
    console.error('Error checking subscription status:', error)
    return 'inactive'
  }
}

// Update user subscription status (admin only)
export const updateUserSubscriptionStatus = async (
  userId: string,
  status: 'active' | 'inactive'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error: any) {
    console.error('Error updating subscription status:', error)
    throw error
  }
}
