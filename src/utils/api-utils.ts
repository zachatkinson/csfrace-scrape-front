/**
 * Shared API Utilities
 * SOLID: Single Responsibility - Handles HTTP response processing
 * SOLID: Dependency Inversion - Abstract HTTP utilities for all API modules
 * DRY: Single source of truth for API response handling
 */

import { createContextLogger } from "./logger";

const logger = createContextLogger("APIUtils");

/**
 * Type guard to check if error has apiError property
 */
function hasApiError(
  error: Error,
): error is Error & { apiError: { status: number } } {
  return (
    "apiError" in error &&
    typeof (error as Error & { apiError?: unknown }).apiError === "object" &&
    (error as Error & { apiError?: { status?: unknown } }).apiError !== null &&
    typeof (error as Error & { apiError: { status?: unknown } }).apiError
      .status === "number"
  );
}

/**
 * Generic HTTP response handler with proper error handling
 * Follows SOLID principles by having a single responsibility
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Comprehensive Error Types and Interfaces
 * SOLID: Interface Segregation - Focused error categories
 * DRY: Single source of truth for all error handling
 */

// Standard error codes consolidated from all error handling files
export enum ApiErrorCode {
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  CONNECTION_REFUSED = "CONNECTION_REFUSED",

  // HTTP status errors
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_GATEWAY = "BAD_GATEWAY",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Authentication/Authorization errors
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  AUTH_INVALID = "AUTH_INVALID",
  AUTHENTICATION_EXPIRED = "AUTHENTICATION_EXPIRED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // Application-specific errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RESOURCE_LIMIT_EXCEEDED = "RESOURCE_LIMIT_EXCEEDED",

  // Job/Processing errors
  JOB_FAILED = "JOB_FAILED",
  JOB_TIMEOUT = "JOB_TIMEOUT",
  JOB_CANCELLED = "JOB_CANCELLED",
  BATCH_PROCESSING_FAILED = "BATCH_PROCESSING_FAILED",

  // File/Upload errors
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  UPLOAD_FAILED = "UPLOAD_FAILED",

  // Server errors
  SERVER_ERROR = "SERVER_ERROR",

  // Unknown/Generic errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface ErrorAction {
  type: "retry" | "sign_in" | "refresh" | "contact_support" | "navigate";
  label: string;
  primary: boolean;
  handler?: (() => void) | undefined;
  url?: string | undefined;
  icon?: string | undefined;
}

/**
 * Enhanced API error interface supporting sophisticated error patterns
 * SOLID: Interface Segregation - Comprehensive but focused error interface
 */
export interface ApiError {
  message: string;
  status: number;
  code?: string | undefined;
  details?: Record<string, unknown> | undefined;
  timestamp?: string | undefined;
  validationErrors?: Record<string, string[]> | undefined;
  severity?: ErrorSeverity | undefined;
  isRecoverable?: boolean | undefined;
  suggestedActions?: ErrorAction[] | undefined;
  technicalDetails?: string | undefined;
}

/**
 * Enhanced API Error class with validation and timestamp support
 * SOLID: Single Responsibility - Handles API error representation
 * SOLID: Open/Closed - Extensible for different error types
 */
export class EnhancedApiError extends Error {
  public readonly errorCode?: string | undefined;
  public readonly timestamp?: string | undefined;
  public readonly validationErrors?: Record<string, string[]> | undefined;
  public readonly statusCode?: number | undefined;
  public readonly apiError: ApiError;

  constructor(
    message: string,
    statusCode?: number | undefined,
    errorCode?: string | undefined,
    timestamp?: string | undefined,
    validationErrors?: Record<string, string[]> | undefined,
    details?: Record<string, unknown> | undefined,
  ) {
    super(message);
    this.name = "EnhancedApiError";
    this.errorCode = errorCode;
    this.timestamp = timestamp;
    this.validationErrors = validationErrors;
    this.statusCode = statusCode;

    // Attach structured error data
    this.apiError = {
      message,
      status: statusCode || 0,
      code: errorCode,
      details,
      timestamp,
      validationErrors,
    };
  }

