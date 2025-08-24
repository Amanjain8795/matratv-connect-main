-- ================================================================
-- MATRATV CARE - COMPLETE DATABASE SETUP
-- ================================================================
-- This file contains ALL database requirements for the complete system
-- Run this in your Supabase SQL editor to set up everything

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. CORE TABLES
-- ================================================================

-- User profiles table (with subscription status)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by UUID REFERENCES public.user_profiles(id),
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    withdrawn_amount DECIMAL(10,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive')),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'sanitary-pads',
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    payment_id TEXT,
    razorpay_order_id TEXT,       
    razorpay_signature TEXT,
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral commissions table (enhanced for 7-level system)
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 7),
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    trigger_type TEXT DEFAULT 'order_purchase' CHECK (trigger_type IN ('order_purchase', 'subscription_activation')),
    trigger_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    upi_id TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id)
);

-- Cart items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ================================================================
-- 2. SUBSCRIPTION SYSTEM TABLES
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

-- ================================================================
-- 3. ADMIN SYSTEM TABLES
-- ================================================================

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

-- System settings table (for configurable rewards)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referred_by ON user_profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_trigger_type ON referral_commissions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_trigger_user ON referral_commissions(trigger_user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user_id ON subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- ================================================================
-- 5. CORE FUNCTIONS
-- ================================================================

-- Generate referral code function
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create user profile automatically
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
BEGIN
    -- Generate unique referral code
    LOOP
        ref_code := generate_referral_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = ref_code);
    END LOOP;
    
    -- Find referrer if referral code exists in metadata
    IF NEW.raw_user_meta_data ? 'referral_code' THEN
        SELECT id INTO referrer_id 
        FROM public.user_profiles 
        WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    END IF;
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        user_id, 
        full_name, 
        phone, 
        referral_code, 
        referred_by
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        ref_code,
        referrer_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 6. REFERRAL SYSTEM FUNCTIONS
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

-- Distribute referral commissions for orders (legacy function)
CREATE OR REPLACE FUNCTION distribute_referral_commissions(order_id_param UUID)
RETURNS VOID AS $$
DECLARE
    order_rec RECORD;
    referrer_rec RECORD;
    commission_rates DECIMAL[] := ARRAY[0.10, 0.05, 0.03, 0.02, 0.01, 0.01, 0.01]; -- 10%, 5%, 3%, 2%, 1%, 1%, 1%
    current_level INTEGER := 1;
    current_referrer_id UUID;
    commission_amount DECIMAL(10,2);
BEGIN
    -- Get order details
    SELECT * INTO order_rec FROM public.orders WHERE id = order_id_param;
    
    -- Get the buyer's referrer
    SELECT referred_by INTO current_referrer_id 
    FROM public.user_profiles up
    JOIN auth.users au ON up.user_id = au.id
    WHERE au.id = order_rec.user_id;
    
    -- Loop through referral levels
    WHILE current_referrer_id IS NOT NULL AND current_level <= 7 LOOP
        -- Calculate commission
        commission_amount := order_rec.total_amount * commission_rates[current_level];
        
        -- Insert commission record
        INSERT INTO public.referral_commissions (
            referrer_id, 
            referee_id, 
            order_id, 
            level, 
            commission_rate, 
            commission_amount,
            trigger_type,
            trigger_user_id
        ) VALUES (
            current_referrer_id,
            (SELECT id FROM public.user_profiles WHERE user_id = order_rec.user_id),
            order_id_param,
            current_level,
            commission_rates[current_level],
            commission_amount,
            'order_purchase',
            order_rec.user_id
        );
        
        -- Update referrer's earnings
        UPDATE public.user_profiles 
        SET 
            total_earnings = total_earnings + commission_amount,
            available_balance = available_balance + commission_amount
        WHERE id = current_referrer_id;
        
        -- Get next referrer
        SELECT referred_by INTO current_referrer_id 
        FROM public.user_profiles 
        WHERE id = current_referrer_id;
        
        current_level := current_level + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 7. SUBSCRIPTION SYSTEM FUNCTIONS
-- ================================================================

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

-- ================================================================
-- 8. ADMIN SYSTEM FUNCTIONS
-- ================================================================

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

-- ================================================================
-- 9. TRIGGERS
-- ================================================================

-- Create user profile trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Order payment trigger
DROP TRIGGER IF EXISTS handle_order_payment_trigger ON public.orders;
CREATE TRIGGER handle_order_payment_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION handle_order_payment();

-- Subscription activation trigger
DROP TRIGGER IF EXISTS user_subscription_activation_trigger ON user_profiles;
CREATE TRIGGER user_subscription_activation_trigger
    AFTER UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_subscription_activation();

-- ================================================================
-- 10. TRIGGER FUNCTIONS
-- ================================================================

-- Handle order payment
CREATE OR REPLACE FUNCTION handle_order_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        PERFORM distribute_referral_commissions(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- 11. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 12. RLS POLICIES
-- ================================================================

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Order items policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create order items for own orders" ON public.order_items;
CREATE POLICY "Users can create order items for own orders" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Referral commissions policies
DROP POLICY IF EXISTS "Users can view own commissions" ON public.referral_commissions;
CREATE POLICY "Users can view own commissions" ON public.referral_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = referral_commissions.referrer_id 
            AND user_profiles.user_id = auth.uid()
        )
    );

-- Withdrawal requests policies
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can create own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cart items policies
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

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
-- 13. STORAGE SETUP
-- ================================================================

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
CREATE POLICY "Users can upload payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view own payment proofs" ON storage.objects;
CREATE POLICY "Users can view own payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND
        EXISTS (
            SELECT 1 FROM admins 
            WHERE email = (
                SELECT email FROM auth.users 
                WHERE id = auth.uid()
            ) AND is_active = true
        )
    );

-- ================================================================
-- 14. DEFAULT DATA
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

-- Set default subscription status for existing users to 'active' (for migration)
UPDATE user_profiles SET subscription_status = 'active' WHERE subscription_status IS NULL;

-- ================================================================
-- 15. PERMISSIONS
-- ================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION process_referral_rewards(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION distribute_referral_commissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_subscription_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_subscription_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_upi_config() TO authenticated;
GRANT SELECT ON system_settings TO authenticated;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ MATRATV CARE database setup completed successfully!';
    RAISE NOTICE '📊 Features included:';
    RAISE NOTICE '   - Complete e-commerce system (products, orders, cart)';
    RAISE NOTICE '   - 7-level referral system with fixed rewards';
    RAISE NOTICE '   - Subscription system with payment verification';
    RAISE NOTICE '   - Admin panel with UPI management';
    RAISE NOTICE '   - Withdrawal system';
    RAISE NOTICE '   - Row Level Security (RLS) policies';
    RAISE NOTICE '   - Automatic triggers and functions';
    RAISE NOTICE '🎯 System is ready for production use!';
END $$;
