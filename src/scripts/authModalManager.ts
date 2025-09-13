/**
 * AuthModalManager - DRY/SOLID Astro Auth Modal Manager
 * Single Responsibility: Handle auth modal specific behavior
 * Follows Astro best practices and BaseModalManager pattern
 */

import { BaseModalManager, type BaseModalConfig } from './baseModalManager';

export interface AuthModalConfig extends Omit<BaseModalConfig, 'modalId'> {
  onAuthSuccess?: () => void;
}

export class AuthModalManager extends BaseModalManager {
  private authConfig: AuthModalConfig;
  
  constructor(config: AuthModalConfig = {}) {
    super({
      modalId: 'auth-modal',
      backdropClasses: ['base-modal-backdrop', 'backdrop-blur-md'],
      closeOnEscape: true,
      closeOnBackdrop: true,
      ...config
    });
    this.authConfig = config;
  }
  
  /**
   * Implementation of abstract method from BaseModalManager
   * Following Astro best practices for event handling
   */
  protected setupModalSpecificHandlers(): void {
    // Listen for auth modal open events (following Astro auth docs pattern)
    window.addEventListener('openAuthModal', () => {
      this.open();
    });
    
    window.addEventListener('testAuthModal', () => {
      this.open();
    });
    
    // Listen for auth success events
    window.addEventListener('authSuccess', () => {
      this.close();
      this.authConfig.onAuthSuccess?.();
    });
  }
  
  /**
   * Override open to reset auth state
   */
  open(): void {
    super.open();
    
    // Clear any previous error states
    const errorEl = document.getElementById('auth-error');
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
    
    // Hide loading state
    const loadingEl = document.getElementById('auth-loading');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }
  
  /**
   * Public method to show authentication error
   */
  showError(message: string): void {
    const errorEl = document.getElementById('auth-error');
    const errorMsg = document.getElementById('auth-error-message');
    
    if (errorEl && errorMsg) {
      errorMsg.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }
  
  /**
   * Public method to clear authentication errors
   */
  clearError(): void {
    const errorEl = document.getElementById('auth-error');
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }
  
  /**
   * Public method to show loading state
   */
  setLoading(loading: boolean, message: string = 'Loading...'): void {
    const loadingEl = document.getElementById('auth-loading');
    const loadingText = document.getElementById('auth-loading-text');
    
    if (loadingEl) {
      loadingEl.style.display = loading ? 'flex' : 'none';
    }
    
    if (loadingText && loading) {
      loadingText.textContent = message;
    }
  }
}