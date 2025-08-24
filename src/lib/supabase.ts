import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin, hasAdminAccess } from './supabase-admin'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')

// Check for placeholder values
const isPlaceholder = supabaseUrl === 'https://your-project.supabase.co' ||
                     supabaseAnonKey === 'your-anon-key-here'

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder) {
  console.error('❌ Supabase Configuration Error:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing',
    isPlaceholder
  })

  if (isPlaceholder) {
    console.warn('🔧 Using placeholder Supabase credentials. Please set up your actual Supabase project.')
  } else {
    console.error('🔧 Missing Supabase environment variables. Please configure:')
    console.error('   VITE_SUPABASE_URL=your_supabase_url')
    console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
  }
}

// Create Supabase client with error handling
export const supabase = (() => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials missing - application will not function properly')
      return null
    }
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
})()

// Check if Supabase is available
export const isSupabaseAvailable = !!supabase && !isPlaceholder

// Global network and configuration status
export const getSystemStatus = () => {
  const isOnline = window.navigator.onLine;
  const hasValidConfig = !!supabase && !isPlaceholder;

  return {
    isOnline,
    hasValidConfig,
    isFullyOperational: isOnline && hasValidConfig,
    mode: !hasValidConfig ? 'error' : !isOnline ? 'offline' : 'online'
  };
};

// Wrapper for Supabase operations with proper error handling
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'database operation'
): Promise<T> => {
  try {
    const status = getSystemStatus();

    if (!status.hasValidConfig) {
      throw new Error(`${operationName}: Database not configured. Please set up Supabase credentials.`);
    }

    if (!status.isOnline) {
      throw new Error(`${operationName}: Network connection required. Please check your internet connection.`);
    }

    return await operation();
  } catch (error: any) {
    console.error(`${operationName} failed:`, error?.message || error);

    // Handle specific error types with appropriate errors
    if (error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('network') ||
        error?.name === 'TypeError') {
      throw new Error(`${operationName}: Network error. Please check your internet connection.`);
    }

    if (error?.message?.includes('permission denied') ||
        error?.code === '42501') {
      throw new Error(`${operationName}: Permission denied. Please contact administrator.`);
    }

    if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
      throw new Error(`${operationName}: Database table doesn't exist. Please set up the database.`);
    }

    // Re-throw the original error
    throw error;
  }
};

// Helper function to get safe client with error handling
const getSafeClient = (requireAdmin = false) => {
  if (requireAdmin) {
    if (!hasAdminAccess) {
      throw new Error('Admin access required but service role key not configured. Please set VITE_SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }
    return supabaseAdmin!
  }

  if (!supabase) {
    throw new Error('Supabase connection not available. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }

  return supabase
}

// Test connection function
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase || isPlaceholder) {
    throw new Error('Supabase not configured. Please set up database credentials.')
  }

  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return false
    }
    console.log('Supabase connection test successful')
    return true
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return false
  }
}

// Database types
export interface UserProfile {
  id: string
  user_id: string
  email?: string
  full_name?: string
  phone?: string
  referral_code: string
  referred_by?: string
  registration_number?: string
  total_earnings: number
  available_balance: number
  withdrawn_amount: number
  subscription_status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed'
  payment_id?: string
  shipping_address?: ShippingAddress
  status_notes?: string
  status_updated_by?: string
  status_updated_at?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
  product?: Product
}

export interface ReferralCommission {
  id: string
  referrer_id: string
  referee_id: string
  order_id: string | null
  level: number
  commission_rate: number
  commission_amount: number
  status: 'pending' | 'paid'
  created_at: string
  trigger_type?: string
  trigger_user_id?: string
}

export interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  upi_id: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  requested_at: string
  processed_at?: string
  processed_by?: string
}

