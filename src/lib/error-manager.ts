// Enterprise Error Management System
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH', 
  BUSINESS = 'BUSINESS',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
  context?: string;
  recoverable: boolean;
  userMessage: string;
}

export interface ErrorAction {
  type: 'RETRY' | 'FALLBACK' | 'REDIRECT' | 'NOTIFY' | 'IGNORE';
  payload?: any;
}

class ErrorManager {
  private static instance: ErrorManager;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  categorizeError(error: unknown, context?: string): AppError {
    const timestamp = Date.now();
    let appError: AppError;

    if (error && typeof error === 'object' && 'message' in error) {
      const err = error as any;
      
      // Supabase Auth Errors
      if (err.message?.includes('Auth session missing') || err.message?.includes('JWT expired')) {
        appError = {
          type: ErrorType.AUTH,
          severity: ErrorSeverity.HIGH,
          message: err.message,
          code: err.code,
          details: err,
          timestamp,
          context,
          recoverable: true,
          userMessage: 'Your session has expired. Please log in again.'
        };
      }
      // Network Errors
      else if (err.message?.includes('fetch') ||
               err.message?.includes('Failed to fetch') ||
               err.message?.includes('network') ||
               err.name === 'TypeError' ||
               err.code === 'NETWORK_ERROR') {
        appError = {
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          message: err.message,
          code: err.code,
          details: err,
          timestamp,
          context,
          recoverable: true,
          userMessage: 'Connection problem. Please check your internet and try again.'
        };
      }
      // Timeout Errors
      else if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
        appError = {
          type: ErrorType.TIMEOUT,
          severity: ErrorSeverity.MEDIUM,
          message: err.message,
          code: err.code,
          details: err,
          timestamp,
          context,
          recoverable: true,
          userMessage: 'Operation took too long. Please try again.'
        };
      }
      // Permission Errors
      else if (err.message?.includes('permission') || err.message?.includes('authorized') || err.code === 'PGRST301') {
        appError = {
          type: ErrorType.PERMISSION,
          severity: ErrorSeverity.HIGH,
          message: err.message,
          code: err.code,
          details: err,
          timestamp,
          context,
          recoverable: false,
          userMessage: 'You don\'t have permission to perform this action.'
        };
      }
      // Validation Errors
      else if (err.message?.includes('invalid') || err.message?.includes('validation') || err.code?.startsWith('23')) {
        appError = {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          message: err.message,
          code: err.code,
          details: err,
          timestamp,
          context,
          recoverable: true,
          userMessage: 'Please check your input and try again.'
        };
      }
      // Business Logic Errors
      else {
        appError = {
          type: ErrorType.BUSINESS,
          severity: ErrorSeverity.MEDIUM,
          message: err.message,
          code: err.code,
          details: err,
          timestamp,
          context,
          recoverable: true,
          userMessage: err.message || 'Something went wrong. Please try again.'
        };
      }
    } else {
      // Unknown error
      appError = {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: String(error),
        timestamp,
        context,
        recoverable: true,
        userMessage: 'An unexpected error occurred. Please try again.'
      };
    }

    this.logError(appError);
    return appError;
  }

  handleError(error: AppError): ErrorAction {
    // Add to history
    this.addToHistory(error);

    // Determine action based on error type and severity
    switch (error.type) {
      case ErrorType.AUTH:
        if (error.severity === ErrorSeverity.HIGH) {
          return { type: 'REDIRECT', payload: '/login' };
        }
        return { type: 'RETRY' };

      case ErrorType.NETWORK:
        return { type: 'RETRY' };

      case ErrorType.TIMEOUT:
        return { type: 'RETRY' };

      case ErrorType.PERMISSION:
        return { type: 'NOTIFY' };

      case ErrorType.VALIDATION:
        return { type: 'NOTIFY' };

      case ErrorType.BUSINESS:
        return { type: 'NOTIFY' };

      default:
        return { type: 'NOTIFY' };
    }
  }

  private logError(error: AppError): void {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
      console.group(`🚨 ${error.type} Error - ${error.severity}`);
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Context:', error.context);
      console.error('User Message:', error.userMessage);
      console.error('Details:', error.details);
      console.groupEnd();
    }

    // In production, you would send this to your error tracking service
    // e.g., Sentry, LogRocket, etc.
    if (!isDev && error.severity === ErrorSeverity.CRITICAL) {
      // this.reportToErrorTracking(error);
    }
  }

  private addToHistory(error: AppError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  clearHistory(): void {
    this.errorHistory = [];
  }

  // Check if similar error occurred recently (for deduplication)
  hasRecentSimilarError(error: AppError, timeWindow = 5000): boolean {
    const now = Date.now();
    return this.errorHistory.some(
      histError => 
        histError.type === error.type &&
        histError.code === error.code &&
        (now - histError.timestamp) < timeWindow
    );
  }
}

export const errorManager = ErrorManager.getInstance();

// Custom error classes for better error handling
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessError';
  }
}
