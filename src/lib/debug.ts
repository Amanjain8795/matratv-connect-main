export const debugSystemStatus = () => {
  console.log('🔍 System Debug Information:');
  console.log('==========================================');
  
  // Environment variables
  console.log('📋 Environment Variables:');
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('- VITE_SITE_URL:', import.meta.env.VITE_SITE_URL);
  
  // Check if using placeholder credentials
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isPlaceholder = supabaseUrl === 'https://your-project.supabase.co' || 
                       supabaseAnonKey === 'your-anon-key-here';
  
  console.log('🔧 Configuration Status:');
  console.log('- Using placeholder credentials:', isPlaceholder ? '❌ Yes (Mock mode)' : '✅ No (Real Supabase)');
  
  // Local storage data
  console.log('💾 Local Storage Data:');
  console.log('- mockUser:', localStorage.getItem('mockUser') ? '✅ Present' : '❌ None');
  console.log('- mockProfile:', localStorage.getItem('mockProfile') ? '✅ Present' : '❌ None');
  
  // Current URL
  console.log('🌐 Current Location:');
  console.log('- URL:', window.location.href);
  console.log('- Host:', window.location.host);
  console.log('- Protocol:', window.location.protocol);
  
  console.log('==========================================');
};

// Add to window for easy access in browser console
(window as any).debugSystem = debugSystemStatus;
