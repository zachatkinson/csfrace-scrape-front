/**
 * API Configuration Constants
 * Centralized API URLs and endpoints configuration
 * ZERO TOLERANCE for hardcoded URLs - All API endpoints must use these constants
 */

import { createContextLogger } from "../utils/logger";

// Type definitions for window extensions

// API Config interface
interface IApiConfig {
  DEFAULT_BASE_URL: string;
  DEVELOPMENT_URL: string;
  PRODUCTION_URL?: string;
  STAGING_URL?: string;
  DOCKER_URL?: string;
  DEFAULT_TIMEOUT?: number;
  DEFAULT_RETRIES?: number;
  HEALTH_CHECK_INTERVAL?: number;
  HEALTH_CHECK_TIMEOUT?: number;
  [key: string]: string | number | undefined;
}

const logger = createContextLogger("APIConfig");

// =============================================================================
// SOLID/DRY API CONFIGURATION
// =============================================================================
// Single Responsibility: API configuration management
// DRY: Centralized configuration without duplication
// Open/Closed: Extensible for new environments without modification
// =============================================================================

// Base API Configuration with SOLID/DRY principles
export const API_CONFIG = {
  // Environment-aware API Base URL (DRY: single source of truth)
  DEFAULT_BASE_URL: getEnvironmentAwareApiUrl(),

  // Fallback URLs for different deployment scenarios (DRY: from env vars)
  DEVELOPMENT_URL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.PUBLIC_API_BASE_URL ||
    "https://localhost",
  DOCKER_URL: import.meta.env.VITE_SERVER_API_URL || "http://backend:8000", // Internal Docker networking

  // Request Configuration (centralized) - Astro best practice
  DEFAULT_TIMEOUT: parseInt(import.meta.env.PUBLIC_API_TIMEOUT ?? "30000", 10),
  DEFAULT_RETRIES: 3,

  // Health Check Configuration (aligned with backend)
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  HEALTH_CHECK_TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Environment-aware API URL resolver (SOLID: Single Responsibility)
 * Determines the correct API URL based on deployment context
 */
function getEnvironmentAwareApiUrl(): string {
  // ASTRO BEST PRACTICE: Environment-aware API URL selection
  // Following official Astro documentation patterns

  // Server-side (Server Islands, SSR) - use internal Docker network in production
  if (typeof window === "undefined") {
    const serverApiUrl = import.meta.env.SERVER_API_BASE_URL;
    if (serverApiUrl) {
      logger.info("Server-side API URL selected", {
        source: "SERVER_API_BASE_URL",
        url: serverApiUrl,
      });
      return serverApiUrl;
    }
  }

  // Client-side (browser) - use public API URL
  const publicApiUrl = import.meta.env.PUBLIC_API_BASE_URL;
  if (publicApiUrl) {
    logger.info("Browser-side API URL selected", {
      source: "PUBLIC_API_BASE_URL",
      url: publicApiUrl,
    });
    return publicApiUrl;
  }

  // Legacy support for Docker compose environment variables
  const viteApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const viteServerApiUrl = import.meta.env.VITE_SERVER_API_URL as
    | string
    | undefined;

  if (typeof window === "undefined" && viteServerApiUrl) {
    logger.info("Legacy server API URL selected", {
      source: "VITE_SERVER_API_URL",
      url: viteServerApiUrl,
    });
    return viteServerApiUrl;
  }

  if (viteApiUrl) {
    logger.info("Legacy client API URL selected", {
      source: "VITE_API_URL",
      url: viteApiUrl,
    });
    return viteApiUrl;
  }

  // Default fallback (DRY: from environment or sensible default)
  const defaultUrl = import.meta.env.PUBLIC_API_BASE_URL || "https://localhost";
  logger.info("Default API URL selected", { url: defaultUrl });
  return defaultUrl;
}

// API Endpoints - All endpoints relative to base URL
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    TOKEN: "/auth/token",
    REFRESH: "/auth/refresh",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password",
    PASSWORD_RESET: "/auth/password-reset",
    PASSWORD_RESET_CONFIRM: "/auth/password-reset/confirm",
    OAUTH: {
      PROVIDERS: "/auth/oauth/providers",
      LOGIN: "/auth/oauth/login",
      CALLBACK: (provider: string) => `/auth/oauth/${provider}/callback`,
    },
    WEBAUTHN: {
      PASSKEYS_SUMMARY: "/auth/passkeys/summary",
      REGISTER_BEGIN: "/auth/passkeys/register/begin",
      REGISTER_COMPLETE: "/auth/passkeys/register/complete",
      AUTH_BEGIN: "/auth/passkeys/authenticate/begin",
      AUTH_COMPLETE: "/auth/passkeys/authenticate/complete",
      DELETE_PASSKEY: (credentialId: string) =>
        `/auth/passkeys/${credentialId}`,
    },
    USERS: {
      LIST: "/auth/users",
      GET: (userId: number) => `/auth/users/${userId}`,
      UPDATE: (userId: number) => `/auth/users/${userId}`,
      DELETE: (userId: number) => `/auth/users/${userId}`,
    },
  },

  // Jobs Management
  JOBS: {
    LIST: "/jobs",
    GET: (id: number) => `/jobs/${id}`,
    CREATE: "/jobs",
    UPDATE: (id: number) => `/jobs/${id}`,
    DELETE: (id: number) => `/jobs/${id}`,
    START: (id: number) => `/jobs/${id}/start`,
    CANCEL: (id: number) => `/jobs/${id}/cancel`,
    RETRY: (id: number) => `/jobs/${id}/retry`,
    RESULTS: (id: number) => `/jobs/${id}/results`,
    RESULT: (jobId: number, resultId: number) =>
      `/jobs/${jobId}/results/${resultId}`,
    LOGS: (id: number) => `/jobs/${id}/logs`,
  },

  // Batch Processing
  BATCHES: {
    LIST: "/batches",
    GET: (id: number) => `/batches/${id}`,
    CREATE: "/batches",
  },

  // Health & Monitoring
  HEALTH: {
    CHECK: "/health/",
    METRICS: "/health/metrics",
    LIVE: "/health/live",
    READY: "/health/ready",
    PROMETHEUS: "/health/prometheus",
  },

  // URL Validation
  VALIDATION: {
    URL: "/validate-url",
  },
} as const;