  /**
   * Check if error has validation errors
   * SOLID: Interface Segregation - Specific validation check
   */
  hasValidationErrors(): boolean {
    return Boolean(
      this.validationErrors && Object.keys(this.validationErrors).length > 0,
    );
  }

  /**
   * Get validation errors for a specific field
   * SOLID: Single Responsibility - Field-specific validation access
   */
  getFieldErrors(field: string): string[] {
    return this.validationErrors?.[field] || [];
  }

  /**
   * Get all validation errors as a formatted message
   * SOLID: Single Responsibility - Validation message formatting
   */
  getValidationErrorMessage(): string | null {
    if (!this.hasValidationErrors()) {
      return null;
    }

    const messages: string[] = [];
    for (const [field, errors] of Object.entries(this.validationErrors || {})) {
      messages.push(`${field}: ${errors.join(", ")}`);
    }
    return messages.join("; ");
  }

  /**
   * Get validation errors formatted for display in forms
   * SOLID: Interface Segregation - Form-specific validation display
   */
  getFormValidationErrors(): Record<string, string> {
    if (!this.hasValidationErrors()) {
      return {};
    }

    const formErrors: Record<string, string> = {};
    for (const [field, errors] of Object.entries(this.validationErrors || {})) {
      formErrors[field] = errors.join(", ");
    }
    return formErrors;
  }
}

/**
 * Enhanced error utility functions
 * SOLID: Single Responsibility - Error type checking and handling utilities
 * DRY: Centralized error handling patterns
 */

/**
 * Type guard to check if error is an enhanced API error
 * SOLID: Single Responsibility - Type checking
 */
export function isEnhancedApiError(error: unknown): error is EnhancedApiError {
  return error instanceof EnhancedApiError;
}

/**
 * Type guard to check if error has validation errors (backwards compatibility)
 * SOLID: Open/Closed - Supports both old and new error types
 */
export function hasValidationErrors(error: unknown): error is Error & {
  validationErrors: Record<string, string[]>;
} {
  if (isEnhancedApiError(error)) {
    return error.hasValidationErrors();
  }

  // Backwards compatibility check
  return (
    error instanceof Error &&
    "validationErrors" in error &&
    error.validationErrors != null &&
    typeof error.validationErrors === "object"
  );
}

/**
 * Consolidated error analysis and handling utilities
 * SOLID: Single Responsibility - Error analysis and UX generation
 * DRY: Unified error handling patterns from all error files
 */

/**
 * Analyze error and determine appropriate user-facing response
 * Consolidates logic from error-handling.ts
 */
export function analyzeError(error: unknown): {
  type: ApiErrorCode;
  title: string;
  message: string;
  severity: ErrorSeverity;
  isRecoverable: boolean;
  suggestedActions: ErrorAction[];
} {
  let errorCode = ApiErrorCode.UNKNOWN_ERROR;
  let title = "Error";
  let message = "An unexpected error occurred";
  let severity: ErrorSeverity = "medium";
  let isRecoverable = true;
  let suggestedActions: ErrorAction[] = [];

  if (isEnhancedApiError(error)) {
    errorCode = (error.errorCode as ApiErrorCode) || ApiErrorCode.UNKNOWN_ERROR;
    message = error.message;
    title = getErrorTitle(errorCode);
    severity = getErrorSeverity(errorCode);
    isRecoverable = getErrorRecoverability(errorCode);
    suggestedActions = getSuggestedActions(errorCode);
  } else if (error instanceof Error) {
    message = error.message;
    // Try to determine error type from message patterns
    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      errorCode = ApiErrorCode.UNAUTHORIZED;
    } else if (
      error.message.includes("403") ||
      error.message.includes("Forbidden")
    ) {
      errorCode = ApiErrorCode.FORBIDDEN;
    } else if (
      error.message.includes("404") ||
      error.message.includes("Not Found")
    ) {
      errorCode = ApiErrorCode.NOT_FOUND;
    } else if (
      error.message.includes("500") ||
      error.message.includes("Internal")
    ) {
      errorCode = ApiErrorCode.INTERNAL_ERROR;
    } else if (error.message.includes("timeout")) {
      errorCode = ApiErrorCode.TIMEOUT;
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      errorCode = ApiErrorCode.NETWORK_ERROR;
    }

    title = getErrorTitle(errorCode);
    severity = getErrorSeverity(errorCode);
    isRecoverable = getErrorRecoverability(errorCode);
    suggestedActions = getSuggestedActions(errorCode);
  }

  return {
    type: errorCode,
    title,
    message,
    severity,
    isRecoverable,
    suggestedActions,
  };
}

