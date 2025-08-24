import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import { supabase, type UserProfile, type ShippingAddress, checkUserSubscriptionStatus } from '@/lib/supabase';
import { sessionManager, type SessionData } from '@/lib/session-manager';
import { errorManager, AuthError, ValidationError } from '@/lib/error-manager';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Auth State Machine
enum AuthState {
  INITIALIZING = 'INITIALIZING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  ERROR = 'ERROR'
}

// Auth Actions
type AuthAction = 
  | { type: 'INITIALIZE_START' }
  | { type: 'INITIALIZE_SUCCESS'; payload: SessionData }
  | { type: 'INITIALIZE_FAILURE'; payload: Error }
  | { type: 'AUTH_SUCCESS'; payload: SessionData }
  | { type: 'AUTH_FAILURE'; payload: Error }
  | { type: 'SIGNOUT_SUCCESS' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'PROFILE_UPDATED'; payload: UserProfile };

interface AuthContextValue {
  // State
  state: AuthState;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;

  // Subscription status
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;

  // Authentication methods
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Password reset methods
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (accessToken: string, newPassword: string) => Promise<void>;

  // Profile methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Subscription methods
  checkSubscription: () => Promise<void>;

  // Utility methods
  requireAuth: () => void;
  clearError: () => void;
  retry: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Auth State Reducer
function authReducer(state: { authState: AuthState; sessionData: SessionData | null; error: Error | null }, action: AuthAction) {
  switch (action.type) {
    case 'INITIALIZE_START':
      return {
        ...state,
        authState: AuthState.INITIALIZING,
        error: null
      };
      
    case 'INITIALIZE_SUCCESS':
    case 'AUTH_SUCCESS':
      return {
        ...state,
        authState: AuthState.AUTHENTICATED,
        sessionData: action.payload,
        error: null
      };
      
    case 'INITIALIZE_FAILURE':
    case 'AUTH_FAILURE':
      return {
        ...state,
        authState: AuthState.ERROR,
        sessionData: null,
        error: action.payload
      };
      
    case 'SIGNOUT_SUCCESS':
    case 'SESSION_EXPIRED':
      return {
        ...state,
        authState: AuthState.UNAUTHENTICATED,
        sessionData: null,
        error: null
      };
      
    case 'PROFILE_UPDATED':
      return {
        ...state,
        sessionData: state.sessionData ? {
          ...state.sessionData,
          profile: action.payload
        } : null
      };
      
    default:
      return state;
  }
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState({
    authState: AuthState.INITIALIZING,
    sessionData: null as SessionData | null,
    error: null as Error | null
  });

  const [subscriptionState, setSubscriptionState] = useState({
    hasActiveSubscription: false,
    subscriptionLoading: true
  });

  const [requireAuthOpen, setRequireAuthOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Dispatch function for state updates
  const dispatch = useCallback((action: AuthAction) => {
    setState(prevState => authReducer(prevState, action));
  }, []);

  // Helper function to handle subscription redirection
  const redirectToSubscription = useCallback(() => {
    const currentPath = window.location.pathname;

    // Don't redirect from these pages
    const allowedPaths = [
      '/subscription',
      '/login',
      '/register',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
      '/admin'
    ];

    const isOnAllowedPath = allowedPaths.some(path => currentPath.startsWith(path));

    if (!isOnAllowedPath) {
      console.log('Redirecting to subscription page from:', currentPath);
      navigate('/subscription');
    }
  }, [navigate]);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    const currentUser = state.sessionData?.user;

    if (!currentUser) {
      console.log('🔍 No user found, setting subscription to inactive');
      setSubscriptionState({ hasActiveSubscription: false, subscriptionLoading: false });
      return;
    }

    try {
      console.log('🔍 Checking subscription status for user:', currentUser.id);
      setSubscriptionState(prev => ({ ...prev, subscriptionLoading: true }));

      // First check from profile if available
      if (state.sessionData?.profile?.subscription_status) {
        const hasActive = state.sessionData.profile.subscription_status === 'active';
        console.log('🔍 Subscription status from profile:', hasActive ? 'active' : 'inactive');
        setSubscriptionState({ hasActiveSubscription: hasActive, subscriptionLoading: false });

        // Redirect to subscription if not active
        if (!hasActive) {
          redirectToSubscription();
        }
        return;
      }

      // Otherwise check from database
      console.log('🔍 Profile not available, checking database...');
      const subscriptionStatus = await checkUserSubscriptionStatus(currentUser.id);
      const hasActive = subscriptionStatus === 'active';
      console.log('🔍 Subscription status from database:', subscriptionStatus);

      setSubscriptionState({ hasActiveSubscription: hasActive, subscriptionLoading: false });

      // Redirect to subscription if not active
      if (!hasActive) {
        redirectToSubscription();
      }

    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      setSubscriptionState({ hasActiveSubscription: false, subscriptionLoading: false });
      // On error, redirect to subscription page to be safe
      redirectToSubscription();
    }
  }, [state.sessionData?.user, state.sessionData?.profile, redirectToSubscription]);