export interface Admin {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
  created_by?: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface ShippingAddress {
  full_name: string
  phone: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface SubscriptionRequest {
  id: string
  user_id: string
  amount: number
  upi_transaction_id: string
  payment_proof_url?: string
  payment_proof_filename?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  requested_at: string
  processed_at?: string
  processed_by?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  duration_months: number
  features?: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id?: string
  status: 'active' | 'expired' | 'cancelled'
  started_at: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Ensure a unique registration number like MAT1001 exists for the user
export const ensureRegistrationNumber = async (userId: string): Promise<string | null> => {
  try {
    // Fetch profile first
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, registration_number')
      .eq('user_id', userId)
      .single()

    if (fetchError || !profile) {
      return null
    }

    if (profile.registration_number) {
      return profile.registration_number
    }

    // Compute a candidate value: MAT1000 + count + 1
    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    let suffix = 1000 + ((count ?? 0) + 1)
    let candidate = `MAT${suffix}`
    let attempts = 0

    while (attempts < 10) {
      // Check if candidate exists
      const { count: exists } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('registration_number', candidate)

      if (!exists || exists === 0) {
        // Try to set it
        const { data: updated, error: updateErr } = await supabase
          .from('user_profiles')
          .update({ registration_number: candidate, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select('registration_number')
          .single()

        if (!updateErr && updated?.registration_number) {
          return updated.registration_number
        }
      }

      // Collision or update failed; try next number
      suffix += 1
      candidate = `MAT${suffix}`
      attempts += 1
    }

    return null
  } catch (error) {
    console.error('ensureRegistrationNumber error:', error)
    return null
  }
}


// Product functions
export const getProducts = async (category?: string) => {
  // Check if using placeholder credentials
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const isPlaceholder = supabaseUrl === 'https://your-project.supabase.co' ||
                       supabaseAnonKey === 'your-anon-key-here'

  if (isPlaceholder) {
    throw new Error('Database not configured. Please set up Supabase credentials.');
  }

  try {
    // Use real database when connected to Supabase
    if (import.meta.env.DEV) {
      console.log('🔍 getProducts: Fetching from database');
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching products from database:', error)
      // If products table doesn't exist, throw error
      if (error.message?.includes('relation "products" does not exist')) {
        throw new Error('Products table does not exist. Please set up the database.');
      }
      throw error
    }

    if (import.meta.env.DEV) {
      console.log('�� Returning products from database:', data?.length || 0);
    }

    return data || []
  } catch (error) {
    console.error('Error in getProducts:', error)
    // If table doesn't exist, throw error
    if (error.message?.includes('relation "products" does not exist')) {
      throw new Error('Products table does not exist. Please set up the database.');
    }
    // Re-throw other errors
    throw error
  }
}

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    // Fetch from database
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching product:', error)

      // If products table doesn't exist, throw error
      if (error.message?.includes('relation "products" does not exist')) {
        throw new Error('Products table does not exist. Please set up the database.');
      }

      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getProduct:', error)
    // If table doesn't exist, throw error
    if (error.message?.includes('relation "products" does not exist')) {
      throw new Error('Products table does not exist. Please set up the database.');
    }
    // Re-throw other errors
    throw error
  }
}

// Cart functions
export const getCartItems = async (userId: string) => {
  return safeSupabaseOperation(async () => {
    if (!supabase) {
      throw new Error('Database not available')
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }, [], 'getCartItems')
}

export const addToCart = async (userId: string, productId: string, quantity: number = 1) => {
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: userId, product_id: productId, quantity },
      { onConflict: 'user_id,product_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCartItem = async (userId: string, productId: string, quantity: number) => {
  if (quantity <= 0) {
    return removeFromCart(userId, productId)
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const removeFromCart = async (userId: string, productId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) throw error
}

export const clearCart = async (userId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}

// Order functions
export const createOrder = async (
  userId: string,
  cartItems: CartItem[],
  shippingAddress: ShippingAddress,
  initialStatus: string = 'pending'
) => {
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity
  }, 0)

  console.log('🛒 Creating order for user:', userId, 'Total:', totalAmount)

  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        status: initialStatus
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError.message || orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    console.log('✅ Order created:', order.id)

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product?.price || 0
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items creation error:', itemsError.message || itemsError)
      // Try to cleanup the order if order items failed
      try {
        await supabase.from('orders').delete().eq('id', order.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup order after items error:', cleanupError?.message || cleanupError)
      }
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    console.log('✅ Order items created for order:', order.id)
    return order
  } catch (error: any) {
    console.error('createOrder error:', error)

    // Check if it's a table not found error and provide helpful message
    if (error.message?.includes('relation "orders" does not exist') ||
        error.message?.includes('relation "order_items" does not exist')) {
      throw new Error('Database tables not found. Please run the database setup script.')
    }

    // Re-throw the error with better message
    throw new Error(error.message || 'Failed to create order. Please try again.')
  }
}


export const getUserOrders = async (userId: string) => {
  if (!supabase) {
    throw new Error('Database not available. Please configure Supabase credentials.');
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting user orders:', error);
    return []; // Return empty array on error
  }
}

// Referral functions
export const getReferralCommissions = async (userId: string) => {
  if (!supabase) {
    throw new Error('Database not available. Please configure Supabase credentials.');
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) return []

    const { data, error } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting referral commissions:', error);
    return []; // Return empty array on error
  }
}

export const getReferredUsers = async (userId: string) => {
  if (!supabase) {
    throw new Error('Database not available. Please configure Supabase credentials.');
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) return []

    const { data, error } = await supabase
      .from('user_profiles')
      .select('full_name, created_at')
      .eq('referred_by', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting referred users:', error);
    return []; // Return empty array on error
  }
}

// Get referrer information for a user
export const getReferrerInfo = async (userId: string) => {
  if (!supabase) {
    throw new Error('Database not available. Please configure Supabase credentials.');
  }

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(`
        referred_by,
        referrer:user_profiles!user_profiles_referred_by_fkey(
          full_name,
          referral_code,
          phone
        )
      `)
      .eq('user_id', userId)
      .single()

    if (!profile || !profile.referred_by) return null

    return profile.referrer ? {
      id: profile.referred_by,
      full_name: profile.referrer.full_name,
      referral_code: profile.referrer.referral_code,
      phone: profile.referrer.phone
    } : null
  } catch (error) {
    console.error('Error getting referrer info:', error);
    return null;
  }
}

// Get all-level referred users up to 7 levels deep
export const getAllLevelReferredUsers = async (userId: string, maxLevels: number = 7) => {
  if (!supabase) {
    throw new Error('Database not available. Please configure Supabase credentials.');
  }

  try {
    // Get current user's profile id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) return []

    const results: Array<{ id: string; full_name: string; created_at: string; level: number }> = []
    let currentLevelProfileIds: string[] = [profile.id]

    for (let level = 1; level <= maxLevels; level++) {
      if (currentLevelProfileIds.length === 0) break

      // Fetch all users referred by any of the profiles in the current level
      const { data: referredLevel, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, created_at')
        .in('referred_by', currentLevelProfileIds)

      if (error) {
        console.warn('Error fetching level referrals:', error.message)
        break
      }

      if (!referredLevel || referredLevel.length === 0) {
        break
      }

      // Add to result with level info
      referredLevel.forEach((u) => {
        results.push({
          id: u.id,
          full_name: u.full_name || 'User',
          created_at: u.created_at,
          level,
        })
      })

      // Prepare next level
      currentLevelProfileIds = referredLevel.map((u) => u.id)
    }

    // Sort by level then date desc to keep recent at top within each level
    results.sort((a, b) => (a.level === b.level ? (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : a.level - b.level))

    return results
  } catch (error) {
    console.error('Error getting all-level referred users:', error)
    return []
  }
}

// Withdrawal functions
export const createWithdrawalRequest = async (userId: string, amount: number, upiId: string) => {
  try {
    // First check if user has sufficient balance
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('available_balance, total_earnings')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      throw new Error('Failed to fetch user balance')
    }

    if (!profile) {
      throw new Error('User profile not found')
    }

    if (profile.available_balance < amount) {
      throw new Error(`Insufficient balance. Available: ₹${profile.available_balance}, Requested: ₹${amount}`)
    }

    // Create withdrawal request
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount,
        upi_id: upiId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating withdrawal request:', error)
      throw new Error(`Failed to create withdrawal request: ${error.message}`)
    }

    // Deduct the amount from available balance
    const { error: balanceError } = await supabase
      .from('user_profiles')
      .update({
        available_balance: profile.available_balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (balanceError) {
      console.error('Error updating balance after withdrawal request:', balanceError)
      // Don't fail the withdrawal request if balance update fails
    }

    console.log(`✅ Withdrawal request created: User ${userId} requested ₹${amount} to ${upiId}`)
    return data
  } catch (error: any) {
    console.error('Error in createWithdrawalRequest:', error)
    throw error
  }
}

export const getUserWithdrawalRequests = async (userId: string) => {
  if (!supabase) {
    throw new Error('Database not available. Please configure Supabase credentials.');
  }

  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting withdrawal requests:', error);
    return []; // Return empty array on error
  }
}

// Admin Functions
export const createAdmin = async (email: string, password: string, fullName?: string, createdBy?: string) => {
  const { hashPassword } = await import('./password-utils')

  // Hash the password (now async)
  const { hash, salt } = await hashPassword(password)

  const { data, error } = await supabase
    .from('admins')
    .insert({
      email,
      password_hash: hash,
      password_salt: salt,
      full_name: fullName,
      role: 'admin',
      is_active: true,
      created_by: createdBy
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const authenticateAdmin = async (email: string, password: string) => {
  try {
    const { verifyPassword } = await import('./password-utils')

    // Use admin client with service role key for admin authentication
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    const { data, error } = await client
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Admin authentication error:', error.message, error)

      // Check if table doesn't exist
      if (error.code === '42P01') {
        throw new Error('Admin table not initialized. Please contact system administrator to set up the database.')
      }

      // Check if no admin found
      if (error.code === 'PGRST116') {
        throw new Error('Invalid email or password')
      }

      throw new Error(`Database error: ${error.message}`)
    }

    // Verify password if admin found
    if (!data.password_hash || !data.password_salt) {
      throw new Error('Admin account setup incomplete. Please contact system administrator.')
    }

    const isPasswordValid = await verifyPassword(password, data.password_hash, data.password_salt)

    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    // Remove sensitive data before returning
    const { password_hash, password_salt, ...adminData } = data
    return adminData
  } catch (error: any) {
    console.error('Admin authentication failed:', error.message || error)
    throw error
  }
}

export const getAllWithdrawalRequests = async () => {
  try {
    if (!supabase) {
      console.warn('Supabase not available, returning empty withdrawal requests array')
      return []
    }

    // First, try to get withdrawal requests
    const { data: withdrawalData, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (withdrawalError) {
      console.error('Error fetching withdrawal requests:', withdrawalError.message)

      // If table doesn't exist, return empty array
      if (withdrawalError.code === '42P01') {
        console.log('Withdrawal requests table does not exist, returning empty array')
        return []
      }

      throw withdrawalError
    }

    if (!withdrawalData || withdrawalData.length === 0) {
      return []
    }

    // Get all unique user IDs from withdrawal requests
    const userIds = [...new Set(withdrawalData.map(req => req.user_id))]

    // Fetch user profiles separately
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, phone')
      .in('user_id', userIds)

    if (profilesError) {
      console.warn('Error fetching user profiles:', profilesError.message)
      // Return withdrawal requests without user profiles if profiles table has issues
      return withdrawalData.map(req => ({
        ...req,
        user_profiles: {
          full_name: 'Unknown User',
          email: 'unknown@example.com'
        }
      }))
    }

    // Create a map of user profiles for quick lookup
    const profilesMap = new Map()
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.user_id, profile)
      })
    }

    // Combine withdrawal requests with user profiles
    const combinedData = withdrawalData.map(request => ({
      ...request,
      user_profiles: profilesMap.get(request.user_id) || {
        full_name: 'Unknown User',
        email: 'unknown@example.com'
      }
    }))

    return combinedData
  } catch (error: any) {
    console.error('Failed to fetch withdrawal requests:', error.message || error)
    return []
  }
}

export const updateWithdrawalRequestStatus = async (
  requestId: string,
  status: 'approved' | 'rejected',
  adminId: string,
  adminNotes?: string
) => {
  try {
    // First get the withdrawal request details
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      throw new Error('Withdrawal request not found')
    }

    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
      admin_notes: adminNotes
    }

