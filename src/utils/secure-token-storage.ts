/**
 * Secure Token Storage System
 * Implements enterprise-grade security for authentication tokens
 * Following SOLID principles with proper abstraction and security isolation
 * 
 * Security Architecture:
 * - Access tokens: In-memory only (lost on tab close for security)
 * - Refresh tokens: HttpOnly cookies (server-managed, XSS-safe)
 * - Session data: Encrypted localStorage with expiration
 * - No plain text storage of sensitive authentication data
 */

import { SecureStorage, EncryptionKeyError } from './security';

/**
 * Token Storage Strategy Enum
 * Single Responsibility: Defines available storage strategies
 */
export enum TokenStorageStrategy {
  MEMORY = 'memory',
  ENCRYPTED_STORAGE = 'encrypted_storage',
  HTTP_ONLY_COOKIE = 'http_only_cookie'
}

/**
 * Token Type Classification
 * Interface Segregation: Different token types have different security requirements
 */
export enum TokenType {
  ACCESS_TOKEN = 'access_token',
  REFRESH_TOKEN = 'refresh_token',
  ID_TOKEN = 'id_token',
  SESSION_DATA = 'session_data'
}

/**
 * Token Storage Configuration Interface
 * Open/Closed: Extensible for new token types without modifying existing code
 */
export interface ITokenStorageConfig {
  readonly strategy: TokenStorageStrategy;
  readonly expirationMinutes?: number;
  readonly encrypted: boolean;
  readonly httpOnly: boolean;
}

/**
 * Token Storage Error Classes
 * Single Responsibility: Each error type handles specific failure scenarios
 */
export class TokenStorageError extends Error {
  constructor(message: string, public readonly tokenType: TokenType) {
    super(message);
    this.name = 'TokenStorageError';
  }
}

export class SecureStorageUnavailableError extends TokenStorageError {
  constructor(tokenType: TokenType) {
    super(`Secure storage unavailable for ${tokenType}`, tokenType);
    this.name = 'SecureStorageUnavailableError';
  }
}

/**
 * Token Storage Configuration Registry
 * Dependency Inversion: High-level modules depend on abstractions
 */
const TOKEN_STORAGE_CONFIG: Record<TokenType, ITokenStorageConfig> = {
  [TokenType.ACCESS_TOKEN]: {
    strategy: TokenStorageStrategy.MEMORY,
    expirationMinutes: 15, // Short-lived for security
    encrypted: false, // Not stored persistently
    httpOnly: false
  },
  [TokenType.REFRESH_TOKEN]: {
    strategy: TokenStorageStrategy.HTTP_ONLY_COOKIE,
    expirationMinutes: 10080, // 7 days
    encrypted: true,
    httpOnly: true // XSS protection
  },
  [TokenType.ID_TOKEN]: {
    strategy: TokenStorageStrategy.ENCRYPTED_STORAGE,
    expirationMinutes: 60,
    encrypted: true,
    httpOnly: false
  },
  [TokenType.SESSION_DATA]: {
    strategy: TokenStorageStrategy.ENCRYPTED_STORAGE,
    expirationMinutes: 480, // 8 hours
    encrypted: true,
    httpOnly: false
  }
} as const;

/**
 * In-Memory Token Storage
 * Single Responsibility: Manages tokens that should not persist
 */
class MemoryTokenStorage {
  private static readonly tokens = new Map<string, {
    value: string;
    expiresAt: number;
  }>();

  public static setToken(key: string, value: string, expirationMinutes: number): void {
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    this.tokens.set(key, { value, expiresAt });
  }

  public static getToken(key: string): string | null {
    const token = this.tokens.get(key);
    if (!token) return null;

    if (Date.now() > token.expiresAt) {
      this.tokens.delete(key);
      return null;
    }

    return token.value;
  }

  public static removeToken(key: string): void {
    this.tokens.delete(key);
  }

  public static clearAll(): void {
    this.tokens.clear();
  }
}

