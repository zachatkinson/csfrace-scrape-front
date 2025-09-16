/**
 * Error Handling Utilities - SOLID Single Responsibility Principle
 * DRY: Centralized error handling logic
 * Following TypeScript best practices for unknown error types
 */

export interface AppError {
  message: string;
  code?: string;
  cause?: unknown;
}

/**
 * SOLID: Single Responsibility - Convert unknown errors to typed errors
 * This follows TypeScript best practices for error handling
 */
export function createAppError(error: unknown, fallbackMessage = 'An unknown error occurred'): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'ERROR_INSTANCE',
      cause: error
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'STRING_ERROR',
      cause: error
    };
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: 'OBJECT_WITH_MESSAGE',
      cause: error
    };
  }
  
  return {
    message: fallbackMessage,
    code: 'UNKNOWN_ERROR',
    cause: error
  };
}

/**
 * SOLID: Single Responsibility - Format error for user display
 * DRY: Consistent error message formatting
 */
export function formatErrorMessage(error: unknown, context?: string): string {
  const appError = createAppError(error);
  const prefix = context ? `${context}: ` : '';
  return `${prefix}${appError.message}`;
}

/**
 * SOLID: Single Responsibility - Log errors consistently
 * Following Astro best practices for error logging
 */
export function logError(error: unknown, context?: string): void {
  const appError = createAppError(error);
  console.error(`[${context || 'Error'}]`, {
    message: appError.message,
    code: appError.code,
    cause: appError.cause
  });
}