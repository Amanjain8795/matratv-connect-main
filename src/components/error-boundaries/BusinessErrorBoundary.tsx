import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { errorManager, ErrorType } from '@/lib/error-manager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  allowRetry?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class BusinessErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // This boundary catches business logic and validation errors
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = errorManager.categorizeError(error, 'BusinessErrorBoundary');
    
    console.error('Business Error Boundary caught an error:', appError);
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service in production
    if (!import.meta.env.DEV) {
      // this.reportError(appError, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage(error: Error): { title: string; description: string } {
    const message = error.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        title: 'Invalid Data',
        description: 'The information provided is not valid. Please check your input and try again.'
      };
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return {
        title: 'Not Found',
        description: 'The requested resource could not be found. It may have been moved or deleted.'
      };
    }
    
    if (message.includes('conflict') || message.includes('409')) {
      return {
        title: 'Conflict',
        description: 'This action conflicts with existing data. Please refresh the page and try again.'
      };
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        title: 'Too Many Requests',
        description: 'You\'re making requests too quickly. Please wait a moment and try again.'
      };
    }

    // Generic business error
    return {
      title: 'Something Went Wrong',
      description: error.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount } = this.state;
      const canRetry = this.props.allowRetry !== false && retryCount < this.maxRetries;
      const { title, description } = this.getErrorMessage(error!);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription className="mt-2">
                {description}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {retryCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  <p>Retry attempts: {retryCount}/{this.maxRetries}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleGoHome}
                  variant={canRetry ? "outline" : "default"}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {import.meta.env.DEV && error && (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  <p className="font-medium">Debug Info:</p>
                  <p className="font-mono text-xs mt-1 break-all">{error.message}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Stack Trace</summary>
                      <pre className="font-mono text-xs mt-1 whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </details>
                  )}
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
