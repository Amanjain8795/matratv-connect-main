# Database Row Level Security (RLS) Setup

The admin panel is encountering RLS policy violations when creating/updating products. Here are the solutions:

## Option 1: Disable RLS for Products Table (Quick Fix)

Run this SQL in your Supabase SQL Editor:

```sql
-- Disable RLS for products table (allows all operations)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

## Option 2: Create Admin-Friendly RLS Policies (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS and create permissive policies for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admins)
CREATE POLICY "Enable all operations for authenticated users" ON products
FOR ALL USING (auth.role() = 'authenticated');

-- Or more specific policies:

-- Allow read access to everyone
CREATE POLICY "Enable read access for all users" ON products
FOR SELECT USING (true);

-- Allow all operations for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON products
FOR DELETE USING (auth.role() = 'authenticated');
```

## Option 3: Admin-Specific Policies (Most Secure)

If you have an admins table with proper relationships:

```sql
-- Create admin-only policies
CREATE POLICY "Products: Admin full access" ON products
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = auth.jwt() ->> 'email' 
    AND admins.is_active = true
  )
);
```

## Quick Test Query

To test if your admin email is properly recognized:

```sql
-- Check current user
SELECT auth.jwt() ->> 'email' as current_user_email;

-- Check if admin exists
SELECT * FROM admins WHERE email = auth.jwt() ->> 'email';
```

## Troubleshooting

1. **If using Option 1**: Products should work immediately
2. **If using Option 2**: Make sure user is authenticated in the browser
3. **If using Option 3**: Ensure admin exists in admins table with correct email

## Current Error Fix

The app now includes better error messages to identify RLS issues. If you continue to see RLS errors:

1. Try Option 1 (disable RLS) for immediate functionality
2. Then implement Option 2 or 3 for proper security
3. Clear browser cache and re-login to admin panel

## Verification

After applying any option:
1. Refresh the admin panel
2. Try creating a test product
3. Check for success message instead of RLS error
