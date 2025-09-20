/**
 * Settings Bridge - Bridge between vanilla JS and React useAppSettings hook
 *
 * This bridge allows vanilla JavaScript components like SettingsModalManager
 * to interact with the React useAppSettings hook through a global interface.
 */

import type { AppSettings, ApiConfigSettings } from '../hooks/useAppSettings';

// =============================================================================
// TYPES
// =============================================================================

export interface SettingsBridgeInterface {
  // Read settings
  getAppSettings(): AppSettings;
  getApiSettings(): ApiConfigSettings;
  getAllSettings(): { app: AppSettings; api: ApiConfigSettings };

  // Write settings
  updateAppSettings(settings: Partial<AppSettings>): void;
  updateApiSettings(settings: Partial<ApiConfigSettings>): void;
  updateAllSettings(settings: { app?: Partial<AppSettings>; api?: Partial<ApiConfigSettings> }): void;

  // Form mapping utilities
  getFormValues(): Record<string, unknown>;
  setFormValues(values: Record<string, unknown>): void;

  // Event handling
  onSettingsChange(callback: (settings: { app: AppSettings; api: ApiConfigSettings }) => void): () => void;
}

// =============================================================================
// SETTINGS BRIDGE IMPLEMENTATION
// =============================================================================

class SettingsBridge implements SettingsBridgeInterface {
  private appSettingsHook: any = null;
  private apiSettingsHook: any = null;
  private changeCallbacks: Array<(settings: any) => void> = [];

  /**
   * Initialize the bridge with React hook instances
   * This should be called from a React component that uses the hooks
   */
  initialize(appHook: any, apiHook: any): void {
    this.appSettingsHook = appHook;
    this.apiSettingsHook = apiHook;
  }

  getAppSettings(): AppSettings {
    return this.appSettingsHook?.settings || this.getDefaultAppSettings();
  }

  getApiSettings(): ApiConfigSettings {
    return this.apiSettingsHook?.settings || this.getDefaultApiSettings();
  }

  getAllSettings() {
    return {
      app: this.getAppSettings(),
      api: this.getApiSettings(),
    };
  }

  updateAppSettings(settings: Partial<AppSettings>): void {
    if (this.appSettingsHook?.updateSettings) {
      this.appSettingsHook.updateSettings(settings);
      this.notifyChangeCallbacks();
    }
  }

  updateApiSettings(settings: Partial<ApiConfigSettings>): void {
    if (this.apiSettingsHook?.updateSettings) {
      this.apiSettingsHook.updateSettings(settings);
      this.notifyChangeCallbacks();
    }
  }

  updateAllSettings(settings: { app?: Partial<AppSettings>; api?: Partial<ApiConfigSettings> }): void {
    if (settings.app) {
      this.updateAppSettings(settings.app);
    }
    if (settings.api) {
      this.updateApiSettings(settings.api);
    }
  }

  /**
   * Get form values mapped to input field names
   */
  getFormValues(): Record<string, unknown> {
    const app = this.getAppSettings();
    const api = this.getApiSettings();

    return {
      // API Config tab
      'api-timeout': api.apiTimeout,
      'refresh-interval': api.refreshInterval,

      // Job Defaults tab
      'max-retries': app.maxRetries, // Use app.maxRetries as primary
      'job-timeout': app.jobTimeout,
    };
  }

  /**
   * Set form values from input field names
   */
  setFormValues(values: Record<string, unknown>): void {
    const appUpdates: Partial<AppSettings> = {};
    const apiUpdates: Partial<ApiConfigSettings> = {};

    // Map form fields to settings
    if (values['api-timeout'] !== undefined) {
      apiUpdates.apiTimeout = Number(values['api-timeout']);
    }
    if (values['refresh-interval'] !== undefined) {
      apiUpdates.refreshInterval = Number(values['refresh-interval']);
    }
    if (values['max-retries'] !== undefined) {
      appUpdates.maxRetries = Number(values['max-retries']);
      // Also update apiSettings.retryAttempts to keep them in sync
      apiUpdates.retryAttempts = Number(values['max-retries']);
    }
    if (values['job-timeout'] !== undefined) {
      appUpdates.jobTimeout = Number(values['job-timeout']);
    }

    // Apply updates
    this.updateAllSettings({ app: appUpdates, api: apiUpdates });
  }

  onSettingsChange(callback: (settings: { app: AppSettings; api: ApiConfigSettings }) => void): () => void {
    this.changeCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  private notifyChangeCallbacks(): void {
    const settings = this.getAllSettings();
    this.changeCallbacks.forEach(callback => {
      try {
        callback(settings);
      } catch (error) {
        console.error('Settings bridge callback error:', error);
      }
    });
  }

  private getDefaultAppSettings(): AppSettings {
    return {
      defaultPriority: "normal",
      maxRetries: 3,
      jobTimeout: 30,
      darkMode: true,
      showJobIds: true,
      compactMode: false,
      jobsPerPage: 10,
      timezone: "auto",
      completionAlerts: true,
      errorNotifications: true,
      browserNotifications: false,
    };
  }

  private getDefaultApiSettings(): ApiConfigSettings {
    return {
      apiUrl: "http://localhost:8000",
      apiTimeout: 30,
      refreshInterval: 10,
      retryAttempts: 3,
      enableCaching: true,
    };
  }
}

// =============================================================================
// GLOBAL BRIDGE INSTANCE
// =============================================================================

export const settingsBridge = new SettingsBridge();

// =============================================================================
// GLOBAL WINDOW INTERFACE
// =============================================================================

declare global {
  interface Window {
    settingsBridge: SettingsBridgeInterface;
  }
}

// Expose to window for vanilla JS access
if (typeof window !== 'undefined') {
  window.settingsBridge = settingsBridge;
}