/**
 * HttpOnly Cookie Token Storage Interface
 * Interface Segregation: Separate concerns for cookie management
 */
export interface IHttpOnlyCookieManager {
  setSecureCookie(name: string, value: string, options: {
    maxAge: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  }): void;
  
  clearCookie(name: string): void;
}

/**
 * Secure Token Storage Manager
 * Single Responsibility: Orchestrates secure token storage across different strategies
 * Dependency Inversion: Depends on storage abstractions, not concrete implementations
 */
export class SecureTokenStorageManager {
  private cookieManager?: IHttpOnlyCookieManager;

  constructor(cookieManager?: IHttpOnlyCookieManager) {
    if (cookieManager !== undefined) {
      this.cookieManager = cookieManager;
    }
  }

  /**
   * Store token using appropriate security strategy
   * Open/Closed: New token types can be added without modifying this method
   */
  public storeToken(tokenType: TokenType, value: string): void {
    const config = TOKEN_STORAGE_CONFIG[tokenType];
    const key = this.getStorageKey(tokenType);

    try {
      switch (config.strategy) {
        case TokenStorageStrategy.MEMORY:
          MemoryTokenStorage.setToken(key, value, config.expirationMinutes || 15);
          break;

        case TokenStorageStrategy.ENCRYPTED_STORAGE:
          const storageOptions: { encrypt: boolean; expirationMinutes?: number } = {
            encrypt: config.encrypted
          };
          if (config.expirationMinutes !== undefined) {
            storageOptions.expirationMinutes = config.expirationMinutes;
          }
          SecureStorage.setItem(key, value, storageOptions);
          break;

        case TokenStorageStrategy.HTTP_ONLY_COOKIE:
          if (!this.cookieManager) {
            throw new SecureStorageUnavailableError(tokenType);
          }
          
          this.cookieManager.setSecureCookie(key, value, {
            maxAge: (config.expirationMinutes || 10080) * 60, // Convert to seconds
            httpOnly: true,
            secure: true, // HTTPS only
            sameSite: 'strict' // CSRF protection
          });
          break;

        default:
          throw new TokenStorageError(`Unsupported storage strategy: ${config.strategy}`, tokenType);
      }
    } catch (error) {
      if (error instanceof EncryptionKeyError) {
        throw new TokenStorageError(
          `Failed to store ${tokenType}: ${error.message}`, 
          tokenType
        );
      }
      throw error;
    }
  }

  /**
   * Retrieve token using appropriate security strategy
   * Liskov Substitution: All token types can be retrieved through same interface
   */
  public getToken(tokenType: TokenType): string | null {
    const config = TOKEN_STORAGE_CONFIG[tokenType];
    const key = this.getStorageKey(tokenType);

    try {
      switch (config.strategy) {
        case TokenStorageStrategy.MEMORY:
          return MemoryTokenStorage.getToken(key);

        case TokenStorageStrategy.ENCRYPTED_STORAGE:
          return SecureStorage.getItem(key);

        case TokenStorageStrategy.HTTP_ONLY_COOKIE:
          // HttpOnly cookies cannot be accessed from JavaScript - this is intentional
          // The server must include these in secure headers
          return null;

        default:
          throw new TokenStorageError(`Unsupported storage strategy: ${config.strategy}`, tokenType);
      }
    } catch (error) {
      if (error instanceof EncryptionKeyError) {
        throw new TokenStorageError(
          `Failed to retrieve ${tokenType}: ${error.message}`, 
          tokenType
        );
      }
      return null;
    }
  }

  /**
   * Remove token from storage
   * Single Responsibility: Handles secure token removal
   */
  public removeToken(tokenType: TokenType): void {
    const config = TOKEN_STORAGE_CONFIG[tokenType];
    const key = this.getStorageKey(tokenType);

    switch (config.strategy) {
      case TokenStorageStrategy.MEMORY:
        MemoryTokenStorage.removeToken(key);
        break;

      case TokenStorageStrategy.ENCRYPTED_STORAGE:
        SecureStorage.removeItem(key);
        break;

      case TokenStorageStrategy.HTTP_ONLY_COOKIE:
        if (this.cookieManager) {
          this.cookieManager.clearCookie(key);
        }
        break;
    }
  }

