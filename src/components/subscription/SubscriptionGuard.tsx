import React from 'react';
import { useAuth } from '@/context/NewAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
  showCard?: boolean;
  fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature = 'this feature',
  showCard = true,
  fallback
}) => {
  const { hasActiveSubscription, subscriptionLoading, user } = useAuth();

  // If user is not authenticated, don't show subscription guard
  if (!user) {
    return <>{children}</>;
  }

  // If loading subscription status, show loading spinner
  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Checking subscription...</span>
      </div>
    );
  }

  // If user has active subscription, render children
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default subscription required card
  if (showCard) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Subscription Required
          </CardTitle>
          <CardDescription>
            You need an active subscription to access {feature}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Subscribe now to unlock all premium features including shopping cart, referral system, and more.
          </p>
          <Button asChild className="w-full">
            <Link to="/subscription">
              <Crown className="w-4 h-4 mr-2" />
              Subscribe Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Simple block without card
  return (
    <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <Crown className="w-12 h-12 text-purple-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Required</h3>
      <p className="text-gray-600 mb-4">You need an active subscription to access {feature}</p>
      <Button asChild>
        <Link to="/subscription">
          Subscribe Now
        </Link>
      </Button>
    </div>
  );
};

export const SubscriptionButton: React.FC<{
  children: React.ReactNode;
  feature?: string;
  className?: string;
  variant?: any;
  size?: any;
  onClick?: () => void;
}> = ({
  children,
  feature = 'this feature',
  className,
  variant,
  size,
  onClick
}) => {
  const { hasActiveSubscription, subscriptionLoading, user } = useAuth();

  // If user is not authenticated, show the normal button
  if (!user) {
    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        onClick={onClick}
      >
        {children}
      </Button>
    );
  }

  if (subscriptionLoading) {
    return (
      <Button disabled className={className} variant={variant} size={size}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        Loading...
      </Button>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Button
        asChild
        className={className}
        variant={variant}
        size={size}
      >
        <Link to="/subscription">
          <Crown className="w-4 h-4 mr-2" />
          Subscribe Required
        </Link>
      </Button>
    );
  }

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};
