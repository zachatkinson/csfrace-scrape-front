/**
 * Auth Provider Service
 * Single Responsibility: Coordinate authentication services and provide unified auth state
 * This replaces the AuthContext God Component by composing focused services
 */

import { UserManager, type UserManagerEvents, type AuthResult } from './UserManager.ts';
import { TokenManager, type TokenManagerEvents } from './TokenManager.ts';
import { OAuthHandler, type OAuthHandlerEvents, type OAuthResult } from './OAuthHandler.ts';
import { authStorage } from '../lib/auth-storage.ts';
import { TIMING_CONSTANTS } from '../constants/timing.ts';
import type { 
  UserProfile, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData,
  PasswordChangeData,
  PasswordResetRequest,
  PasswordResetConfirm
} from '../types/auth.ts';

export interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthProviderEvents {
  onAuthStateChanged: (state: AuthState) => void;
  onLoginSuccess: (user: UserProfile) => void;
  onLoginError: (error: string) => void;
  onLogoutComplete: () => void;
  onTokenRefreshFailed: () => void;
  onOAuthStart: (provider: string) => void;
  onOAuthSuccess: (provider: string, user: UserProfile) => void;
  onOAuthError: (provider: string, error: string) => void;
}

/**
 * Auth Provider - Orchestrates all authentication services
 * Replaces the monolithic AuthContext with a composed service pattern
 */
export class AuthProvider {
  private userManager: UserManager;
  private tokenManager: TokenManager;
  private oAuthHandler: OAuthHandler;
  
  private state: AuthState = {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };
  
  private events: Partial<AuthProviderEvents> = {};
  private stateUpdateTimer: number | undefined;

  constructor(events: Partial<AuthProviderEvents> = {}) {
    this.events = events;
    
    // Initialize service managers with event handlers
    this.tokenManager = new TokenManager(this.createTokenManagerEvents());
    this.userManager = new UserManager(this.createUserManagerEvents());
    this.oAuthHandler = new OAuthHandler(this.createOAuthHandlerEvents());
    
    this.initializeAuth();
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.state };
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfile | null {
    return this.userManager.getCurrentUser();
  }

