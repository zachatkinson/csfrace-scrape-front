/**
 * App Settings Hook
 * SOLID: Single Responsibility - Manages application settings state and persistence
 * SOLID: Interface Segregation - Separates app and API settings concerns
 */

import { useState, useEffect, useCallback } from "react";
import type { AppSettings, ApiConfigSettings } from "../interfaces/forms.ts";
import { getApiBaseUrl } from "../constants/api.ts";
import { createContextLogger } from "../utils/logger";
import { userSettingsAPI } from "../lib/user-settings-api.ts";

// Window interface extensions

const logger = createContextLogger("useAppSettings");

// =============================================================================
// SETTINGS STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  APP_SETTINGS: "csfrace-app-settings",
  API_SETTINGS: "csfrace-api-settings",
} as const;

// =============================================================================
// DEFAULT SETTINGS
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
      : getApiBaseUrl(),
  apiTimeout: 30,
  refreshInterval: 10,
  retryAttempts: 3,
  enableCaching: true,
});

// =============================================================================
// SETTINGS UTILITIES
// =============================================================================

/**
 * Safely parse settings from localStorage with fallbacks
 */
function parseStoredSettings<T>(key: string, defaults: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaults;

    const parsed = JSON.parse(stored);
    return { ...defaults, ...parsed };
  } catch (error) {
    logger.warn("Failed to parse settings from storage", { key, error });
    return defaults;
  }
}

/**
 * Safely store settings to localStorage
 */
function storeSettings<T>(key: string, settings: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    logger.error("Failed to store settings to storage", { key, error });
  }
}

// =============================================================================
// SETTINGS HOOK
// =============================================================================

export interface UseAppSettingsReturn {
  // Current settings state
  appSettings: AppSettings;
  apiSettings: ApiConfigSettings;

  // Update methods
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  updateApiSettings: (settings: Partial<ApiConfigSettings>) => void;

  // Utility methods
  resetToDefaults: () => Promise<void>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;
  applySettings: (settings: Partial<AppSettings & ApiConfigSettings>) => void;

  // Loading state
  isLoading: boolean;

  // Backend integration state
  isAuthenticated: boolean;
  isSyncing: boolean;
}

/**
 * App Settings Hook
 * Manages application and API settings with localStorage persistence
 */
