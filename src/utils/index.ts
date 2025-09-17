/**
 * Consolidated Utility Exports
 * SOLID: Single Responsibility - Central utility access point
 * DRY: Single source for all utility functions
 * Following focused module organization
 */

// Formatting utilities
export {
  formatFileSize,
  formatRelativeTime,
  formatDuration,
  formatPercentage,
  formatLogLevel,
  capitalize,
  formatJobTitle
} from './formatting.ts';

// Calculation utilities
export {
  calculateJobProgress,
  calculateJobEfficiency,
  isJobRetryable,
  calculateNextRetryTime,
  calculatePercentage,
  calculateAverage,
  calculateProcessingRate
} from './calculations.ts';

// API utilities (enhanced error handling and HTTP operations)
export {
  handleApiResponse,
  EnhancedApiError,
  isEnhancedApiError,
  hasValidationErrors,
  analyzeError,
  createAppError,
  formatErrorMessage,
  logError,
  ApiErrorCode
} from './api-utils.ts';

// Security utilities
export { SecurityUtils, SecureStorage } from './security.ts';

// Form validation utilities
export {
  FieldValidator,
  FormValidator,
  ValidationHelpers
} from './form-validation.ts';

// DOM utilities
export {
  SafeDomAccessor,
  DomTextUpdater,
  DomClassUpdater
} from './dom-utilities.ts';
export type { IDomUpdater } from './dom-utilities.ts';

// Modal utilities
export * from './modalUtils.ts';

// Test helpers (for development/testing)
export {
  SecurityTestHelpers,
  AuthTestHelpers,
  PerformanceTestHelpers,
  AccessibilityTestHelpers
} from './test-helpers.ts';

// Auth-related utilities
export * from './auth-tokens.ts';
export * from './authApi.ts';
export * from './secure-token-storage.ts';

// Service utilities
export { HttpClient, ErrorHandler } from './serviceCheckers.ts';

// UI utilities
export { UIUpdater } from './uiUpdater.ts';
export * from './health-ui-utilities.ts';

// Type definitions for utilities
export type {
  ApiError,
  ErrorSeverity,
  ErrorAction
} from './api-utils.ts';