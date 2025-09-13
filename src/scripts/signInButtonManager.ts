/**
 * Sign In Button Manager - Following Astro Best Practices & SOLID Principles
 * Handles sign-in button functionality and event dispatching
 * Single Responsibility: Manages sign-in button interactions and event communication
 */

export interface SignInButtonConfig {
  container: HTMLElement;
  onButtonClick?: () => void;
}

export class SignInButtonManager {
  private container: HTMLElement;
  private onButtonClick?: () => void;
  private button: HTMLElement | null = null;
  
  constructor(config: SignInButtonConfig) {
    this.container = config.container;
    this.onButtonClick = config.onButtonClick;
  }

  /**
   * Initialize the sign-in button manager
   */
  init() {
    this.cacheElements();
    this.setupEventListeners();
  }

  /**
   * Cache DOM elements for performance
   */
  private cacheElements() {
    this.button = this.container.querySelector('#auth-toggle');
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners() {
    this.button?.addEventListener('click', () => this.handleButtonClick());
  }

  /**
   * Handle sign-in button click
   */
  private handleButtonClick() {
    console.log('🟡 Sign In Button clicked: Dispatching openAuthModal event');
    
    // Dispatch custom event that React AuthModalManager can listen to
    window.dispatchEvent(new CustomEvent('openAuthModal'));
    
    // Call optional callback
    this.onButtonClick?.();
  }

  /**
   * Public method to programmatically trigger sign-in
   */
  triggerSignIn() {
    this.handleButtonClick();
  }
}