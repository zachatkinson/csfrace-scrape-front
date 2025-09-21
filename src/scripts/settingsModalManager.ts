/**
 * SettingsModalManager - SOLID Implementation extending BaseModalManager
 * Single Responsibility: Manage settings-specific modal interactions
 * Open/Closed: Extends BaseModalManager without modifying it
 * Liskov Substitution: Can substitute BaseModalManager
 * Interface Segregation: Clean settings-specific interface
 * Dependency Inversion: Depends on BaseModalManager abstraction
 */

import { BaseModalManager, type ModalConfig } from "./baseModalManager";
import { createContextLogger } from "../utils/logger.js";
import { settingsBridge } from "../utils/settingsBridge.js";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface SettingsModalConfig extends ModalConfig {
  onSettingsChanged?: (settings: Record<string, unknown>) => void;
}

// =============================================================================
// SETTINGS MODAL MANAGER CLASS
// =============================================================================

export class SettingsModalManager extends BaseModalManager {
  protected override config: SettingsModalConfig;
  protected override readonly logger = createContextLogger(
    "SettingsModalManager",
  );

  constructor(config: SettingsModalConfig) {
    super(config);
    this.config = {
      closeOnEscape: true,
      closeOnBackdrop: true,
      ...config,
    };
  }

  /**
   * Set up settings-specific handlers
   * Implementation of abstract method from BaseModalManager
   */
  protected override setupModalSpecificHandlers(): void {
    this.setupTabHandlers();
    this.setupActionHandlers();
    this.setupToggleEventListener();

    this.logger.info("Settings handlers set up");
  }

  /**
   * Set up tab switching handlers
   */
  private setupTabHandlers(): void {
    if (!this.modal) return;

    const tabButtons = this.modal.querySelectorAll(
      '[data-action="switch-tab"]',
    );
    tabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = button.getAttribute("data-tab");
        if (tabId) {
          this.switchTab(tabId);
        }
      });
    });
  }

  /**
   * Set up action button handlers
   */
  private setupActionHandlers(): void {
    if (!this.modal) return;

    const actionButtons = this.modal.querySelectorAll("[data-action]");
    actionButtons.forEach((button) => {
      const action = button.getAttribute("data-action");
      if (action && action !== "switch-tab") {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleAction(action, button as HTMLElement);
        });
      }
    });
  }

  /**
   * Set up toggle-settings event listener
   */
  private setupToggleEventListener(): void {
    window.addEventListener("toggle-settings", () => {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });
  }

  /**
   * Switch to a specific tab
   */
  private switchTab(tabId: string): void {
    if (!this.modal) return;

    // Update tab buttons
    const tabButtons = this.modal.querySelectorAll(
      '[data-action="switch-tab"]',
    );
    tabButtons.forEach((btn) => {
      const isActiveBtn = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("active", isActiveBtn);

      // Update button styles
      if (isActiveBtn) {
        btn.className =
          "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors bg-blue-500/20 text-blue-300 border border-blue-500/30";
      } else {
        btn.className =
          "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-white/60 hover:text-white hover:bg-white/5";
      }
    });

    // Update tab content - fix the display issue
    const tabContents = this.modal.querySelectorAll(".tab-content");
    tabContents.forEach((content) => {
      const isActive = content.getAttribute("data-tab") === tabId;

      // Remove inline display style and use proper display control
      const element = content as HTMLElement;
      element.style.display = isActive ? "block" : "none";

      // Also update classes for consistency
      content.classList.toggle("hidden", !isActive);
      content.classList.toggle("active", isActive);
    });

    this.logger.info("Tab switched", { tabId });
  }

  /**
   * Handle action button clicks
   */
  private handleAction(action: string, _button: HTMLElement): void {
    this.logger.info("Action triggered", { action });

    switch (action) {
      case "save-settings":
        this.saveSettings();
        break;
      case "export-settings":
        this.exportSettings();
        break;
      case "import-settings":
        this.importSettings();
        break;
      case "reset-settings":
        this.resetSettings();
        break;
      case "clear-cache":
        this.clearCache();
        break;
      default:
        this.logger.warn("Unknown action", { action });
    }
  }

  /**
   * Save current form values to settings
   */
  private saveSettings(): void {
    if (!this.modal) return;

    try {
      // Collect form values
      const formValues: Record<string, unknown> = {};
      const fieldIds = [
        "api-timeout",
        "refresh-interval",
        "max-retries",
        "job-timeout",
      ];

      fieldIds.forEach((fieldId) => {
        const input = this.modal?.querySelector(
          `#${fieldId}`,
        ) as HTMLInputElement;
        if (input) {
          const value = Number(input.value);
          if (!isNaN(value)) {
            formValues[fieldId] = value;
            this.logger.debug(`Saving setting: ${fieldId} = ${value}`);
          }
        }
      });

      // Save to settings bridge
      settingsBridge.setFormValues(formValues);

      // Notify success
      this.logger.info("Settings saved successfully", formValues);

      // Call the callback if provided
      if (this.config.onSettingsChanged) {
        this.config.onSettingsChanged(formValues);
      }

      // Optional: Close modal after saving
      // this.close();
    } catch (error) {
      this.logger.error("Failed to save settings", error);
    }
  }

  /**
   * Export settings
   */
  private exportSettings(): void {
    try {
      const settings = this.getCurrentSettings();
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = "csfrace-settings.json";
      link.click();

      this.logger.info("Settings exported");
    } catch (error) {
      this.logger.error("Failed to export settings", error);
    }
  }

  /**
   * Import settings
   */
  private importSettings(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target?.result as string);
            this.applySettings(settings);
            this.logger.info("Settings imported");
          } catch (error) {
            this.logger.error("Failed to import settings", error);
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }

  /**
   * Reset settings to defaults
   */
  private resetSettings(): void {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      localStorage.clear();
      sessionStorage.clear();
      this.logger.info("Settings reset");
      window.location.reload();
    }
  }

  /**
   * Clear cache
   */
  private clearCache(): void {
    if (confirm("Are you sure you want to clear the cache?")) {
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      this.logger.info("Cache cleared");
    }
  }

  /**
   * Get current settings
   */
  private getCurrentSettings(): Record<string, unknown> {
    const settings: Record<string, unknown> = {};

    // Collect all localStorage settings
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          settings[key] = JSON.parse(localStorage.getItem(key) || "");
        } catch {
          settings[key] = localStorage.getItem(key);
        }
      }
    }

    return settings;
  }

  /**
   * Apply settings
   */
  private applySettings(settings: Record<string, unknown>): void {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
    });

    if (this.config.onSettingsChanged) {
      this.config.onSettingsChanged(settings);
    }
  }

  /**
   * Load current settings when opening
   */
  protected onOpen(): void {
    this.loadCurrentSettings();
  }

  /**
   * Load current settings into the UI
   */
  private loadCurrentSettings(): void {
    if (!this.modal) return;

    try {
      // Get current settings from the bridge
      const formValues = settingsBridge.getFormValues();

      // Update form fields with current values
      Object.entries(formValues).forEach(([fieldId, value]) => {
        const input = this.modal?.querySelector(
          `#${fieldId}`,
        ) as HTMLInputElement;
        if (input) {
          input.value = String(value);
          this.logger.debug(`Loaded setting: ${fieldId} = ${value}`);
        }
      });

      this.logger.info("Current settings loaded from bridge", formValues);
    } catch (error) {
      this.logger.error("Failed to load current settings", error);
    }
  }
}
