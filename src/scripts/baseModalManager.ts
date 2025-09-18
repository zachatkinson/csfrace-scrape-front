/**
 * BaseModalManager - SOLID Base Class Implementation
 * Single Responsibility: Manage modal open/close behavior and accessibility
 * Open/Closed: Extensible for specific modal types without modification
 * Liskov Substitution: Any modal manager can substitute this base class
 * Interface Segregation: Clean modal interface
 * Dependency Inversion: Depends on DOM abstractions, not concrete implementations
 */

import { createContextLogger } from "../utils/logger.js";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface ModalConfig {
  modalId: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onBeforeOpen?: () => boolean; // Return false to prevent opening
  onBeforeClose?: () => boolean; // Return false to prevent closing
}

export interface ModalElements {
  modal: HTMLElement;
  closeButton?: HTMLElement;
  backdrop?: HTMLElement;
}

// =============================================================================
// BASE MODAL MANAGER CLASS
// =============================================================================

export abstract class BaseModalManager {
  protected config: ModalConfig;
  protected modal: HTMLElement | null = null;
  protected closeButton: HTMLElement | null = null;
  protected backdrop: HTMLElement | null = null;
  protected isOpen: boolean = false;
  protected isInitialized: boolean = false;
  protected readonly logger = createContextLogger("BaseModalManager");

  // Focus management for accessibility
  private previouslyFocusedElement: Element | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(config: ModalConfig) {
    this.config = {
      closeOnEscape: true,
      closeOnBackdrop: true,
      ...config,
    };
  }

  /**
   * Getter for modal element (compatibility alias)
   */
  get modalElement(): HTMLElement | null {
    return this.modal;
  }

  /**
   * Initialize the modal manager
   * Template method pattern - subclasses can override specific steps
   */
  init(): void {
    if (this.isInitialized) {
      this.logger.warn("Modal already initialized", {
        modalId: this.config.modalId,
      });
      return;
    }

    try {
      this.cacheElements();
      this.setupEventListeners();
      this.setupModalSpecificHandlers();
      this.setupAccessibility();
      this.isInitialized = true;

      this.logger.info("Modal initialized successfully", {
        modalId: this.config.modalId,
      });
    } catch (error) {
      this.logger.error("Failed to initialize modal", {
        modalId: this.config.modalId,
        error,
      });
    }
  }

  /**
   * Cache DOM elements for performance
   * Protected method that subclasses can override
   */
  protected cacheElements(): void {
    this.modal = document.getElementById(this.config.modalId);
    if (!this.modal) {
      throw new Error(
        `Modal element with ID "${this.config.modalId}" not found`,
      );
    }

    // Find close button (common patterns)
    this.closeButton =
      this.modal.querySelector("[data-modal-close]") ||
      this.modal.querySelector(".modal-close") ||
      this.modal.querySelector(`#${this.config.modalId}-close`);

    // Find backdrop (common patterns)
    this.backdrop =
      this.modal.querySelector("[data-modal-backdrop]") ||
      this.modal.querySelector(".modal-backdrop") ||
      this.modal; // Modal itself can be the backdrop
  }

