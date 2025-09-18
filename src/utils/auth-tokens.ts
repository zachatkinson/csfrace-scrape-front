/**
 * Authentication Token Utilities
 * SOLID: Single Responsibility - Token management utilities only
 * Handles JWT token parsing, validation, expiry calculations, and refresh logic
 * 
 * SECURITY: Uses enterprise-grade secure token storage
 * - Access tokens: Memory-only (cleared on tab close)
 * - Refresh tokens: HttpOnly cookies (XSS-safe)
 * - Session data: Encrypted localStorage
 */

import {
  secureTokenStorage,
  TokenType,
  TokenMigrationService
} from './secure-token-storage';
import { createContextLogger } from './logger';

const logger = createContextLogger('AuthTokens');

// =============================================================================
// TOKEN INTERFACES
// =============================================================================

export interface TokenPayload {
  sub: string; // Subject (user ID)
  email?: string;
  username?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  jti?: string; // JWT ID
  token_type?: 'access' | 'refresh';
  scopes?: string[];
}

export interface TokenInfo {
  payload: TokenPayload;
  isValid: boolean;
  isExpired: boolean;
  expiresAt: Date;
  expiresIn: number; // Seconds until expiration
  timeUntilExpiry: string; // Human-readable time
}

export interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

// =============================================================================
// TOKEN PARSING UTILITIES
// =============================================================================

/**
 * Parse JWT token without verification (client-side only)
 * SECURITY NOTE: This is for UI purposes only - server must verify tokens
 */
export function parseJWT(token: string): TokenPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (base64url)
    const payload = parts[1];
    if (!payload) {
      return null;
    }
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decoded) as TokenPayload;
  } catch (error) {
    logger.warn('Failed to parse JWT token', { error });
    return null;
  }
}

/**
 * Get comprehensive token information
 */
export function getTokenInfo(token: string): TokenInfo | null {
  const payload = parseJWT(token);
  if (!payload) {
    return null;
  }

  const now = Date.now() / 1000; // Current timestamp in seconds
  const isExpired = payload.exp <= now;
  const expiresAt = new Date(payload.exp * 1000);
  const expiresIn = Math.max(0, payload.exp - now);
  
  return {
    payload,
    isValid: !isExpired,
    isExpired,
    expiresAt,
    expiresIn,
    timeUntilExpiry: formatTimeUntilExpiry(expiresIn),
  };
}

// =============================================================================
// TOKEN VALIDATION
// =============================================================================

/**
 * Check if token is valid and not expired
 */
export function isTokenValid(token: string | null | undefined): boolean {
  if (!token) return false;
  
  const info = getTokenInfo(token);
  return info ? info.isValid : false;
}

/**
 * Check if token will expire within a given timeframe
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
  const info = getTokenInfo(token);
  if (!info) return true;
  
  return info.expiresIn <= thresholdSeconds;
}

/**
 * Get seconds until token expires
 */
export function getSecondsUntilExpiry(token: string): number {
  const info = getTokenInfo(token);
  return info ? info.expiresIn : 0;
}

// =============================================================================
// TOKEN STORAGE UTILITIES
// =============================================================================

/**
 * Store tokens using enterprise-grade secure storage
 * SECURITY: Access tokens in memory, refresh tokens in HttpOnly cookies
 */
export function storeTokens(accessToken: string, refreshToken?: string): void {
  try {
    // Migrate any legacy tokens first
    TokenMigrationService.migrateLegacyTokens();
    
    // Store access token in memory (cleared on tab close)
    secureTokenStorage.storeToken(TokenType.ACCESS_TOKEN, accessToken);
    
    // Store refresh token in HttpOnly cookie (XSS-safe)
    if (refreshToken) {
      secureTokenStorage.storeToken(TokenType.REFRESH_TOKEN, refreshToken);
    }
    
    // Store session metadata in encrypted storage
    const info = getTokenInfo(accessToken);
    if (info) {
      const sessionData = {
        expiresAt: info.expiresAt.toISOString(),
        issuedAt: new Date().toISOString(),
        tokenType: info.payload.token_type || 'access'
      };
      secureTokenStorage.storeToken(TokenType.SESSION_DATA, JSON.stringify(sessionData));
    }
  } catch (error) {
    logger.error('Failed to store tokens securely', { error });
    throw new Error('Token storage failed - check encryption configuration');
  }
}

/**
 * Retrieve stored access token from secure memory storage
 * SECURITY: Access tokens are never stored persistently
 */
export function getStoredAccessToken(): string | null {
  try {
    return secureTokenStorage.getToken(TokenType.ACCESS_TOKEN);
  } catch (error) {
    logger.error('Failed to retrieve access token', { error });
    return null;
  }
}

/**
 * Retrieve stored refresh token 
 * SECURITY: Refresh tokens are in HttpOnly cookies - not accessible from JavaScript
 * This function returns null by design - server manages refresh token security
 */
export function getStoredRefreshToken(): string | null {
  // HttpOnly cookies cannot be accessed from JavaScript (security feature)
  // The server will handle refresh token validation and rotation
  return null;
}

/**
 * Get session metadata from encrypted storage
 * SECURITY: Session information is encrypted and expires automatically
 */
