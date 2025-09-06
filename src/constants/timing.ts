/**
 * Timing Constants
 * Centralized timing values, delays, intervals, and timeouts
 * ZERO TOLERANCE for hardcoded timing values - All timing must use these constants
 */

// API and Network Timing
export const API_TIMING = {
  // Request timeouts
  DEFAULT_TIMEOUT: 30000,  // 30 seconds
  SHORT_TIMEOUT: 10000,    // 10 seconds
  LONG_TIMEOUT: 60000,     // 60 seconds
  
  // Retry configuration
  RETRY_DELAY_BASE: 1000,  // 1 second base delay
  RETRY_MAX_ATTEMPTS: 3,
  
  // Polling intervals
  HEALTH_CHECK_INTERVAL: 30000,  // 30 seconds
  JOB_STATUS_POLL_INTERVAL: 2000,  // 2 seconds
  BATCH_STATUS_POLL_INTERVAL: 5000,  // 5 seconds
} as const;

// UI Animation and Interaction Timing
export const UI_TIMING = {
  // Animation durations
  FAST_ANIMATION: 150,     // 150ms - Quick UI responses
  NORMAL_ANIMATION: 300,   // 300ms - Standard transitions  
  SLOW_ANIMATION: 500,     // 500ms - Emphasis animations
  EXTRA_SLOW_ANIMATION: 1000, // 1 second - Special effects
  
  // Debounce and throttle
  SEARCH_DEBOUNCE: 300,    // 300ms - Search input debounce
  SCROLL_THROTTLE: 16,     // 16ms - ~60fps scroll throttling
  RESIZE_DEBOUNCE: 250,    // 250ms - Window resize debounce
  
  // User feedback delays
  TOAST_DURATION: 4000,    // 4 seconds - Toast notifications
  TOOLTIP_DELAY: 500,      // 500ms - Tooltip show delay
  LOADING_MIN_DISPLAY: 200, // 200ms - Minimum loading spinner time
  
  // Form interaction
  INPUT_VALIDATION_DELAY: 500, // 500ms - Validation after typing stops
  FORM_SUBMIT_TIMEOUT: 30000,  // 30 seconds - Form submission timeout
} as const;

// Authentication and Session Timing
export const AUTH_TIMING = {
  // Token management
  TOKEN_REFRESH_BUFFER: 300000,    // 5 minutes before expiry
  SESSION_CHECK_INTERVAL: 60000,   // 1 minute - Check session validity
  TOKEN_STORAGE_CLEANUP: 86400000, // 24 hours - Clean expired tokens
  
  // OAuth timeouts
  OAUTH_STATE_EXPIRY: 600000,      // 10 minutes - OAuth state timeout
  OAUTH_CALLBACK_TIMEOUT: 30000,   // 30 seconds - OAuth callback timeout
  
  // WebAuthn timeouts
  WEBAUTHN_TIMEOUT: 300000,        // 5 minutes - WebAuthn ceremony timeout
  WEBAUTHN_USER_VERIFICATION: 60000, // 1 minute - User verification timeout
} as const;

// Job Processing Timing
export const JOB_TIMING = {
  // Processing timeouts
  SINGLE_JOB_TIMEOUT: 300000,      // 5 minutes - Individual job timeout
  BATCH_JOB_TIMEOUT: 1800000,      // 30 minutes - Batch processing timeout
  LARGE_BATCH_TIMEOUT: 3600000,    // 1 hour - Large batch timeout
  
  // Status checking
  JOB_STATUS_CHECK_INTERVAL: 2000,  // 2 seconds - Active job monitoring
  COMPLETED_JOB_CLEANUP: 3600000,   // 1 hour - Clean completed jobs from memory
  
  // Queue management
  QUEUE_PROCESS_INTERVAL: 1000,     // 1 second - Queue processing interval
  MAX_CONCURRENT_JOBS: 5,           // Maximum parallel jobs
} as const;

// File Upload and Processing Timing
export const UPLOAD_TIMING = {
  // Upload timeouts
  SMALL_FILE_TIMEOUT: 30000,       // 30 seconds - Files under 10MB
  MEDIUM_FILE_TIMEOUT: 120000,     // 2 minutes - Files 10MB-100MB
  LARGE_FILE_TIMEOUT: 600000,      // 10 minutes - Files over 100MB
  
  // Progress reporting
  UPLOAD_PROGRESS_INTERVAL: 500,   // 500ms - Upload progress updates
  
  // Chunk processing
  FILE_CHUNK_PROCESS_DELAY: 100,   // 100ms - Delay between chunk processing
} as const;

