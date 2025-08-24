import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/NewAuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  fallback 
}) => {
  const { state, user, loading } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being determined
  if (loading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname + location.search }}
        replace 
      />
    );
  }

  // If authentication is not required but we want to redirect authenticated users
  if (!requireAuth && user) {
    // Get the original destination from state, or default to home
    const from = location.state?.from || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

// Specialized components for common use cases
export const RequireAuth: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute requireAuth={true} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const RequireGuest: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);

// Admin protection - allows independent admin system
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // For our independent admin system, we'll bypass the auth check
  // The admin system handles its own authentication internally
  return <>{children}</>;
};
