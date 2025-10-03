/**
 * AuthModalManager - SOLID Implementation extending BaseModalManager
 * Single Responsibility: Manage authentication modal interactions and flows
 * Open/Closed: Extends BaseModalManager without modification
 * Liskov Substitution: Can substitute BaseModalManager
 * Interface Segregation: Clean authentication-specific interface
 * Dependency Inversion: Depends on BaseModalManager abstraction
 */

import { BaseModalManager, type ModalConfig } from "./baseModalManager";
import { createContextLogger } from "../utils/logger.js";

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface AuthModalConfig extends ModalConfig {
  authEndpoint?: string;
  providers?: AuthProvider[];
  allowRegistration?: boolean;
  requireEmailVerification?: boolean;
  onAuthSuccess?: (user: AuthenticatedUser) => void;
  onAuthError?: (error: AuthError) => void;
}

export interface AuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  authUrl: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
  isVerified: boolean;
  tokens: {
    access: string;
    refresh?: string;
    expires: number;
  };
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  rememberMe?: boolean;
}

// =============================================================================
// AUTH MODAL MANAGER CLASS
// =============================================================================

export class AuthModalManager extends BaseModalManager {
  protected override config: AuthModalConfig;
  protected override readonly logger = createContextLogger("AuthModalManager");

  // Form elements
  private authForm: HTMLFormElement | null = null;
  private emailInput: HTMLInputElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private nameInput: HTMLInputElement | null = null;
  private rememberMeInput: HTMLInputElement | null = null;

  // UI elements
  private signInTab: HTMLElement | null = null;
  private signUpTab: HTMLElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private switchModeButton: HTMLElement | null = null;
  private errorContainer: HTMLElement | null = null;
  private providersContainer: HTMLElement | null = null;

  // State
  private currentMode: "signin" | "signup" = "signin";
  private isSubmitting: boolean = false;

  constructor(config: AuthModalConfig) {
    super(config);
    this.config = {
      authEndpoint: "/auth/login",
      providers: [],
      allowRegistration: true,
      requireEmailVerification: false,
      ...config,
    };
  }

  /**
   * Set up authentication-specific handlers
   * Implementation of abstract method from BaseModalManager
   */
  protected override setupModalSpecificHandlers(): void {
    this.cacheAuthElements();
    this.setupFormHandlers();
    this.setupModeToggle();
    this.setupProviders();
    this.setupValidation();
    this.setupCustomEventListeners();
    this.setupOAuthCallbackListener();

    this.logger.info("Authentication handlers set up");
  }

  /**
   * Set up custom event listeners for external triggers
   */
  private setupCustomEventListeners(): void {
    // Listen for open-auth-modal events from SignInButton
    window.addEventListener("open-auth-modal", (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: string }>;
      const { mode } = customEvent.detail || {};
      this.logger.info("Received open-auth-modal event", { mode });

      if (mode && (mode === "signin" || mode === "signup")) {
        this.openInMode(mode);
      } else {
        this.open();
      }
    });

