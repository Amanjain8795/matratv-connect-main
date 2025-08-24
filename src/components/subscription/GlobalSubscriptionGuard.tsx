import React from 'react';
import { useAuth } from '@/context/NewAuthContext';
import { useLocation, Navigate } from 'react-router-dom';

interface GlobalSubscriptionGuardProps {
  children: React.ReactNode;
}

export const GlobalSubscriptionGuard: React.FC<GlobalSubscriptionGuardProps> = ({ children }) => {
  const { user, hasActiveSubscription, subscriptionLoading, loading } = useAuth();
  const location = useLocation();

  // Pages that don't require subscription
  const publicPaths = [
    '/',
    '/login',
    '/register', 
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/subscription',
    '/admin'
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  });

  // If on public path, show content normally
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If auth is still loading, show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If subscription is loading, show loading
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have active subscription, redirect to subscription page
  if (!hasActiveSubscription) {
    return <Navigate to="/subscription" replace />;
  }

  // User has active subscription, show protected content
  return <>{children}</>;
};

export default GlobalSubscriptionGuard;