  /**
   * Set up core event listeners
   * Protected method that subclasses can extend
   */
  protected setupEventListeners(): void {
    // Close button click
    if (this.closeButton) {
      this.closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.close();
      });
    }

    // Backdrop click (if enabled)
    if (this.config.closeOnBackdrop && this.backdrop) {
      this.backdrop.addEventListener("click", (e) => {
        // Only close if clicking the backdrop itself, not child elements
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }

    // Escape key (if enabled)
    if (this.config.closeOnEscape) {
      document.addEventListener("keydown", this.handleEscapeKey.bind(this));
    }

    // Listen for external open/close events
    window.addEventListener(`open-${this.config.modalId}`, () => this.open());
    window.addEventListener(`close-${this.config.modalId}`, () => this.close());
  }

  /**
   * Abstract method for modal-specific setup
   * Subclasses must implement this
   */
  protected abstract setupModalSpecificHandlers(): void;

  /**
   * Set up accessibility features
   * Protected method following WCAG guidelines
   */
  protected setupAccessibility(): void {
    if (!this.modal) return;

    // Ensure modal has proper ARIA attributes
    this.modal.setAttribute("role", "dialog");
    this.modal.setAttribute("aria-modal", "true");

    // Add aria-hidden when closed
    if (!this.isOpen) {
      this.modal.setAttribute("aria-hidden", "true");
    }

    // Cache focusable elements
    this.updateFocusableElements();
  }

  /**
   * Update list of focusable elements in modal
   */
  private updateFocusableElements(): void {
    if (!this.modal) return;

    const focusableSelector = [
      "button:not([disabled])",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    this.focusableElements = Array.from(
      this.modal.querySelectorAll(focusableSelector),
    ) as HTMLElement[];
  }

  /**
   * Open the modal
   * Public method with hooks for customization
   */
  open(): void {
    if (!this.modal || this.isOpen) return;

    // Call before open hook
    if (this.config.onBeforeOpen && !this.config.onBeforeOpen()) {
      this.logger.info("Modal open prevented by onBeforeOpen hook", {
        modalId: this.config.modalId,
      });
      return;
    }

    try {
      // Store previously focused element for restoration
      this.previouslyFocusedElement = document.activeElement;

      // Show modal
      this.showModal();

      // Update state
      this.isOpen = true;

      // Update accessibility
      this.modal.setAttribute("aria-hidden", "false");
      this.updateFocusableElements();

      // Focus management
      this.focusFirstElement();

      // Call open callback
      if (this.config.onOpen) {
        this.config.onOpen();
      }

      // Emit open event
      this.emitModalEvent("opened");

      this.logger.info("Modal opened", { modalId: this.config.modalId });
    } catch (error) {
      this.logger.error("Failed to open modal", {
        modalId: this.config.modalId,
        error,
      });
    }
  }

  /**
   * Close the modal
   * Public method with hooks for customization
   */
  close(): void {
    if (!this.modal || !this.isOpen) return;

    // Call before close hook
    if (this.config.onBeforeClose && !this.config.onBeforeClose()) {
      this.logger.info("Modal close prevented by onBeforeClose hook", {
        modalId: this.config.modalId,
      });
      return;
    }

    try {
      // Hide modal
      this.hideModal();

      // Update state
      this.isOpen = false;

      // Update accessibility
      this.modal.setAttribute("aria-hidden", "true");

      // Restore focus
      this.restoreFocus();

      // Call close callback
      if (this.config.onClose) {
        this.config.onClose();
      }

      // Emit close event
      this.emitModalEvent("closed");

      this.logger.info("Modal closed", { modalId: this.config.modalId });
    } catch (error) {
      this.logger.error("Failed to close modal", {
        modalId: this.config.modalId,
        error,
      });
    }
  }

  /**
   * Show modal implementation
   * Protected method that subclasses can override for custom animations
   */
  protected showModal(): void {
    if (!this.modal) return;

    this.modal.classList.remove("hidden");
    this.modal.style.display = "flex";

    // Add opening animation class if it exists
    if (this.modal.classList.contains("modal-animate")) {
      this.modal.classList.add("modal-opening");
      setTimeout(() => {
        this.modal?.classList.remove("modal-opening");
      }, 300);
    }
  }

  /**
   * Hide modal implementation
   * Protected method that subclasses can override for custom animations
   */
  protected hideModal(): void {
    if (!this.modal) return;

    // Add closing animation class if it exists
    if (this.modal.classList.contains("modal-animate")) {
      this.modal.classList.add("modal-closing");
      setTimeout(() => {
        this.modal?.classList.remove("modal-closing");
        this.modal?.classList.add("hidden");
        if (this.modal) this.modal.style.display = "none";
      }, 300);
    } else {
      this.modal.classList.add("hidden");
      this.modal.style.display = "none";
    }
  }

  /**
   * Handle escape key press
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.isOpen) {
      event.preventDefault();
      this.close();
    }
  }

  /**
   * Focus first focusable element in modal
   */
  private focusFirstElement(): void {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0]?.focus();
    } else if (this.modal) {
      // Fallback: focus the modal itself
      this.modal.focus();
    }
  }

  /**
   * Restore focus to previously focused element
   */
  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      "focus" in this.previouslyFocusedElement
    ) {
      (this.previouslyFocusedElement as HTMLElement).focus();
    }
    this.previouslyFocusedElement = null;
  }

  /**
   * Emit modal events for external listening
   */
  private emitModalEvent(eventType: "opened" | "closed"): void {
    const event = new CustomEvent(`modal-${eventType}`, {
      detail: {
        modalId: this.config.modalId,
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Public getters for external access
   */
  get isModalOpen(): boolean {
    return this.isOpen;
  }

  get modalId(): string {
    return this.config.modalId;
  }

  /**
   * Update modal configuration
   */
  updateConfig(newConfig: Partial<ModalConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroy the modal manager
   * Clean up event listeners and references
   */
  destroy(): void {
    // Remove event listeners
    if (this.config.closeOnEscape) {
      document.removeEventListener("keydown", this.handleEscapeKey.bind(this));
    }

    // Clear references
    this.modal = null;
    this.closeButton = null;
    this.backdrop = null;
    this.focusableElements = [];
    this.previouslyFocusedElement = null;
    this.isInitialized = false;
    this.isOpen = false;

    this.logger.info("Modal destroyed", { modalId: this.config.modalId });
  }

  /**
   * Toggle modal open/close state
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Factory function to create modal managers
 * Follows the Factory pattern for easier instantiation
 */
export function createModalManager(config: ModalConfig): BaseModalManager {
  // This would be extended to create specific modal types
  return new (class extends BaseModalManager {
    protected setupModalSpecificHandlers(): void {
      // Default implementation - can be overridden
      this.logger.info("Setting up default modal handlers", {
        modalId: this.config.modalId,
      });
    }
  })(config);
}

/**
 * Global modal utilities
 */
export const ModalUtils = {
  /**
   * Open any modal by ID
   */
  openModal(modalId: string): void {
    window.dispatchEvent(new CustomEvent(`open-${modalId}`));
  },

  /**
   * Close any modal by ID
   */
  closeModal(modalId: string): void {
    window.dispatchEvent(new CustomEvent(`close-${modalId}`));
  },

  /**
   * Close all open modals
   */
  closeAllModals(): void {
    // This could be implemented with a registry of modal managers
    document
      .querySelectorAll('[role="dialog"][aria-hidden="false"]')
      .forEach((modal) => {
        const modalId = modal.id;
        if (modalId) {
          this.closeModal(modalId);
        }
      });
  },
};