  // Initialize authentication
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        dispatch({ type: 'INITIALIZE_START' });
        console.log('🔄 Starting auth initialization...');

        const sessionData = await sessionManager.initialize();

        if (!isMounted) return;

        if (sessionData) {
          console.log('✅ Auth initialization successful, user found');
          dispatch({ type: 'INITIALIZE_SUCCESS', payload: sessionData });
        } else {
          console.log('ℹ️ Auth initialization complete, no active session');
          dispatch({ type: 'SIGNOUT_SUCCESS' });
        }
      } catch (error) {
        if (!isMounted) return;

        console.error('❌ Auth initialization failed:', error);
        const appError = errorManager.categorizeError(error, 'AuthProvider.initialize');
        dispatch({ type: 'INITIALIZE_FAILURE', payload: appError });
      }
    };

    initialize();

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe((sessionData) => {
      if (!isMounted) return;

      if (sessionData) {
        console.log('📡 Session change: user authenticated');
        dispatch({ type: 'AUTH_SUCCESS', payload: sessionData });
      } else {
        console.log('📡 Session change: user signed out');
        dispatch({ type: 'SIGNOUT_SUCCESS' });
        setSubscriptionState({ hasActiveSubscription: false, subscriptionLoading: false });
      }
    });

    // Listen for Supabase auth changes (for real auth mode)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔐 Supabase auth state change:', event, session?.user?.id);

      // Let session manager handle the session update
      if (event === 'SIGNED_OUT' || !session) {
        dispatch({ type: 'SIGNOUT_SUCCESS' });
        setSubscriptionState({ hasActiveSubscription: false, subscriptionLoading: false });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Check subscription when auth state changes to authenticated
  useEffect(() => {
    if (state.authState === AuthState.AUTHENTICATED && state.sessionData?.user) {
      console.log('🔍 User authenticated, checking subscription status...');
      setTimeout(() => {
        checkSubscription();
      }, 100);
    }
  }, [state.authState, state.sessionData?.user, checkSubscription]);

  // Sign up method
  const signUp = async (data: SignUpData): Promise<void> => {
    try {
      // Don't change the global auth state during signup - just handle the signup process
      // The loading state should be managed by the component, not the global auth state

      // Validate input
      if (!data.email || !data.password || !data.fullName) {
        throw new ValidationError('All required fields must be filled');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new ValidationError('Please enter a valid email address');
      }

      if (data.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }

      // Check if using placeholder credentials
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                           import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key-here';

      if (isPlaceholder) {
        await handleMockSignUp(data);
        return;
      }

      // Real Supabase registration
      const userData = {
        full_name: data.fullName,
        phone: data.phone
      };

      if (data.referralCode) {
        (userData as any).referral_code = data.referralCode.toUpperCase();
      }

      const redirectURL = `${import.meta.env.VITE_SITE_URL || window.location.origin}/verify-email`;

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userData,
          emailRedirectTo: redirectURL
        }
      });

      if (error) {
        // Handle different Supabase signup error cases
        if (error.message.includes('User already registered')) {
          // For existing users, just try to resend verification email
          // This is simpler and avoids complications with checking verification status
          try {
            // Attempt signup again to resend verification (this will work for unverified users)
            const { error: resendError } = await supabase.auth.signUp({
              email: data.email,
              password: data.password,
              options: {
                data: userData,
                emailRedirectTo: redirectURL
              }
            });

            // If no error, it means verification was resent
            if (!resendError) {
              toast({
                description: t('auth.verificationEmailResent'),
                variant: 'default'
              });
              return;
            }

            // If we get here, the user likely already exists and is verified
            throw new AuthError(t('auth.emailAlreadyVerified'));
          } catch (innerError: any) {
            if (innerError.message === t('auth.emailAlreadyVerified')) {
              throw innerError;
            }
            // If we can't determine status, show generic already registered message
            throw new AuthError(t('auth.emailAlreadyRegistered'));
          }
        }
        throw new AuthError(error.message);
      }

      if (authData.user && !authData.session) {
        // Email confirmation required - this is the normal flow
        toast({
          description: t('auth.verificationEmailSent'),
          variant: 'default'
        });
      } else if (authData.session) {
        // Auto-signed in (shouldn't happen with email confirmation enabled)
        const sessionData = await sessionManager.initialize();
        if (sessionData) {
          dispatch({ type: 'AUTH_SUCCESS', payload: sessionData });
          setTimeout(() => {
            navigate('/subscription');
          }, 100);
        }
        toast({ description: t('auth.registrationSuccess') });
      }
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.signUp');

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });

      throw appError;
    }
  };

  // Sign in method
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Check if using placeholder credentials
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                           import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key-here';

      if (isPlaceholder) {
        await handleMockSignIn(email);
        return;
      }

      // Real Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new AuthError(t('auth.emailNotVerified'));
        }
        throw new AuthError(error.message);
      }

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new AuthError(t('auth.emailNotVerified'));
      }

      // Initialize session
      const sessionData = await sessionManager.initialize();
      if (sessionData) {
        dispatch({ type: 'AUTH_SUCCESS', payload: sessionData });
        // Check subscription after successful login
        setTimeout(() => {
          checkSubscription();
        }, 100);
      }

      toast({ description: t('auth.welcomeBack') });
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.signIn');

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });

      throw appError;
    }
  };

  // Sign out method
  const signOut = async (): Promise<void> => {
    try {
      await sessionManager.signOut();
      dispatch({ type: 'SIGNOUT_SUCCESS' });
      
      toast({ description: t('auth.signedOut') });
      
      // Navigate to home
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.signOut');
      console.error('Sign out error:', appError);
      
      // Always dispatch signout success for local cleanup
      dispatch({ type: 'SIGNOUT_SUCCESS' });
      
      toast({
        description: 'Signed out successfully',
        variant: 'default'
      });
      
      navigate('/');
    }
  };

  // Request password reset method
  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError('Please enter a valid email address');
      }

      // Check if using placeholder credentials
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                           import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key-here';

      if (isPlaceholder) {
        // Mock password reset
        console.warn('Mock password reset - Supabase not configured');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        toast({
          description: 'Password reset email sent (mock mode)',
          variant: 'default'
        });
        return;
      }

      // Get the redirect URL for password reset
      const redirectURL = `${import.meta.env.VITE_SITE_URL || window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectURL,
      });

      if (error) {
        // Handle specific Supabase errors
        if (error.message?.includes('not found') || error.message?.includes('Invalid')) {
          throw new AuthError('No account found with this email address');
        } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
          throw new AuthError('Too many reset attempts. Please wait before trying again.');
        } else {
          throw new AuthError(error.message);
        }
      }

      toast({
        description: 'Password reset email sent. Please check your inbox.',
        variant: 'default'
      });
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.requestPasswordReset');

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });

      throw appError;
    }
  };

  // Reset password method
  const resetPassword = async (accessToken: string, newPassword: string): Promise<void> => {
    try {
      // Validate inputs
      if (!accessToken) {
        throw new AuthError('Invalid reset token');
      }

      if (!newPassword || newPassword.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }

      // Check if using placeholder credentials
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co' ||
                           import.meta.env.VITE_SUPABASE_ANON_KEY === 'your-anon-key-here';

      if (isPlaceholder) {
        // Mock password reset
        console.warn('Mock password reset - Supabase not configured');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        toast({
          description: 'Password updated successfully (mock mode)',
          variant: 'default'
        });
        return;
      }

      // Set the session with the access token first
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // We don't have the refresh token from URL, but Supabase will handle this
      });

      if (sessionError) {
        throw new AuthError('Invalid or expired reset link. Please request a new password reset.');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        if (updateError.message?.includes('weak') || updateError.message?.includes('common')) {
          throw new ValidationError('Password is too weak. Please choose a stronger password.');
        } else if (updateError.message?.includes('expired') || updateError.message?.includes('invalid')) {
          throw new AuthError('Reset link has expired. Please request a new password reset.');
        } else {
          throw new AuthError(updateError.message);
        }
      }

      // Sign out after successful password reset
      await supabase.auth.signOut();

      toast({
        description: 'Password updated successfully. Please log in with your new password.',
        variant: 'default'
      });
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.resetPassword');

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });

      throw appError;
    }
  };

  // Update profile method
  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      const updatedProfile = await sessionManager.updateProfile(updates);
      if (updatedProfile) {
        dispatch({ type: 'PROFILE_UPDATED', payload: updatedProfile });
        toast({ description: t('profile.updated') });

        // Re-check subscription if subscription_status was updated
        if (updates.subscription_status) {
          await checkSubscription();
        }
      }
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.updateProfile');

      toast({
        description: appError.userMessage,
        variant: 'destructive'
      });

      throw appError;
    }
  };

  // Functions moved above to fix hoisting issue

  // Mock authentication handlers
  const handleMockSignUp = async (data: SignUpData): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email: data.email,
      created_at: new Date().toISOString(),
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone
      }
    };

    const mockProfile = {
      id: `mock-profile-${Date.now()}`,
      user_id: mockUser.id,
      full_name: data.fullName,
      phone: data.phone,
      referral_code: `MOCK${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      referred_by: null,
      total_earnings: 0,
      available_balance: 0,
      withdrawn_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    localStorage.setItem('mockProfile', JSON.stringify(mockProfile));

    const sessionData = await sessionManager.initialize();
    if (sessionData) {
      dispatch({ type: 'AUTH_SUCCESS', payload: sessionData });
      // Redirect to subscription page after mock signup
      setTimeout(() => {
        navigate('/subscription');
      }, 100);
    }

    toast({ description: t('auth.registrationSuccess') });
  };

  const handleMockSignIn = async (email: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    let mockUser = localStorage.getItem('mockUser');
    let mockProfile = localStorage.getItem('mockProfile');

    if (!mockUser) {
      // Create default mock user
      const user = {
        id: `mock-user-${Date.now()}`,
        email,
        created_at: new Date().toISOString(),
        user_metadata: {
          full_name: 'Demo User',
          phone: '+91-9876543210'
        }
      };

      const profile = {
        id: `mock-profile-${Date.now()}`,
        user_id: user.id,
        full_name: 'Demo User',
        phone: '+91-9876543210',
        referral_code: `DEMO${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        referred_by: null,
        total_earnings: 500,
        available_balance: 300,
        withdrawn_amount: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      localStorage.setItem('mockUser', JSON.stringify(user));
      localStorage.setItem('mockProfile', JSON.stringify(profile));
    }

    const sessionData = await sessionManager.initialize();
    if (sessionData) {
      dispatch({ type: 'AUTH_SUCCESS', payload: sessionData });
      // Check subscription after mock signin
      setTimeout(() => {
        checkSubscription();
      }, 100);
    }

    toast({ description: t('auth.welcomeBack') });
  };

  // Utility methods
  const requireAuth = useCallback(() => {
    if (state.authState !== AuthState.AUTHENTICATED) {
      setRequireAuthOpen(true);
    }
  }, [state.authState]);

  const clearError = useCallback(() => {
    setState(prevState => ({ ...prevState, error: null }));
  }, []);

  const retry = useCallback(async () => {
    try {
      dispatch({ type: 'INITIALIZE_START' });
      const sessionData = await sessionManager.initialize();
      
      if (sessionData) {
        dispatch({ type: 'INITIALIZE_SUCCESS', payload: sessionData });
      } else {
        dispatch({ type: 'SIGNOUT_SUCCESS' });
      }
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'AuthProvider.retry');
      dispatch({ type: 'INITIALIZE_FAILURE', payload: appError });
    }
  }, [dispatch]);

  // Context value
  const value: AuthContextValue = {
    state: state.authState,
    user: state.sessionData?.user || null,
    profile: state.sessionData?.profile || null,
    loading: state.authState === AuthState.INITIALIZING,
    error: state.error,
    hasActiveSubscription: subscriptionState.hasActiveSubscription,
    subscriptionLoading: subscriptionState.subscriptionLoading,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    checkSubscription,
    requireAuth,
    clearError,
    retry
  };

  // Show loading screen while initializing
  if (state.authState === AuthState.INITIALIZING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      <RequireAuthDialog 
        open={requireAuthOpen} 
        onOpenChange={setRequireAuthOpen}
        onLogin={() => {
          setRequireAuthOpen(false);
          navigate('/login');
        }}
      />
    </AuthContext.Provider>
  );
};

// Require Auth Dialog Component
const RequireAuthDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}> = ({ open, onOpenChange, onLogin }) => {
  const { t } = useTranslation();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("auth.loginRequiredTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("auth.loginRequiredMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onLogin}>
            {t("auth.ok")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth guard hook
export const useAuthGuard = (redirectTo = '/login') => {
  const { state, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state === AuthState.UNAUTHENTICATED) {
      navigate(redirectTo);
    }
  }, [state, navigate, redirectTo]);

  return {
    isAuthenticated: state === AuthState.AUTHENTICATED,
    user,
    loading: state === AuthState.INITIALIZING
  };
};