// Cache and Storage Timing
export const CACHE_TIMING = {
  // Cache expiration
  SHORT_CACHE: 300000,             // 5 minutes - Frequently changing data
  MEDIUM_CACHE: 1800000,           // 30 minutes - Semi-static data
  LONG_CACHE: 86400000,            // 24 hours - Static data
  
  // Cache cleanup
  CACHE_CLEANUP_INTERVAL: 3600000, // 1 hour - Automatic cache cleanup
  
  // Local storage
  LOCAL_STORAGE_SYNC_DELAY: 1000,  // 1 second - Debounce local storage writes
} as const;

// Development and Testing Timing
export const DEV_TIMING = {
  // Mock delays (development only)
  MOCK_API_DELAY: 800,             // 800ms - Simulate network delay
  MOCK_PROCESSING_DELAY: 2000,     // 2 seconds - Simulate job processing
  
  // Test timeouts
  UNIT_TEST_TIMEOUT: 5000,         // 5 seconds - Individual test timeout
  INTEGRATION_TEST_TIMEOUT: 30000, // 30 seconds - Integration test timeout
  E2E_TEST_TIMEOUT: 60000,         // 1 minute - End-to-end test timeout
} as const;

// Health Check and Monitoring
export const MONITORING_TIMING = {
  // Health checks
  HEALTH_CHECK_INTERVAL: 30000,    // 30 seconds - Regular health checks
  HEALTH_CHECK_TIMEOUT: 10000,     // 10 seconds - Health check timeout
  
  // Error reporting
  ERROR_REPORT_DEBOUNCE: 5000,     // 5 seconds - Prevent error spam
  METRICS_COLLECTION_INTERVAL: 60000, // 1 minute - Collect metrics
  
  // Connection monitoring
  RECONNECT_INTERVAL: 5000,        // 5 seconds - Reconnection attempts
  CONNECTION_TIMEOUT: 15000,       // 15 seconds - Connection timeout
} as const;

// Helper functions for common timing operations
export const TimingHelpers = {
  /**
   * Convert seconds to milliseconds
   */
  seconds: (seconds: number): number => seconds * 1000,
  
  /**
   * Convert minutes to milliseconds
   */
  minutes: (minutes: number): number => minutes * 60 * 1000,
  
  /**
   * Convert hours to milliseconds
   */
  hours: (hours: number): number => hours * 60 * 60 * 1000,
  
  /**
   * Get exponential backoff delay
   */
  exponentialBackoff: (attempt: number, baseDelay: number = API_TIMING.RETRY_DELAY_BASE): number => {
    return baseDelay * Math.pow(2, attempt - 1);
  },
  
  /**
   * Get jittered delay (adds random variation to prevent thundering herd)
   */
  jitteredDelay: (baseDelay: number, jitterPercent: number = 0.1): number => {
    const jitter = baseDelay * jitterPercent * Math.random();
    return baseDelay + jitter;
  },
} as const;

// Environment-specific timing adjustments
export const getEnvironmentTiming = () => {
  const isDev = import.meta.env.MODE === 'development';
  const isTest = import.meta.env.MODE === 'test';
  
  return {
    // Faster timeouts in development for better DX
    API_TIMEOUT: isDev ? API_TIMING.SHORT_TIMEOUT : API_TIMING.DEFAULT_TIMEOUT,
    
    // Shorter intervals in development
    POLL_INTERVAL: isDev ? JOB_TIMING.JOB_STATUS_CHECK_INTERVAL / 2 : JOB_TIMING.JOB_STATUS_CHECK_INTERVAL,
    
    // Faster animations in test environment
    ANIMATION_DURATION: isTest ? 0 : UI_TIMING.NORMAL_ANIMATION,
    
    // No delays in test environment
    MOCK_DELAY: isTest ? 0 : DEV_TIMING.MOCK_API_DELAY,
  } as const;
};

// Export all timing constants as a single object for convenience
export const TIMING_CONSTANTS = {
  API: API_TIMING,
  UI: UI_TIMING,
  AUTH: AUTH_TIMING,
  JOB: JOB_TIMING,
  UPLOAD: UPLOAD_TIMING,
  CACHE: CACHE_TIMING,
  DEV: DEV_TIMING,
  MONITORING: MONITORING_TIMING,
  HELPERS: TimingHelpers,
  ENVIRONMENT: getEnvironmentTiming(),
} as const;

export default TIMING_CONSTANTS;