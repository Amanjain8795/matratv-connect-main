import { supabase } from './supabase'
import { hasAdminAccess, supabaseAdmin } from './supabase-admin'

// Default reward structure for 7 levels (fallback values)
export const DEFAULT_REFERRAL_REWARD_CONFIG = {
  level1: 200,  // Direct referrer gets ₹200
  level2: 15,   // Level 2 gets ₹15
  level3: 11,   // Level 3 gets ₹11
  level4: 9,    // Level 4 gets ₹9
  level5: 7,    // Level 5 gets ₹7
  level6: 5,    // Level 6 gets ₹5
  level7: 3,    // Level 7 gets ₹3
}

// Load reward configuration from database or use defaults
export const loadRewardConfig = async (): Promise<typeof DEFAULT_REFERRAL_REWARD_CONFIG> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'referral_reward_config')
      .single()

    if (error || !data) {
      console.log('Using default reward configuration')
      return DEFAULT_REFERRAL_REWARD_CONFIG
    }

    // Merge database config with defaults to ensure all levels exist
    return { ...DEFAULT_REFERRAL_REWARD_CONFIG, ...data.value }
  } catch (error) {
    console.error('Error loading reward config:', error)
    return DEFAULT_REFERRAL_REWARD_CONFIG
  }
}

// Current reward configuration (will be loaded from database)
export let REFERRAL_REWARD_CONFIG = DEFAULT_REFERRAL_REWARD_CONFIG

export interface ReferralChainUser {
  user_id: string
  profile_id: string
  full_name: string
  referral_code: string
  level: number
  reward_amount: number
}

// Get the referral chain up to 7 levels
export const getReferralChain = async (userId: string): Promise<ReferralChainUser[]> => {
  try {
    // Load current reward configuration
    const rewardConfig = await loadRewardConfig()
    const chain: ReferralChainUser[] = []
    let currentUserId = userId

    for (let level = 1; level <= 7; level++) {
      // Get current user's profile to find who referred them
      const { data: currentProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, referral_code, referred_by')
        .eq('user_id', currentUserId)
        .single()

      if (profileError || !currentProfile || !currentProfile.referred_by) {
        // No more referrers in the chain, stop here
        break
      }

      // Get the referrer's details
      const { data: referrerProfile, error: referrerError } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, referral_code')
        .eq('id', currentProfile.referred_by)
        .single()

      if (referrerError || !referrerProfile) {
        // Referrer not found, stop the chain
        break
      }

      // Get reward amount for this level
      const rewardKey = `level${level}` as keyof typeof DEFAULT_REFERRAL_REWARD_CONFIG
      const rewardAmount = rewardConfig[rewardKey]

      // Add to chain
      chain.push({
        user_id: referrerProfile.user_id,
        profile_id: referrerProfile.id,
        full_name: referrerProfile.full_name || 'Unknown User',
        referral_code: referrerProfile.referral_code,
        level,
        reward_amount: rewardAmount
      })

      // Move up the chain
      currentUserId = referrerProfile.user_id
    }

    return chain
  } catch (error: any) {
    console.error('Error getting referral chain:', error)
    return []
  }
}

// Process rewards for the entire referral chain
export const processReferralRewards = async (
  newActiveUserId: string,
  trigger: 'subscription_activation' = 'subscription_activation'
): Promise<void> => {
  try {
    console.log(`🔄 Processing referral rewards for user: ${newActiveUserId}, trigger: ${trigger}`)

    // Use the new database function for processing rewards
    const { data, error } = await supabase.rpc('process_referral_rewards', {
      new_active_user_id: newActiveUserId,
      trigger_type_param: trigger
    })

    if (error) {
      console.error('❌ Error calling process_referral_rewards:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      throw new Error(`Referral rewards processing failed: ${error.message || error.code || 'Unknown error'}`)
    }

    if (data) {
      console.log('✅ Referral rewards processed successfully:', data)
      console.log(`💰 Total distributed: ₹${data.total_distributed}`)
      console.log(`📊 Levels processed: ${data.levels_processed}`)
    }

  } catch (error: any) {
    console.error('❌ Error processing referral rewards:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      fullError: error
    })
    throw error
  }
}

// Count referrals at each level for a user
export const countReferralsByLevel = async (userId: string): Promise<Record<number, number>> => {
  try {
    const levelCounts: Record<number, number> = {}
    
    // Use the new database function to count referrals by level
    const { data, error } = await supabase.rpc('count_referrals_by_level', {
      user_uuid: userId
    })

    if (error) {
      console.error('Error calling count_referrals_by_level:', error)
      return levelCounts
    }

    // Convert the result to the expected format
    if (data) {
      data.forEach((row: any) => {
        levelCounts[row.level] = parseInt(row.count)
      })
    }

    return levelCounts
  } catch (error: any) {
    console.error('Error counting referrals by level:', error)
    return {}
  }
}

// Get detailed referral information for each level
export const getReferralsByLevel = async (userId: string): Promise<Record<number, any[]>> => {
  try {
    const referralsByLevel: Record<number, any[]> = {}
    
    // Get user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profileError || !userProfile) {
      return referralsByLevel
    }

    // Get all commission records for this user, grouped by level
    const { data: commissions, error: commissionsError } = await supabase
      .from('referral_commissions')
      .select(`
        level,
        commission_amount,
        created_at,
        referee_id,
        trigger_type,
        trigger_user_id,
        user_profiles!referral_commissions_referee_id_fkey(full_name, referral_code)
      `)
      .eq('referrer_id', userProfile.id)
      .order('level')
      .order('created_at', { ascending: false })

    if (!commissionsError && commissions) {
      // Group by level
      commissions.forEach(commission => {
        if (!referralsByLevel[commission.level]) {
          referralsByLevel[commission.level] = []
        }
        referralsByLevel[commission.level].push(commission)
      })
    }

    return referralsByLevel
  } catch (error: any) {
    console.error('Error getting referrals by level:', error)
    return {}
  }
}

// Update reward configuration (admin only)
export const updateRewardConfig = async (newConfig: Partial<typeof REFERRAL_REWARD_CONFIG>): Promise<void> => {
  try {
    // In a production system, you might want to store this in the database
    // For now, this function serves as a placeholder for future implementation
    console.log('Reward configuration would be updated:', newConfig)
    
    // You could implement this by storing the config in a settings table:
    // const client = getSafeClient(true)
    // await client.from('system_settings').upsert({
    //   key: 'referral_reward_config',
    //   value: { ...REFERRAL_REWARD_CONFIG, ...newConfig }
    // })
  } catch (error: any) {
    console.error('Error updating reward config:', error)
    throw error
  }
}
