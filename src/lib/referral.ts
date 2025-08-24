import { supabase } from '@/lib/supabase'

// Commission rates for 7 levels (10%, 5%, 3%, 2%, 1%, 0.5%, 0.5%)
const COMMISSION_RATES = [0.10, 0.05, 0.03, 0.02, 0.01, 0.005, 0.005]

export interface ReferralStats {
  totalEarnings: number
  availableBalance: number
  withdrawnAmount: number
  totalReferrals: number
  referralCode: string
  referralLink: string
}

export interface ReferralCommission {
  id: string
  level: number
  commissionAmount: number
  commissionRate: number
  status: 'pending' | 'paid'
  createdAt: string
  order?: {
    id: string
    totalAmount: number
  }
  referee?: {
    fullName: string
  }
}

export interface ReferredUser {
  id: string
  fullName: string
  createdAt: string
  totalOrders?: number
  totalSpent?: number
}

// Generate referral code
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'MTC'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate referral link
export function generateReferralLink(referralCode: string): string {
  const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin
  return `${baseUrl}/register?ref=${referralCode}`
}

// Get referral stats for a user
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
  try {

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !profile) return null

    // Count total referrals
    const { count: totalReferrals } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', profile.id)

    return {
      totalEarnings: profile.total_earnings,
      availableBalance: profile.available_balance,
      withdrawnAmount: profile.withdrawn_amount,
      totalReferrals: totalReferrals || 0,
      referralCode: profile.referral_code,
      referralLink: generateReferralLink(profile.referral_code)
    }
  } catch (error) {
    console.error('Error getting referral stats:', error)
    return null
  }
}

// Get referral commissions for a user
export async function getReferralCommissions(userId: string): Promise<ReferralCommission[]> {
  try {

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) return []

    const { data: commissions, error } = await supabase
      .from('referral_commissions')
      .select(`
        *,
        order:orders!referral_commissions_order_id_fkey(id, total_amount),
        referee:user_profiles!referral_commissions_referee_id_fkey(full_name)
      `)
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return commissions?.map(commission => ({
      id: commission.id,
      level: commission.level,
      commissionAmount: commission.commission_amount,
      commissionRate: commission.commission_rate,
      status: commission.status,
      createdAt: commission.created_at,
      order: commission.order ? {
        id: commission.order.id,
        totalAmount: commission.order.total_amount
      } : undefined,
      referee: commission.referee ? {
        fullName: commission.referee.full_name
      } : undefined
    })) || []

  } catch (error) {
    console.error('Error getting referral commissions:', error)
    return []
  }
}

// Get referred users
export async function getReferredUsers(userId: string): Promise<ReferredUser[]> {
  try {

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) return []

    const { data: referredUsers, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, created_at')
      .eq('referred_by', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get order statistics for each referred user
    const usersWithStats = await Promise.all(
      (referredUsers || []).map(async (user) => {
        try {
          // Get order statistics for this user
          const { data: orderStats } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id)
            .in('status', ['confirmed', 'paid', 'shipped', 'delivered'])

          const totalOrders = orderStats?.length || 0
          const totalSpent = orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

          return {
            id: user.id,
            fullName: user.full_name || 'Anonymous User',
            createdAt: user.created_at,
            totalOrders,
            totalSpent
          }
        } catch (error) {
          console.error('Error getting stats for user:', user.id, error)
          return {
            id: user.id,
            fullName: user.full_name || 'Anonymous User',
            createdAt: user.created_at,
            totalOrders: 0,
            totalSpent: 0
          }
        }
      })
    )

    return usersWithStats

  } catch (error) {
    console.error('Error getting referred users:', error)
    return []
  }
}

// Calculate and distribute commissions for an order
export async function distributeCommissions(orderId: string, orderAmount: number, buyerUserId: string): Promise<void> {
  try {

    // Get buyer's profile
    const { data: buyerProfile } = await supabase
      .from('user_profiles')
      .select('id, referred_by')
      .eq('user_id', buyerUserId)
      .single()

    if (!buyerProfile || !buyerProfile.referred_by) {
      console.log('No referrer found for user:', buyerUserId)
      return
    }

    // Start the commission chain
    let currentReferrerId = buyerProfile.referred_by
    let level = 1

    while (currentReferrerId && level <= 7) {
      const commissionRate = COMMISSION_RATES[level - 1]
      const commissionAmount = orderAmount * commissionRate

      // Create commission record
      const { error: commissionError } = await supabase
        .from('referral_commissions')
        .insert({
          referrer_id: currentReferrerId,
          referee_id: buyerProfile.id,
          order_id: orderId,
          level,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          status: 'pending'
        })

      if (commissionError) {
        console.error('Error creating commission record:', commissionError)
        break
      }

      // Update referrer's earnings
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          total_earnings: supabase.raw(`total_earnings + ${commissionAmount}`),
          available_balance: supabase.raw(`available_balance + ${commissionAmount}`)
        })
        .eq('id', currentReferrerId)

      if (updateError) {
        console.error('Error updating referrer earnings:', updateError)
        break
      }

      // Get next level referrer
      const { data: nextReferrer } = await supabase
        .from('user_profiles')
        .select('referred_by')
        .eq('id', currentReferrerId)
        .single()

      currentReferrerId = nextReferrer?.referred_by
      level++
    }

    console.log(`Distributed commissions for order ${orderId} through ${level - 1} levels`)

  } catch (error) {
    console.error('Error distributing commissions:', error)
  }
}

// Validate referral code
export async function validateReferralCode(referralCode: string): Promise<boolean> {
  if (!referralCode) return false

  try {

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase())
      .single()

    return !error && !!data

  } catch (error) {
    console.error('Error validating referral code:', error)
    return false
  }
}

// Create withdrawal request
export async function createWithdrawalRequest(userId: string, amount: number): Promise<boolean> {
  try {

    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount,
        status: 'pending'
      })

    return !error

  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return false
  }
}

// Get withdrawal requests for a user
export async function getWithdrawalRequests(userId: string) {
  try {

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) throw error
    return data || []

  } catch (error) {
    console.error('Error getting withdrawal requests:', error)
    return []
  }
}
