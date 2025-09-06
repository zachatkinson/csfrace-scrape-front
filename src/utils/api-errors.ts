/**
 * API Error Handling Utilities
 * Centralized error handling patterns to eliminate duplication
 * ZERO TOLERANCE for duplicate error handling logic
 */

import { TIMING_CONSTANTS } from '../constants/timing.ts';

// Standard error codes used across the application
export enum ApiErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT', 
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // HTTP status errors
  BAD_REQUEST = 'BAD_REQUEST',          // 400
  UNAUTHORIZED = 'UNAUTHORIZED',        // 401
  FORBIDDEN = 'FORBIDDEN',              // 403
  NOT_FOUND = 'NOT_FOUND',              // 404
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED', // 405
  CONFLICT = 'CONFLICT',                // 409
  RATE_LIMITED = 'RATE_LIMITED',        // 429
  INTERNAL_ERROR = 'INTERNAL_ERROR',    // 500
  BAD_GATEWAY = 'BAD_GATEWAY',          // 502
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE', // 503
  
  // Application-specific errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_EXPIRED = 'AUTHENTICATION_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Job/Processing errors
  JOB_FAILED = 'JOB_FAILED',
  JOB_TIMEOUT = 'JOB_TIMEOUT',
  JOB_CANCELLED = 'JOB_CANCELLED',
  BATCH_PROCESSING_FAILED = 'BATCH_PROCESSING_FAILED',
  
  // File/Upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Unknown/Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Structured API error interface
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  retryable: boolean;
  userFriendlyMessage: string;
  suggestedAction?: string;
}

// Error severity levels for logging and UI display
export enum ErrorSeverity {
  LOW = 'low',       // Minor issues, app continues normally
  MEDIUM = 'medium', // Partial functionality affected
  HIGH = 'high',     // Major functionality broken
  CRITICAL = 'critical', // App largely unusable
}

// Error context for better debugging and user experience
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  additionalData?: Record<string, any>;
}

/**
 * Standard API Error class with consistent structure
 */
export class StandardApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly retryable: boolean;
  public readonly userFriendlyMessage: string;
  public readonly suggestedAction?: string;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      details?: Record<string, any>;
      retryable?: boolean;
      userFriendlyMessage?: string;
      suggestedAction?: string;
      severity?: ErrorSeverity;
      context?: ErrorContext;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'StandardApiError';
    this.code = code;
    this.details = options.details;
    this.timestamp = new Date().toISOString();
    this.retryable = options.retryable ?? false;
    this.userFriendlyMessage = options.userFriendlyMessage ?? this.getDefaultUserMessage(code);
    this.suggestedAction = options.suggestedAction;
    this.severity = options.severity ?? this.getDefaultSeverity(code);
    this.context = options.context;

    if (options.cause) {
      this.cause = options.cause;
    }
  }

  private getDefaultUserMessage(code: ApiErrorCode): string {
    const messages: Record<ApiErrorCode, string> = {
      [ApiErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
      [ApiErrorCode.TIMEOUT]: 'The request took too long to complete. Please try again.',
      [ApiErrorCode.CONNECTION_REFUSED]: 'Cannot reach the server. The service may be temporarily unavailable.',
      
      [ApiErrorCode.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
      [ApiErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
      [ApiErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
      [ApiErrorCode.NOT_FOUND]: 'The requested resource could not be found.',
      [ApiErrorCode.METHOD_NOT_ALLOWED]: 'This action is not supported.',
      [ApiErrorCode.CONFLICT]: 'This action conflicts with the current state. Please refresh and try again.',
      [ApiErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
      [ApiErrorCode.INTERNAL_ERROR]: 'A server error occurred. Please try again later.',
      [ApiErrorCode.BAD_GATEWAY]: 'Server communication error. Please try again.',
      [ApiErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
      
      [ApiErrorCode.VALIDATION_ERROR]: 'Please correct the highlighted fields and try again.',
      [ApiErrorCode.AUTHENTICATION_EXPIRED]: 'Your session has expired. Please log in again.',
      [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 'You need additional permissions to perform this action.',
      [ApiErrorCode.RESOURCE_LIMIT_EXCEEDED]: 'Resource limit exceeded. Please contact support if this persists.',
      
      [ApiErrorCode.JOB_FAILED]: 'The job could not be completed. Please try again.',
      [ApiErrorCode.JOB_TIMEOUT]: 'The job took too long to complete and was stopped.',
      [ApiErrorCode.JOB_CANCELLED]: 'The job was cancelled.',
      [ApiErrorCode.BATCH_PROCESSING_FAILED]: 'Batch processing failed. Some items may have been processed successfully.',
      
      [ApiErrorCode.FILE_TOO_LARGE]: 'The file is too large. Please select a smaller file.',
      [ApiErrorCode.INVALID_FILE_TYPE]: 'This file type is not supported. Please select a different file.',
      [ApiErrorCode.UPLOAD_FAILED]: 'File upload failed. Please try again.',
      
      [ApiErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    };

    return messages[code] || 'An error occurred. Please try again.';
  }

  private getDefaultSeverity(code: ApiErrorCode): ErrorSeverity {
    const severityMap: Record<ApiErrorCode, ErrorSeverity> = {
      [ApiErrorCode.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.TIMEOUT]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.CONNECTION_REFUSED]: ErrorSeverity.HIGH,
      
      [ApiErrorCode.BAD_REQUEST]: ErrorSeverity.LOW,
      [ApiErrorCode.UNAUTHORIZED]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.FORBIDDEN]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.NOT_FOUND]: ErrorSeverity.LOW,
      [ApiErrorCode.METHOD_NOT_ALLOWED]: ErrorSeverity.LOW,
      [ApiErrorCode.CONFLICT]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.RATE_LIMITED]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.INTERNAL_ERROR]: ErrorSeverity.HIGH,
      [ApiErrorCode.BAD_GATEWAY]: ErrorSeverity.HIGH,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
      
      [ApiErrorCode.VALIDATION_ERROR]: ErrorSeverity.LOW,
      [ApiErrorCode.AUTHENTICATION_EXPIRED]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.RESOURCE_LIMIT_EXCEEDED]: ErrorSeverity.HIGH,
      
      [ApiErrorCode.JOB_FAILED]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.JOB_TIMEOUT]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.JOB_CANCELLED]: ErrorSeverity.LOW,
      [ApiErrorCode.BATCH_PROCESSING_FAILED]: ErrorSeverity.HIGH,
      
      [ApiErrorCode.FILE_TOO_LARGE]: ErrorSeverity.LOW,
      [ApiErrorCode.INVALID_FILE_TYPE]: ErrorSeverity.LOW,
      [ApiErrorCode.UPLOAD_FAILED]: ErrorSeverity.MEDIUM,
      
      [ApiErrorCode.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
    };

    return severityMap[code] || ErrorSeverity.MEDIUM;
  }

  /**
   * Convert to a plain object for logging/serialization
   */
  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      retryable: this.retryable,
      userFriendlyMessage: this.userFriendlyMessage,
      suggestedAction: this.suggestedAction,
    };
  }
}

