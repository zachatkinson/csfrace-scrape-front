/**
 * App Settings Hook
 * SOLID: Single Responsibility - Manages application settings state and persistence
 * SOLID: Interface Segregation - Separates app and API settings concerns
 */

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ApiConfigSettings } from '../interfaces/forms.ts';
import { getApiBaseUrl } from '../constants/api.ts';

// =============================================================================
// SETTINGS STORAGE KEYS
// =============================================================================

const STORAGE_KEYS = {
  APP_SETTINGS: 'csfrace-app-settings',
  API_SETTINGS: 'csfrace-api-settings',
} as const;

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================

const getDefaultAppSettings = (): AppSettings => ({
  // Job Defaults
  defaultPriority: 'normal',
  maxRetries: 3,
  jobTimeout: 30,
  
  // Display Options
  darkMode: true,
  showJobIds: true,
  compactMode: false,
  jobsPerPage: 10,
  timezone: 'auto',
  
  // Notifications
  completionAlerts: true,
  errorNotifications: true,
  browserNotifications: false,
});

const getDefaultApiSettings = (): ApiConfigSettings => ({
  apiUrl: typeof window !== 'undefined' && (window as any).CSFRACE_API_BASE_URL 
    ? (window as any).CSFRACE_API_BASE_URL 
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
    console.warn(`Failed to parse settings from ${key}:`, error);
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
    console.error(`Failed to store settings to ${key}:`, error);
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
}

/**
 * App Settings Hook
 * Manages application and API settings with localStorage persistence
 */
export const useAppSettings = (): UseAppSettingsReturn => {
  const [appSettings, setAppSettings] = useState<AppSettings>(getDefaultAppSettings);
  const [apiSettings, setApiSettings] = useState<ApiConfigSettings>(getDefaultApiSettings);
  const [isLoading, setIsLoading] = useState(true);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    const initializeSettings = () => {
      const loadedAppSettings = parseStoredSettings(STORAGE_KEYS.APP_SETTINGS, getDefaultAppSettings());
      const loadedApiSettings = parseStoredSettings(STORAGE_KEYS.API_SETTINGS, getDefaultApiSettings());
      
      setAppSettings(loadedAppSettings);
      setApiSettings(loadedApiSettings);
      setIsLoading(false);
      
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

  const updateAppSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setAppSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      storeSettings(STORAGE_KEYS.APP_SETTINGS, updatedSettings);
      return updatedSettings;
    });
  }, []);

  const updateApiSettings = useCallback((newSettings: Partial<ApiConfigSettings>) => {
    setApiSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      storeSettings(STORAGE_KEYS.API_SETTINGS, updatedSettings);
      return updatedSettings;
    });
  }, []);

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  const resetToDefaults = useCallback(async (): Promise<void> => {
    const defaultAppSettings = getDefaultAppSettings();
    const defaultApiSettings = getDefaultApiSettings();
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.APP_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.API_SETTINGS);
    
    // Reset state
    setAppSettings(defaultAppSettings);
    setApiSettings(defaultApiSettings);
    
    // Apply default settings
    applySettingsInternal({ ...defaultAppSettings, ...defaultApiSettings });
  }, []);

  const exportSettings = useCallback((): string => {
    const exportData = {
      appSettings,
      apiSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [appSettings, apiSettings]);

  const importSettings = useCallback(async (settingsJson: string): Promise<boolean> => {
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
      console.error('Failed to import settings:', error);
      return false;
    }
  }, [updateAppSettings, updateApiSettings]);

  // =============================================================================
  // SETTINGS APPLICATION
  // =============================================================================

  const applySettingsInternal = (settings: Partial<AppSettings & ApiConfigSettings>) => {
    // Apply theme changes
    if (settings.compactMode !== undefined) {
      document.body.classList.toggle('compact-mode', settings.compactMode);
    }
    
    if (settings.darkMode !== undefined) {
      document.body.classList.toggle('light-mode', !settings.darkMode);
    }

    // Update API client if available
    if (settings.apiUrl && typeof window !== 'undefined') {
      const apiClient = (window as any).apiClient;
      if (apiClient && typeof apiClient.setBaseURL === 'function') {
        apiClient.setBaseURL(settings.apiUrl);
      }
    }

    // Update health service API URL
    if (settings.apiUrl && typeof window !== 'undefined') {
      const healthService = (window as any).healthStatusService;
      if (healthService && typeof healthService.updateApiUrl === 'function') {
        healthService.updateApiUrl(settings.apiUrl);
      }
    }

    // Dispatch settings change event for other components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: settings 
      }));
    }
  };

  const applySettings = useCallback((settings: Partial<AppSettings & ApiConfigSettings>) => {
    applySettingsInternal(settings);
  }, []);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

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
  };
};

export default useAppSettings;