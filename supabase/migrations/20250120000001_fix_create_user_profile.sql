-- Fix create_user_profile function to handle null metadata properly
-- This prevents the database error during user registration

BEGIN;

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS create_user_profile();

-- Recreate the function with better null handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
    full_name_val TEXT;
    phone_val TEXT;
    referral_code_val TEXT;
BEGIN
    -- Generate unique referral code
    LOOP
        ref_code := generate_referral_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = ref_code);
    END LOOP;
    
    -- Safely extract metadata values with null checks
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    phone_val := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    referral_code_val := NEW.raw_user_meta_data->>'referral_code';
    
    -- Find referrer if referral code exists in metadata
    IF referral_code_val IS NOT NULL AND referral_code_val != '' THEN
        SELECT id INTO referrer_id 
        FROM public.user_profiles 
        WHERE referral_code = referral_code_val;
    END IF;
    
    -- Insert user profile with safe values
    INSERT INTO public.user_profiles (
        user_id, 
        full_name, 
        phone, 
        referral_code, 
        referred_by,
        email,
        subscription_status
    ) VALUES (
        NEW.id,
        NULLIF(full_name_val, ''), -- Convert empty string to NULL
        NULLIF(phone_val, ''),     -- Convert empty string to NULL
        ref_code,
        referrer_id,
        NEW.email,
        'inactive' -- Default to inactive until subscription is activated
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

COMMIT;
