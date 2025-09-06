/**
 * Token Manager Service
 * Single Responsibility: Handle authentication token lifecycle
 * Extracted from AuthContext to follow SOLID principles
 */

import { authAPI } from '../lib/auth-api.ts';
import { authStorage } from '../lib/auth-storage.ts';
import { TIMING_CONSTANTS } from '../constants/timing.ts';
import type { AuthTokens } from '../types/auth.ts';

export interface TokenManagerEvents {
  onTokensUpdated: (tokens: AuthTokens | null) => void;
  onTokenExpired: () => void;
  onRefreshFailed: (error: Error) => void;
}

/**
 * Token Manager - Handles token storage, refresh, and expiration
 */
export class TokenManager {
  private refreshTimer: number | undefined;
  private isRefreshing = false;
  private events: Partial<TokenManagerEvents> = {};

  constructor(events: Partial<TokenManagerEvents> = {}) {
    this.events = events;
  }

  /**
   * Set authentication tokens and setup refresh
   */
  setTokens(tokens: AuthTokens | null): void {
    if (tokens) {
      authStorage.saveTokens(tokens);
      this.setupTokenRefresh(tokens.expiresAt);
      this.events.onTokensUpdated?.(tokens);
    } else {
      this.clearTokens();
    }
  }

  /**
   * Get current tokens from storage
   */
  getTokens(): AuthTokens | null {
    return authStorage.getTokens();
  }

  /**
   * Clear all tokens and cancel refresh
   */
  clearTokens(): void {
    authStorage.clearTokens();
    this.cancelTokenRefresh();
    this.events.onTokensUpdated?.(null);
  }

  /**
   * Check if tokens are valid (not expired)
   */
  areTokensValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    
    return Date.now() < tokens.expiresAt;
  }

  /**
   * Get time until token expiration (in milliseconds)
   */
  getTimeUntilExpiry(): number | null {
    const tokens = this.getTokens();
    if (!tokens) return null;
    
    return Math.max(0, tokens.expiresAt - Date.now());
  }

  /**
   * Check if tokens need refresh (within buffer time)
   */
  needsRefresh(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    
    const timeUntilExpiry = this.getTimeUntilExpiry();
    if (timeUntilExpiry === null) return false;
    
    return timeUntilExpiry < TIMING_CONSTANTS.AUTH.TOKEN_REFRESH_BUFFER;
  }

  /**
   * Refresh tokens if needed
   */
  async refreshTokensIfNeeded(): Promise<AuthTokens | null> {
    if (!this.needsRefresh()) {
      return this.getTokens();
    }

    return this.refreshTokens();
  }

  /**
   * Force refresh tokens
   */
  async refreshTokens(): Promise<AuthTokens | null> {
    const tokens = this.getTokens();
    if (!tokens?.refreshToken) {
      this.events.onTokenExpired?.();
      return null;
    }

    if (this.isRefreshing) {
      // Wait for existing refresh to complete
      return new Promise((resolve) => {
        const checkRefresh = () => {
          if (!this.isRefreshing) {
            resolve(this.getTokens());
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }

    try {
      this.isRefreshing = true;
      console.log('Refreshing auth tokens...');

      const response = await authAPI.refreshToken(tokens.refreshToken);
      
      if (response.success && response.tokens) {
        console.log('Tokens refreshed successfully');
        this.setTokens(response.tokens);
        return response.tokens;
      } else {
        throw new Error(response.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.events.onRefreshFailed?.(error as Error);
      this.events.onTokenExpired?.();
      this.clearTokens();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(expiresAt: number): void {
    this.cancelTokenRefresh();
    
    const now = Date.now();
    const expiresIn = expiresAt - now;
    const refreshIn = expiresIn - TIMING_CONSTANTS.AUTH.TOKEN_REFRESH_BUFFER;
    
    if (refreshIn <= 0) {
      // Token already needs refresh
      setTimeout(() => this.refreshTokens(), 1000);
      return;
    }
    
    console.log(`Token refresh scheduled in ${Math.round(refreshIn / 1000)} seconds`);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTokens();
    }, refreshIn);
  }

  /**
   * Cancel automatic token refresh
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Add authorization header to fetch options
   */
  addAuthHeader(options: RequestInit = {}): RequestInit {
    const tokens = this.getTokens();
    if (!tokens) return options;

    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    };
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Try to refresh tokens if needed
    await this.refreshTokensIfNeeded();
    
    const tokens = this.getTokens();
    if (!tokens) {
      throw new Error('No authentication tokens available');
    }

    const authOptions = this.addAuthHeader(options);
    const response = await fetch(url, authOptions);

    // If unauthorized and we have a refresh token, try once more
    if (response.status === 401 && tokens.refreshToken) {
      const refreshedTokens = await this.refreshTokens();
      if (refreshedTokens) {
        const retryOptions = this.addAuthHeader(options);
        return fetch(url, retryOptions);
      }
    }

    return response;
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(): {
    hasTokens: boolean;
    isValid: boolean;
    needsRefresh: boolean;
    timeUntilExpiry: number | null;
    expiresAt: Date | null;
  } {
    const tokens = this.getTokens();
    const timeUntilExpiry = this.getTimeUntilExpiry();
    
    return {
      hasTokens: !!tokens,
      isValid: this.areTokensValid(),
      needsRefresh: this.needsRefresh(),
      timeUntilExpiry,
      expiresAt: tokens ? new Date(tokens.expiresAt) : null,
    };
  }

  /**
   * Start periodic token validation check
   */
  startPeriodicCheck(): void {
    const checkInterval = TIMING_CONSTANTS.AUTH.SESSION_CHECK_INTERVAL;
    
    setInterval(() => {
      if (this.getTokens() && !this.areTokensValid()) {
        console.log('Tokens expired, triggering cleanup');
        this.events.onTokenExpired?.();
      }
    }, checkInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelTokenRefresh();
    this.isRefreshing = false;
  }
}

export default TokenManager;