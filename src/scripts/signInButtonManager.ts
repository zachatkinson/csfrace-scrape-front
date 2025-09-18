/**
 * SignInButtonManager - SOLID Implementation
 * Single Responsibility: Manage sign-in button interactions and authentication flow
 * Open/Closed: Extensible for new authentication methods without modification
 * Interface Segregation: Clean separation of authentication concerns
 * Dependency Inversion: Depends on authentication abstractions, not concrete implementations
 */

import { createContextLogger } from '../utils/logger';

const logger = createContextLogger('SignInButtonManager');

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface SignInButtonConfig {
  buttonId?: string;
  container?: HTMLElement;
  authEndpoint?: string;
  redirectUrl?: string;
  onSuccess?: (user: AuthUser) => void;
  onError?: (error: AuthError) => void;
  onLoading?: (isLoading: boolean) => void;
  onButtonClick?: () => void;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
  tokens?: {
    access: string;
    refresh?: string;
    expires?: number;
  };
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: AuthError;
  requiresVerification?: boolean;
  redirectUrl?: string;
}

// =============================================================================
// SIGN-IN BUTTON MANAGER CLASS
// =============================================================================

export class SignInButtonManager {
  private config: SignInButtonConfig;
  private button: HTMLButtonElement | null = null;
  private isLoading: boolean = false;
  private originalButtonContent: string = '';

  constructor(config: SignInButtonConfig) {
    this.config = {
      authEndpoint: '/auth/login',
      redirectUrl: '/dashboard',
      ...config
    };
  }

  /**
   * Initialize the sign-in button manager
   */
  init(): void {
    try {
      this.cacheElements();
      this.setupEventListeners();
      this.setupUI();
      
      logger.info('Initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize', error);
    }
  }

  /**
   * Cache DOM elements
   */
  private cacheElements(): void {
    this.button = document.getElementById(this.config.buttonId || '') as HTMLButtonElement;
    if (!this.button) {
      throw new Error(`Sign-in button with ID "${this.config.buttonId}" not found`);
    }

    // Store original button content for restoration
    this.originalButtonContent = this.button.innerHTML;
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.button) return;

    this.button.addEventListener('click', this.handleSignInClick.bind(this));

