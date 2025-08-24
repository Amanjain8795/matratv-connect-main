import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getSystemStatus } from '@/lib/supabase';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState(() => getSystemStatus());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      setStatus(getSystemStatus());
    };

    // Check status when online/offline events occur
    window.addEventListener('online', checkStatus);
    window.addEventListener('offline', checkStatus);

    // Check status periodically
    const interval = setInterval(checkStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', checkStatus);
      window.removeEventListener('offline', checkStatus);
      clearInterval(interval);
    };
  }, []);

  // Don't show anything if everything is working fine
  if (status.isFullyOperational) {
    return null;
  }

  const getStatusInfo = () => {
    if (!status.isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        title: 'Offline Mode',
        description: 'You are currently offline. Some features may be limited.',
        variant: 'destructive' as const
      };
    }

    if (!status.hasValidConfig) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Demo Mode',
        description: 'Running in demo mode with limited functionality.',
        variant: 'default' as const
      };
    }

    return {
      icon: <CheckCircle className="h-4 w-4" />,
      title: 'Online',
      description: 'All systems operational.',
      variant: 'default' as const
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert variant={statusInfo.variant} className="shadow-lg">
        <statusInfo.icon.type {...statusInfo.icon.props} />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-medium">{statusInfo.title}</div>
            <div className="text-sm">{statusInfo.description}</div>
            {showDetails && (
              <div className="mt-2 text-xs space-y-1">
                <div>Online: {status.isOnline ? '✓' : '✗'}</div>
                <div>Database: {status.hasValidConfig ? '✓' : '✗'}</div>
                <div>Mode: {status.mode}</div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="ml-2"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SystemStatus;
