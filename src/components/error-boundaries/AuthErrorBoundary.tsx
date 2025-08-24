import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Shield, LogIn, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorManager, ErrorType } from '@/lib/error-manager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onAuthError?: (error: Error) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'session_expired' | 'permission_denied' | 'auth_required' | 'unknown';
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is an auth-related error
    const message = error.message.toLowerCase();
    const isAuthError = 
      message.includes('auth') ||
      message.includes('session') ||
      message.includes('jwt') ||
      message.includes('token') ||
      message.includes('unauthorized') ||
      message.includes('permission') ||
      error.name === 'AuthError';

    if (isAuthError) {
      let errorType: State['errorType'] = 'unknown';
      
      if (message.includes('session') || message.includes('jwt') || message.includes('expired')) {
        errorType = 'session_expired';
      } else if (message.includes('permission') || message.includes('unauthorized')) {
        errorType = 'permission_denied';
      } else if (message.includes('required') || message.includes('auth')) {
        errorType = 'auth_required';
      }

      return {
        hasError: true,
        error,
        errorType
      };
    }

    // Not an auth error, let it propagate to parent boundary
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = errorManager.categorizeError(error, 'AuthErrorBoundary');
    
    if (appError.type === ErrorType.AUTH || appError.type === ErrorType.PERMISSION) {
      console.error('Auth Error Boundary caught an error:', appError);
      this.props.onAuthError?.(error);
    } else {
      // Re-throw if not an auth error
      throw error;
    }
  }

  handleLogin = () => {
    window.location.href = '/login';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown'
    });
    
    this.props.onRetry?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getErrorContent() {
    const { errorType, error } = this.state;

    switch (errorType) {
      case 'session_expired':
        return {
          title: 'Session Expired',
          description: 'Your login session has expired for security reasons. Please log in again to continue.',
          icon: <Shield className="h-4 w-4" />,
          primaryAction: {
            label: 'Log In Again',
            onClick: this.handleLogin,
            icon: <LogIn className="h-4 w-4" />
          },
          secondaryAction: {
            label: 'Go to Home',
            onClick: this.handleGoHome
          }
        };

      case 'permission_denied':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to access this resource. Please contact support if you believe this is an error.',
          icon: <Shield className="h-4 w-4" />,
          primaryAction: {
            label: 'Go to Home',
            onClick: this.handleGoHome
          },
          secondaryAction: {
            label: 'Log In Again',
            onClick: this.handleLogin,
            icon: <LogIn className="h-4 w-4" />
          }
        };

      case 'auth_required':
        return {
          title: 'Authentication Required',
          description: 'You need to be logged in to access this page. Please log in to continue.',
          icon: <LogIn className="h-4 w-4" />,
          primaryAction: {
            label: 'Log In',
            onClick: this.handleLogin,
            icon: <LogIn className="h-4 w-4" />
          },
          secondaryAction: {
            label: 'Go to Home',
            onClick: this.handleGoHome
          }
        };

      default:
        return {
          title: 'Authentication Error',
          description: error?.message || 'An authentication error occurred. Please try logging in again.',
          icon: <Shield className="h-4 w-4" />,
          primaryAction: {
            label: 'Try Again',
            onClick: this.handleRetry,
            icon: <RefreshCw className="h-4 w-4" />
          },
          secondaryAction: {
            label: 'Log In',
            onClick: this.handleLogin,
            icon: <LogIn className="h-4 w-4" />
          }
        };
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const content = this.getErrorContent();

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive">
              {content.icon}
              <AlertTitle>{content.title}</AlertTitle>
              <AlertDescription className="mt-2">
                {content.description}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={content.primaryAction.onClick}
                  className="flex items-center gap-2"
                >
                  {content.primaryAction.icon}
                  {content.primaryAction.label}
                </Button>

                {content.secondaryAction && (
                  <Button
                    onClick={content.secondaryAction.onClick}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {content.secondaryAction.icon}
                    {content.secondaryAction.label}
                  </Button>
                )}
              </div>

              {import.meta.env.DEV && this.state.error && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  <p className="font-medium">Debug Info:</p>
                  <p className="font-mono text-xs mt-1">{this.state.error.message}</p>
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