  /**
   * Get current tokens
   */
  getCurrentTokens(): AuthTokens | null {
    return this.tokenManager.getTokens();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  /**
   * Check if user is loading
   */
  isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    this.updateState({ isLoading: true, error: null });
    
    try {
      const result = await this.userManager.login(credentials);
      
      if (result.success && result.user && result.tokens) {
        this.tokenManager.setTokens(result.tokens);
        this.updateAuthenticatedState(result.user, result.tokens);
        this.events.onLoginSuccess?.(result.user);
      } else {
        this.updateState({ 
          isLoading: false, 
          error: result.error || 'Login failed' 
        });
        this.events.onLoginError?.(result.error || 'Login failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateState({ isLoading: false, error: errorMessage });
      this.events.onLoginError?.(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    this.updateState({ isLoading: true, error: null });
    
    try {
      const result = await this.userManager.register(data);
      
      if (result.success) {
        if (result.user && result.tokens) {
          this.tokenManager.setTokens(result.tokens);
          this.updateAuthenticatedState(result.user, result.tokens);
        } else {
          // Registration successful but requires verification
          this.updateState({ isLoading: false });
        }
      } else {
        this.updateState({ 
          isLoading: false, 
          error: result.error || 'Registration failed' 
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.updateState({ isLoading: false, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this.updateState({ isLoading: true });
    
    try {
      await this.userManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.tokenManager.clearTokens();
      this.updateUnauthenticatedState();
      this.events.onLogoutComplete?.();
    }
  }

  /**
   * Refresh user profile
   */
  async refreshProfile(): Promise<UserProfile | null> {
    const user = await this.userManager.refreshProfile();
    if (user) {
      this.updateState({ user });
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    return this.userManager.updateProfile(updates);
  }

  /**
   * Change password
   */
  async changePassword(data: PasswordChangeData): Promise<boolean> {
    return this.userManager.changePassword(data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<boolean> {
    return this.userManager.requestPasswordReset(data);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<boolean> {
    return this.userManager.confirmPasswordReset(data);
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<boolean> {
    const result = await this.userManager.deleteAccount(password);
    if (result) {
      this.tokenManager.clearTokens();
      this.updateUnauthenticatedState();
    }
    return result;
  }

  /**
   * Start OAuth flow
   */
  async startOAuthFlow(provider: string, popup = true): Promise<void> {
    return this.oAuthHandler.startOAuthFlow(provider, popup);
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
    error?: string
  ): Promise<OAuthResult> {
    return this.oAuthHandler.handleOAuthCallback(provider, code, state, error);
  }

  /**
   * Get available OAuth providers
   */
  async getAvailableOAuthProviders() {
    return this.oAuthHandler.getAvailableProviders();
  }

  /**
   * Check if OAuth is in progress
   */
  isOAuthInProgress(provider?: string): boolean {
    return this.oAuthHandler.isOAuthInProgress(provider);
  }

  /**
   * Cancel OAuth flow
   */
  cancelOAuthFlow(provider: string): void {
    this.oAuthHandler.cancelOAuthFlow(provider);
  }

  /**
   * Check user permissions
   */
  hasPermission(permission: string): boolean {
    return this.userManager.hasPermission(permission);
  }

  /**
   * Check user role
   */
  hasRole(role: string): boolean {
    return this.userManager.hasRole(role);
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.userManager.isAdmin();
  }

  /**
   * Check if user is verified
   */
  isVerified(): boolean {
    return this.userManager.isVerified();
  }

  /**
   * Get user display name
   */
  getDisplayName(): string {
    return this.userManager.getDisplayName();
  }

  /**
   * Get user avatar URL
   */
  getAvatarUrl(): string | null {
    return this.userManager.getAvatarUrl();
  }

  /**
   * Get user initials
   */
  getUserInitials(): string {
    return this.userManager.getUserInitials();
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return this.tokenManager.authenticatedFetch(url, options);
  }

  /**
   * Get debug info for all services
   */
  getDebugInfo() {
    return {
      authState: this.getAuthState(),
      userInfo: this.userManager.getUserInfo(),
      tokenInfo: this.tokenManager.getTokenInfo(),
      oAuthInfo: this.oAuthHandler.getOAuthInfo(),
    };
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Check for stored tokens and user
      const tokens = this.tokenManager.getTokens();
      const user = this.userManager.getCurrentUser();

      if (tokens && user && this.tokenManager.areTokensValid()) {
        // We have valid tokens and user data
        this.updateAuthenticatedState(user, tokens);
        
        // Try to refresh profile in background
        this.userManager.refreshProfile().catch(error => {
          console.warn('Failed to refresh profile on init:', error);
        });
      } else if (tokens && this.tokenManager.areTokensValid()) {
        // We have tokens but no user - try to get profile
        const refreshedUser = await this.userManager.refreshProfile();
        if (refreshedUser) {
          this.updateAuthenticatedState(refreshedUser, tokens);
        } else {
          this.clearAuthState();
        }
      } else {
        // No valid auth state
        this.clearAuthState();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuthState();
    }

    // Start periodic token validation
    this.tokenManager.startPeriodicCheck();
  }

  /**
   * Update authenticated state
   */
  private updateAuthenticatedState(user: UserProfile, tokens: AuthTokens): void {
    this.updateState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }

  /**
   * Update unauthenticated state
   */
  private updateUnauthenticatedState(): void {
    this.updateState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  /**
   * Clear all auth state
   */
  private clearAuthState(): void {
    this.tokenManager.clearTokens();
    this.userManager.setCurrentUser(null);
    this.updateUnauthenticatedState();
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    
    // Debounce state change notifications
    if (this.stateUpdateTimer) {
      clearTimeout(this.stateUpdateTimer);
    }
    
    this.stateUpdateTimer = window.setTimeout(() => {
      this.events.onAuthStateChanged?.(this.getAuthState());
    }, TIMING_CONSTANTS.UI.STATE_UPDATE_DEBOUNCE);
  }

  /**
   * Create token manager event handlers
   */
  private createTokenManagerEvents(): Partial<TokenManagerEvents> {
    return {
      onTokensUpdated: (tokens) => {
        this.updateState({ tokens });
      },
      onTokenExpired: () => {
        this.clearAuthState();
        this.events.onTokenRefreshFailed?.();
      },
      onRefreshFailed: (error) => {
        console.error('Token refresh failed:', error);
        this.clearAuthState();
        this.events.onTokenRefreshFailed?.();
      },
    };
  }

  /**
   * Create user manager event handlers
   */
  private createUserManagerEvents(): Partial<UserManagerEvents> {
    return {
      onUserUpdated: (user) => {
        this.updateState({ 
          user,
          isAuthenticated: !!user,
        });
      },
      onProfileChanged: (user) => {
        this.updateState({ user });
      },
      onPasswordChanged: () => {
        console.log('Password changed successfully');
      },
      onAccountDeleted: () => {
        this.clearAuthState();
      },
    };
  }

  /**
   * Create OAuth handler event handlers
   */
  private createOAuthHandlerEvents(): Partial<OAuthHandlerEvents> {
    return {
      onOAuthStart: (provider) => {
        this.updateState({ isLoading: true, error: null });
        this.events.onOAuthStart?.(provider);
      },
      onOAuthSuccess: ({ tokens, user, provider }) => {
        this.tokenManager.setTokens(tokens);
        this.userManager.setCurrentUser(user);
        this.updateAuthenticatedState(user, tokens);
        this.events.onOAuthSuccess?.(provider, user);
      },
      onOAuthError: (error, provider) => {
        this.updateState({ isLoading: false, error });
        if (provider) {
          this.events.onOAuthError?.(provider, error);
        }
      },
      onOAuthCancel: (provider) => {
        this.updateState({ isLoading: false });
        console.log(`OAuth ${provider} cancelled by user`);
      },
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.userManager.destroy();
    this.tokenManager.destroy();
    this.oAuthHandler.destroy();
    
    if (this.stateUpdateTimer) {
      clearTimeout(this.stateUpdateTimer);
    }
  }
}

export default AuthProvider;