/**
 * Get user-friendly error title based on error code
 */
function getErrorTitle(code: ApiErrorCode): string {
  switch (code) {
    case ApiErrorCode.NETWORK_ERROR:
      return "Connection Problem";
    case ApiErrorCode.TIMEOUT:
      return "Request Timed Out";
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.AUTH_REQUIRED:
    case ApiErrorCode.AUTH_EXPIRED:
    case ApiErrorCode.AUTH_INVALID:
      return "Authentication Required";
    case ApiErrorCode.FORBIDDEN:
    case ApiErrorCode.PERMISSION_DENIED:
      return "Access Denied";
    case ApiErrorCode.NOT_FOUND:
      return "Not Found";
    case ApiErrorCode.VALIDATION_ERROR:
      return "Invalid Input";
    case ApiErrorCode.RATE_LIMITED:
      return "Too Many Requests";
    case ApiErrorCode.SERVER_ERROR:
    case ApiErrorCode.INTERNAL_ERROR:
      return "Server Error";
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      return "Service Unavailable";
    case ApiErrorCode.JOB_FAILED:
      return "Processing Failed";
    case ApiErrorCode.FILE_TOO_LARGE:
      return "File Too Large";
    default:
      return "Error";
  }
}

/**
 * Get error severity based on error code
 */
function getErrorSeverity(code: ApiErrorCode): ErrorSeverity {
  switch (code) {
    case ApiErrorCode.INTERNAL_ERROR:
    case ApiErrorCode.SERVER_ERROR:
    case ApiErrorCode.BAD_GATEWAY:
      return "critical";
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.FORBIDDEN:
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      return "high";
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.NOT_FOUND:
    case ApiErrorCode.RATE_LIMITED:
      return "medium";
    default:
      return "low";
  }
}

/**
 * Determine if error is recoverable
 */
function getErrorRecoverability(code: ApiErrorCode): boolean {
  switch (code) {
    case ApiErrorCode.NETWORK_ERROR:
    case ApiErrorCode.TIMEOUT:
    case ApiErrorCode.RATE_LIMITED:
    case ApiErrorCode.SERVICE_UNAVAILABLE:
    case ApiErrorCode.AUTH_EXPIRED:
      return true;
    case ApiErrorCode.FORBIDDEN:
    case ApiErrorCode.NOT_FOUND:
    case ApiErrorCode.VALIDATION_ERROR:
      return false;
    default:
      return true;
  }
}

/**
 * Get suggested actions for error recovery
 */
function getSuggestedActions(code: ApiErrorCode): ErrorAction[] {
  switch (code) {
    case ApiErrorCode.NETWORK_ERROR:
    case ApiErrorCode.TIMEOUT:
      return [
        { type: "retry", label: "Try Again", primary: true },
        { type: "contact_support", label: "Get Help", primary: false },
      ];
    case ApiErrorCode.UNAUTHORIZED:
    case ApiErrorCode.AUTH_REQUIRED:
    case ApiErrorCode.AUTH_EXPIRED:
      return [
        { type: "sign_in", label: "Sign In", primary: true },
        { type: "refresh", label: "Refresh Page", primary: false },
      ];
    case ApiErrorCode.RATE_LIMITED:
      return [{ type: "retry", label: "Wait and Retry", primary: true }];
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      return [
        { type: "retry", label: "Try Again Later", primary: true },
        { type: "contact_support", label: "Report Issue", primary: false },
      ];
    default:
      return [
        { type: "retry", label: "Try Again", primary: true },
        { type: "contact_support", label: "Get Help", primary: false },
      ];
  }
}

/**
 * Create standardized app error from unknown error (from errorHandler.ts)
 * SOLID: Single Responsibility - Convert unknown errors to typed errors
 */