    // Listen for OAuth callback messages from popup windows
    window.addEventListener("message", async (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      const { type, provider, tokens, user, error } = event.data;

      if (type === "oauth_success" && provider && tokens && user) {
        this.logger.info("Received OAuth success", { provider });

        // Create authenticated user object with received tokens
        const authenticatedUser: AuthenticatedUser = {
          ...user,
          tokens: tokens,
        };

        this.handleAuthSuccess(authenticatedUser);
      } else if (type === "oauth_error" && error) {
        this.logger.error("OAuth error from popup", { error });
        this.handleAuthError({
          code: "OAUTH_ERROR",
          message: error,
        });
      }
    });
  }

  /**
   * Cache authentication-specific DOM elements
   */
  private cacheAuthElements(): void {
    if (!this.modal) return;

    // Form elements
    this.authForm = this.modal.querySelector("#auth-form") as HTMLFormElement;
    this.emailInput = this.modal.querySelector("#email") as HTMLInputElement;
    this.passwordInput = this.modal.querySelector(
      "#password",
    ) as HTMLInputElement;
    this.nameInput = this.modal.querySelector("#name") as HTMLInputElement;
    this.rememberMeInput = this.modal.querySelector(
      "#remember-me",
    ) as HTMLInputElement;

    // UI elements
    this.signInTab = this.modal.querySelector("#signin-tab");
    this.signUpTab = this.modal.querySelector("#signup-tab");
    this.submitButton = this.modal.querySelector(
      "#auth-submit",
    ) as HTMLButtonElement;
    this.switchModeButton = this.modal.querySelector("#switch-mode");
    this.errorContainer = this.modal.querySelector("#auth-error");
    this.providersContainer = this.modal.querySelector("#auth-providers");
  }

  /**
   * Set up form submission handlers
   */
  private setupFormHandlers(): void {
    if (!this.authForm) return;

    this.authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleFormSubmission();
    });

    // Submit button click (for additional handling)
    if (this.submitButton) {
      this.submitButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.handleFormSubmission();
      });
    }
  }

  /**
   * Set up mode toggle between sign-in and sign-up
   */
  private setupModeToggle(): void {
    // Tab clicks
    if (this.signInTab) {
      this.signInTab.addEventListener("click", () => {
        this.switchMode("signin");
      });
    }

    if (this.signUpTab) {
      this.signUpTab.addEventListener("click", () => {
        this.switchMode("signup");
      });
    }

    // Switch mode button
    if (this.switchModeButton) {
      this.switchModeButton.addEventListener("click", () => {
        this.switchMode(this.currentMode === "signin" ? "signup" : "signin");
      });
    }
  }

  /**
   * Set up OAuth provider buttons
   */
  private setupProviders(): void {
    if (!this.providersContainer || !this.config.providers?.length) return;

    // Clear existing provider buttons
    this.providersContainer.innerHTML = "";

    // Create provider buttons
    this.config.providers.forEach((provider) => {
      const button = this.createProviderButton(provider);
      this.providersContainer?.appendChild(button);
    });
  }

  /**
   * Create OAuth provider button
   */
  private createProviderButton(provider: AuthProvider): HTMLElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `
      w-full flex items-center justify-center px-4 py-3 border border-gray-300 
      rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 
      hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
      focus:ring-indigo-500 transition-colors duration-200
    `;
    button.style.borderColor = provider.color;

    button.innerHTML = `
      <span class="mr-2">${provider.icon}</span>
      Continue with ${provider.name}
    `;

    button.addEventListener("click", () => {
      this.handleProviderAuth(provider);
    });

    return button;
  }

  /**
   * Set up form validation
   */
  private setupValidation(): void {
    const inputs = [this.emailInput, this.passwordInput, this.nameInput].filter(
      Boolean,
    );

    inputs.forEach((input) => {
      if (!input) return;

      input.addEventListener("blur", () => {
        this.validateField(input);
      });

      input.addEventListener("input", () => {
        this.clearFieldError(input);
      });
    });
  }

  /**
   * Switch between sign-in and sign-up modes
   */
  private switchMode(mode: "signin" | "signup"): void {
    this.currentMode = mode;

    // Update tabs
    if (this.signInTab && this.signUpTab) {
      this.signInTab.classList.toggle("active", mode === "signin");
      this.signUpTab.classList.toggle("active", mode === "signup");
    }

    // Update form fields
    if (this.nameInput) {
      const nameField = this.nameInput.closest(".form-field");
      if (nameField) {
        nameField.classList.toggle("hidden", mode === "signin");
      }
    }

    // Update submit button
    if (this.submitButton) {
      this.submitButton.textContent = mode === "signin" ? "Sign In" : "Sign Up";
    }

    // Update switch mode button
    if (this.switchModeButton) {
      const text =
        mode === "signin"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in";
      this.switchModeButton.textContent = text;
    }

    // Clear errors
    this.clearErrors();

    this.logger.info("Switched mode", { mode });
  }

  /**
   * Handle form submission
   */
  private async handleFormSubmission(): Promise<void> {
    if (this.isSubmitting) return;

    try {
      this.setSubmittingState(true);
      this.clearErrors();

      // Validate form
      if (!this.validateForm()) {
        return;
      }

      // Get form data
      const formData = this.getFormData();

      // Submit to authentication endpoint
      const result = await this.submitAuth(formData);

      if (result.success && result.user) {
        this.handleAuthSuccess(result.user);
      } else if (result.error) {
        this.handleAuthError(result.error);
      }
    } catch (error) {
      this.logger.error("Form submission error", error);
      this.handleAuthError({
        code: "SUBMISSION_ERROR",
        message: "An unexpected error occurred. Please try again.",
        details:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { error: String(error) },
      });
    } finally {
      this.setSubmittingState(false);
    }
  }

  /**
   * Handle OAuth provider authentication
   */
  private async handleProviderAuth(provider: AuthProvider): Promise<void> {
    try {
      this.logger.info("Starting provider authentication", {
        provider: provider.name,
      });

      // Open OAuth provider in popup window for better UX
      const popup = window.open(
        provider.authUrl,
        `oauth_${provider.id}`,
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Monitor popup closure in case user cancels
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          this.logger.info("OAuth popup closed by user");
        }
      }, 1000);
    } catch (error) {
      this.logger.error(`${provider.name} auth error`, error);
      this.handleAuthError({
        code: "PROVIDER_ERROR",
        message: `Failed to authenticate with ${provider.name}. Please try again.`,
        details:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { error: String(error) },
      });
    }
  }

  /**
   * Validate entire form
   */
  private validateForm(): boolean {
    let isValid = true;

    // Email validation
    if (this.emailInput) {
      if (!this.validateField(this.emailInput)) {
        isValid = false;
      }
    }

    // Password validation
    if (this.passwordInput) {
      if (!this.validateField(this.passwordInput)) {
        isValid = false;
      }
    }

    // Name validation (for sign-up)
    if (this.currentMode === "signup" && this.nameInput) {
      if (!this.validateField(this.nameInput)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Validate individual field
   */
  private validateField(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    let error = "";

    switch (input.type) {
      case "email":
        if (!value) {
          error = "Email is required";
        } else if (!this.isValidEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (this.currentMode === "signup" && value.length < 8) {
          error = "Password must be at least 8 characters long";
        }
        break;

      case "text":
        if (input.id === "name" && this.currentMode === "signup") {
          if (!value) {
            error = "Name is required";
          }
        }
        break;
    }

    if (error) {
      this.showFieldError(input, error);
      return false;
    } else {
      this.clearFieldError(input);
      return true;
    }
  }

  /**
   * Show field-specific error
   */
  private showFieldError(input: HTMLInputElement, message: string): void {
    // Add error class to input
    input.classList.add("error");

    // Find or create error element
    let errorElement = input.parentElement?.querySelector(
      ".field-error",
    ) as HTMLElement;
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "field-error text-red-500 text-sm mt-1";
      input.parentElement?.appendChild(errorElement);
    }

    errorElement.textContent = message;
  }

  /**
   * Clear field-specific error
   */
  private clearFieldError(input: HTMLInputElement): void {
    input.classList.remove("error");
    const errorElement = input.parentElement?.querySelector(".field-error");
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Get form data
   */
  private getFormData(): AuthFormData {
    const baseData = {
      email: this.emailInput?.value.trim() || "",
      password: this.passwordInput?.value || "",
    };

    return {
      ...baseData,
      ...(this.currentMode === "signup" && this.nameInput?.value.trim()
        ? { name: this.nameInput.value.trim() }
        : {}),
      ...(this.rememberMeInput?.checked ? { rememberMe: true } : {}),
    };
  }

  /**
   * Submit authentication request
   */
  private async submitAuth(formData: AuthFormData): Promise<{
    success: boolean;
    user?: AuthenticatedUser;
    error?: AuthError;
  }> {
    // Simulating authentication for demo purposes

    // In a real implementation, this would make an actual API call
    // For now, simulate the authentication process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate successful authentication
    const baseUser = {
      id: "user-123",
      email: formData.email,
      isVerified: !this.config.requireEmailVerification,
      tokens: {
        access: "demo-access-token",
        refresh: "demo-refresh-token",
        expires: Date.now() + 24 * 60 * 60 * 1000,
      },
    };

    const userName = (formData.name ?? formData.email.split("@")[0]) as string;

    return {
      success: true,
      user: {
        ...baseUser,
        name: userName,
      },
    };
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(user: AuthenticatedUser): void {
    this.logger.info("Authentication successful", {
      userId: user.id,
      email: user.email,
    });

    // Store authentication data
    this.storeAuthData(user);

    // Call success callback
    if (this.config.onAuthSuccess) {
      this.config.onAuthSuccess(user);
    }

    // Emit global event
    window.dispatchEvent(
      new CustomEvent("auth-success", {
        detail: user,
      }),
    );

    // Close modal
    this.close();

    // Show success message
    this.showSuccess(`Welcome ${user.name || user.email}!`);
  }

  /**
   * Handle authentication error
   */
  private handleAuthError(error: AuthError): void {
    this.logger.error("Authentication error", error);

    // Show error in modal
    this.showError(error.message);

    // Call error callback
    if (this.config.onAuthError) {
      this.config.onAuthError(error);
    }

    // Emit global event
    window.dispatchEvent(
      new CustomEvent("auth-error", {
        detail: error,
      }),
    );
  }

  /**
   * Set submitting state
   */
  private setSubmittingState(isSubmitting: boolean): void {
    this.isSubmitting = isSubmitting;

    if (this.submitButton) {
      this.submitButton.disabled = isSubmitting;
      this.submitButton.textContent = isSubmitting
        ? "Please wait..."
        : this.currentMode === "signin"
          ? "Sign In"
          : "Sign Up";
    }

    // Disable form inputs
    const inputs = [this.emailInput, this.passwordInput, this.nameInput].filter(
      Boolean,
    );
    inputs.forEach((input) => {
      if (input) input.disabled = isSubmitting;
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (this.errorContainer) {
      this.errorContainer.textContent = message;
      this.errorContainer.classList.remove("hidden");
    }
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    // This could show a toast notification or temporary success message
    this.logger.info("Success message", { message });
  }

  /**
   * Clear all errors
   */
  private clearErrors(): void {
    if (this.errorContainer) {
      this.errorContainer.classList.add("hidden");
      this.errorContainer.textContent = "";
    }

    // Clear field errors
    const fieldErrors = this.modal?.querySelectorAll(".field-error");
    fieldErrors?.forEach((error) => error.remove());

    // Clear error classes
    const errorInputs = this.modal?.querySelectorAll("input.error");
    errorInputs?.forEach((input) => input.classList.remove("error"));
  }

  /**
   * Store authentication data
   */
  private storeAuthData(user: AuthenticatedUser): void {
    try {
      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
          isVerified: user.isVerified,
        }),
      );

      sessionStorage.setItem("auth_tokens", JSON.stringify(user.tokens));
    } catch (error) {
      this.logger.error("Failed to store auth data", error);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Open modal in specific mode
   */
  openInMode(mode: "signin" | "signup"): void {
    this.switchMode(mode);
    this.open();
  }

  /**
   * Get current mode
   */
  getCurrentMode(): "signin" | "signup" {
    return this.currentMode;
  }

  /**
   * Update providers
   */
  updateProviders(providers: AuthProvider[]): void {
    this.config.providers = providers;
    this.setupProviders();
  }

  /**
   * Handle OAuth callback from popup window
   */
  private async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<void> {
    try {
      this.logger.info(`Processing OAuth callback for ${provider}`);

      // Exchange authorization code for JWT tokens
      const callbackUrl = new URL(
        `https://localhost/auth/oauth/${provider}/callback`,
      );
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);

      const response = await fetch(callbackUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const tokenData = await response.json();
      this.logger.info(`Token exchange successful for ${provider}`, {
        tokenData,
      });

      // Validate token response
      if (!tokenData.access_token || !tokenData.token_type) {
        throw new Error("Invalid token response from server");
      }

      // Create user object in expected format
      const user: AuthenticatedUser = {
        id: "oauth_user",
        email: "", // Will be populated if available
        name: "",
        isVerified: true,
        provider: provider,
        tokens: {
          access: tokenData.access_token,
          refresh: tokenData.refresh_token,
          expires: Date.now() + tokenData.expires_in * 1000,
        },
      };

      this.logger.info(`Storing user data for ${provider}`, {
        user: { ...user, tokens: "***" },
      });
      this.handleAuthSuccess(user);
    } catch (error) {
      this.logger.error(`OAuth callback failed for ${provider}`, error);
      this.showError(
        error instanceof Error ? error.message : "OAuth authentication failed",
      );
    }
  }

  /**
   * Set up OAuth callback message listener
   */
  private setupOAuthCallbackListener(): void {
    // Listen for OAuth callback messages from popup windows
    window.addEventListener("message", async (event: MessageEvent) => {
      // Security check: only accept messages from same origin
      if (event.origin !== window.location.origin) {
        this.logger.warn("OAuth: Rejected message from different origin", {
          origin: event.origin,
        });
        return;
      }

      const { type, provider, code, state, error } = event.data;

      if (type === "oauth_callback" && provider && code && state) {
        this.logger.info(`Received OAuth callback message for ${provider}`);
        await this.handleOAuthCallback(provider, code, state);
      } else if (type === "oauth_error" && error) {
        this.logger.error("Received OAuth error message", { error });
        this.showError(error);
      }
    });

    this.logger.info("OAuth callback message listener set up");
  }
}
