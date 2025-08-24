import React from 'react';
import { NetworkErrorBoundary } from './NetworkErrorBoundary';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { BusinessErrorBoundary } from './BusinessErrorBoundary';

interface Props {
  children: React.ReactNode;
}

export const RootErrorBoundary: React.FC<Props> = ({ children }) => {
  return (
    <NetworkErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Network Error caught by Root Error Boundary:', error, errorInfo);
      }}
    >
      <AuthErrorBoundary
        onAuthError={(error) => {
          console.error('Auth Error caught by Root Error Boundary:', error);
        }}
        onRetry={() => {
          // Retry logic can be implemented here
          window.location.reload();
        }}
      >
        <BusinessErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Business Error caught by Root Error Boundary:', error, errorInfo);
          }}
          allowRetry={true}
        >
          {children}
        </BusinessErrorBoundary>
      </AuthErrorBoundary>
    </NetworkErrorBoundary>
  );
};
