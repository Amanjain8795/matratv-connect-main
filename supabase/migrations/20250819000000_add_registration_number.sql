-- Add registration_number to user_profiles and backfill existing rows
-- Format: 'MAT' + 4+ digit increasing number starting at 1001 (e.g., MAT1001, MAT1002, ...)

BEGIN;

-- 1) Add column if missing
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS registration_number text;

-- 2) Add a CHECK to enforce pattern when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_registration_number_format_chk'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_registration_number_format_chk
      CHECK (
        registration_number IS NULL OR registration_number ~ '^MAT[0-9]{4,}$'
      );
  END IF;
END$$;

-- 3) Add a UNIQUE index to guarantee uniqueness (allow NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'user_profiles_registration_number_key'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_registration_number_key
    ON public.user_profiles (registration_number)
    WHERE registration_number IS NOT NULL;
  END IF;
END$$;

-- 4) Backfill existing rows that are missing registration_number deterministically
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM public.user_profiles
  WHERE registration_number IS NULL
)
UPDATE public.user_profiles up
SET registration_number = 'MAT' || to_char(1000 + rn, 'FM0000')
FROM numbered n
WHERE up.id = n.id;

COMMIT;


