-- Fix missing database schema for user registration
-- This migration adds missing tables and functions that are causing registration errors

BEGIN;

-- ================================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ================================================================

-- Add missing columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add missing columns to referral_commissions
ALTER TABLE public.referral_commissions 
ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'order_purchase' CHECK (trigger_type IN ('order_purchase', 'subscription_activation')),
ADD COLUMN IF NOT EXISTS trigger_user_id UUID REFERENCES auth.users(id);

-- ================================================================
-- 2. CREATE MISSING TABLES
-- ================================================================

-- Subscription requests table
CREATE TABLE IF NOT EXISTS subscription_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 99.00,
    upi_transaction_id TEXT NOT NULL,
    payment_proof_url TEXT,
    payment_proof_filename TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 12,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    active_upi_id TEXT,
    upi_merchant_name TEXT,
    upi_ids TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 3. CREATE MISSING FUNCTIONS
-- ================================================================

-- Process referral rewards for subscription activation (7-level system)
CREATE OR REPLACE FUNCTION process_referral_rewards(
  new_active_user_id UUID,
  trigger_type_param TEXT DEFAULT 'subscription_activation'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reward_config JSONB;
  referral_chain RECORD;
  current_user_id UUID;
  current_level INTEGER := 1;
  total_distributed DECIMAL := 0;
  result JSON;
BEGIN
  -- Get reward configuration
  SELECT value INTO reward_config 
  FROM system_settings 
  WHERE key = 'referral_reward_config';
  
  IF reward_config IS NULL THEN
    -- Use default values if config not found
    reward_config := '{
      "level1": 200,
      "level2": 15,
      "level3": 11,
      "level4": 9,
      "level5": 7,
      "level6": 5,
      "level7": 3
    }'::JSONB;
  END IF;

  -- Get the new active user's profile
  SELECT id INTO current_user_id
  FROM user_profiles 
  WHERE user_id = new_active_user_id;
  
  IF current_user_id IS NULL THEN
    SELECT json_build_object(
      'success', false,
      'message', 'User profile not found',
      'distributed', 0
    ) INTO result;
    RETURN result;
  END IF;

  -- Process each level in the referral chain
  WHILE current_level <= 7 LOOP
    -- Get current user's referrer
    SELECT referred_by INTO current_user_id
    FROM user_profiles 
    WHERE id = current_user_id;
    
    -- Exit if no more referrers
    EXIT WHEN current_user_id IS NULL;
    
    -- Get reward amount for this level
    DECLARE
      reward_amount DECIMAL;
      new_user_profile_id UUID;
    BEGIN
      reward_amount := (reward_config ->> ('level' || current_level))::DECIMAL;
      
      -- Get new user's profile ID for commission record
      SELECT id INTO new_user_profile_id
      FROM user_profiles 
      WHERE user_id = new_active_user_id;
      
      -- Check if commission already exists to prevent duplicates
      IF NOT EXISTS (
        SELECT 1 FROM referral_commissions 
        WHERE referrer_id = current_user_id
        AND trigger_user_id = new_active_user_id
        AND trigger_type = trigger_type_param
        AND level = current_level
      ) THEN
        -- Create commission record
        INSERT INTO referral_commissions (
          referrer_id,
          referee_id,
          order_id,
          level,
          commission_rate,
          commission_amount,
          status,
          trigger_type,
          trigger_user_id
        ) VALUES (
          current_user_id,
          new_user_profile_id,
          NULL, -- No order for subscription activation
          current_level,
          0, -- Not percentage-based, fixed amount
          reward_amount,
          'paid', -- Automatically mark as paid
          trigger_type_param,
          new_active_user_id
        );
        
        -- Update referrer's earnings
        UPDATE user_profiles 
        SET 
          total_earnings = total_earnings + reward_amount,
          available_balance = available_balance + reward_amount,
          updated_at = NOW()
        WHERE id = current_user_id;
        
        total_distributed := total_distributed + reward_amount;
      END IF;
    END;
    
    current_level := current_level + 1;
  END LOOP;
  
  SELECT json_build_object(
    'success', true,
    'levels_processed', current_level - 1,
    'total_distributed', total_distributed
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Check user subscription status
CREATE OR REPLACE FUNCTION check_user_subscription_status(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_status TEXT;
BEGIN
    SELECT subscription_status INTO user_status
    FROM user_profiles
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_status, 'inactive');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user subscription status
CREATE OR REPLACE FUNCTION update_user_subscription_status(user_uuid UUID, new_status TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_profiles
    SET subscription_status = new_status,
        updated_at = NOW()
    WHERE user_id = user_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user subscription requests
CREATE OR REPLACE FUNCTION get_user_subscription_requests(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    amount DECIMAL(10,2),
    upi_transaction_id TEXT,
    payment_proof_url TEXT,
    payment_proof_filename TEXT,
    status TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Only return requests for the authenticated user
    IF auth.uid() = user_uuid THEN
        RETURN QUERY
        SELECT sr.id, sr.user_id, sr.amount, sr.upi_transaction_id,
               sr.payment_proof_url, sr.payment_proof_filename, sr.status,
               sr.admin_notes, sr.requested_at, sr.processed_at, sr.processed_by,
               sr.created_at, sr.updated_at
        FROM subscription_requests sr
        WHERE sr.user_id = user_uuid
        ORDER BY sr.created_at DESC;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check admin status
CREATE OR REPLACE FUNCTION check_admin_status(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins 
        WHERE email = user_email AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active UPI configuration
CREATE OR REPLACE FUNCTION get_active_upi_config()
RETURNS JSON AS $$
DECLARE
    admin_record RECORD;
    result JSON;
BEGIN
    SELECT active_upi_id, upi_merchant_name, upi_ids
    INTO admin_record
    FROM admins
    WHERE is_active = true
    LIMIT 1;
    
    IF admin_record.active_upi_id IS NOT NULL THEN
        result := json_build_object(
            'upi_id', admin_record.active_upi_id,
            'merchant_name', admin_record.upi_merchant_name,
            'upi_ids', admin_record.upi_ids
        );
    ELSE
        result := NULL;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle subscription activation
CREATE OR REPLACE FUNCTION handle_subscription_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only when status changes to active and user was actually referred
  IF TG_OP = 'UPDATE'
     AND NEW.subscription_status = 'active'
     AND (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
     AND NEW.referred_by IS NOT NULL THEN
    PERFORM process_referral_rewards(NEW.user_id, 'subscription_activation');
  END IF;
  RETURN NEW;
END;
$$;

-- ================================================================
-- 4. CREATE MISSING TRIGGERS
-- ================================================================

-- Updated_at triggers for new tables
DROP TRIGGER IF EXISTS update_subscription_requests_updated_at ON subscription_requests;
CREATE TRIGGER update_subscription_requests_updated_at BEFORE UPDATE ON subscription_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Subscription activation trigger
DROP TRIGGER IF EXISTS user_subscription_activation_trigger ON user_profiles;
CREATE TRIGGER user_subscription_activation_trigger
    AFTER UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_subscription_activation();

-- ================================================================
-- 5. ENABLE RLS ON NEW TABLES
-- ================================================================

ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 6. CREATE RLS POLICIES FOR NEW TABLES
-- ================================================================

-- Subscription requests policies
DROP POLICY IF EXISTS "Users can view own subscription requests" ON subscription_requests;
CREATE POLICY "Users can view own subscription requests" ON subscription_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own subscription requests" ON subscription_requests;
CREATE POLICY "Users can create own subscription requests" ON subscription_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending subscription requests" ON subscription_requests;
CREATE POLICY "Users can update own pending subscription requests" ON subscription_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Subscription plans policies
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- User subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- System settings policies
DROP POLICY IF EXISTS "Anyone can read system settings" ON system_settings;
CREATE POLICY "Anyone can read system settings" ON system_settings
    FOR SELECT USING (true);

-- Admin policies (for subscription requests)
DROP POLICY IF EXISTS "Admins can manage all subscription requests" ON subscription_requests;
CREATE POLICY "Admins can manage all subscription requests" ON subscription_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            ) AND is_active = true
        )
    );

-- ================================================================
-- 7. INSERT DEFAULT DATA
-- ================================================================

-- Insert default subscription plan
INSERT INTO subscription_plans (name, description, price, duration_months, features, is_active)
VALUES (
    'Premium Annual Plan',
    'Full access to all MATRATV CARE features including shopping, referrals, and premium support',
    99.00,
    12,
    '{"features": ["Shopping Cart", "Product Purchases", "Referral System", "Commission Earnings", "Withdrawal Requests", "Premium Support"]}',
    true
) ON CONFLICT DO NOTHING;

-- Insert default reward configuration
INSERT INTO system_settings (key, value, description)
VALUES (
    'referral_reward_config',
    '{
        "level1": 200,
        "level2": 15,
        "level3": 11,
        "level4": 9,
        "level5": 7,
        "level6": 5,
        "level7": 3
    }'::jsonb,
    '7-level fixed reward structure amounts in rupees'
) ON CONFLICT (key) DO NOTHING;

-- ================================================================
-- 8. GRANT PERMISSIONS
-- ================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION process_referral_rewards(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_subscription_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_upi_config() TO authenticated;
GRANT SELECT ON system_settings TO authenticated;

-- ================================================================
-- 9. UPDATE EXISTING USER PROFILES
-- ================================================================

-- Set default subscription status for existing users
UPDATE user_profiles SET subscription_status = 'active' WHERE subscription_status IS NULL;

-- Update email field from auth.users if missing
UPDATE user_profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE user_profiles.user_id = auth.users.id 
AND user_profiles.email IS NULL;

COMMIT;
