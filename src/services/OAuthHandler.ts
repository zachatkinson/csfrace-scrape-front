/**
 * OAuth Handler Service
 * Single Responsibility: Handle OAuth authentication flows
 * Extracted from AuthContext to follow SOLID principles
 */

import { authAPI, generateOAuthState } from '../lib/auth-api.ts';
import { authStorage } from '../lib/auth-storage.ts';
import { TIMING_CONSTANTS } from '../constants/timing.ts';
import type { AuthTokens, UserProfile } from '../types/auth.ts';

export interface OAuthProvider {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface OAuthResult {
  success: boolean;
  tokens?: AuthTokens;
  user?: UserProfile;
  error?: string;
}

export interface OAuthHandlerEvents {
  onOAuthStart: (provider: string) => void;
  onOAuthSuccess: (result: { tokens: AuthTokens; user: UserProfile; provider: string }) => void;
  onOAuthError: (error: string, provider?: string) => void;
  onOAuthCancel: (provider: string) => void;
}

/**
 * OAuth Handler - Manages OAuth authentication flows
 */
export class OAuthHandler {
  private activeStates = new Map<string, { provider: string; timestamp: number }>();
  private popups = new Map<string, Window>();
  private events: Partial<OAuthHandlerEvents> = {};

  constructor(events: Partial<OAuthHandlerEvents> = {}) {
    this.events = events;
    this.setupMessageListener();
    this.startStateCleanup();
  }

  /**
   * Get available OAuth providers
   */
  async getAvailableProviders(): Promise<OAuthProvider[]> {
    try {
      const response = await authAPI.getOAuthProviders();
      if (response.success && response.providers) {
        return response.providers.map(provider => ({
          id: provider.name,
          name: this.formatProviderName(provider.name),
          icon: this.getProviderIcon(provider.name),
          color: this.getProviderColor(provider.name),
        }));
      }
    } catch (error) {
      console.error('Failed to get OAuth providers:', error);
    }
    
    return [];
  }

  /**
   * Start OAuth flow for a provider
   */
  async startOAuthFlow(provider: string, popup = true): Promise<void> {
    try {
      this.events.onOAuthStart?.(provider);
      
      // Generate and store state for security
      const state = generateOAuthState();
      this.activeStates.set(state, {
        provider,
        timestamp: Date.now(),
      });

      // Get OAuth URL from backend
      const response = await authAPI.getOAuthURL(provider, state);
      if (!response.success || !response.url) {
        throw new Error(response.error || 'Failed to get OAuth URL');
      }

      if (popup) {
        this.openOAuthPopup(provider, response.url, state);
      } else {
        // Full page redirect
        window.location.href = response.url;
      }
    } catch (error) {
      console.error(`OAuth ${provider} error:`, error);
      this.events.onOAuthError?.(error instanceof Error ? error.message : 'OAuth failed', provider);
    }
  }

