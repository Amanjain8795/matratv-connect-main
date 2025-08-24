import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Admin client that bypasses RLS (for production admin operations)
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      // Production security settings
      db: {
        schema: 'public'
      }
    })
  : null

// Check if admin client is available
export const hasAdminAccess = !!supabaseAdmin && !!supabaseUrl && !!supabaseServiceKey

// Log admin access status
console.log('Admin Client Status:', hasAdminAccess ? '✅ Configured' : '❌ Missing Service Role Key')
