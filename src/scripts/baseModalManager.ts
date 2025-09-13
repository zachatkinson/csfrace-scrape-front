/**
 * BaseModalManager - DRY/SOLID Modal Behavior Foundation
 * Single Responsibility: Provide consistent modal open/close behavior
 * Open/Closed: Extensible for specific modal implementations
 * Liskov Substitution: Can be substituted by any modal manager
 * Interface Segregation: Minimal interface focused on modal operations
 * Dependency Inversion: Depends on HTMLElement abstraction
 */

import { addBackdropClickListener } from '../utils/modalUtils';

export interface BaseModalConfig {
  modalId: string;
  container?: HTMLElement;
  onOpen?: () => void;
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  backdropClasses?: string[]; // Optional custom backdrop class names
}

export abstract class BaseModalManager {
  protected modal: HTMLElement | null = null;
  protected config: BaseModalConfig;
  protected isOpen: boolean = false;
  protected backdropCleanup?: () => void;

  constructor(config: BaseModalConfig) {
    this.config = {
      closeOnEscape: true,
      closeOnBackdrop: true,
      backdropClasses: ['base-modal-backdrop', 'backdrop-blur-md'], // Default backdrop classes
      ...config
    };
  }

  /**
   * Initialize the modal manager
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupModalSpecificHandlers();
  }

  /**
   * Cache DOM elements for performance
   */
  private cacheElements() {
    const container = this.config.container || document;
    this.modal = container.querySelector(`#${this.config.modalId}`);
  }

  /**
   * Set up base event listeners
   */
  private setupEventListeners() {
    // Escape key listener
    if (this.config.closeOnEscape) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    // Backdrop click listener using DRY utility
    if (this.config.closeOnBackdrop && this.modal) {
      this.backdropCleanup = addBackdropClickListener(
        this.modal,
        () => this.close(),
        this.config.backdropClasses
      );
    }
  }

  /**
   * Abstract method for modal-specific event handlers
   * Implementation in concrete classes
   */
  protected abstract setupModalSpecificHandlers(): void;

  /**
   * Open modal with unified fade animation
   */
  open() {
    if (!this.modal) return;
    
    // Show modal and enable interactions
    this.modal.style.display = 'flex';
    this.modal.style.pointerEvents = 'auto';
    this.modal.classList.remove('opacity-0');
    this.modal.classList.add('opacity-100');
    
    this.isOpen = true;
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Trigger custom hook
    this.config.onOpen?.();
  }

  /**
   * Close modal with unified fade animation
   */
  close() {
    if (!this.modal) return;
    
    // Start fade out animation
    this.modal.classList.remove('opacity-100');
    this.modal.classList.add('opacity-0');
    
    // Hide modal after animation completes
    setTimeout(() => {
      if (this.modal) {
        this.modal.style.display = 'none';
        this.modal.style.pointerEvents = 'none';
      }
    }, 300);
    
    this.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Trigger custom hook
    this.config.onClose?.();
  }

  /**
   * Get current open state
   */
  getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Toggle modal state
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Cleanup when modal is destroyed
   */
  destroy() {
    // Clean up backdrop click listener
    this.backdropCleanup?.();
    this.backdropCleanup = undefined;
    
    this.modal = null;
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}