/**
 * Error parsing utilities - convert various error types to StandardApiError
 */
export class ErrorParser {
  /**
   * Parse fetch/axios error into StandardApiError
   */
  static fromFetchError(error: any, context?: ErrorContext): StandardApiError {
    // Network/connection errors
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return new StandardApiError(ApiErrorCode.NETWORK_ERROR, error.message, {
        retryable: true,
        context,
      });
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new StandardApiError(ApiErrorCode.TIMEOUT, 'Request timeout', {
        retryable: true,
        context,
      });
    }

    // HTTP status errors from response
    if (error.response?.status) {
      return ErrorParser.fromHttpStatus(error.response.status, error.response.data, context);
    }

    // Generic network error
    return new StandardApiError(ApiErrorCode.UNKNOWN_ERROR, error.message || 'Unknown error occurred', {
      details: { originalError: error },
      context,
    });
  }

  /**
   * Parse HTTP status code into StandardApiError
   */
  static fromHttpStatus(status: number, responseData?: any, context?: ErrorContext): StandardApiError {
    const statusCodeMap: Record<number, [ApiErrorCode, boolean]> = {
      400: [ApiErrorCode.BAD_REQUEST, false],
      401: [ApiErrorCode.UNAUTHORIZED, false],
      403: [ApiErrorCode.FORBIDDEN, false],
      404: [ApiErrorCode.NOT_FOUND, false],
      405: [ApiErrorCode.METHOD_NOT_ALLOWED, false],
      409: [ApiErrorCode.CONFLICT, false],
      429: [ApiErrorCode.RATE_LIMITED, true],
      500: [ApiErrorCode.INTERNAL_ERROR, true],
      502: [ApiErrorCode.BAD_GATEWAY, true],
      503: [ApiErrorCode.SERVICE_UNAVAILABLE, true],
    };

    const [code, retryable] = statusCodeMap[status] || [ApiErrorCode.UNKNOWN_ERROR, false];
    const message = responseData?.message || responseData?.error || `HTTP ${status}`;

    return new StandardApiError(code, message, {
      retryable,
      details: { status, responseData },
      context,
    });
  }

  /**
   * Parse validation errors with field-level details
   */
  static fromValidationError(
    fieldErrors: Record<string, string[]>,
    context?: ErrorContext
  ): StandardApiError {
    const message = 'Validation failed';
    return new StandardApiError(ApiErrorCode.VALIDATION_ERROR, message, {
      details: { fieldErrors },
      userFriendlyMessage: 'Please correct the highlighted fields and try again.',
      context,
    });
  }

  /**
   * Parse job processing errors
   */
  static fromJobError(
    jobId: string,
    errorType: 'failed' | 'timeout' | 'cancelled',
    errorMessage?: string,
    context?: ErrorContext
  ): StandardApiError {
    const codeMap = {
      failed: ApiErrorCode.JOB_FAILED,
      timeout: ApiErrorCode.JOB_TIMEOUT,
      cancelled: ApiErrorCode.JOB_CANCELLED,
    };

    return new StandardApiError(codeMap[errorType], errorMessage || `Job ${errorType}`, {
      details: { jobId, errorType },
      retryable: errorType === 'failed',
      context,
    });
  }
}

