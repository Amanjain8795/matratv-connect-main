// Authentication debugging utilities

export const logAuthState = (context: string, data: any) => {
  // Auth state logging - call manually when needed for debugging
  // Auto-logging removed to prevent console pollution
  return {
    context,
    timestamp: new Date().toISOString(),
    data
  };
};

export const checkSessionHealth = () => {
  // Session health check - call manually when needed for debugging
  // Auto-run removed to prevent console pollution
  const sessionData = sessionStorage.getItem('authSession');
  const mockUser = localStorage.getItem('mockUser');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return {
    hasSession: !!sessionData,
    sessionAge: sessionData ? (Date.now() - JSON.parse(sessionData).timestamp) / (1000 * 60) : null,
    hasMockData: !!(mockUser && localStorage.getItem('mockProfile')),
    isConfigured: !!supabaseUrl,
    isPlaceholder: supabaseUrl === 'https://your-project.supabase.co'
  };
};

export const simulatePageRefresh = () => {
  if (import.meta.env.DEV) {
    console.log('🔄 Simulating page refresh for auth testing...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

export const clearAllAuthData = () => {
  if (import.meta.env.DEV) {
    console.log('🧹 Clearing all authentication data...');
    sessionStorage.removeItem('authSession');
    localStorage.removeItem('mockUser');
    localStorage.removeItem('mockProfile');
    console.log('✅ All auth data cleared');
  }
};

// Make these functions available globally in development
if (import.meta.env.DEV) {
  (window as any).authDebug = {
    logAuthState,
    checkSessionHealth,
    simulatePageRefresh,
    clearAllAuthData
  };

  // Debug utilities available at window.authDebug (message removed to prevent console pollution)
}