    // Listen for external authentication events
    window.addEventListener('auth-success', this.handleAuthSuccess.bind(this) as EventListener);
    window.addEventListener('auth-error', this.handleAuthError.bind(this) as EventListener);
    window.addEventListener('auth-logout', this.handleLogout.bind(this) as EventListener);
  }

  /**
   * Set up UI state
   */
  private setupUI(): void {
    if (!this.button) return;

    // Check if user is already authenticated
    const existingAuth = this.getStoredAuth();
    if (existingAuth) {
      this.updateButtonForAuthenticatedState(existingAuth);
    } else {
      this.updateButtonForUnauthenticatedState();
    }
  }

  /**
   * Handle sign-in button click
   */
  private async handleSignInClick(event: Event): Promise<void> {
    event.preventDefault();
    
    if (this.isLoading) return;

    try {
      this.setLoadingState(true);
      
      // Check if user is already authenticated
      const existingAuth = this.getStoredAuth();
      if (existingAuth) {
        // User is already signed in, handle sign out
        await this.handleSignOut();
        return;
      }

      // Initiate sign-in flow
      await this.initiateSignIn();
      
    } catch (error) {
      logger.error('Error during sign-in', error);
      this.handleAuthError({
        detail: {
          code: 'SIGNIN_ERROR',
          message: 'Failed to sign in. Please try again.',
          details: error
        }
      } as CustomEvent);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Initiate sign-in flow
   */
  private async initiateSignIn(): Promise<void> {
    logger.info('Opening authentication modal');

    // Dispatch event to open the authentication modal
    window.dispatchEvent(new CustomEvent('open-auth-modal', {
      detail: { mode: 'signin' }
    }));
  }


  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(event: CustomEvent): void {
    const user: AuthUser = event.detail;
    
    logger.info('Authentication successful', { user });
    
    // Store authentication data
    this.storeAuth(user);
    
    // Update UI
    this.updateButtonForAuthenticatedState(user);
    
    // Call success callback
    if (this.config.onSuccess) {
      this.config.onSuccess(user);
    }
    
    // Emit global authentication event
    window.dispatchEvent(new CustomEvent('user-authenticated', {
      detail: user
    }));
    
    // Redirect if specified
    if (this.config.redirectUrl) {
      // Use a small delay to allow UI updates to be seen
      setTimeout(() => {
        if (this.config.redirectUrl) {
          window.location.href = this.config.redirectUrl;
        }
      }, 500);
    }
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(event: CustomEvent): void {
    const error: AuthError = event.detail;
    
    logger.error('Authentication error', error);
    
    // Update UI to show error state
    this.updateButtonForErrorState(error);
    
    // Call error callback
    if (this.config.onError) {
      this.config.onError(error);
    }
    
    // Reset to normal state after delay
    setTimeout(() => {
      this.updateButtonForUnauthenticatedState();
    }, 3000);
  }

  /**
   * Handle sign-out
   */
  private async handleSignOut(): Promise<void> {
    try {
      logger.info('Signing out');
      
      // Clear stored authentication
      this.clearStoredAuth();
      
      // Update UI
      this.updateButtonForUnauthenticatedState();
      
      // Emit logout event
      window.dispatchEvent(new CustomEvent('user-logged-out'));
      
      // Optional: Make API call to revoke tokens
      // await this.revokeTokens();
      
    } catch (error) {
      logger.error('Error during sign-out', error);
    }
  }

  /**
   * Handle logout event from external sources
   */
  private handleLogout(): void {
    this.clearStoredAuth();
    this.updateButtonForUnauthenticatedState();
  }

  /**
   * Set loading state
   */
  private setLoadingState(isLoading: boolean): void {
    this.isLoading = isLoading;
    
    if (!this.button) return;
    
    if (isLoading) {
      this.button.disabled = true;
      this.button.innerHTML = `
        <svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Signing in...
      `;
    } else {
      this.button.disabled = false;
    }
    
    // Call loading callback
    if (this.config.onLoading) {
      this.config.onLoading(isLoading);
    }
  }

  /**
   * Update button for unauthenticated state
   */
  private updateButtonForUnauthenticatedState(): void {
    if (!this.button) return;
    
    this.button.innerHTML = this.originalButtonContent || `
      <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      Sign In
    `;
    
    this.button.classList.remove('authenticated', 'error');
    this.button.disabled = false;
  }

  /**
   * Update button for authenticated state
   */
  private updateButtonForAuthenticatedState(user: AuthUser): void {
    if (!this.button) return;
    
    this.button.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      ${user.name || user.email}
    `;
    
    this.button.classList.add('authenticated');
    this.button.classList.remove('error');
    this.button.disabled = false;
    this.button.title = 'Click to sign out';
  }

  /**
   * Update button for error state
   */
  private updateButtonForErrorState(error: AuthError): void {
    if (!this.button) return;
    
    this.button.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      Sign In Failed
    `;
    
    this.button.classList.add('error');
    this.button.classList.remove('authenticated');
    this.button.title = error.message;
  }

  // =============================================================================
  // STORAGE UTILITIES
  // =============================================================================

  /**
   * Store authentication data
   */
  private storeAuth(user: AuthUser): void {
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      // Store tokens separately for security
      if (user.tokens) {
        sessionStorage.setItem('auth_tokens', JSON.stringify(user.tokens));
      }
    } catch (error) {
      logger.error('Failed to store authentication data', error);
    }
  }

  /**
   * Get stored authentication data
   */
  private getStoredAuth(): AuthUser | null {
    try {
      const userJson = localStorage.getItem('auth_user');
      const tokensJson = sessionStorage.getItem('auth_tokens');
      
      if (userJson) {
        const user: AuthUser = JSON.parse(userJson);
        
        // Add tokens if available
        if (tokensJson) {
          user.tokens = JSON.parse(tokensJson);
        }
        
        // Check if tokens are expired
        if (user.tokens?.expires && user.tokens.expires < Date.now()) {
          this.clearStoredAuth();
          return null;
        }
        
        return user;
      }
    } catch (error) {
      logger.error('Failed to retrieve authentication data', error);
      this.clearStoredAuth();
    }
    
    return null;
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    try {
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_tokens');
    } catch (error) {
      logger.error('Failed to clear authentication data', error);
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.getStoredAuth();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  }

  /**
   * Programmatically sign out
   */
  async signOut(): Promise<void> {
    await this.handleSignOut();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SignInButtonConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Trigger sign-in programmatically (for external control)
   */
  triggerSignIn(): void {
    if (this.button) {
      this.button.click();
    }
  }

  /**
   * Destroy the manager
   */
  destroy(): void {
    // Remove event listeners
    if (this.button) {
      this.button.removeEventListener('click', this.handleSignInClick.bind(this));
    }
    
    window.removeEventListener('auth-success', this.handleAuthSuccess.bind(this) as EventListener);
    window.removeEventListener('auth-error', this.handleAuthError.bind(this) as EventListener);
    window.removeEventListener('auth-logout', this.handleLogout.bind(this) as EventListener);
    
    // Clear references
    this.button = null;
    
    logger.info('Destroyed');
  }
}