-- Restore the working create_user_profile function with registration number
-- This fixes the database error during user registration and includes registration numbers

BEGIN;

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS create_user_profile();

-- Recreate the working function with proper null handling and registration number
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    ref_code TEXT;
    referrer_id UUID;
    full_name_val TEXT;
    phone_val TEXT;
    reg_number TEXT;
    next_number INTEGER;
BEGIN
    -- Generate unique referral code
    LOOP
        ref_code := generate_referral_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = ref_code);
    END LOOP;
    
    -- Generate registration number (MAT1001, MAT1002, etc.)
    SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number, 4) AS INTEGER)), 1000)
    INTO next_number
    FROM public.user_profiles 
    WHERE registration_number ~ '^MAT[0-9]{4,}$';
    
    reg_number := 'MAT' || (next_number + 1)::TEXT;
    
    -- Safely extract metadata values with null checks
    full_name_val := CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'full_name' 
        THEN NEW.raw_user_meta_data->>'full_name' 
        ELSE NULL 
    END;
    
    phone_val := CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'phone' 
        THEN NEW.raw_user_meta_data->>'phone' 
        ELSE NULL 
    END;
    
    -- Find referrer if referral code exists in metadata
    IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'referral_code' THEN
        SELECT id INTO referrer_id 
        FROM public.user_profiles 
        WHERE referral_code = NEW.raw_user_meta_data->>'referral_code';
    END IF;
    
    -- Insert user profile with safe values including registration number
    INSERT INTO public.user_profiles (
        user_id, 
        full_name, 
        phone, 
        referral_code, 
        referred_by,
        registration_number
    ) VALUES (
        NEW.id,
        full_name_val,
        phone_val,
        ref_code,
        referrer_id,
        reg_number
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

COMMIT;