// =============================================================================
// SOLID API URL MANAGEMENT
// =============================================================================

/**
 * Get the current API base URL (SOLID: Single Responsibility)
 * Returns the resolved API URL for the current environment
 */
export function getApiBaseUrl(): string {
  // DRY: Use the centrally configured DEFAULT_BASE_URL
  return API_CONFIG.DEFAULT_BASE_URL;
}

/**
 * Update API base URL dynamically (Open/Closed: extensible)
 * Allows runtime API URL changes without breaking existing contracts
 */
export function updateApiBaseUrl(newUrl: string): void {
  // Update the configuration object
  (API_CONFIG as IApiConfig).DEFAULT_BASE_URL = newUrl;

  // Notify any global services about the URL change
  if (typeof window !== "undefined") {
    // Update global window variable for backward compatibility
    window.CSFRACE_API_BASE_URL = newUrl;

    // Update health service if available
    const healthService = window.healthStatusService;
    if (healthService && typeof healthService.updateApiUrl === "function") {
      healthService.updateApiUrl(newUrl);
    }

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent("apiUrlChanged", {
        detail: { newUrl, timestamp: new Date().toISOString() },
      }),
    );
  }
}

// Helper function to build full API URL
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
}

// Helper function to build URLs with query parameters
export function buildApiUrlWithParams(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const baseUrl = buildApiUrl(endpoint);
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Type-safe endpoint builders
export const ApiUrlBuilder = {
  auth: {
    token: () => buildApiUrl(API_ENDPOINTS.AUTH.TOKEN),
    refresh: () => buildApiUrl(API_ENDPOINTS.AUTH.REFRESH),
    register: () => buildApiUrl(API_ENDPOINTS.AUTH.REGISTER),
    me: () => buildApiUrl(API_ENDPOINTS.AUTH.ME),
    changePassword: () => buildApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD),
    passwordReset: () => buildApiUrl(API_ENDPOINTS.AUTH.PASSWORD_RESET),
    passwordResetConfirm: () =>
      buildApiUrl(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM),
    oauthProviders: () => buildApiUrl(API_ENDPOINTS.AUTH.OAUTH.PROVIDERS),
    oauthLogin: () => buildApiUrl(API_ENDPOINTS.AUTH.OAUTH.LOGIN),
    oauthCallback: (provider: string) =>
      buildApiUrl(API_ENDPOINTS.AUTH.OAUTH.CALLBACK(provider)),
  },
  jobs: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      params
        ? buildApiUrlWithParams(API_ENDPOINTS.JOBS.LIST, params)
        : buildApiUrl(API_ENDPOINTS.JOBS.LIST),
    get: (id: number) => buildApiUrl(API_ENDPOINTS.JOBS.GET(id)),
    create: () => buildApiUrl(API_ENDPOINTS.JOBS.CREATE),
    start: (id: number) => buildApiUrl(API_ENDPOINTS.JOBS.START(id)),
    cancel: (id: number) => buildApiUrl(API_ENDPOINTS.JOBS.CANCEL(id)),
    retry: (id: number) => buildApiUrl(API_ENDPOINTS.JOBS.RETRY(id)),
  },
  health: {
    check: () => buildApiUrl(API_ENDPOINTS.HEALTH.CHECK),
    metrics: () => buildApiUrl(API_ENDPOINTS.HEALTH.METRICS),
    prometheus: () => buildApiUrl(API_ENDPOINTS.HEALTH.PROMETHEUS),
  },
} as const;

// Environment-specific configuration
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.MODE === "development",
  isProduction: import.meta.env.MODE === "production",
  apiUrl: getApiBaseUrl(),
  timeout: API_CONFIG.DEFAULT_TIMEOUT,
  retries: API_CONFIG.DEFAULT_RETRIES,
} as const;