export function getSessionData(): { expiresAt: string; issuedAt: string; tokenType: string } | null {
  try {
    const sessionDataStr = secureTokenStorage.getToken(TokenType.SESSION_DATA);
    if (!sessionDataStr) return null;
    
    return JSON.parse(sessionDataStr);
  } catch (error) {
    logger.error('Failed to retrieve session data', { error });
    return null;
  }
}

/**
 * Clear all stored tokens using secure storage
 * SECURITY: Clears memory, encrypted storage, and HttpOnly cookies
 */
export function clearStoredTokens(): void {
  try {
    // Clear all tokens from secure storage
    secureTokenStorage.clearAllTokens();
    
    // Clear any remaining legacy tokens
    TokenMigrationService.clearLegacyTokens();
  } catch (error) {
    logger.error('Failed to clear tokens', { error });
  }
}

// =============================================================================
// TIME FORMATTING UTILITIES
// =============================================================================

/**
 * Format seconds into human-readable time string
 */
export function formatTimeUntilExpiry(seconds: number): string {
  if (seconds <= 0) {
    return 'Expired';
  }
  
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  }
  
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

/**
 * Get relative expiry description
 */
export function getExpiryDescription(token: string): string {
  const info = getTokenInfo(token);
  if (!info) {
    return 'Invalid token';
  }
  
  if (info.isExpired) {
    return 'Token expired';
  }
  
  if (info.expiresIn < 300) { // Less than 5 minutes
    return `Expires in ${info.timeUntilExpiry} (refresh soon)`;
  }
  
  if (info.expiresIn < 3600) { // Less than 1 hour
    return `Expires in ${info.timeUntilExpiry}`;
  }
  
  return `Valid for ${info.timeUntilExpiry}`;
}

// =============================================================================
// REFRESH TOKEN UTILITIES
// =============================================================================

/**
 * Check if we should attempt to refresh tokens
 */
export function shouldRefreshToken(accessToken: string, refreshToken: string): boolean {
  if (!isTokenValid(refreshToken)) {
    return false; // Refresh token is expired
  }
  
  return !isTokenValid(accessToken) || isTokenExpiringSoon(accessToken, 300);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  apiUrl: string = '/api/auth/refresh'
): Promise<RefreshResult> {
  try {
    if (!isTokenValid(refreshToken)) {
      return {
        success: false,
        error: 'Refresh token is expired or invalid',
      };
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to refresh token: ${response.status} ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    
    // Store new tokens
    if (data.access_token) {
      storeTokens(data.access_token, data.refresh_token || refreshToken);
    }
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error during token refresh',
    };
  }
}

// =============================================================================
// TOKEN MONITORING
// =============================================================================

export type TokenExpiryCallback = (token: string, secondsUntilExpiry: number) => void;

/**
 * Monitor token expiry and call callback at intervals
 */
export class TokenMonitor {
  private intervalId: number | null = null;
  private readonly callbacks: TokenExpiryCallback[] = [];
  
  constructor(private token: string, private checkIntervalMs: number = 60000) {}
  
  start(): void {
    if (this.intervalId) return;
    
    this.intervalId = window.setInterval(() => {
      const secondsUntilExpiry = getSecondsUntilExpiry(this.token);
      
      this.callbacks.forEach(callback => {
        try {
          callback(this.token, secondsUntilExpiry);
        } catch (error) {
          logger.error('Error in token expiry callback', { error });
        }
      });
      
      // Stop monitoring if token is expired
      if (secondsUntilExpiry <= 0) {
        this.stop();
      }
    }, this.checkIntervalMs);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  addCallback(callback: TokenExpiryCallback): void {
    this.callbacks.push(callback);
  }
  
  removeCallback(callback: TokenExpiryCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
  
  updateToken(newToken: string): void {
    this.token = newToken;
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get current authentication status
 */
export function getAuthStatus(): {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenInfo: TokenInfo | null;
  needsRefresh: boolean;
} {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();
  const tokenInfo = accessToken ? getTokenInfo(accessToken) : null;
  
  const isAuthenticated = Boolean(accessToken && tokenInfo?.isValid);
  const needsRefresh = Boolean(
    accessToken && 
    refreshToken && 
    shouldRefreshToken(accessToken, refreshToken)
  );
  
  return {
    isAuthenticated,
    accessToken,
    refreshToken,
    tokenInfo,
    needsRefresh,
  };
}

/**
 * Auto-refresh tokens if needed
 */
export async function autoRefreshIfNeeded(apiUrl?: string): Promise<boolean> {
  const status = getAuthStatus();
  
  if (!status.needsRefresh || !status.refreshToken) {
    return status.isAuthenticated;
  }
  
  const result = await refreshAccessToken(status.refreshToken, apiUrl);
  return result.success;
}

export default {
  parseJWT,
  getTokenInfo,
  isTokenValid,
  isTokenExpiringSoon,
  getSecondsUntilExpiry,
  storeTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  clearStoredTokens,
  formatTimeUntilExpiry,
  getExpiryDescription,
  shouldRefreshToken,
  refreshAccessToken,
  TokenMonitor,
  getAuthStatus,
  autoRefreshIfNeeded,
};