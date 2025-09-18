/**
 * SettingsManager - SOLID Implementation
 * Single Responsibility: Manage application settings and preferences
 * Open/Closed: Extensible for new setting types without modification
 * Interface Segregation: Clean separation of settings concerns
 * Dependency Inversion: Depends on storage abstractions, not concrete implementations
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: 'short' | 'medium' | 'long' | 'full';
  notifications: {
    jobComplete: boolean;
    errors: boolean;
    system: boolean;
  };
  ui: {
    compactMode: boolean;
    showAdvanced: boolean;
    autoRefresh: boolean;
    refreshInterval: number; // seconds
  };
  conversion: {
    defaultOutputFormat: 'html' | 'markdown' | 'json';
    preserveImages: boolean;
    preserveStyles: boolean;
    timeoutDuration: number; // seconds
  };
}

export interface SettingsChangeEvent {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export interface SettingsChangeListener {
  (event: SettingsChangeEvent): void;
}

export interface SettingsManagerConfig {
  container?: HTMLElement;
  onSettingsChange?: (settings: AppSettings) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SETTINGS_STORAGE_KEY = 'app_settings';
const SETTINGS_CHANGE_EVENT = 'settingsChanged';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'medium',
  notifications: {
    jobComplete: true,
    errors: true,
    system: false,
  },
  ui: {
    compactMode: false,
    showAdvanced: false,
    autoRefresh: true,
    refreshInterval: 30,
  },
  conversion: {
    defaultOutputFormat: 'html',
    preserveImages: true,
    preserveStyles: true,
    timeoutDuration: 30,
  },
};

// =============================================================================
// SETTINGS MANAGER CLASS
// =============================================================================

export class SettingsManager {
  private settings: AppSettings;
  private listeners: Set<SettingsChangeListener> = new Set();
  private storageAvailable: boolean = false;
  private config: SettingsManagerConfig;

  constructor(config: SettingsManagerConfig = {}) {
    this.config = config;
    this.storageAvailable = this.checkStorageAvailability();
    this.settings = this.loadSettings();
    this.initializeTheme();

    // Set up change listener if provided
    if (this.config.onSettingsChange) {
      this.listeners.add((_event: SettingsChangeEvent) => {
        if (this.config.onSettingsChange) {
          this.config.onSettingsChange(this.settings);
        }
      });
    }
  }

  /**
   * Check if localStorage is available
   * @returns True if localStorage is available, false otherwise
   */
  private checkStorageAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('SettingsManager: localStorage not available, using memory storage');
      return false;
    }
  }

  /**
   * Load settings from storage or use defaults
   * @returns Loaded settings
   */
  private loadSettings(): AppSettings {
    if (!this.storageAvailable) {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return this.mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error('SettingsManager: Error loading settings:', error);
    }

    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Merge loaded settings with defaults to handle new settings
   * @param loaded - Loaded settings from storage
   * @returns Merged settings with defaults
   */
  private mergeWithDefaults(loaded: Record<string, unknown>): AppSettings {
    const merged = { ...DEFAULT_SETTINGS };
    
    if (loaded && typeof loaded === 'object') {
      // Safely merge each section
      if (loaded.theme && typeof loaded.theme === 'string' && ['light', 'dark', 'auto'].includes(loaded.theme)) {
        merged.theme = loaded.theme as 'light' | 'dark' | 'auto';
      }
      
      if (typeof loaded.timezone === 'string') {
        merged.timezone = loaded.timezone;
      }
      
      if (loaded.dateFormat && typeof loaded.dateFormat === 'string' && ['short', 'medium', 'long', 'full'].includes(loaded.dateFormat)) {
        merged.dateFormat = loaded.dateFormat as 'short' | 'medium' | 'long' | 'full';
      }
      
      if (loaded.notifications && typeof loaded.notifications === 'object' && loaded.notifications !== null) {
        merged.notifications = { ...merged.notifications, ...(loaded.notifications as Record<string, unknown>) };
      }
      
      if (loaded.ui && typeof loaded.ui === 'object' && loaded.ui !== null) {
        merged.ui = { ...merged.ui, ...(loaded.ui as Record<string, unknown>) };
      }
      
      if (loaded.conversion && typeof loaded.conversion === 'object' && loaded.conversion !== null) {
        merged.conversion = { ...merged.conversion, ...(loaded.conversion as Record<string, unknown>) };
      }
    }

    return merged;
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    if (!this.storageAvailable) return;

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('SettingsManager: Error saving settings:', error);
    }
  }

  /**
   * Initialize theme based on current settings
   */
  private initializeTheme(): void {
    const theme = this.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme class for CSS
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }

  /**
   * Get current theme (resolving 'auto' to actual theme)
   * @returns Current theme ('light' or 'dark')
   */
  private getTheme(): 'light' | 'dark' {
    if (this.settings.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.settings.theme;
  }

  /**
   * Emit settings change event
   * @param key - Setting key that changed
   * @param oldValue - Previous value
   * @param newValue - New value
   */
  private emitChange(key: string, oldValue: unknown, newValue: unknown): void {
    const event: SettingsChangeEvent = {
      key,
      oldValue,
      newValue,
      timestamp: Date.now(),
    };

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('SettingsManager: Error in change listener:', error);
      }
    });

    // Emit DOM event for components that can't access the manager directly
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, {
      detail: event
    }));
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get all settings
   * @returns Copy of current settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get a specific setting value
   * @param key - Dot-notation key (e.g., 'ui.compactMode')
   * @returns Setting value
   */
  getSetting(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = this.settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }
    
    return value;
  }

  /**
   * Set a specific setting value
   * @param key - Dot-notation key (e.g., 'ui.compactMode')
   * @param value - New value
   */
  setSetting(key: string, value: unknown): void {
    const keys = key.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;

    // Navigate to the parent object
    let target: Record<string, unknown> = this.settings as unknown as Record<string, unknown>;
    for (const k of keys) {
      if (!(k in target)) {
        target[k] = {};
      }
      const nextTarget = target[k];
      if (typeof nextTarget === 'object' && nextTarget !== null) {
        target = nextTarget as Record<string, unknown>;
      } else {
        target[k] = {};
        target = target[k] as Record<string, unknown>;
      }
    }

    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Handle special settings
    if (key === 'theme') {
      this.initializeTheme();
    }

    this.saveSettings();
    this.emitChange(key, oldValue, value);
  }

  /**
   * Update multiple settings at once
   * @param updates - Object with setting updates
   */
  updateSettings(updates: Partial<AppSettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = this.mergeWithDefaults({ ...this.settings, ...updates });
    
    // Handle theme changes
    if ('theme' in updates) {
      this.initializeTheme();
    }

    this.saveSettings();

    // Emit change events for all updated keys
    Object.keys(updates).forEach(key => {
      this.emitChange(key, oldSettings[key as keyof AppSettings], this.settings[key as keyof AppSettings]);
    });
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...DEFAULT_SETTINGS };
    this.initializeTheme();
    this.saveSettings();
    
    this.emitChange('*', oldSettings, this.settings);
  }

  /**
   * Reset a specific setting to default
   * @param key - Setting key to reset
   */
  resetSetting(key: string): void {
    const defaultValue = this.getSetting.call({ settings: DEFAULT_SETTINGS }, key);
    this.setSetting(key, defaultValue);
  }

  /**
   * Add a settings change listener
   * @param listener - Function to call when settings change
   * @returns Cleanup function to remove the listener
   */
  onChange(listener: SettingsChangeListener): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Export settings as JSON string
   * @returns JSON string of current settings
   */
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON string
   * @param json - JSON string to import
   * @returns True if successful, false otherwise
   */
  importSettings(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      const merged = this.mergeWithDefaults(imported);
      
      const oldSettings = { ...this.settings };
      this.settings = merged;
      this.initializeTheme();
      this.saveSettings();
      
      this.emitChange('*', oldSettings, this.settings);
      return true;
    } catch (error) {
      console.error('SettingsManager: Error importing settings:', error);
      return false;
    }
  }

  /**
   * Validate settings object
   * @param settings - Settings object to validate
   * @returns True if valid, false otherwise
   */
  validateSettings(settings: unknown): boolean {
    if (!settings || typeof settings !== 'object') return false;

    try {
      // Basic validation - ensure required structure
      const merged = this.mergeWithDefaults(settings as Record<string, unknown>);
      return merged !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get default settings
   * @returns Copy of default settings
   */
  getDefaults(): AppSettings {
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Check if a setting has been changed from default
   * @param key - Setting key to check
   * @returns True if changed from default, false otherwise
   */
  isChangedFromDefault(key: string): boolean {
    const currentValue = this.getSetting(key);
    const defaultValue = this.getSetting.call({ settings: DEFAULT_SETTINGS }, key);
    
    return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Create singleton instance
let settingsManagerInstance: SettingsManager | null = null;

/**
 * Get the singleton settings manager instance
 * @returns SettingsManager instance
 */
export function getSettingsManager(): SettingsManager {
  if (!settingsManagerInstance) {
    settingsManagerInstance = new SettingsManager();
  }
  return settingsManagerInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick access functions for common settings
 */
export const Settings = {
  get theme() { return getSettingsManager().getSetting('theme') as 'light' | 'dark' | 'auto'; },
  set theme(value: 'light' | 'dark' | 'auto') { getSettingsManager().setSetting('theme', value); },
  
  get timezone() { return getSettingsManager().getSetting('timezone') as string; },
  set timezone(value: string) { getSettingsManager().setSetting('timezone', value); },
  
  get compactMode() { return getSettingsManager().getSetting('ui.compactMode') as boolean; },
  set compactMode(value: boolean) { getSettingsManager().setSetting('ui.compactMode', value); },
  
  get autoRefresh() { return getSettingsManager().getSetting('ui.autoRefresh') as boolean; },
  set autoRefresh(value: boolean) { getSettingsManager().setSetting('ui.autoRefresh', value); },
  
  get refreshInterval() { return getSettingsManager().getSetting('ui.refreshInterval') as number; },
  set refreshInterval(value: number) { getSettingsManager().setSetting('ui.refreshInterval', value); },
};

// =============================================================================
// BROWSER INTEGRATION
// =============================================================================

// Listen for system theme changes when theme is set to 'auto'
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const manager = getSettingsManager();
    if (manager.getSetting('theme') === 'auto') {
      // Re-initialize theme to apply system change
      manager['initializeTheme']();
    }
  });
}