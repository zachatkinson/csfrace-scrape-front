/**
 * User Settings Nano Store
 * Single source of truth: Backend database
 * No localStorage duplication - backend is the only persistent storage
 *
 * SOLID: Single Responsibility - Manages only user settings state
 * DRY: Eliminates localStorage/backend dual storage
 */

import { atom, onMount } from "nanostores";
import type { AppSettings, ApiConfigSettings } from "../interfaces/forms";
import { createContextLogger } from "../utils/logger";

const logger = createContextLogger("userSettings-store");

// =============================================================================
// TYPES
// =============================================================================

export interface UserSettingsState {
  // Settings data
  appSettings: AppSettings;
  apiSettings: ApiConfigSettings;

  // State flags
  isLoading: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  error: string | null;
}

// =============================================================================
// DEFAULT SETTINGS (fallback for non-authenticated users only)
// =============================================================================

const getDefaultAppSettings = (): AppSettings => ({
  // Job Defaults
  defaultPriority: "normal",
  maxRetries: 3,
  jobTimeout: 30,

  // Display Options
  darkMode: true,
  showJobIds: true,
  compactMode: false,
  jobsPerPage: 10,
  timezone: "auto",

  // Notifications
  completionAlerts: true,
  errorNotifications: true,
  browserNotifications: false,
});

const getDefaultApiSettings = (): ApiConfigSettings => ({
  apiUrl:
    typeof window !== "undefined" && window.CSFRACE_API_BASE_URL
      ? window.CSFRACE_API_BASE_URL
      : "https://localhost",
  apiTimeout: 30,
  refreshInterval: 10,
  retryAttempts: 3,
  enableCaching: true,
});

// =============================================================================
// STORE
// =============================================================================

export const userSettingsStore = atom<UserSettingsState>({
  appSettings: getDefaultAppSettings(),
  apiSettings: getDefaultApiSettings(),
  isLoading: true,
  isAuthenticated: false,
  isSyncing: false,
  error: null,
});

// =============================================================================
// BACKEND API
// =============================================================================

const API_BASE = "https://localhost";

/**
 * Check if user is authenticated (via httpOnly cookies)
 */
async function checkAuthentication(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include", // Send httpOnly cookies
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch (error) {
    logger.warn("Authentication check failed", { error });
    return false;
  }
}

/**
 * Load user settings from backend (single source of truth)
 */
async function loadSettingsFromBackend(): Promise<
  (UserSettingsState["appSettings"] & UserSettingsState["apiSettings"]) | null
> {
  try {
    const response = await fetch(`${API_BASE}/auth/user/settings`, {
      method: "GET",
      credentials: "include", // Send httpOnly cookies
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to load settings: ${response.status}`);
    }

    const backendSettings = await response.json();

    // Convert backend snake_case to frontend camelCase
    return {
      // App settings
      defaultPriority: backendSettings.default_priority,
      maxRetries: backendSettings.max_retries,
      jobTimeout: backendSettings.job_timeout,
      darkMode: backendSettings.dark_mode,
      showJobIds: backendSettings.show_job_ids,
      compactMode: backendSettings.compact_mode,
      jobsPerPage: backendSettings.jobs_per_page,
      timezone: backendSettings.timezone,
      completionAlerts: backendSettings.completion_alerts,
      errorNotifications: backendSettings.error_notifications,
      browserNotifications: backendSettings.browser_notifications,

      // API settings
      apiUrl: backendSettings.api_url,
      apiTimeout: backendSettings.api_timeout,
      refreshInterval: backendSettings.refresh_interval,
      retryAttempts: backendSettings.retry_attempts,
      enableCaching: backendSettings.enable_caching,
    };
  } catch (error) {
    logger.error("Failed to load settings from backend", { error });
    return null;
  }
}

/**
 * Save user settings to backend (single source of truth)
 */
async function saveSettingsToBackend(
  appSettings: AppSettings,
  apiSettings: ApiConfigSettings,
): Promise<boolean> {
  try {
    // Convert frontend camelCase to backend snake_case
    const backendSettings = {
      default_priority: appSettings.defaultPriority,
      max_retries: appSettings.maxRetries,
      job_timeout: appSettings.jobTimeout,
      api_url: apiSettings.apiUrl,
      api_timeout: apiSettings.apiTimeout,
      refresh_interval: apiSettings.refreshInterval,
      retry_attempts: apiSettings.retryAttempts,
      enable_caching: apiSettings.enableCaching,
      dark_mode: appSettings.darkMode,
      show_job_ids: appSettings.showJobIds,
      compact_mode: appSettings.compactMode,
      jobs_per_page: appSettings.jobsPerPage,
      timezone: appSettings.timezone,
      completion_alerts: appSettings.completionAlerts,
      error_notifications: appSettings.errorNotifications,
      browser_notifications: appSettings.browserNotifications,
    };

    const response = await fetch(`${API_BASE}/auth/user/settings`, {
      method: "PUT",
      credentials: "include", // Send httpOnly cookies
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendSettings),
    });

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.status}`);
    }

    logger.info("Settings saved to backend successfully");
    return true;
  } catch (error) {
    logger.error("Failed to save settings to backend", { error });
    return false;
  }
}

