// Enterprise Session Management System
import { supabase, type UserProfile } from './supabase';
import { User, Session } from '@supabase/supabase-js';
import { errorManager, AuthError } from './error-manager';

export interface SessionData {
  user: User;
  profile: UserProfile | null;
  session: Session;
  lastValidated: number;
  expiresAt: number;
}

export interface SessionConfig {
  refreshThreshold: number; // Refresh session when this close to expiry (ms)
  validationInterval: number; // How often to validate session (ms)
  maxRetries: number;
  timeout: number;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionData: SessionData | null = null;
  private config: SessionConfig;
  private validationTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<SessionData | null> | null = null;
  private listeners: Set<(session: SessionData | null) => void> = new Set();

  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      refreshThreshold: 5 * 60 * 1000, // 5 minutes
      validationInterval: 30 * 60 * 1000, // 30 minutes
      maxRetries: 3,
      timeout: 10000, // 10 seconds
      ...config
    };
  }

  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  async initialize(): Promise<SessionData | null> {
    try {
      // Check if we're using placeholder credentials
      const isPlaceholder = this.isUsingPlaceholder();
      if (isPlaceholder) {
        return this.handleMockSession();
      }

      // Get current session from Supabase
      const { data: { session }, error } = await this.withTimeout(
        supabase.auth.getSession(),
        this.config.timeout
      );

      if (error) {
        throw new AuthError(`Failed to get session: ${error.message}`, error.message);
      }

      if (!session) {
        this.clearSession();
        return null;
      }

      // Load profile data
      let profile = await this.loadProfile(session.user.id);
      // Auto-generate registration number if missing
      try {
        if (profile && !profile.registration_number) {
          const { ensureRegistrationNumber } = await import('./supabase');
          const reg = await ensureRegistrationNumber(session.user.id);
          if (reg) {
            // Reload profile to include the new registration number
            profile = await this.loadProfile(session.user.id);
          }
        }
      } catch (e) {
        console.warn('Failed to ensure registration number:', e);
      }
      
      const sessionData: SessionData = {
        user: session.user,
        profile,
        session,
        lastValidated: Date.now(),
        expiresAt: new Date(session.expires_at!).getTime()
      };

      this.setSession(sessionData);
      this.startSessionMonitoring();
      
      return sessionData;
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'SessionManager.initialize');
      this.clearSession();
      throw appError;
    }
  }

  async refreshSession(): Promise<SessionData | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      return result;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performRefresh(): Promise<SessionData | null> {
    try {
      if (this.isUsingPlaceholder()) {
        return this.sessionData; // Mock sessions don't expire
      }

      const { data: { session }, error } = await this.withTimeout(
        supabase.auth.refreshSession(),
        this.config.timeout
      );

      if (error) {
        throw new AuthError(`Failed to refresh session: ${error.message}`, error.message);
      }

      if (!session) {
        this.clearSession();
        return null;
      }

      let profile = this.sessionData?.profile || await this.loadProfile(session.user.id);
      try {
        if (profile && !profile.registration_number) {
          const { ensureRegistrationNumber } = await import('./supabase');
          const reg = await ensureRegistrationNumber(session.user.id);
          if (reg) {
            profile = await this.loadProfile(session.user.id);
          }
        }
      } catch (e) {
        console.warn('Failed to ensure registration number on refresh:', e);
      }
      
      const sessionData: SessionData = {
        user: session.user,
        profile,
        session,
        lastValidated: Date.now(),
        expiresAt: new Date(session.expires_at!).getTime()
      };

      this.setSession(sessionData);
      return sessionData;
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'SessionManager.refreshSession');
      this.clearSession();
      throw appError;
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.sessionData) {
      return false;
    }

    try {
      const now = Date.now();
      
      // Check if session is expired
      if (now >= this.sessionData.expiresAt) {
        await this.refreshSession();
        return !!this.sessionData;
      }

      // Check if we need to refresh soon
      if (now >= (this.sessionData.expiresAt - this.config.refreshThreshold)) {
        // Refresh in background, don't wait for it
        this.refreshSession().catch(error => {
          console.warn('Background session refresh failed:', error);
        });
      }

      // Update last validated timestamp
      this.sessionData.lastValidated = now;
      return true;
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'SessionManager.validateSession');
      console.error('Session validation failed:', appError);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      this.stopSessionMonitoring();
      
      if (!this.isUsingPlaceholder() && this.sessionData?.session) {
        // Only attempt Supabase signout if we have a real session
        const { error } = await this.withTimeout(
          supabase.auth.signOut(),
          this.config.timeout
        );
        
        if (error) {
          console.warn('Supabase signout failed, but continuing with local cleanup:', error);
        }
      } else if (this.isUsingPlaceholder()) {
        // Clear mock data
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockProfile');
      }

      this.clearSession();
    } catch (error) {
      // Always clear local session even if Supabase signout fails
      console.warn('Error during signout, clearing local session:', error);
      this.clearSession();
    }
  }

  private async loadProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (this.isUsingPlaceholder()) {
        const mockProfile = localStorage.getItem('mockProfile');
        return mockProfile ? JSON.parse(mockProfile) : null;
      }

      const { data, error } = await this.withTimeout(
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        this.config.timeout
      );

      if (error && error.code !== 'PGRST116') {
        throw new AuthError(`Failed to load profile: ${error.message}`, error.code);
      }

      return data || null;
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'SessionManager.loadProfile');
      console.error('Profile loading failed:', appError);
      return null;
    }
  }

  private handleMockSession(): SessionData | null {
    const mockUser = localStorage.getItem('mockUser');
    const mockProfile = localStorage.getItem('mockProfile');

    if (mockUser && mockProfile) {
      try {
        const user = JSON.parse(mockUser);
        const profile = JSON.parse(mockProfile);
        
        const mockSession: SessionData = {
          user: user as User,
          profile: profile as UserProfile,
          session: {
            user: user as User,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            token_type: 'bearer',
            expires_in: 3600
          } as Session,
          lastValidated: Date.now(),
          expiresAt: Date.now() + (3600 * 1000) // 1 hour from now
        };

        this.setSession(mockSession);
        return mockSession;
      } catch (error) {
        console.error('Failed to parse mock session data:', error);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockProfile');
      }
    }

    return null;
  }

  private setSession(sessionData: SessionData): void {
    this.sessionData = sessionData;
    this.notifyListeners(sessionData);
    
    // Store in sessionStorage for quick recovery
    try {
      sessionStorage.setItem('lastSession', JSON.stringify({
        userId: sessionData.user.id,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to store session metadata:', error);
    }
  }

  private clearSession(): void {
    this.sessionData = null;
    this.stopSessionMonitoring();
    this.notifyListeners(null);
    
    try {
      sessionStorage.removeItem('lastSession');
    } catch (error) {
      console.warn('Failed to clear session metadata:', error);
    }
  }

  private startSessionMonitoring(): void {
    this.stopSessionMonitoring();
    
    this.validationTimer = setInterval(() => {
      this.validateSession().catch(error => {
        console.error('Periodic session validation failed:', error);
      });
    }, this.config.validationInterval);
  }

  private stopSessionMonitoring(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private isUsingPlaceholder(): boolean {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return supabaseUrl === 'https://your-project.supabase.co' ||
           supabaseAnonKey === 'your-anon-key-here';
  }

  private notifyListeners(sessionData: SessionData | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(sessionData);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  // Public API
  getSession(): SessionData | null {
    return this.sessionData;
  }

  getUser(): User | null {
    return this.sessionData?.user || null;
  }

  getProfile(): UserProfile | null {
    return this.sessionData?.profile || null;
  }

  isAuthenticated(): boolean {
    return !!this.sessionData && this.sessionData.expiresAt > Date.now();
  }

  subscribe(listener: (session: SessionData | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!this.sessionData) {
      throw new AuthError('No active session for profile update');
    }

    try {
      if (this.isUsingPlaceholder()) {
        // Update mock profile
        const updatedProfile = { ...this.sessionData.profile, ...updates };
        localStorage.setItem('mockProfile', JSON.stringify(updatedProfile));
        this.sessionData.profile = updatedProfile as UserProfile;
        this.notifyListeners(this.sessionData);
        return updatedProfile as UserProfile;
      }

      const { data, error } = await this.withTimeout(
        supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', this.sessionData.user.id)
          .select()
          .single(),
        this.config.timeout
      );

      if (error) {
        throw new AuthError(`Failed to update profile: ${error.message}`, error.code);
      }

      this.sessionData.profile = data;
      this.notifyListeners(this.sessionData);
      return data;
    } catch (error) {
      const appError = errorManager.categorizeError(error, 'SessionManager.updateProfile');
      throw appError;
    }
  }
}

export const sessionManager = SessionManager.getInstance();