    // Get current authenticated user to set as processed_by
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      updateData.processed_by = user.id
    }

    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Error updating withdrawal request status:', error.message)
      throw new Error(`Failed to update withdrawal request: ${error.message}`)
    }

    // If rejected, refund the amount back to user's available balance
    if (status === 'rejected') {
      try {
        // First get current balance
        const { data: currentProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('available_balance')
          .eq('user_id', request.user_id)
          .single()

        if (!fetchError && currentProfile) {
          const { error: refundError } = await supabase
            .from('user_profiles')
            .update({
              available_balance: currentProfile.available_balance + request.amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', request.user_id)

          if (refundError) {
            console.error('Error refunding amount:', refundError)
          } else {
            console.log(`✅ Refunded ₹${request.amount} to user ${request.user_id}`)
          }
        }
      } catch (refundError) {
        console.error('Error in refund process:', refundError)
      }
    }

    // If approved, update withdrawn amount
    if (status === 'approved') {
      try {
        // First get current withdrawn amount
        const { data: currentProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('withdrawn_amount')
          .eq('user_id', request.user_id)
          .single()

        if (!fetchError && currentProfile) {
          const { error: withdrawnError } = await supabase
            .from('user_profiles')
            .update({
              withdrawn_amount: (currentProfile.withdrawn_amount || 0) + request.amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', request.user_id)

          if (withdrawnError) {
            console.error('Error updating withdrawn amount:', withdrawnError)
          } else {
            console.log(`✅ Updated withdrawn amount for user ${request.user_id}`)
          }
        }
      } catch (withdrawnError) {
        console.error('Error updating withdrawn amount:', withdrawnError)
      }
    }

    console.log(`✅ Withdrawal request ${requestId} status updated to ${status}`)
    return data
  } catch (error: any) {
    console.error('Update withdrawal request status error:', error.message || error)
    throw error
  }
}

export const addNewAdmin = async (email: string, password: string, fullName: string, createdBy: string) => {
  try {
    const { hashPassword, validatePasswordStrength } = await import('./password-utils')

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`)
    }

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .single()

    // If table doesn't exist, inform user
    if (checkError && checkError.code === '42P01') {
      throw new Error('Admin table not initialized. Please contact system administrator to set up the database.')
    }

    if (existingAdmin) {
      throw new Error('Admin with this email already exists')
    }

    // Hash the password (now async)
    const { hash, salt } = await hashPassword(password)

    const { data, error } = await supabase
      .from('admins')
      .insert({
        email,
        password_hash: hash,
        password_salt: salt,
        full_name: fullName,
        role: 'admin',
        is_active: true,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding new admin:', error.message)
      throw new Error(`Failed to add admin: ${error.message}`)
    }

    // Remove sensitive data before returning
    const { password_hash, password_salt, ...adminData } = data
    return adminData
  } catch (error: any) {
    console.error('Add admin error:', error.message || error)
    throw error
  }
}

// Initialize default admin account
export const seedInitialAdmin = async () => {
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('email', 'aman.csc.99188@gmail.com')
      .single()

    if (existingAdmin) {
      console.log('Initial admin already exists')
      return existingAdmin
    }

    // Create initial admin with secure password
    const adminData = await createAdmin(
      'aman.csc.99188@gmail.com',
      'Admin@123!',
      'Aman Kumar'
    )

    console.log('Initial admin created successfully')
    return adminData
  } catch (error) {
    console.error('Error seeding initial admin:', error)
    throw error
  }
}

export const getAllAdmins = async () => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const updateAdminStatus = async (adminId: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('admins')
    .update({ is_active: isActive })
    .eq('id', adminId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Product Management Functions
export const getAllProducts = async () => {
  try {
    if (!supabase) {
      console.warn('Supabase not available, returning empty products array')
      return []
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error.message)

      // If table doesn't exist, throw error
      if (error.code === '42P01') {
        throw new Error('Products table does not exist. Please set up the database.')
      }

      throw error
    }

    return data || []
  } catch (error: any) {
    console.error('Failed to fetch products:', error.message || error)
    throw error
  }
}

export const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    // Validate required fields
    if (!productData.name || !productData.price) {
      throw new Error('Product name and price are required')
    }

    if (productData.price <= 0) {
      throw new Error('Product price must be greater than 0')
    }

    if (productData.stock_quantity < 0) {
      throw new Error('Stock quantity cannot be negative')
    }

    console.log('Creating product...')

    // Clean up the data
    const cleanData = {
      ...productData,
      name: productData.name.trim(),
      description: productData.description?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client
      .from('products')
      .insert([cleanData])
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error.message, error.code, error)

      if (error.code === '42P01') {
        throw new Error('Products table not initialized. Please contact system administrator.')
      }

      // Handle RLS policy violations
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Database permission error: Row Level Security policy violation. Please disable RLS for the products table or create appropriate policies.')
      }

      // Handle constraint violations
      if (error.code === '23505') {
        throw new Error('A product with this name already exists.')
      }

      throw new Error(`Failed to create product: ${error.message}`)
    }

    if (!data) {
      throw new Error('Product was not created. Please try again.')
    }

    console.log('Product created successfully:', data.id)
    return data
  } catch (error: any) {
    console.error('Create product error:', error.message || error)
    throw error
  }
}

export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  try {
    // Validate required fields
    if (!productId) {
      throw new Error('Product ID is required')
    }

    // Admin authentication is handled by the admin context

    // Clean up the data
    const cleanData = {
      ...productData,
      updated_at: new Date().toISOString()
    }

    // Remove undefined/null values
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined || cleanData[key] === null) {
        delete cleanData[key]
      }
    })

    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client
      .from('products')
      .update(cleanData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error.message, error.code, error)

      if (error.code === '42P01') {
        throw new Error('Products table not initialized. Please contact system administrator.')
      }

      if (error.code === 'PGRST116') {
        throw new Error('Product not found. It may have been deleted.')
      }

      // Handle RLS policy violations
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Database permission error: Row Level Security policy violation. Please disable RLS for the products table or create appropriate policies.')
      }

      // Handle constraint violations
      if (error.code === '23505') {
        throw new Error('A product with this name already exists.')
      }

      throw new Error(`Failed to update product: ${error.message}`)
    }

    if (!data) {
      throw new Error('Product was not updated. Please try again.')
    }

    return data
  } catch (error: any) {
    console.error('Update product error:', error.message || error)
    throw error
  }
}

export const deleteProduct = async (productId: string) => {
  try {
    // Admin authentication is handled by the admin context

    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error.message, error.code, error)

      if (error.code === '42P01') {
        throw new Error('Products table not initialized. Please contact system administrator.')
      }

      // Handle RLS policy violations
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Database permission error: Row Level Security policy violation. Please disable RLS for the products table or create appropriate policies.')
      }

      throw new Error(`Failed to delete product: ${error.message}`)
    }

    return true
  } catch (error: any) {
    console.error('Delete product error:', error.message || error)
    throw error
  }
}

export const toggleProductStatus = async (productId: string, isActive: boolean) => {
  try {
    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client
      .from('products')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling product status:', error.message)
      throw new Error(`Failed to update product status: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error('Toggle product status error:', error.message || error)
    throw error
  }
}

export const getProductsByCategory = async (category?: string) => {
  try {
    let query = supabase.from('products').select('*')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        throw new Error('Products table does not exist. Please set up the database.')
      }
      throw error
    }

    return data || []
  } catch (error: any) {
    console.error('Failed to fetch products by category:', error.message || error)
    throw error
  }
}

export const updateProductStock = async (productId: string, stockQuantity: number) => {
  try {
    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client
      .from('products')
      .update({
        stock_quantity: stockQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product stock:', error.message)
      throw new Error(`Failed to update stock: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error('Update product stock error:', error.message || error)
    throw error
  }
}

// Admin Dashboard Analytics Functions
export const getAdminAnalytics = async () => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    // Get data in parallel
    const [usersResult, ordersResult, productsResult, withdrawalsResult] = await Promise.all([
      client.from('user_profiles').select('id, created_at, full_name, email'),
      client.from('orders').select('id, total_amount, created_at, status'),
      client.from('products').select('id, created_at'),
      client.from('withdrawal_requests').select('id, amount, status, requested_at')
    ])

    const users = usersResult.data || []
    const orders = ordersResult.data || []
    const products = productsResult.data || []
    const withdrawals = withdrawalsResult.data || []

    // Calculate analytics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const analytics = {
      // Users
      totalUsers: users.length,
      activeUsers: users.filter(user => new Date(user.created_at) > thirtyDaysAgo).length,
      newUsers: users.filter(user => new Date(user.created_at) > sevenDaysAgo).length,

      // Orders
      totalOrders: orders.length,
      weeklyOrders: orders.filter(order => new Date(order.created_at) > sevenDaysAgo).length,
      monthlyOrders: orders.filter(order => new Date(order.created_at) > thirtyDaysAgo).length,

      // Revenue
      totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      monthlyRevenue: orders
        .filter(order => new Date(order.created_at) > thirtyDaysAgo)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0),
      weeklyRevenue: orders
        .filter(order => new Date(order.created_at) > sevenDaysAgo)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0),

      // Products
      totalProducts: products.length,

      // Withdrawals
      totalWithdrawals: withdrawals.length,
      pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
      totalWithdrawalAmount: withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0),

      // Order statuses
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'pending').length,
        paid: orders.filter(o => o.status === 'paid').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
      }
    }

    return analytics
  } catch (error: any) {
    console.error('Error getting admin analytics:', error?.message || error)
    // Return fallback data if error
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      totalOrders: 0,
      weeklyOrders: 0,
      monthlyOrders: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      weeklyRevenue: 0,
      totalProducts: 0,
      totalWithdrawals: 0,
      pendingWithdrawals: 0,
      totalWithdrawalAmount: 0,
      ordersByStatus: {
        pending: 0,
        paid: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }
    }
  }
}

export const getAllUsers = async () => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error.message)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error('Error in getAllUsers:', error?.message || error)
    return []
  }
}

// Admin: Update a user's profile (including email) by user_id
export const updateUserByAdmin = async (
  userId: string,
  updates: Partial<UserProfile> & { email?: string }
): Promise<UserProfile> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    const cleanUpdates: any = { ...updates, updated_at: new Date().toISOString() }
    Object.keys(cleanUpdates).forEach((key) => {
      if (cleanUpdates[key] === undefined) delete cleanUpdates[key]
    })

    const { data, error } = await client
      .from('user_profiles')
      .update(cleanUpdates)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return data as UserProfile
  } catch (error: any) {
    console.error('updateUserByAdmin error:', error?.message || error)
    throw error
  }
}

// Admin: Delete a user's profile by user_id
export const deleteUserByAdmin = async (userId: string): Promise<boolean> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    const { error } = await client
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return true
  } catch (error: any) {
    console.error('deleteUserByAdmin error:', error?.message || error)
    throw error
  }
}

export const getAllOrders = async () => {
  try {
    // Use admin client with service role key for admin operations
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      console.error('Admin client not available')
      return []
    }

    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items:order_items(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error.message)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error('Error in getAllOrders:', error)
    return []
  }
}

export const updateOrderStatus = async (
  orderId: string, 
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed',
  notes?: string,
  adminId?: string
) => {
  try {
    // Use admin client with service role key for admin operations
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Add optional fields if provided
    if (notes) updateData.status_notes = notes
    if (adminId) updateData.status_updated_by = adminId

    const { data, error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order status:', error.message)
      throw new Error(`Failed to update order status: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error('Update order status error:', error.message || error)
    throw error
  }
}

// Comprehensive order update function for admin
export const updateOrderComprehensive = async (
  orderId: string,
  updates: {
    status?: string
    tracking_number?: string
    carrier_name?: string
    estimated_delivery_date?: string
    admin_notes?: string
  }
) => {
  try {
    // Use admin client with service role key for admin operations
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only add fields that are provided
    if (updates.status) updateData.status = updates.status
    if (updates.tracking_number) updateData.tracking_number = updates.tracking_number
    if (updates.carrier_name) updateData.carrier_name = updates.carrier_name
    if (updates.estimated_delivery_date) updateData.estimated_delivery_date = updates.estimated_delivery_date
    if (updates.admin_notes) updateData.admin_notes = updates.admin_notes

    const { data, error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error.message)
      throw new Error(`Failed to update order: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error('Update order comprehensive error:', error.message || error)
    throw error
  }
}

// Subscription Functions

// Check user subscription status
export const checkUserSubscriptionStatus = async (userId: string): Promise<'active' | 'inactive'> => {
  return safeSupabaseOperation(async () => {
    if (!supabase) {
      throw new Error('Database not available. Please configure Supabase credentials.');
    }

    // Use service role client for reliable access to user_profiles
    const client = hasAdminAccess ? supabaseAdmin! : supabase!;

    const { data, error } = await client
      .from('user_profiles')
      .select('subscription_status')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error checking subscription status:', error)
      return 'inactive' // Default to inactive if there's an error
    }

    return data?.subscription_status || 'inactive'
  }, 'inactive', 'checkUserSubscriptionStatus')
}

// Get subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  return safeSupabaseOperation(async () => {
    if (!supabase) {
      throw new Error('Database not available. Please configure Supabase credentials.');
    }

    // Use service role client for reliable access
    const client = hasAdminAccess ? supabaseAdmin! : supabase!;

    const { data, error } = await client
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price')

    if (error) {
      throw error
    }

    return data || []
  }, [], 'getSubscriptionPlans')
}

// Create subscription request
export const createSubscriptionRequest = async (
  userId: string,
  upiTransactionId: string,
  amount: number,
  paymentProofFile?: File
): Promise<SubscriptionRequest | null> => {
  try {
    if (!supabase) {
      throw new Error('Database not available. Please configure Supabase credentials.');
    }

    // Check if Supabase is available
    if (!supabase) {
      throw new Error('Database not available. Please try again later.')
    }

    // Verify user authentication
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      throw new Error('User must be authenticated to create subscription request')
    }

    // Security check - ensure user can only create requests for themselves
    if (currentUser.id !== userId) {
      throw new Error('Cannot create subscription request for different user')
    }

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
          // Continue without file upload
        } else {
          paymentProofUrl = uploadData.path
          paymentProofFilename = paymentProofFile.name
        }
      } catch (uploadError) {
        console.warn('Error uploading payment proof:', uploadError)
        // Continue without file upload
      }
    }

    // Use service role client if available for better permissions
    const client = hasAdminAccess ? supabaseAdmin! : supabase;

    // Create subscription request
    const { data, error } = await client
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

    if (error) {
      console.error('Error creating subscription request:', error)

      // Handle specific errors
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('Subscription system not set up. Please contact administrator.')
      }

      if (error.code === '42501' || error.message?.includes('permission denied')) {
        throw new Error('Permission denied. Please contact administrator to set up subscription permissions.')
      }

      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createSubscriptionRequest:', error)
    throw error
  }
}

// Get user's subscription requests
export const getUserSubscriptionRequests = async (userId: string): Promise<SubscriptionRequest[]> => {
  try {
    if (!supabase) {
      throw new Error('Database not available. Please configure Supabase credentials.');
    }

    // Check if Supabase is available
    if (!supabase) {
      console.log('Supabase not available, returning empty subscription requests array')
      return []
    }

    // Use service role client if available for better permissions
    const client = hasAdminAccess ? supabaseAdmin! : supabase;

    // Get current authenticated user to ensure we only fetch their requests
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !currentUser) {
      console.log('User not authenticated, cannot fetch subscription requests:', authError?.message)
      return []
    }

    // Only allow fetching requests for the authenticated user (security measure)
    if (currentUser.id !== userId) {
      console.log('User ID mismatch, cannot fetch subscription requests for different user')
      return []
    }

    // Query subscription requests
    const { data, error } = await client
      .from('subscription_requests')
      .select('id, user_id, amount, upi_transaction_id, payment_proof_url, payment_proof_filename, status, admin_notes, requested_at, processed_at, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscription requests:', error)

      // Handle specific errors
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('subscription_requests table does not exist, returning empty array')
        return []
      }

      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.log('Permission denied for subscription_requests, returning empty array')
        return []
      }

      // For other errors, return empty array to prevent crashes
      console.log('Unknown error fetching subscription requests, returning empty array')
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserSubscriptionRequests:', error)
    return []
  }
}

// Admin Functions for Subscription Management

// Get all subscription requests (admin only)
export const getAllSubscriptionRequests = async (): Promise<(SubscriptionRequest & { user_profile?: UserProfile })[]> => {
  try {
    if (!supabase) {
      console.warn('Supabase not available, returning empty subscription requests array')
      return []
    }

    const client = hasAdminAccess ? supabaseAdmin! : supabase

    // First, get subscription requests
    const { data: requestsData, error: requestsError } = await client
      .from('subscription_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching subscription requests:', requestsError.message || requestsError)

      // Check if table doesn't exist
      if (requestsError.code === '42P01' || requestsError.message?.includes('relation "subscription_requests" does not exist')) {
        console.log('Subscription requests table does not exist, returning empty array')
        return []
      }

      // Check for permission denied errors
      if (requestsError.code === '42501' || requestsError.message?.includes('permission denied')) {
        console.log('Permission denied for subscription requests, admin may need service role key')
        return []
      }

      return []
    }

    if (!requestsData || requestsData.length === 0) {
      return []
    }

    // Get all unique user IDs from subscription requests
    const userIds = [...new Set(requestsData.map(req => req.user_id))]

    // Fetch user profiles separately
    const { data: profilesData, error: profilesError } = await client
      .from('user_profiles')
      .select('user_id, full_name, phone')
      .in('user_id', userIds)

    if (profilesError) {
      console.warn('Error fetching user profiles:', profilesError.message)
      // Return requests without user profiles if profiles table has issues
      return requestsData.map(req => ({
        ...req,
        user_profile: {
          full_name: 'Unknown User'
        }
      }))
    }

    // Create a map of user profiles for quick lookup
    const profilesMap = new Map()
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.user_id, profile)
      })
    }

    // Combine requests with user profiles
    const combinedData = requestsData.map(request => ({
      ...request,
      user_profile: profilesMap.get(request.user_id) || {
        full_name: 'Unknown User'
      }
    }))

    return combinedData
  } catch (error: any) {
    console.error('Failed to fetch subscription requests:', error.message || error)
    return []
  }
}

// Update subscription request status (admin only)
export const updateSubscriptionRequestStatus = async (
  requestId: string,
  status: 'approved' | 'rejected',
  adminId: string,
  adminNotes?: string
): Promise<SubscriptionRequest | null> => {
  try {
    // Use admin client with service role key for admin operations
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    const updateData: any = {
      status,
      processed_at: new Date().toISOString(),
      admin_notes: adminNotes
    }

    // Get current authenticated user to set as processed_by
    const { data: { user } } = await client.auth.getUser()
    if (user) {
      updateData.processed_by = user.id
    }

    const { data, error } = await client
      .from('subscription_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription request status:', error.message)
      throw new Error(`Failed to update subscription request: ${error.message}`)
    }

    // If approved, also update user's subscription status
    if (status === 'approved' && data) {
      await updateUserSubscriptionStatus(data.user_id, 'active')
    }

    return data
  } catch (error: any) {
    console.error('Update subscription request status error:', error.message || error)
    throw error
  }
}

// Update user subscription status (admin only)
export const updateUserSubscriptionStatus = async (
  userId: string,
  status: 'active' | 'inactive'
): Promise<boolean> => {
  try {
    // Use admin client with service role key for admin operations
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    // Check if user was previously inactive to trigger rewards only once
    const { data: currentProfile, error: checkError } = await client
      .from('user_profiles')
      .select('subscription_status')
      .eq('user_id', userId)
      .single()

    if (checkError) {
      console.error('Error checking current subscription status:', checkError.message)
      throw new Error(`Failed to check subscription status: ${checkError.message}`)
    }

    const wasInactive = currentProfile?.subscription_status !== 'active'

    const { error } = await client
      .from('user_profiles')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating user subscription status:', error.message)
      throw new Error(`Failed to update subscription status: ${error.message}`)
    }

    // Trigger referral rewards on activation. Prefer first-activation, but add idempotent fallback.
    if (status === 'active') {
      try {
        // Check if commissions for this activation already exist
        const { count: existingCount } = await client
          .from('referral_commissions')
          .select('*', { count: 'exact', head: true })
          .eq('trigger_user_id', userId)
          .eq('trigger_type', 'subscription_activation')

        // Only process if first-time activation OR commissions missing
        if (wasInactive || (existingCount ?? 0) === 0) {
          // Ensure user was actually referred to avoid unnecessary work
          const { data: buyerProfile } = await client
            .from('user_profiles')
            .select('referred_by')
            .eq('user_id', userId)
            .single()

          if (buyerProfile?.referred_by) {
            const { safeProcessReferralRewards } = await import('./referral-system-fix')
            const success = await safeProcessReferralRewards(userId, 'subscription_activation')
            if (success) {
              console.log(`✅ Referral rewards processed for user: ${userId}`)
            } else {
              console.log(`⚠️ Referral rewards processing skipped for user: ${userId} (system not ready)`) 
            }
          }
        }
      } catch (rewardError: any) {
        console.error('Error processing referral rewards:', {
          message: rewardError.message,
          stack: rewardError.stack,
          name: rewardError.name,
          fullError: rewardError
        })
        // Don't fail the subscription update if rewards processing fails
      }
    }

    return true
  } catch (error: any) {
    console.error('Update user subscription status error:', error.message || error)
    throw error
  }
}

// Get payment proof URL for viewing
export const getPaymentProofUrl = async (paymentProofPath: string): Promise<string | null> => {
  try {
    if (!paymentProofPath) return null

    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(paymentProofPath, 60 * 60) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error in getPaymentProofUrl:', error)
    return null
  }
}

// Admin UPI Management Types and Functions (Updated for existing schema)
export interface AdminUPIConfig {
  upi_id: string
  merchant_name: string
  upi_ids: string[]
}

export interface AdminUPI {
  id: string
  upi_id: string
  upi_name: string
  is_primary: boolean
}

// Get active UPI configuration using the existing function
export const getActiveUPIConfig = async (): Promise<AdminUPIConfig | null> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client.rpc('get_active_upi_config')

    if (error) {
      console.error('Error fetching active UPI config:', error.message)
      return null
    }

    return data
  } catch (error: any) {
    console.error('Error in getActiveUPIConfig:', error)
    return null
  }
}

// Get admin UPI settings from admins table
export const getAdminUPIs = async (adminId: string): Promise<AdminUPI[]> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { data, error } = await client
      .from('admins')
      .select('active_upi_id, upi_merchant_name, upi_ids')
      .eq('id', adminId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching admin UPIs:', error.message)
      return []
    }

    if (!data) return []

    // Convert the schema to our interface format
    const upis: AdminUPI[] = []

    // Add active UPI as primary
    if (data.active_upi_id) {
      upis.push({
        id: 'primary',
        upi_id: data.active_upi_id,
        upi_name: data.upi_merchant_name || 'Primary UPI',
        is_primary: true
      })
    }

    // Add additional UPIs if they exist
    if (data.upi_ids && Array.isArray(data.upi_ids)) {
      data.upi_ids.forEach((upiId: string, index: number) => {
        if (upiId !== data.active_upi_id) {
          upis.push({
            id: `upi-${index}`,
            upi_id: upiId,
            upi_name: `UPI ${index + 1}`,
            is_primary: false
          })
        }
      })
    }

    return upis
  } catch (error: any) {
    console.error('Error in getAdminUPIs:', error)
    return []
  }
}

// Update admin UPI settings in admins table
export const updateAdminUPI = async (adminId: string, upiId: string, upiName: string, isPrimary: boolean): Promise<void> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    // Get current admin data
    const { data: currentAdmin, error: fetchError } = await client
      .from('admins')
      .select('active_upi_id, upi_merchant_name, upi_ids')
      .eq('id', adminId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch admin data: ${fetchError.message}`)
    }

    let updateData: any = {}

    if (isPrimary) {
      // Update primary UPI
      updateData.active_upi_id = upiId
      updateData.upi_merchant_name = upiName
    }

    // Update upi_ids array
    let upiIds = currentAdmin?.upi_ids || []
    if (!upiIds.includes(upiId)) {
      upiIds.push(upiId)
    }
    updateData.upi_ids = upiIds

    const { error } = await client
      .from('admins')
      .update(updateData)
      .eq('id', adminId)

    if (error) {
      console.error('Error updating admin UPI:', error.message)
      throw new Error(`Failed to update UPI: ${error.message}`)
    }
  } catch (error: any) {
    console.error('Error in updateAdminUPI:', error)
    throw error
  }
}

// Add new UPI ID
export const addAdminUPI = async (adminId: string, upiId: string, upiName: string, isPrimary: boolean = false): Promise<AdminUPI> => {
  try {
    await updateAdminUPI(adminId, upiId, upiName, isPrimary)

    return {
      id: isPrimary ? 'primary' : `upi-${Date.now()}`,
      upi_id: upiId,
      upi_name: upiName,
      is_primary: isPrimary
    }
  } catch (error: any) {
    console.error('Error in addAdminUPI:', error)
    throw error
  }
}

// Remove UPI ID
export const deleteAdminUPI = async (adminId: string, upiId: string): Promise<void> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    // Get current admin data
    const { data: currentAdmin, error: fetchError } = await client
      .from('admins')
      .select('active_upi_id, upi_merchant_name, upi_ids')
      .eq('id', adminId)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch admin data: ${fetchError.message}`)
    }

    let updateData: any = {}

    // If deleting the primary UPI, clear it
    if (currentAdmin?.active_upi_id === upiId) {
      updateData.active_upi_id = null
      updateData.upi_merchant_name = null
    }

    // Remove from upi_ids array
    if (currentAdmin?.upi_ids) {
      updateData.upi_ids = currentAdmin.upi_ids.filter((id: string) => id !== upiId)
    }

    const { error } = await client
      .from('admins')
      .update(updateData)
      .eq('id', adminId)

    if (error) {
      console.error('Error deleting admin UPI:', error.message)
      throw new Error(`Failed to delete UPI: ${error.message}`)
    }
  } catch (error: any) {
    console.error('Error in deleteAdminUPI:', error)
    throw error
  }
}

// Set primary UPI
export const setPrimaryAdminUPI = async (adminId: string, upiId: string, upiName: string): Promise<void> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { error } = await client
      .from('admins')
      .update({
        active_upi_id: upiId,
        upi_merchant_name: upiName
      })
      .eq('id', adminId)

    if (error) {
      console.error('Error setting primary UPI:', error.message)
      throw new Error(`Failed to set primary UPI: ${error.message}`)
    }
  } catch (error: any) {
    console.error('Error in setPrimaryAdminUPI:', error)
    throw error
  }
}

// Additional subscription management functions

// Manually toggle user subscription status (admin only)
export const toggleUserSubscription = async (
  userId: string,
  status: 'active' | 'inactive',
  adminId: string
): Promise<boolean> => {
  try {
    // Use admin client with service role key for admin operations
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      throw new Error('Admin client not available. Please check service role key configuration.')
    }

    // Update user subscription status
    const { error: updateError } = await client
      .from('user_profiles')
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    // Log the admin action
    console.log(`Admin ${adminId} ${status === 'active' ? 'activated' : 'deactivated'} subscription for user ${userId}`);

    return true
  } catch (error: any) {
    console.error('Toggle user subscription error:', error.message || error)
    throw error
  }
}

// Get user profile by user ID (admin function)
export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
  return safeSupabaseOperation(async () => {
    const client = hasAdminAccess ? supabaseAdmin! : supabase!;

    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw error
    }

    return data
  }, null, 'getUserProfileById')
}

// Get order items by order ID (admin function)
export const getOrderItemsByOrderId = async (orderId: string): Promise<OrderItem[]> => {
  return safeSupabaseOperation(async () => {
    const client = hasAdminAccess ? supabaseAdmin! : supabase!;

    const { data, error } = await client
      .from('order_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('order_id', orderId)

    if (error) {
      throw error
    }

    return data || []
  }, [], 'getOrderItemsByOrderId')
}

// Get complete order details including items and user profile
export const getOrderDetails = async (orderId: string): Promise<{
  order: Order | null
  orderItems: OrderItem[]
  userProfile: UserProfile | null
}> => {
  return safeSupabaseOperation(async () => {
    const client = hasAdminAccess ? supabaseAdmin! : supabase!;

    // Get order
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      throw orderError
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await client
      .from('order_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('order_id', orderId)

    if (itemsError) {
      throw itemsError
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', order.user_id)
      .single()

    if (profileError) {
      console.warn('Could not load user profile:', profileError)
    }

    return {
      order,
      orderItems: orderItems || [],
      userProfile: userProfile || null
    }
  }, { order: null, orderItems: [], userProfile: null }, 'getOrderDetails')
}

// Set default UPI ID for an admin
export const setDefaultUPI = async (adminId: string, upiId: string): Promise<void> => {
  try {
    const client = hasAdminAccess ? supabaseAdmin! : supabase

    const { error } = await client
      .from('admins')
      .update({ 
        active_upi_id: upiId,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)

    if (error) {
      throw new Error(`Failed to set default UPI: ${error.message}`)
    }

    console.log('Default UPI set successfully')
  } catch (error: any) {
    console.error('Error in setDefaultUPI:', error)
    throw error
  }
}
