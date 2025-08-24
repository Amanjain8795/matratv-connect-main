import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorManager, ErrorType } from '@/lib/error-manager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isOnline: boolean;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isOnline: navigator.onLine
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a network-related error
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError';

    if (isNetworkError) {
      return {
        hasError: true,
        error
      };
    }

    // Not a network error, let it propagate to parent boundary
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = errorManager.categorizeError(error, 'NetworkErrorBoundary');
    
    if (appError.type === ErrorType.NETWORK) {
      console.error('Network Error Boundary caught an error:', appError);
      this.props.onError?.(error, errorInfo);
    } else {
      // Re-throw if not a network error
      throw error;
    }
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleOnlineStatus = () => {
    const isOnline = navigator.onLine;
    this.setState({ isOnline });
    
    // Auto-retry when coming back online
    if (isOnline && this.state.hasError) {
      this.scheduleRetry();
    }
  };

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, schedule a delayed retry
      this.scheduleRetry(10000); // 10 seconds
    }
  };

  scheduleRetry = (delay = 2000) => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        retryCount: 0
      });
    }, delay);
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isOnline, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                Network Connection Error
                {!isOnline && <Wifi className="h-4 w-4 text-muted-foreground" />}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {!isOnline 
                  ? "You're currently offline. Please check your internet connection."
                  : "Unable to connect to our servers. This might be a temporary issue."
                }
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p><strong>Error:</strong> {error?.message}</p>
                {retryCount > 0 && (
                  <p><strong>Retry attempts:</strong> {retryCount}/{this.maxRetries}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  disabled={!canRetry && !isOnline}
                  className="flex items-center gap-2"
                  variant={canRetry ? "default" : "secondary"}
                >
                  <RefreshCw className="h-4 w-4" />
                  {canRetry ? 'Try Again' : 'Retrying...'}
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Reload Page
                </Button>
              </div>

              {!isOnline && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  <p className="font-medium">Connection Tips:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Check your WiFi or mobile data connection</li>
                    <li>Try moving to an area with better signal</li>
                    <li>Restart your router if using WiFi</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