// =============================================================================
// STORE ACTIONS (Tasks)
// =============================================================================

/**
 * Initialize user settings on app load
 * Loads from backend if authenticated, uses defaults otherwise
 */
export const initializeSettings = async (): Promise<void> => {
  logger.info("Initializing user settings...");

  userSettingsStore.set({
    ...userSettingsStore.get(),
    isLoading: true,
    error: null,
  });

  try {
    // Check authentication status
    const isAuthenticated = await checkAuthentication();

    if (isAuthenticated) {
      // Load from backend (single source of truth)
      logger.info("User authenticated - loading settings from backend");
      const settings = await loadSettingsFromBackend();

      if (settings) {
        userSettingsStore.set({
          appSettings: {
            defaultPriority: settings.defaultPriority,
            maxRetries: settings.maxRetries,
            jobTimeout: settings.jobTimeout,
            darkMode: settings.darkMode,
            showJobIds: settings.showJobIds,
            compactMode: settings.compactMode,
            jobsPerPage: settings.jobsPerPage,
            timezone: settings.timezone,
            completionAlerts: settings.completionAlerts,
            errorNotifications: settings.errorNotifications,
            browserNotifications: settings.browserNotifications,
          },
          apiSettings: {
            apiUrl: settings.apiUrl,
            apiTimeout: settings.apiTimeout,
            refreshInterval: settings.refreshInterval,
            retryAttempts: settings.retryAttempts,
            enableCaching: settings.enableCaching,
          },
          isLoading: false,
          isAuthenticated: true,
          isSyncing: false,
          error: null,
        });

        // Apply settings to DOM
        applySettingsToDom(settings);
        logger.info("Settings loaded from backend successfully");
      } else {
        // Backend failed, use defaults
        logger.warn("Failed to load from backend, using defaults");
        useDefaultSettings(true);
      }
    } else {
      // Not authenticated, use defaults
      logger.info("User not authenticated - using default settings");
      useDefaultSettings(false);
    }
  } catch (error) {
    logger.error("Failed to initialize settings", { error });
    userSettingsStore.set({
      ...userSettingsStore.get(),
      isLoading: false,
      error: "Failed to initialize settings",
    });
    useDefaultSettings(false);
  }
};

/**
 * Update app settings and sync to backend
 */
export const updateAppSettings = async (
  newSettings: Partial<AppSettings>,
): Promise<void> => {
    const currentState = userSettingsStore.get();
    const updatedAppSettings = { ...currentState.appSettings, ...newSettings };

    // Optimistically update UI
    userSettingsStore.set({
      ...currentState,
      appSettings: updatedAppSettings,
      isSyncing: true,
    });

    // Apply to DOM immediately
    applySettingsToDom({ ...updatedAppSettings, ...currentState.apiSettings });

    if (currentState.isAuthenticated) {
      // Sync to backend (single source of truth)
      const success = await saveSettingsToBackend(
        updatedAppSettings,
        currentState.apiSettings,
      );

      userSettingsStore.set({
        ...userSettingsStore.get(),
        isSyncing: false,
        error: success ? null : "Failed to save settings",
      });
    } else {
      userSettingsStore.set({
        ...userSettingsStore.get(),
        isSyncing: false,
      });
    }
};

