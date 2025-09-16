/**
 * Settings Manager - Following Astro Best Practices & SOLID Principles
 * Extends BaseModalManager for DRY modal behavior
 * Single Responsibility: Manages application settings state and UI interactions
 */

import { BaseModalManager } from './baseModalManager';
import type { BaseModalConfig } from './baseModalManager';
import { getApiBaseUrl } from '../constants/api.ts';

export interface SettingsData {
  // API Configuration
  apiUrl: string;
  apiTimeout: number;
  refreshInterval: number;
  
  // Job Defaults
  defaultPriority: 'Low' | 'Normal' | 'High' | 'Urgent';
  maxRetries: number;
  jobTimeout: number;
  
  // Display Options
  darkMode: boolean;
  showJobIds: boolean;
  compactMode: boolean;
  jobsPerPage: number;
  timezone: string;
  
  // Notifications
  completionAlerts: boolean;
  errorNotifications: boolean;
  browserNotifications: boolean;
}

interface SettingsManagerConfig extends BaseModalConfig {
  onSettingsChange?: (settings: SettingsData) => void;
}

export class SettingsManager extends BaseModalManager {
  private onSettingsChange?: (settings: SettingsData) => void;
  
  // Settings-specific elements
  private toggleBtn: HTMLElement | null = null;
  private closeBtn: HTMLElement | null = null;
  private cancelBtn: HTMLElement | null = null;
  private saveBtn: HTMLElement | null = null;
  private resetBtn: HTMLElement | null = null;
  
  // Default settings
  private readonly defaultSettings: SettingsData = {
    // API Configuration
    apiUrl: getApiBaseUrl(),
    apiTimeout: 30,
    refreshInterval: 10,
    
    // Job Defaults
    defaultPriority: 'Normal',
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
    browserNotifications: false
  };

  constructor(config: SettingsManagerConfig) {
    super({
      modalId: 'settings-panel',
      ...config
    });
    this.onSettingsChange = config.onSettingsChange;
  }

  /**
   * Initialize the settings manager  
   */
  init() {
    super.init(); // Initialize base modal behavior
    this.loadSettings();
  }

  /**
   * Settings-specific event handlers (required by BaseModalManager)
   */
  protected setupModalSpecificHandlers() {
    const container = this.config.container || document;
    
    // Cache settings-specific elements
    this.toggleBtn = document.querySelector('#settings-toggle');
    this.closeBtn = container.querySelector('#settings-close');
    this.cancelBtn = container.querySelector('#cancel-settings');
    this.saveBtn = container.querySelector('#save-settings');
    this.resetBtn = container.querySelector('#reset-settings');
    
    // Setup settings-specific event listeners
    this.toggleBtn?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', () => this.close());
    this.cancelBtn?.addEventListener('click', () => this.close());
    this.saveBtn?.addEventListener('click', () => this.saveSettings());
    this.resetBtn?.addEventListener('click', () => this.resetSettings());
  }

  /**
   * Override open to load settings on open
   */
  open() {
    super.open();
    this.loadSettings();
  }

  /**
   * Load settings from localStorage into form elements
   */
  private loadSettings() {
    const settings = this.getStoredSettings();
    const container = this.config.container || document;
    
    // API Configuration
    this.setFormValue(container, 'api-url', settings.apiUrl);
    this.setFormValue(container, 'api-timeout', settings.apiTimeout.toString());
    this.setFormValue(container, 'refresh-interval', settings.refreshInterval.toString());
    
    // Job Defaults
    this.setFormValue(container, 'default-priority', settings.defaultPriority);
    this.setFormValue(container, 'max-retries', settings.maxRetries.toString());
    this.setFormValue(container, 'job-timeout', settings.jobTimeout.toString());
    
    // Display Options
    this.setFormValue(container, 'dark-mode', settings.darkMode);
    this.setFormValue(container, 'show-job-ids', settings.showJobIds);
    this.setFormValue(container, 'compact-mode', settings.compactMode);
    this.setFormValue(container, 'jobs-per-page', settings.jobsPerPage.toString());
    this.setFormValue(container, 'timezone', settings.timezone);
    
    // Notifications
    this.setFormValue(container, 'completion-alerts', settings.completionAlerts);
    this.setFormValue(container, 'error-notifications', settings.errorNotifications);
    this.setFormValue(container, 'browser-notifications', settings.browserNotifications);
  }

