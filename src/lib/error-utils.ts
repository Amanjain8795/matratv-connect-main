/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Extracts a readable error message from various error types
 * @param error - The error object or message
 * @returns A string representation of the error
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.error) return error.error;
  
  if (error.details) return error.details;
  
  // For Supabase errors
  if (error.hint) return `${error.message || 'Database error'}: ${error.hint}`;
  
  // Fallback for objects
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred';
  }
}

/**
 * Logs error with consistent formatting
 * @param context - Context where the error occurred
 * @param error - The error object
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}] Error:`, getErrorMessage(error));
  
  // Also log the full error object in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Full error object:`, error);
  }
}

/**
 * Creates user-friendly error messages for common database errors
 * @param error - The database error
 * @returns A user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const message = getErrorMessage(error);
  
  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Database tables not found. Please contact support.';
  }
  
  if (message.includes('authentication') || message.includes('auth')) {
    return 'Authentication error. Please log in again.';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'Permission denied. Please contact support.';
  }
  
  if (message.includes('validation') || message.includes('constraint')) {
    return 'Invalid data provided. Please check your input and try again.';
  }
  
  // Return the original message if no pattern matches
  return message;
}
