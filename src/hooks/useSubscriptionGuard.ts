import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/NewAuthContext';
import { toast } from '@/components/ui/use-toast';

interface SubscriptionGuardOptions {
  redirectTo?: string;
  showToast?: boolean;
  feature?: string;
}

export const useSubscriptionGuard = (options: SubscriptionGuardOptions = {}) => {
  const { 
    hasActiveSubscription, 
    subscriptionLoading, 
    user, 
    state 
  } = useAuth();
  
  const navigate = useNavigate();
  
  const {
    redirectTo = '/subscription',
    showToast = true,
    feature = 'this feature'
  } = options;

  useEffect(() => {
    // Don't redirect if still loading or user not authenticated
    if (subscriptionLoading || !user || state !== 'AUTHENTICATED') {
      return;
    }

    // If user doesn't have active subscription, redirect
    if (!hasActiveSubscription) {
      if (showToast) {
        toast({
          description: `Active subscription required to access ${feature}`,
          variant: 'destructive'
        });
      }
      navigate(redirectTo);
    }
  }, [hasActiveSubscription, subscriptionLoading, user, state, navigate, redirectTo, showToast, feature]);

  return {
    hasActiveSubscription,
    subscriptionLoading,
    canAccess: hasActiveSubscription && !subscriptionLoading
  };
};

export const useSubscriptionStatus = () => {
  const { hasActiveSubscription, subscriptionLoading, checkSubscription } = useAuth();

  return {
    hasActiveSubscription,
    subscriptionLoading,
    refreshSubscription: checkSubscription
  };
};