  /**
   * Save settings to localStorage and apply them
   */
  private saveSettings() {
    const container = this.config.container || document;
    
    const settings: SettingsData = {
      // API Configuration
      apiUrl: this.getFormValue(container, 'api-url') as string,
      apiTimeout: parseInt(this.getFormValue(container, 'api-timeout') as string),
      refreshInterval: parseInt(this.getFormValue(container, 'refresh-interval') as string),
      
      // Job Defaults
      defaultPriority: this.getFormValue(container, 'default-priority') as SettingsData['defaultPriority'],
      maxRetries: parseInt(this.getFormValue(container, 'max-retries') as string),
      jobTimeout: parseInt(this.getFormValue(container, 'job-timeout') as string),
      
      // Display Options
      darkMode: this.getFormValue(container, 'dark-mode') as boolean,
      showJobIds: this.getFormValue(container, 'show-job-ids') as boolean,
      compactMode: this.getFormValue(container, 'compact-mode') as boolean,
      jobsPerPage: parseInt(this.getFormValue(container, 'jobs-per-page') as string),
      timezone: this.getFormValue(container, 'timezone') as string,
      
      // Notifications
      completionAlerts: this.getFormValue(container, 'completion-alerts') as boolean,
      errorNotifications: this.getFormValue(container, 'error-notifications') as boolean,
      browserNotifications: this.getFormValue(container, 'browser-notifications') as boolean
    };
    
    localStorage.setItem('csfrace-settings', JSON.stringify(settings));
    
    // Apply settings immediately
    this.applySettings(settings);
    
    // Notify other components
    this.onSettingsChange?.(settings);
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    
    // Show success feedback
    this.showSaveSuccess();
    
    // Close panel using base class method
    this.close();
  }

  /**
   * Reset settings to defaults
   */
  private resetSettings() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      localStorage.removeItem('csfrace-settings');
      this.loadSettings();
      
      // Show confirmation
      if (this.resetBtn) {
        const originalText = this.resetBtn.textContent;
        this.resetBtn.textContent = 'Reset Complete!';
        setTimeout(() => {
          this.resetBtn!.textContent = originalText;
        }, 2000);
      }
    }
  }

  /**
   * Get stored settings with defaults
   */
  private getStoredSettings(): SettingsData {
    try {
      const stored = localStorage.getItem('csfrace-settings');
      return stored ? { ...this.defaultSettings, ...JSON.parse(stored) } : this.defaultSettings;
    } catch {
      return this.defaultSettings;
    }
  }

  /**
   * Apply settings to the application
   */
  private applySettings(settings: SettingsData) {
    // Apply theme changes
    document.body.classList.toggle('compact-mode', settings.compactMode);
  }

  /**
   * Helper to set form values (handles different input types)
   */
  private setFormValue(container: HTMLElement | Document, elementId: string, value: string | number | boolean) {
    const element = container.querySelector(`#${elementId}`) as HTMLInputElement | HTMLSelectElement;
    if (!element) return;
    
    if (element.type === 'checkbox') {
      (element as HTMLInputElement).checked = Boolean(value);
    } else {
      element.value = String(value);
    }
  }

  /**
   * Helper to get form values (handles different input types)
   */
  private getFormValue(container: HTMLElement | Document, elementId: string): string | boolean {
    const element = container.querySelector(`#${elementId}`) as HTMLInputElement | HTMLSelectElement;
    if (!element) return '';
    
    if (element.type === 'checkbox') {
      return (element as HTMLInputElement).checked;
    } else {
      return element.value;
    }
  }

  /**
   * Show save success feedback
   */
  private showSaveSuccess() {
    if (this.saveBtn) {
      const originalText = this.saveBtn.textContent;
      this.saveBtn.textContent = 'Settings Saved!';
      this.saveBtn.classList.add('bg-green-500/20', 'text-green-300', 'border-green-500/50');
      
      setTimeout(() => {
        this.saveBtn!.textContent = originalText;
        this.saveBtn!.classList.remove('bg-green-500/20', 'text-green-300', 'border-green-500/50');
      }, 2000);
    }
  }

  /**
   * Public method to get current settings
   */
  getSettings(): SettingsData {
    return this.getStoredSettings();
  }

  // Public methods inherited from BaseModalManager:
  // - open(): Opens the modal with unified animation
  // - close(): Closes the modal with unified animation  
  // - getIsOpen(): Returns current open state
  // - toggle(): Toggles modal state
}