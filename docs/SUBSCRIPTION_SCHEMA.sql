-- Subscription System Database Schema
-- This script adds subscription functionality to the existing MATRATV CARE database

-- 1. Add subscription_status column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive'));

-- 2. Create subscription_requests table for payment verification
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

-- 3. Create subscription_plans table for future extensibility
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

-- 4. Create user_subscriptions table for tracking subscription history
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

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user_id ON subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- 6. Insert default subscription plan
INSERT INTO subscription_plans (name, description, price, duration_months, features, is_active)
VALUES (
    'Premium Annual Plan',
    'Full access to all MATRATV CARE features including shopping, referrals, and premium support',
    99.00,
    12,
    '{"features": ["Shopping Cart", "Product Purchases", "Referral System", "Commission Earnings", "Withdrawal Requests", "Premium Support"]}',
    true
) ON CONFLICT DO NOTHING;

-- 7. RLS Policies for subscription_requests
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription requests
CREATE POLICY "Users can view own subscription requests" ON subscription_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own subscription requests
CREATE POLICY "Users can create own subscription requests" ON subscription_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending subscription requests
CREATE POLICY "Users can update own pending subscription requests" ON subscription_requests
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 8. RLS Policies for subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active subscription plans
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- 9. RLS Policies for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- 10. Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_subscription_requests_updated_at BEFORE UPDATE ON subscription_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Function to check user subscription status
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

-- 12. Function to update user subscription status
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

-- 13. Function to safely get user subscription requests (bypasses RLS issues)
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

-- 13. Set default subscription status for existing users to 'active' (for migration)
-- Comment this out if you want existing users to need subscriptions
UPDATE user_profiles SET subscription_status = 'active' WHERE subscription_status IS NULL;

-- 14. Create admin policy for subscription management
-- Admins can manage all subscription requests
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

-- 15. Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- 16. Storage policies for payment proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

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
