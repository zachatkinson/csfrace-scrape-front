/**
 * User Settings API Client
 * Extends the main API client with user settings-specific endpoints
 * Follows SOLID/DRY principles and integrates with existing auth system
 */

import { apiClient } from "./api-client.ts";
import { authAPI } from "./auth-api.ts";

export interface UserSettings {
  id: string;
  user_id: string;

  // Job Defaults
  default_priority: string;
  max_retries: number;
  job_timeout: number;

  // API Configuration
  api_url: string;
  api_timeout: number;
  refresh_interval: number;
  retry_attempts: number;
  enable_caching: boolean;

  // Display Options
  dark_mode: boolean;
  show_job_ids: boolean;
  compact_mode: boolean;
  jobs_per_page: number;
  timezone: string;

  // Notification Settings
  completion_alerts: boolean;
  error_notifications: boolean;
  browser_notifications: boolean;

  // Additional settings
  custom_settings?: Record<string, unknown> | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  // Job Defaults
  default_priority?: string;
  max_retries?: number;
  job_timeout?: number;

  // API Configuration
  api_url?: string;
  api_timeout?: number;
  refresh_interval?: number;
  retry_attempts?: number;
  enable_caching?: boolean;

  // Display Options
  dark_mode?: boolean;
  show_job_ids?: boolean;
  compact_mode?: boolean;
  jobs_per_page?: number;
  timezone?: string;

  // Notification Settings
  completion_alerts?: boolean;
  error_notifications?: boolean;
  browser_notifications?: boolean;

  // Additional settings
  custom_settings?: Record<string, unknown> | null;
}

class UserSettingsAPI {
  private baseClient = apiClient;

  /**
   * Get current user's settings
   * Creates default settings if none exist
   */
  async getUserSettings(): Promise<UserSettings> {
    return this.baseClient.get<UserSettings>("/user/settings/");
  }

  /**
   * Update current user's settings
   * Supports partial updates
   */
  async updateUserSettings(
    settings: UserSettingsUpdate,
  ): Promise<UserSettings> {
    return this.baseClient.put<UserSettings>("/user/settings/", settings);
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(): Promise<{ message: string }> {
    return this.baseClient.delete<{ message: string }>("/user/settings/");
  }

  /**
   * Check if user is authenticated for backend settings
   */
  isAuthenticated(): boolean {
    try {
      // Check if we have a valid auth token
      const token = localStorage.getItem("auth_token");
      if (!token) return false;

      // Simple expiration check if token is JWT
      const payload = this.parseJWTPayload(token);
      if (payload?.exp && Date.now() >= payload.exp * 1000) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user info for settings context
   */
  async getCurrentUser() {
    return authAPI.getCurrentUser();
  }

  /**
   * Parse JWT token payload
   */
  private parseJWTPayload(token: string): { exp?: number } | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = parts[1];
      if (!payload) return null;
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.baseClient.setAPIKey(token);
  }

  /**
   * Clear authentication
   */
  clearAuthToken(): void {
    this.baseClient.setAPIKey("");
  }
}

// Singleton instance
export const userSettingsAPI = new UserSettingsAPI();

// Default settings for fallback
export const DEFAULT_USER_SETTINGS: Omit<
  UserSettings,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  // Job Defaults
  default_priority: "normal",
  max_retries: 3,
  job_timeout: 30,

  // API Configuration
  api_url: "http://localhost",
  api_timeout: 30,
  refresh_interval: 10,
  retry_attempts: 3,
  enable_caching: true,

  // Display Options
  dark_mode: true,
  show_job_ids: true,
  compact_mode: false,
  jobs_per_page: 10,
  timezone: "auto",

  // Notification Settings
  completion_alerts: true,
  error_notifications: true,
  browser_notifications: false,

  // Additional settings
  custom_settings: {},
};

// Utility functions
export function mergeWithDefaults(
  settings: Partial<UserSettings>,
): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
    // Ensure required fields
    id: settings.id || "",
    user_id: settings.user_id || "",
    created_at: settings.created_at || new Date().toISOString(),
    updated_at: settings.updated_at || new Date().toISOString(),
  };
}

export function isSettingsEqual(a: UserSettings, b: UserSettings): boolean {
  // Compare all fields except timestamps using object spread and destructuring
  const { created_at, updated_at, ...aWithoutTimestamps } = a;
  const { created_at: createdAtB, updated_at: updatedAtB, ...bWithoutTimestamps } = b;

  // Avoid unused variable warning by referencing them in a void expression
  void created_at;
  void updated_at;
  void createdAtB;
  void updatedAtB;

  return (
    JSON.stringify(aWithoutTimestamps) === JSON.stringify(bWithoutTimestamps)
  );
}

export function validateSettings(settings: UserSettingsUpdate): string[] {
  const errors: string[] = [];

  if (
    settings.max_retries !== undefined &&
    (settings.max_retries < 0 || settings.max_retries > 10)
  ) {
    errors.push("Max retries must be between 0 and 10");
  }

  if (
    settings.job_timeout !== undefined &&
    (settings.job_timeout < 10 || settings.job_timeout > 3600)
  ) {
    errors.push("Job timeout must be between 10 and 3600 seconds");
  }

  if (
    settings.api_timeout !== undefined &&
    (settings.api_timeout < 5 || settings.api_timeout > 300)
  ) {
    errors.push("API timeout must be between 5 and 300 seconds");
  }

  if (
    settings.refresh_interval !== undefined &&
    (settings.refresh_interval < 5 || settings.refresh_interval > 300)
  ) {
    errors.push("Refresh interval must be between 5 and 300 seconds");
  }

  if (
    settings.retry_attempts !== undefined &&
    (settings.retry_attempts < 0 || settings.retry_attempts > 10)
  ) {
    errors.push("Retry attempts must be between 0 and 10");
  }

  if (
    settings.jobs_per_page !== undefined &&
    (settings.jobs_per_page < 5 || settings.jobs_per_page > 100)
  ) {
    errors.push("Jobs per page must be between 5 and 100");
  }

  if (settings.api_url !== undefined) {
    try {
      new URL(settings.api_url);
    } catch {
      errors.push("API URL must be a valid URL");
    }
  }

  if (settings.default_priority !== undefined) {
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!validPriorities.includes(settings.default_priority)) {
      errors.push("Default priority must be one of: low, normal, high, urgent");
    }
  }

  return errors;
}