  /**
   * Handle OAuth callback (from URL parameters)
   */
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
    error?: string
  ): Promise<OAuthResult> {
    try {
      // Validate state
      if (!this.validateState(state, provider)) {
        return {
          success: false,
          error: 'Invalid OAuth state. This may be a security issue.',
        };
      }

      // Clear the used state
      this.activeStates.delete(state);

      if (error) {
        this.events.onOAuthError?.(error, provider);
        return {
          success: false,
          error: `OAuth error: ${error}`,
        };
      }

      if (!code) {
        this.events.onOAuthError?.('No authorization code received', provider);
        return {
          success: false,
          error: 'No authorization code received',
        };
      }

      // Exchange code for tokens
      console.log(`Processing OAuth ${provider} callback...`);
      const response = await authAPI.handleOAuthCallback(provider, code, state);

      if (response.success && response.tokens && response.user) {
        this.events.onOAuthSuccess?.({
          tokens: response.tokens,
          user: response.user,
          provider,
        });
        
        return {
          success: true,
          tokens: response.tokens,
          user: response.user,
        };
      } else {
        const errorMsg = response.error || 'OAuth authentication failed';
        this.events.onOAuthError?.(errorMsg, provider);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'OAuth callback failed';
      console.error(`OAuth ${provider} callback error:`, error);
      this.events.onOAuthError?.(errorMsg, provider);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Cancel OAuth flow
   */
  cancelOAuthFlow(provider: string): void {
    const popup = this.popups.get(provider);
    if (popup && !popup.closed) {
      popup.close();
    }
    this.popups.delete(provider);
    this.events.onOAuthCancel?.(provider);
  }

  /**
   * Check if OAuth flow is in progress
   */
  isOAuthInProgress(provider?: string): boolean {
    if (provider) {
      return this.popups.has(provider);
    }
    return this.popups.size > 0;
  }

  /**
   * Get active OAuth providers (in progress)
   */
  getActiveOAuthProviders(): string[] {
    return Array.from(this.popups.keys());
  }

  /**
   * Open OAuth popup window
   */
  private openOAuthPopup(provider: string, url: string, state: string): void {
    const popup = window.open(
      url,
      `oauth_${provider}`,
      'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes'
    );

    if (!popup) {
      this.events.onOAuthError?.('Failed to open popup window. Please allow popups and try again.', provider);
      return;
    }

    this.popups.set(provider, popup);

    // Monitor popup for closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        this.popups.delete(provider);
        
        // Check if OAuth was successful (state still exists means it wasn't completed)
        if (this.activeStates.has(state)) {
          this.activeStates.delete(state);
          this.events.onOAuthCancel?.(provider);
        }
      }
    }, 1000);

    // Close popup after timeout
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkClosed);
        this.popups.delete(provider);
        if (this.activeStates.has(state)) {
          this.activeStates.delete(state);
          this.events.onOAuthError?.('OAuth timeout. Please try again.', provider);
        }
      }
    }, TIMING_CONSTANTS.AUTH.OAUTH_CALLBACK_TIMEOUT);
  }

  /**
   * Setup message listener for popup communication
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === 'oauth_callback') {
        const { provider, code, state, error } = event.data;
        this.handleOAuthCallback(provider, code, state, error);
        
        // Close popup
        this.cancelOAuthFlow(provider);
      }
    });
  }

  /**
   * Validate OAuth state parameter
   */
  private validateState(state: string, provider: string): boolean {
    const storedState = this.activeStates.get(state);
    if (!storedState) {
      console.error('OAuth state not found');
      return false;
    }

    if (storedState.provider !== provider) {
      console.error('OAuth provider mismatch');
      return false;
    }

    // Check if state is too old
    const age = Date.now() - storedState.timestamp;
    if (age > TIMING_CONSTANTS.AUTH.OAUTH_STATE_EXPIRY) {
      console.error('OAuth state expired');
      this.activeStates.delete(state);
      return false;
    }

    return true;
  }

  /**
   * Format provider name for display
   */
  private formatProviderName(provider: string): string {
    const nameMap: Record<string, string> = {
      google: 'Google',
      github: 'GitHub',
      discord: 'Discord',
      facebook: 'Facebook',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      microsoft: 'Microsoft',
    };
    
    return nameMap[provider.toLowerCase()] || provider;
  }

  /**
   * Get provider icon class or URL
   */
  private getProviderIcon(provider: string): string {
    const iconMap: Record<string, string> = {
      google: 'fab fa-google',
      github: 'fab fa-github',
      discord: 'fab fa-discord',
      facebook: 'fab fa-facebook',
      twitter: 'fab fa-twitter',
      linkedin: 'fab fa-linkedin',
      microsoft: 'fab fa-microsoft',
    };
    
    return iconMap[provider.toLowerCase()] || 'fas fa-user';
  }

  /**
   * Get provider brand color
   */
  private getProviderColor(provider: string): string {
    const colorMap: Record<string, string> = {
      google: '#ea4335',
      github: '#333333',
      discord: '#5865f2',
      facebook: '#1877f2',
      twitter: '#1da1f2',
      linkedin: '#0a66c2',
      microsoft: '#00a1f1',
    };
    
    return colorMap[provider.toLowerCase()] || '#6b7280';
  }

  /**
   * Clean up expired states periodically
   */
  private startStateCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredStates: string[] = [];

      this.activeStates.forEach((state, key) => {
        if (now - state.timestamp > TIMING_CONSTANTS.AUTH.OAUTH_STATE_EXPIRY) {
          expiredStates.push(key);
        }
      });

      expiredStates.forEach(key => {
        this.activeStates.delete(key);
      });

      if (expiredStates.length > 0) {
        console.log(`Cleaned up ${expiredStates.length} expired OAuth states`);
      }
    }, TIMING_CONSTANTS.CACHE.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Get OAuth state info for debugging
   */
  getOAuthInfo(): {
    activeStates: number;
    activePopups: string[];
    inProgress: boolean;
  } {
    return {
      activeStates: this.activeStates.size,
      activePopups: Array.from(this.popups.keys()),
      inProgress: this.isOAuthInProgress(),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Close all popups
    this.popups.forEach((popup, provider) => {
      if (!popup.closed) {
        popup.close();
      }
    });
    this.popups.clear();
    
    // Clear states
    this.activeStates.clear();
  }
}

export default OAuthHandler;