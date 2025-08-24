# 🔑 Get Your Service Role Key for Production

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Visit: https://app.supabase.com
- Select your project: **MATRATV CARE**

### 2. Navigate to API Settings
- Click **Settings** (gear icon) in left sidebar
- Click **API** in the settings menu

### 3. Copy Service Role Key
- Find the **service_role** section (NOT anon/public)
- Click the **copy** button next to the service role key
- It should start with `eyJ` and be very long

### 4. Set the Key Securely

**Option A: Using DevServerControl (Recommended)**
```javascript
// Replace 'your-actual-service-role-key' with the key you copied
DevServerControl.set_env_variable(['VITE_SUPABASE_SERVICE_ROLE_KEY', 'your-actual-service-role-key'])
```

**Option B: Manual .env (Less Secure)**
```env
VITE_SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

### 5. Apply Database Policies
Run the SQL in `PRODUCTION_RLS_POLICIES.sql` in your Supabase SQL Editor

### 6. Restart Development Server
```bash
# If you used .env file
npm run dev
```

## Example Key Format
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteHpuYXBsdC...
```

## Security Notes
- ⚠️ **NEVER commit this key to git**
- 🔒 This key has **full database access**
- 🏭 Only use for **admin operations**
- 🔄 **Rotate regularly** for security

## Verification
After setup, try creating a product in the admin panel. You should see:
- ✅ No RLS errors
- ✅ "Production Admin Client: ✅ Configured" in console
- ✅ Products created successfully
