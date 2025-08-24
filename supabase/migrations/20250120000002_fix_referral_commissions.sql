-- Fix distribute_referral_commissions function to handle new columns
-- This ensures compatibility with the updated schema

BEGIN;

-- Drop the existing function
DROP FUNCTION IF EXISTS distribute_referral_commissions(UUID);

-- Recreate the function with proper column handling
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
        
        -- Insert commission record with new columns
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
            available_balance = available_balance + commission_amount,
            updated_at = NOW()
        WHERE id = current_referrer_id;
        
        -- Get next referrer
        SELECT referred_by INTO current_referrer_id 
        FROM public.user_profiles 
        WHERE id = current_referrer_id;
        
        current_level := current_level + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