/**
 * Update API settings and sync to backend
 */
export const updateApiSettings = async (
  newSettings: Partial<ApiConfigSettings>,
): Promise<void> => {
    const currentState = userSettingsStore.get();
    const updatedApiSettings = { ...currentState.apiSettings, ...newSettings };

    // Optimistically update UI
    userSettingsStore.set({
      ...currentState,
      apiSettings: updatedApiSettings,
      isSyncing: true,
    });

    // Apply to DOM immediately
    applySettingsToDom({ ...currentState.appSettings, ...updatedApiSettings });

    if (currentState.isAuthenticated) {
      // Sync to backend (single source of truth)
      const success = await saveSettingsToBackend(
        currentState.appSettings,
        updatedApiSettings,
      );

      userSettingsStore.set({
        ...userSettingsStore.get(),
        isSyncing: false,
        error: success ? null : "Failed to save settings",
      });
    } else {
      userSettingsStore.set({
        ...userSettingsStore.get(),
        isSyncing: false,
      });
    }
};

/**
 * Reset settings to defaults
 */
export const resetToDefaults = async (): Promise<void> => {
  const currentState = userSettingsStore.get();

  if (currentState.isAuthenticated) {
    // Reset on backend
    try {
      const response = await fetch(`${API_BASE}/auth/user/settings/reset`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        // Reload from backend to get fresh defaults
        await initializeSettings();
      }
    } catch (error) {
      logger.error("Failed to reset settings on backend", { error });
    }
  } else {
    // Just use local defaults
    useDefaultSettings(false);
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function useDefaultSettings(isAuthenticated: boolean) {
  const defaults = {
    ...getDefaultAppSettings(),
    ...getDefaultApiSettings(),
  };

  userSettingsStore.set({
    appSettings: getDefaultAppSettings(),
    apiSettings: getDefaultApiSettings(),
    isLoading: false,
    isAuthenticated,
    isSyncing: false,
    error: null,
  });

  applySettingsToDom(defaults);
}

function applySettingsToDom(
  settings: Partial<AppSettings & ApiConfigSettings>,
) {
  if (typeof window === "undefined") return;

  // Apply theme changes
  if (settings.compactMode !== undefined) {
    document.body.classList.toggle("compact-mode", settings.compactMode);
  }

  if (settings.darkMode !== undefined) {
    document.body.classList.toggle("light-mode", !settings.darkMode);
  }

  // Update API client if available
  if (settings.apiUrl && typeof window !== "undefined") {
    const apiClient = (window as { apiClient?: { setBaseURL?: (url: string) => void } }).apiClient;
    if (apiClient && typeof apiClient.setBaseURL === "function") {
      apiClient.setBaseURL(settings.apiUrl);
    }
  }

  // Dispatch settings change event
  window.dispatchEvent(
    new CustomEvent("settingsChanged", {
      detail: settings,
    }),
  );
}

// =============================================================================
// AUTO-INITIALIZE ON MOUNT
// =============================================================================

if (typeof window !== "undefined") {
  // Initialize when first subscriber mounts
  onMount(userSettingsStore, () => {
    initializeSettings().catch((error) =>
      logger.error("Failed to initialize settings on mount", { error }),
    );

    // Re-initialize on auth changes
    const handleAuthChange = () => {
      initializeSettings().catch((error) =>
        logger.error("Failed to re-initialize settings on auth change", {
          error,
        }),
      );
    };

    window.addEventListener("auth-success", handleAuthChange);
    window.addEventListener("user-logged-out", handleAuthChange);

    return () => {
      window.removeEventListener("auth-success", handleAuthChange);
      window.removeEventListener("user-logged-out", handleAuthChange);
    };
  });
}
