import { supabase } from './supabase'
import { hasAdminAccess, supabaseAdmin } from './supabase-admin'

export const initializeAdminTable = async () => {
  try {
    // Check if admins table exists and has the correct structure
    const { data: tableInfo, error } = await supabase
      .from('admins')
      .select('*')
      .limit(1)

    if (error && error.code === '42P01') {
      // Table doesn't exist, we need to create it
      console.log('Admin table does not exist. It needs to be created in Supabase.')
      console.log('Please run this SQL in your Supabase SQL editor:')
      console.log(`
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admins(id)
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert new admins" ON admins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update admins" ON admins
  FOR UPDATE USING (true);
      `)
      throw new Error('Admin table needs to be created in Supabase')
    }

    return true
  } catch (error) {
    console.error('Admin table initialization error:', error)
    throw error
  }
}

export const seedDefaultAdmin = async () => {
  try {
    // Use admin client with service role key
    const client = hasAdminAccess ? supabaseAdmin! : supabase
    
    if (!client) {
      console.error('Admin client not available')
      return null
    }

    // Check if default admin exists
    const { data: existingAdmin, error: checkError } = await client
      .from('admins')
      .select('*')
      .eq('email', 'aman.csc.99188@gmail.com')
      .single()

    // If table doesn't exist, throw an error
    if (checkError && checkError.code === '42P01') {
      throw new Error('Admin table does not exist. Please initialize the database first.')
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error checking admin:', checkError.message)
      return null
    }

    if (existingAdmin) {
      console.log('Default admin already exists')
      return existingAdmin
    }

    // Create default admin
    const { data: newAdmin, error: insertError } = await client
      .from('admins')
      .insert([{
        email: 'aman.csc.99188@gmail.com',
        full_name: 'Aman Kumar',
        role: 'super_admin',
        is_active: true
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting default admin:', insertError.message)
      return null
    }

    console.log('Default admin created successfully')
    return newAdmin
  } catch (error: any) {
    console.error('Error seeding default admin:', error.message || error)
    // Don't throw here to avoid breaking the app
    return null
  }
}