/**
 * Error handler utility class with retry logic and user feedback
 */
export class ErrorHandler {
  private static errorReports: Map<string, number> = new Map();
  
  /**
   * Handle errors with automatic retry logic
   */
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = TIMING_CONSTANTS.API.RETRY_MAX_ATTEMPTS,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: StandardApiError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof StandardApiError
          ? error
          : ErrorParser.fromFetchError(error, { ...context, attempt });
        
        // Don't retry if error is not retryable or we've reached max attempts
        if (!lastError.retryable || attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        const delay = TIMING_CONSTANTS.HELPERS.exponentialBackoff(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Log error with rate limiting to prevent spam
   */
  static logError(error: StandardApiError): void {
    const errorKey = `${error.code}-${error.context?.component || 'unknown'}`;
    const reportCount = this.errorReports.get(errorKey) || 0;
    
    // Rate limit error reporting
    if (reportCount < 5 || reportCount % 10 === 0) {
      console.error(`[${error.severity.toUpperCase()}] ${error.code}:`, {
        message: error.message,
        userMessage: error.userFriendlyMessage,
        context: error.context,
        details: error.details,
        timestamp: error.timestamp,
      });
      
      // In production, send to error reporting service
      if (import.meta.env.PROD && error.severity !== ErrorSeverity.LOW) {
        this.reportToService(error);
      }
    }
    
    this.errorReports.set(errorKey, reportCount + 1);
  }

  /**
   * Show user-friendly error message
   */
  static showUserError(error: StandardApiError, showToast: (message: string) => void): void {
    let message = error.userFriendlyMessage;
    
    if (error.suggestedAction) {
      message += ` ${error.suggestedAction}`;
    }
    
    showToast(message);
    this.logError(error);
  }

  /**
   * Handle authentication errors specifically
   */
  static handleAuthError(error: StandardApiError, redirectToLogin: () => void): void {
    if (error.code === ApiErrorCode.UNAUTHORIZED || error.code === ApiErrorCode.AUTHENTICATION_EXPIRED) {
      // Clear any stored tokens
      localStorage.removeItem('csfrace-access-token');
      sessionStorage.removeItem('csfrace-access-token');
      
      // Redirect to login
      redirectToLogin();
    }
    
    this.logError(error);
  }

  /**
   * Report error to external service (placeholder)
   */
  private static reportToService(error: StandardApiError): void {
    // In a real application, this would send to Sentry, Bugsnag, etc.
    // For now, just log that it would be reported
    console.log('Would report to error service:', error.toJSON());
  }

  /**
   * Clear error report counts (useful for testing)
   */
  static clearErrorReports(): void {
    this.errorReports.clear();
  }
}

/**
 * Common error handling patterns as reusable functions
 */
export const CommonErrorHandlers = {
  /**
   * Standard API request error handler
   */
  apiRequest: (error: any, context?: ErrorContext) => {
    const standardError = ErrorParser.fromFetchError(error, context);
    ErrorHandler.logError(standardError);
    return standardError;
  },

  /**
   * Form submission error handler
   */
  formSubmission: (error: any, showToast: (message: string) => void) => {
    const standardError = ErrorParser.fromFetchError(error, { action: 'form_submit' });
    ErrorHandler.showUserError(standardError, showToast);
    return standardError;
  },

  /**
   * File upload error handler
   */
  fileUpload: (error: any, fileName?: string) => {
    let standardError: StandardApiError;
    
    if (error.code === 'FILE_TOO_LARGE') {
      standardError = new StandardApiError(ApiErrorCode.FILE_TOO_LARGE, 'File too large', {
        details: { fileName },
      });
    } else if (error.code === 'INVALID_FILE_TYPE') {
      standardError = new StandardApiError(ApiErrorCode.INVALID_FILE_TYPE, 'Invalid file type', {
        details: { fileName },
      });
    } else {
      standardError = ErrorParser.fromFetchError(error, { action: 'file_upload', fileName });
    }
    
    ErrorHandler.logError(standardError);
    return standardError;
  },

  /**
   * Job processing error handler
   */
  jobProcessing: (jobId: string, error: any) => {
    const standardError = ErrorParser.fromJobError(
      jobId,
      'failed',
      error.message,
      { action: 'job_processing', jobId }
    );
    ErrorHandler.logError(standardError);
    return standardError;
  },
};

export default {
  ApiErrorCode,
  StandardApiError,
  ErrorParser,
  ErrorHandler,
  CommonErrorHandlers,
};