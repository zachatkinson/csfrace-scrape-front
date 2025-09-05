/**
 * Secure Authentication Storage
 * Handles secure storage and retrieval of authentication tokens and user data
 */

import { AUTH_STORAGE_KEYS } from '../types/auth.ts';
import type { User, AuthTokens } from '../types/auth.ts';

class AuthStorage {
  private readonly isClient = typeof window !== 'undefined';
  private readonly PREFIX = 'csfrace_';

  // Token Management
  setTokens(tokens: AuthTokens): void {
    if (!this.isClient) return;

    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const tokensWithExpiry = { ...tokens, expires_at: expiresAt };

    // Store access token in sessionStorage for security (cleared on tab close)
    sessionStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

    // Store refresh token in localStorage if available (persistent across sessions)
    if (tokens.refresh_token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    }

    // Dispatch storage event for cross-tab synchronization
    this.dispatchStorageEvent('tokens_updated', tokensWithExpiry);
  }

  getAccessToken(): string | null {
    if (!this.isClient) return null;
    return sessionStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    if (!this.isClient) return null;
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  }

  getTokenExpiry(): number | null {
    if (!this.isClient) return null;
    const expiry = sessionStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
    return expiry ? parseInt(expiry, 10) : null;
  }

  clearTokens(): void {
    if (!this.isClient) return;

    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);

    this.dispatchStorageEvent('tokens_cleared', null);
  }

  // User Data Management
  setUser(user: User): void {
    if (!this.isClient) return;

    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    this.dispatchStorageEvent('user_updated', user);
  }

  getUser(): User | null {
    if (!this.isClient) return null;

    try {
      const userData = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to parse user data from storage:', error);
      this.clearUser();
      return null;
    }
  }

  clearUser(): void {
    if (!this.isClient) return;

    sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    this.dispatchStorageEvent('user_cleared', null);
  }

  // OAuth State Management
  setOAuthState(state: string, provider: string, verifier?: string): void {
    if (!this.isClient) return;

    const oauthData = {
      state,
      provider,
      verifier,
      timestamp: Date.now()
    };

    sessionStorage.setItem(AUTH_STORAGE_KEYS.OAUTH_STATE, JSON.stringify(oauthData));
  }

  getOAuthState(): { state: string; provider: string; verifier?: string; timestamp: number } | null {
    if (!this.isClient) return null;
    
    try {
      const oauthData = sessionStorage.getItem(AUTH_STORAGE_KEYS.OAUTH_STATE);
      return oauthData ? JSON.parse(oauthData) : null;
    } catch (error) {
      console.error('Failed to parse OAuth state from storage:', error);
      this.clearOAuthState();
      return null;
    }
  }

  getOAuthVerifier(): string | null {
    const oauthState = this.getOAuthState();
    return oauthState?.verifier || null;
  }

  clearOAuthState(): void {
    if (!this.isClient) return;

    sessionStorage.removeItem(AUTH_STORAGE_KEYS.OAUTH_STATE);
  }

  // Complete Auth State
  getAuthState(): {
    tokens: AuthTokens | null;
    user: User | null;
    isAuthenticated: boolean;
  } {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAt = this.getTokenExpiry();
    const user = this.getUser();

    let tokens: AuthTokens | null = null;
    if (accessToken && expiresAt) {
      tokens = {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
        token_type: 'bearer',
        expires_in: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
        expires_at: expiresAt,
      };
    }

    const isAuthenticated = !!(
      tokens &&
      user &&
      tokens.expires_at > Date.now()
    );

    return { tokens, user, isAuthenticated };
  }

  clearAllAuthData(): void {
    this.clearTokens();
    this.clearUser();
    this.clearOAuthState();
    this.dispatchStorageEvent('auth_cleared', null);
  }

  // Cross-tab synchronization
  private dispatchStorageEvent(type: string, data: any): void {
    if (!this.isClient) return;

    const event = new CustomEvent('auth_storage_change', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  onStorageChange(callback: (event: { type: string; data: any; timestamp: number }) => void): () => void {
    if (!this.isClient) return () => {};

    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener('auth_storage_change', handler as EventListener);
    
    // Also listen for storage events from other tabs
    const storageHandler = (event: StorageEvent) => {
      if (event.key?.startsWith(this.PREFIX)) {
        const type = event.key.replace(this.PREFIX, '');
        const data = event.newValue ? JSON.parse(event.newValue) : null;
        callback({ type, data, timestamp: Date.now() });
      }
    };
    window.addEventListener('storage', storageHandler);

    // Return cleanup function
    return () => {
      window.removeEventListener('auth_storage_change', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }

  // Token validation
  isTokenValid(token?: string): boolean {
    const accessToken = token || this.getAccessToken();
    const expiresAt = this.getTokenExpiry();

    if (!accessToken || !expiresAt) return false;
    
    return Date.now() < expiresAt;
  }

  shouldRefreshToken(bufferMinutes: number = 5): boolean {
    const expiresAt = this.getTokenExpiry();
    if (!expiresAt) return false;

    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() >= (expiresAt - bufferMs);
  }

  // Session management
  extendSession(additionalMinutes: number = 30): void {
    const expiresAt = this.getTokenExpiry();
    if (!expiresAt) return;

    const newExpiresAt = expiresAt + (additionalMinutes * 60 * 1000);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, newExpiresAt.toString());
  }

  getSessionTimeRemaining(): number {
    const expiresAt = this.getTokenExpiry();
    if (!expiresAt) return 0;

    return Math.max(0, expiresAt - Date.now());
  }

  // Security utilities
  generateSecureKey(length: number = 32): string {
    if (!this.isClient || !window.crypto) {
      // Fallback for SSR or unsupported browsers
      return Math.random().toString(36).substring(2, length + 2);
    }

    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Development utilities
  getStorageInfo(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasUser: boolean;
    tokenExpiry: number | null;
    timeRemaining: number;
    isValid: boolean;
  } {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const user = this.getUser();
    const tokenExpiry = this.getTokenExpiry();
    const timeRemaining = this.getSessionTimeRemaining();

    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUser: !!user,
      tokenExpiry,
      timeRemaining,
      isValid: this.isTokenValid(),
    };
  }
}

// Singleton instance
export const authStorage = new AuthStorage();

// Storage event types for type safety
export interface AuthStorageEvent {
  type: 'tokens_updated' | 'tokens_cleared' | 'user_updated' | 'user_cleared' | 'auth_cleared';
  data: any;
  timestamp: number;
}

// Utility hooks for React components
export function useAuthStorage() {
  return authStorage;
}

// Security constants
export const SECURITY_CONFIG = {
  // Token refresh buffer (refresh 5 minutes before expiry)
  TOKEN_REFRESH_BUFFER_MINUTES: 5,
  
  // Maximum session duration (8 hours)
  MAX_SESSION_DURATION_MS: 8 * 60 * 60 * 1000,
  
  // OAuth state length
  OAUTH_STATE_LENGTH: 32,
  
  // PKCE code verifier length
  PKCE_VERIFIER_LENGTH: 43,
  
  // Session warning threshold (15 minutes)
  SESSION_WARNING_THRESHOLD_MS: 15 * 60 * 1000,
} as const;