export const useAppSettings = (): UseAppSettingsReturn => {
  const [appSettings, setAppSettings] = useState<AppSettings>(
    getDefaultAppSettings,
  );
  const [apiSettings, setApiSettings] = useState<ApiConfigSettings>(
    getDefaultApiSettings,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    const initializeSettings = async () => {
      // Check authentication status
      const authStatus = userSettingsAPI.isAuthenticated();
      setIsAuthenticated(authStatus);

      try {
        if (authStatus) {
          // Load settings from backend if authenticated
          logger.info("Loading settings from backend (authenticated)");
          setIsSyncing(true);

          try {
            const backendSettings = await userSettingsAPI.getUserSettings();

            // Convert backend settings to frontend format
            const convertedAppSettings: AppSettings = {
              defaultPriority:
                backendSettings.default_priority as AppSettings["defaultPriority"],
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
            };

            const convertedApiSettings: ApiConfigSettings = {
              apiUrl: backendSettings.api_url,
              apiTimeout: backendSettings.api_timeout,
              refreshInterval: backendSettings.refresh_interval,
              retryAttempts: backendSettings.retry_attempts,
              enableCaching: backendSettings.enable_caching,
            };

            setAppSettings(convertedAppSettings);
            setApiSettings(convertedApiSettings);

            // Sync to localStorage as backup
            storeSettings(STORAGE_KEYS.APP_SETTINGS, convertedAppSettings);
            storeSettings(STORAGE_KEYS.API_SETTINGS, convertedApiSettings);

            applySettingsInternal({
              ...convertedAppSettings,
              ...convertedApiSettings,
            });
            logger.info("Settings loaded from backend successfully");
          } catch (error) {
            logger.warn(
              "Failed to load settings from backend, falling back to localStorage",
              { error },
            );
            // Fall back to localStorage if backend fails
            loadLocalSettings();
          } finally {
            setIsSyncing(false);
          }
        } else {
          // Load settings from localStorage if not authenticated
          logger.info("Loading settings from localStorage (not authenticated)");
          loadLocalSettings();
        }
      } catch (error) {
        logger.error("Failed to initialize settings", { error });
        loadLocalSettings();
      } finally {
        setIsLoading(false);
      }
    };

    const loadLocalSettings = () => {
      const loadedAppSettings = parseStoredSettings(
        STORAGE_KEYS.APP_SETTINGS,
        getDefaultAppSettings(),
      );
      const loadedApiSettings = parseStoredSettings(
        STORAGE_KEYS.API_SETTINGS,
        getDefaultApiSettings(),
      );

      setAppSettings(loadedAppSettings);
      setApiSettings(loadedApiSettings);

      // Apply settings immediately on initialization
      applySettingsInternal({ ...loadedAppSettings, ...loadedApiSettings });
    };

    // Delay initialization slightly to ensure localStorage is available
    const timer = setTimeout(initializeSettings, 100);
    return () => clearTimeout(timer);
  }, []);

  // =============================================================================
  // UPDATE METHODS
  // =============================================================================

  // =============================================================================
  // BACKEND SYNC UTILITIES
  // =============================================================================

  const syncToBackend = useCallback(
    async (
      currentAppSettings: AppSettings,
      currentApiSettings: ApiConfigSettings,
    ) => {
      if (!isAuthenticated) return;

      try {
        setIsSyncing(true);

        // Convert frontend settings to backend format
        const backendSettings = {
          default_priority: currentAppSettings.defaultPriority,
          max_retries: currentAppSettings.maxRetries,
          job_timeout: currentAppSettings.jobTimeout,
          api_url: currentApiSettings.apiUrl,
          api_timeout: currentApiSettings.apiTimeout,
          refresh_interval: currentApiSettings.refreshInterval,
          retry_attempts: currentApiSettings.retryAttempts,
          enable_caching: currentApiSettings.enableCaching,
          dark_mode: currentAppSettings.darkMode,
          show_job_ids: currentAppSettings.showJobIds,
          compact_mode: currentAppSettings.compactMode,
          jobs_per_page: currentAppSettings.jobsPerPage,
          timezone: currentAppSettings.timezone,
          completion_alerts: currentAppSettings.completionAlerts,
          error_notifications: currentAppSettings.errorNotifications,
          browser_notifications: currentAppSettings.browserNotifications,
        };

        await userSettingsAPI.updateUserSettings(backendSettings);
        logger.info("Settings synced to backend successfully");
      } catch (error) {
        logger.error("Failed to sync settings to backend", { error });
        throw error; // Re-throw to let callers handle
      } finally {
        setIsSyncing(false);
      }
    },
    [isAuthenticated],
  );

  const updateAppSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setAppSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings, ...newSettings };

        // Always save to localStorage immediately
        storeSettings(STORAGE_KEYS.APP_SETTINGS, updatedSettings);

        // Sync to backend if authenticated (async, don't block UI)
        if (isAuthenticated) {
          syncToBackend(updatedSettings, apiSettings).catch((error) => {
            logger.warn("Failed to sync app settings to backend", { error });
          });
        }

        return updatedSettings;
      });
    },
    [isAuthenticated, apiSettings, syncToBackend],
  );

  const updateApiSettings = useCallback(
    (newSettings: Partial<ApiConfigSettings>) => {
      setApiSettings((prevSettings) => {
        const updatedSettings = { ...prevSettings, ...newSettings };

        // Always save to localStorage immediately
        storeSettings(STORAGE_KEYS.API_SETTINGS, updatedSettings);

        // Sync to backend if authenticated (async, don't block UI)
        if (isAuthenticated) {
          syncToBackend(appSettings, updatedSettings).catch((error) => {
            logger.warn("Failed to sync API settings to backend", { error });
          });
        }

        return updatedSettings;
      });
    },
    [isAuthenticated, appSettings, syncToBackend],
  );

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  const resetToDefaults = useCallback(async (): Promise<void> => {
    const defaultAppSettings = getDefaultAppSettings();
    const defaultApiSettings = getDefaultApiSettings();

    try {
      if (isAuthenticated) {
        // Reset backend settings if authenticated
        setIsSyncing(true);
        await userSettingsAPI.resetUserSettings();
      }
    } catch (error) {
      logger.warn(
        "Failed to reset backend settings, continuing with local reset",
        { error },
      );
    } finally {
      setIsSyncing(false);
    }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.APP_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.API_SETTINGS);

    // Reset state
    setAppSettings(defaultAppSettings);
    setApiSettings(defaultApiSettings);

    // Apply default settings
    applySettingsInternal({ ...defaultAppSettings, ...defaultApiSettings });
  }, [isAuthenticated]);

  const exportSettings = useCallback((): string => {
    const exportData = {
      appSettings,
      apiSettings,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    return JSON.stringify(exportData, null, 2);
  }, [appSettings, apiSettings]);

  const importSettings = useCallback(
    async (settingsJson: string): Promise<boolean> => {
      try {
        const importData = JSON.parse(settingsJson);

        if (importData.appSettings) {
          updateAppSettings(importData.appSettings);
        }

        if (importData.apiSettings) {
          updateApiSettings(importData.apiSettings);
        }

        return true;
      } catch (error) {
        logger.error("Failed to import settings", { error });
        return false;
      }
    },
    [updateAppSettings, updateApiSettings],
  );

  // =============================================================================
  // SETTINGS APPLICATION
  // =============================================================================

  const applySettingsInternal = (
    settings: Partial<AppSettings & ApiConfigSettings>,
  ) => {
    // Apply theme changes
    if (settings.compactMode !== undefined) {
      document.body.classList.toggle("compact-mode", settings.compactMode);
    }

    if (settings.darkMode !== undefined) {
      document.body.classList.toggle("light-mode", !settings.darkMode);
    }

    // Update API client if available
    if (settings.apiUrl && typeof window !== "undefined") {
      const apiClient = window.apiClient;
      if (apiClient && typeof apiClient.setBaseURL === "function") {
        apiClient.setBaseURL(settings.apiUrl);
      }
    }

    // Update health service API URL
    if (settings.apiUrl && typeof window !== "undefined") {
      const healthService = window.healthStatusService;
      if (healthService && typeof healthService.updateApiUrl === "function") {
        healthService.updateApiUrl(settings.apiUrl);
      }
    }

    // Dispatch settings change event for other components to react
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("settingsChanged", {
          detail: settings,
        }),
      );
    }
  };

  const applySettings = useCallback(
    (settings: Partial<AppSettings & ApiConfigSettings>) => {
      applySettingsInternal(settings);
    },
    [],
  );

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  // =============================================================================
  // AUTHENTICATION STATE MONITORING
  // =============================================================================

  useEffect(() => {
    const handleAuthChange = () => {
      const newAuthStatus = userSettingsAPI.isAuthenticated();
      if (newAuthStatus !== isAuthenticated) {
        setIsAuthenticated(newAuthStatus);

        if (newAuthStatus) {
          // User just logged in - sync current localStorage settings to backend
          logger.info("User authenticated, syncing local settings to backend");
          syncToBackend(appSettings, apiSettings).catch((error) => {
            logger.warn("Failed to sync settings on login", { error });
          });
        }
      }
    };

    // Listen for authentication changes
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, [isAuthenticated, appSettings, apiSettings, syncToBackend]);

  return {
    // Current settings
    appSettings,
    apiSettings,

    // Update methods
    updateAppSettings,
    updateApiSettings,

    // Utility methods
    resetToDefaults,
    exportSettings,
    importSettings,
    applySettings,

    // Loading state
    isLoading,

    // Backend integration state
    isAuthenticated,
    isSyncing,
  };
};

export default useAppSettings;
