/**
 * Settings Bridge - Bridge between vanilla JS and React useAppSettings hook
 *
 * This bridge allows vanilla JavaScript components like SettingsModalManager
 * to interact with the React useAppSettings hook through a global interface.
 */

import type { AppSettings, ApiConfigSettings } from "../interfaces/forms.ts";
import type { UseAppSettingsReturn } from "../hooks/useAppSettings.ts";

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
  updateAllSettings(settings: {
    app?: Partial<AppSettings>;
    api?: Partial<ApiConfigSettings>;
  }): void;

  // Form mapping utilities
  getFormValues(): Record<string, unknown>;
  setFormValues(values: Record<string, unknown>): void;

  // Event handling
  onSettingsChange(
    callback: (settings: { app: AppSettings; api: ApiConfigSettings }) => void,
  ): () => void;

  // Backend integration state
  isAuthenticated(): boolean;
  isSyncing(): boolean;
  isLoading(): boolean;

  // Utility methods
  resetToDefaults(): Promise<void>;
  exportSettings(): string;
  importSettings(settingsJson: string): Promise<boolean>;
}

// =============================================================================
// SETTINGS BRIDGE IMPLEMENTATION
// =============================================================================

class SettingsBridge implements SettingsBridgeInterface {
  private useAppSettingsHook: UseAppSettingsReturn | null = null;
  private changeCallbacks: Array<
    (settings: { app: AppSettings; api: ApiConfigSettings }) => void
  > = [];

  /**
   * Initialize the bridge with React hook instances
   * This should be called from a React component that uses the hooks
   */
  initialize(useAppSettingsResult: UseAppSettingsReturn): void {
    this.useAppSettingsHook = useAppSettingsResult;
  }

  getAppSettings(): AppSettings {
    return this.useAppSettingsHook?.appSettings || this.getDefaultAppSettings();
  }

  getApiSettings(): ApiConfigSettings {
    return this.useAppSettingsHook?.apiSettings || this.getDefaultApiSettings();
  }

  getAllSettings() {
    return {
      app: this.getAppSettings(),
      api: this.getApiSettings(),
    };
  }

  updateAppSettings(settings: Partial<AppSettings>): void {
    if (this.useAppSettingsHook?.updateAppSettings) {
      this.useAppSettingsHook.updateAppSettings(settings);
      this.notifyChangeCallbacks();
    }
  }

  updateApiSettings(settings: Partial<ApiConfigSettings>): void {
    if (this.useAppSettingsHook?.updateApiSettings) {
      this.useAppSettingsHook.updateApiSettings(settings);
      this.notifyChangeCallbacks();
    }
  }

  updateAllSettings(settings: {
    app?: Partial<AppSettings>;
    api?: Partial<ApiConfigSettings>;
  }): void {
    if (settings.app) {
      this.updateAppSettings(settings.app);
    }
    if (settings.api) {
      this.updateApiSettings(settings.api);
    }
  }

  // =============================================================================
  // BACKEND INTEGRATION STATE
  // =============================================================================

  isAuthenticated(): boolean {
    return this.useAppSettingsHook?.isAuthenticated || false;
  }

  isSyncing(): boolean {
    return this.useAppSettingsHook?.isSyncing || false;
  }

  isLoading(): boolean {
    return this.useAppSettingsHook?.isLoading || false;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async resetToDefaults(): Promise<void> {
    if (this.useAppSettingsHook?.resetToDefaults) {
      await this.useAppSettingsHook.resetToDefaults();
      this.notifyChangeCallbacks();
    }
  }

  exportSettings(): string {
    // Export current settings as JSON
    return JSON.stringify(this.getAllSettings(), null, 2);
  }

  async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(settingsJson);

      if (parsed.app) {
        this.updateAppSettings(parsed.app);
      }
      if (parsed.api) {
        this.updateApiSettings(parsed.api);
      }

      this.notifyChangeCallbacks();
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
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
      "api-timeout": api.apiTimeout,
      "refresh-interval": api.refreshInterval,

      // Job Defaults tab
      "max-retries": app.maxRetries, // Use app.maxRetries as primary
      "job-timeout": app.jobTimeout,
    };
  }

  /**
   * Set form values from input field names
   */
  setFormValues(values: Record<string, unknown>): void {
    const appUpdates: Partial<AppSettings> = {};
    const apiUpdates: Partial<ApiConfigSettings> = {};

    // Map form fields to settings
    if (values["api-timeout"] !== undefined) {
      apiUpdates.apiTimeout = Number(values["api-timeout"]);
    }
    if (values["refresh-interval"] !== undefined) {
      apiUpdates.refreshInterval = Number(values["refresh-interval"]);
    }
    if (values["max-retries"] !== undefined) {
      appUpdates.maxRetries = Number(values["max-retries"]);
      // Also update apiSettings.retryAttempts to keep them in sync
      apiUpdates.retryAttempts = Number(values["max-retries"]);
    }
    if (values["job-timeout"] !== undefined) {
      appUpdates.jobTimeout = Number(values["job-timeout"]);
    }

    // Apply updates
    this.updateAllSettings({ app: appUpdates, api: apiUpdates });
  }

  onSettingsChange(
    callback: (settings: { app: AppSettings; api: ApiConfigSettings }) => void,
  ): () => void {
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
    this.changeCallbacks.forEach((callback) => {
      try {
        callback(settings);
      } catch (error) {
        console.error("Settings bridge callback error:", error);
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
      apiUrl: "http://localhost",
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
if (typeof window !== "undefined") {
  window.settingsBridge = settingsBridge;
}