export function createAppError(
  error: unknown,
  fallbackMessage = "An unknown error occurred",
): {
  message: string;
  code?: string;
  cause?: unknown;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: "ERROR_INSTANCE",
      cause: error,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      code: "STRING_ERROR",
      cause: error,
    };
  }

  if (error && typeof error === "object" && "message" in error) {
    return {
      message: String(error.message),
      code: "OBJECT_WITH_MESSAGE",
      cause: error,
    };
  }

  return {
    message: fallbackMessage,
    code: "UNKNOWN_ERROR",
    cause: error,
  };
}

/**
 * Format error for user display with context
 * SOLID: Single Responsibility - Error message formatting
 */
export function formatErrorMessage(error: unknown, context?: string): string {
  const appError = createAppError(error);
  const prefix = context ? `${context}: ` : "";
  return `${prefix}${appError.message}`;
}

/**
 * Log errors consistently across the application
 * SOLID: Single Responsibility - Error logging
 */
export function logError(error: unknown, context?: string): void {
  const appError = createAppError(error);
  logger.error(context || "Error occurred", {
    message: appError.message,
    code: appError.code,
    cause: appError.cause,
  });
}

/**
 * Extract validation error message from any error type
 * SOLID: Single Responsibility - Validation message extraction
 * DRY: Consolidated validation message handling
 */
export function getValidationErrorMessage(error: unknown): string | null {
  if (isEnhancedApiError(error)) {
    return error.getValidationErrorMessage();
  }

  // Backwards compatibility for old error format
  if (hasValidationErrors(error)) {
    const messages: string[] = [];
    for (const [field, errors] of Object.entries(error.validationErrors)) {
      messages.push(`${field}: ${errors.join(", ")}`);
    }
    return messages.join("; ");
  }

  return null;
}

/**
 * Extract form validation errors from any error type
 * SOLID: Interface Segregation - Form-specific error extraction
 */
export function getFormValidationErrors(
  error: unknown,
): Record<string, string> {
  if (isEnhancedApiError(error)) {
    return error.getFormValidationErrors();
  }

  // Backwards compatibility for old error format
  if (hasValidationErrors(error)) {
    const formErrors: Record<string, string> = {};
    for (const [field, errors] of Object.entries(error.validationErrors)) {
      formErrors[field] = errors.join(", ");
    }
    return formErrors;
  }

  return {};
}

/**
 * Check if error is retryable based on status code and type
 * SOLID: Single Responsibility - Retry logic determination
 */
export function isRetryableError(error: unknown): boolean {
  if (isEnhancedApiError(error)) {
    const status = error.statusCode;
    if (!status) return true; // Network errors are typically retryable

    // Retry on server errors (5xx) and rate limiting (429)
    return status >= 500 || status === 429;
  }

  // For non-API errors, assume retryable unless it's a clear client error
  return true;
}

/**
 * Sophisticated error handler supporting validation errors and timestamps
 * SOLID: Open/Closed - Extensible for different error response formats
 * DRY: Consolidates sophisticated error handling patterns
 */