  /**
   * Clear all stored tokens (logout)
   * Single Responsibility: Handles complete session cleanup
   */
  public clearAllTokens(): void {
    // Clear memory storage
    MemoryTokenStorage.clearAll();

    // Clear encrypted storage for all token types
    Object.values(TokenType).forEach(tokenType => {
      const config = TOKEN_STORAGE_CONFIG[tokenType];
      if (config.strategy === TokenStorageStrategy.ENCRYPTED_STORAGE) {
        this.removeToken(tokenType);
      }
    });

    // Clear HTTP-only cookies
    if (this.cookieManager) {
      Object.values(TokenType).forEach(tokenType => {
        const config = TOKEN_STORAGE_CONFIG[tokenType];
        if (config.strategy === TokenStorageStrategy.HTTP_ONLY_COOKIE) {
          this.removeToken(tokenType);
        }
      });
    }
  }

  /**
   * Check if token is expired
   * Single Responsibility: Handles token expiration logic
   */
  public isTokenExpired(tokenType: TokenType): boolean {
    // For memory storage, expiration is handled internally
    // For encrypted storage, expiration is handled by SecureStorage
    // For HTTP-only cookies, expiration is handled by the browser
    
    const token = this.getToken(tokenType);
    return token === null;
  }

  /**
   * Get storage configuration for token type
   * Open/Closed: Extensible for new token types
   */
  public getTokenConfig(tokenType: TokenType): ITokenStorageConfig {
    return TOKEN_STORAGE_CONFIG[tokenType];
  }

  /**
   * Generate storage key for token type
   * Single Responsibility: Handles key generation logic
   */
  private getStorageKey(tokenType: TokenType): string {
    return `csfrace_${tokenType}`;
  }
}

/**
 * Default Secure Token Storage Instance
 * Singleton Pattern: Single point of access for token storage
 */
export const secureTokenStorage = new SecureTokenStorageManager();

/**
 * Legacy Auth Token Migration Utilities
 * Single Responsibility: Handles migration from insecure localStorage
 */
export class TokenMigrationService {
  private static readonly LEGACY_KEYS = [
    'csfrace_access_token',
    'csfrace_refresh_token',
    'csfrace_token_expiry',
    'csfrace-access-token',
    'csfrace-refresh-token'
  ];

  /**
   * Migrate tokens from insecure localStorage to secure storage
   * Single Responsibility: Handles migration logic
   */
  public static migrateLegacyTokens(): void {
    try {
      // Attempt to read legacy access token
      const legacyAccessToken = localStorage.getItem('csfrace_access_token') || 
                               localStorage.getItem('csfrace-access-token');
      
      if (legacyAccessToken) {
        secureTokenStorage.storeToken(TokenType.ACCESS_TOKEN, legacyAccessToken);
      }

      // Attempt to read legacy refresh token  
      const legacyRefreshToken = localStorage.getItem('csfrace_refresh_token') ||
                                localStorage.getItem('csfrace-refresh-token');
      
      if (legacyRefreshToken) {
        secureTokenStorage.storeToken(TokenType.REFRESH_TOKEN, legacyRefreshToken);
      }

      // Clear all legacy tokens
      this.clearLegacyTokens();
      
    } catch (error) {
      console.warn('Token migration failed:', error);
      // Continue execution - don't break the app
    }
  }

  /**
   * Clear legacy tokens from localStorage
   * Single Responsibility: Handles legacy token cleanup
   */
  public static clearLegacyTokens(): void {
    this.LEGACY_KEYS.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove legacy token ${key}:`, error);
      }
    });
  }
}