export async function handleApiResponseWithStructuredErrors<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    let errorData: {
      detail?: string;
      message?: string;
      error_code?: string;
      timestamp?: string;
      validation_errors?: Record<string, string[]>;
    };

    try {
      errorData = await response.json();
    } catch {
      // Fallback for non-JSON error responses
      const errorText = await response.text();
      errorData = {
        detail: errorText || `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Extract message with priority: message > detail > fallback
    const errorMessage =
      errorData.message ||
      errorData.detail ||
      `HTTP ${response.status}: ${response.statusText}`;

    // Create enhanced error with all sophisticated features
    throw new EnhancedApiError(
      errorMessage,
      response.status,
      errorData.error_code,
      errorData.timestamp || new Date().toISOString(),
      errorData.validation_errors,
    );
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * HTTP method types for type safety
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Standard fetch options interface
 * SOLID: Interface Segregation - Clean, focused interface
 */
export interface ApiFetchOptions {
  method?: HttpMethod | undefined;
  headers?: Record<string, string> | undefined;
  body?: string | FormData | undefined;
  signal?: AbortSignal | undefined;
}

/**
 * Enhanced fetch wrapper with consistent error handling
 * SOLID: Single Responsibility - Handles HTTP requests with standardized error processing
 * DRY: Eliminates duplicate fetch + handleResponse patterns
 */
export async function apiFetch<T>(
  url: string,
  options: ApiFetchOptions = {},
  useStructuredErrors: boolean = false,
): Promise<T> {
  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include", // CRITICAL: Required for httpOnly cookies
    ...(options.headers && { headers: options.headers }),
    ...(options.body && { body: options.body }),
    ...(options.signal && { signal: options.signal }),
  });

  return useStructuredErrors
    ? handleApiResponseWithStructuredErrors<T>(response)
    : handleApiResponse<T>(response);
}

/**
 * Retry configuration for robust API calls
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration following backend best practices
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Exponential backoff delay calculation
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Enhanced fetch with retry logic and exponential backoff
 * SOLID: Open/Closed - Extensible retry behavior
 * Follows backend patterns for robust API communication
 */
export async function apiFetchWithRetry<T>(
  url: string,
  options: ApiFetchOptions = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  useStructuredErrors: boolean = false,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
    try {
      return await apiFetch<T>(url, options, useStructuredErrors);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except for specific cases
      if (error instanceof EnhancedApiError) {
        const status = error.statusCode;
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error; // Don't retry client errors except rate limiting
        }
      } else if (error instanceof Error && hasApiError(error)) {
        const status = error.apiError.status;
        if (status >= 400 && status < 500 && status !== 429) {
          throw error; // Don't retry client errors except rate limiting
        }
      }

      // Don't retry on the last attempt
      if (attempt === retryConfig.maxAttempts - 1) {
        break;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, retryConfig);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * Enhanced API Client Configuration
 * SOLID: Interface Segregation - Client-specific configuration
 */
export interface EnhancedApiClientConfig {
  baseURL: string;
  apiKey?: string | undefined;
  defaultHeaders?: Record<string, string> | undefined;
  useStructuredErrors?: boolean | undefined;
  retryConfig?: RetryConfig | undefined;
}

/**
 * Enhanced API Client Class following DRY/SOLID principles
 * SOLID: Single Responsibility - HTTP client operations
 * SOLID: Open/Closed - Extensible for different API patterns
 * DRY: Eliminates duplicate sophisticated error handling
 */
export class EnhancedApiClient {
  private config: EnhancedApiClientConfig;

  constructor(config: EnhancedApiClientConfig) {
    this.config = {
      useStructuredErrors: true,
      retryConfig: DEFAULT_RETRY_CONFIG,
      ...config,
    };
  }

  /**
   * Set or update the API key for authentication
   * Used to add Bearer token after user login
   */
  setAPIKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Enhanced request method with sophisticated error handling
   * SOLID: Single Responsibility - HTTP request with full error support
   */
  async request<T>(
    endpoint: string,
    options: ApiFetchOptions = {},
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;

    // Prepare headers with authentication
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.defaultHeaders,
      ...options.headers,
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const requestOptions: ApiFetchOptions = {
      ...options,
      headers,
    };

    try {
      if (this.config.retryConfig) {
        return await apiFetchWithRetry<T>(
          url,
          requestOptions,
          this.config.retryConfig,
          this.config.useStructuredErrors,
        );
      } else {
        return await apiFetch<T>(
          url,
          requestOptions,
          this.config.useStructuredErrors,
        );
      }
    } catch (error) {
      // Re-throw enhanced errors or wrap basic errors
      if (error instanceof EnhancedApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new EnhancedApiError(
          error.message || "Network request failed",
          undefined,
          undefined,
          new Date().toISOString(),
        );
      }

      throw new EnhancedApiError(
        "Unknown error occurred",
        undefined,
        undefined,
        new Date().toISOString(),
      );
    }
  }

  /**
   * Convenience methods for common HTTP operations
   * SOLID: Interface Segregation - Specific operation methods
   */
  async get<T>(
    endpoint: string,
    options: Omit<ApiFetchOptions, "method"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<ApiFetchOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<ApiFetchOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    endpoint: string,
    options: Omit<ApiFetchOptions, "method"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<ApiFetchOptions, "method" | "body"> = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
