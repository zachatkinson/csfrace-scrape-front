/**
 * OAuth Provider Registry
 * Registry Pattern: Centralized provider management
 * Single Responsibility: Provider registration and configuration
 * Open/Closed: Extensible for new providers without modification
 */

import type { IOAuthProvider, IOAuthProviderRegistry, OAuthProviderId } from '../../../types/oauth';
import { createProviderIcon } from './OAuthProviderIcons';

/**
 * OAuth Provider Configuration
 * Immutable provider definitions with comprehensive metadata
 */
const OAUTH_PROVIDER_DEFINITIONS: readonly IOAuthProvider[] = [
  {
    id: 'google',
    name: 'google',
    displayName: 'Google',
    icon: createProviderIcon('google'),
    brandColor: '#4285F4',
    description: 'Sign in with your Google account',
    loginText: 'Continue with Google',
    registerText: 'Sign up with Google',
    loadingText: 'Connecting to Google...',
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    icon: createProviderIcon('github'),
    brandColor: '#333333',
    description: 'Sign in with your GitHub account',
    loginText: 'Continue with GitHub',
    registerText: 'Sign up with GitHub',
    loadingText: 'Connecting to GitHub...',
  },
  {
    id: 'microsoft',
    name: 'microsoft',
    displayName: 'Microsoft',
    icon: createProviderIcon('microsoft'),
    brandColor: '#00A4EF',
    description: 'Sign in with your Microsoft account',
    loginText: 'Continue with Microsoft',
    registerText: 'Sign up with Microsoft',
    loadingText: 'Connecting to Microsoft...',
  },
  {
    id: 'facebook',
    name: 'facebook',
    displayName: 'Facebook',
    icon: createProviderIcon('facebook'),
    brandColor: '#1877F2',
    description: 'Sign in with your Facebook account',
    loginText: 'Continue with Facebook',
    registerText: 'Sign up with Facebook',
    loadingText: 'Connecting to Facebook...',
  },
  {
    id: 'apple',
    name: 'apple',
    displayName: 'Apple',
    icon: createProviderIcon('apple'),
    brandColor: '#000000',
    description: 'Sign in with your Apple ID',
    loginText: 'Continue with Apple',
    registerText: 'Sign up with Apple',
    loadingText: 'Connecting to Apple...',
  },
] as const;

/**
 * OAuth Provider Registry Implementation
 * Singleton Pattern: Single source of truth for provider configuration
 * Dependency Inversion: Provides abstraction for provider access
 */
class OAuthProviderRegistryImpl implements IOAuthProviderRegistry {
  private readonly providers: Map<OAuthProviderId, IOAuthProvider>;
  private readonly enabledProviders: Set<OAuthProviderId>;

  constructor() {
    // Initialize provider map for O(1) lookups
    this.providers = new Map();
    OAUTH_PROVIDER_DEFINITIONS.forEach(provider => {
      this.providers.set(provider.id, provider);
    });

    // Load enabled providers from environment or default to all
    this.enabledProviders = this.loadEnabledProviders();
  }

  /**
   * Load enabled providers from environment configuration
   * Supports environment-based provider enabling/disabling
   */
  private loadEnabledProviders(): Set<OAuthProviderId> {
    const enabledProvidersEnv = import.meta.env.VITE_ENABLED_OAUTH_PROVIDERS;
    
    if (enabledProvidersEnv) {
      const enabledIds = enabledProvidersEnv
        .split(',')
        .map((id: string) => id.trim() as OAuthProviderId)
        .filter(id => this.providers.has(id));
      
      return new Set(enabledIds);
    }

    // Default: All providers enabled
    return new Set(OAUTH_PROVIDER_DEFINITIONS.map(p => p.id));
  }

  /**
   * Get provider by ID
   * @param id - OAuth provider identifier
   * @returns Provider definition or undefined if not found
   */
  getProvider(id: OAuthProviderId): IOAuthProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all registered providers
   * @returns Readonly array of all provider definitions
   */
  getAllProviders(): readonly IOAuthProvider[] {
    return OAUTH_PROVIDER_DEFINITIONS;
  }

  /**
   * Get only enabled providers
   * @returns Readonly array of enabled provider definitions
   */
  getEnabledProviders(): readonly IOAuthProvider[] {
    return OAUTH_PROVIDER_DEFINITIONS.filter(provider => 
      this.enabledProviders.has(provider.id)
    );
  }

  /**
   * Check if provider is enabled
   * @param id - OAuth provider identifier
   * @returns True if provider is enabled
   */
  isProviderEnabled(id: OAuthProviderId): boolean {
    return this.enabledProviders.has(id);
  }

  /**
   * Enable provider at runtime
   * @param id - OAuth provider identifier
   */
  enableProvider(id: OAuthProviderId): void {
    if (this.providers.has(id)) {
      this.enabledProviders.add(id);
    }
  }

  /**
   * Disable provider at runtime
   * @param id - OAuth provider identifier
   */
  disableProvider(id: OAuthProviderId): void {
    this.enabledProviders.delete(id);
  }
}

/**
 * Singleton OAuth Provider Registry Instance
 * Export for application-wide provider access
 */
export const oauthProviderRegistry: IOAuthProviderRegistry = new OAuthProviderRegistryImpl();

/**
 * Convenience hook for accessing OAuth providers
 * React-friendly interface to the registry
 */
export const useOAuthProviders = () => {
  return {
    getAllProviders: () => oauthProviderRegistry.getAllProviders(),
    getEnabledProviders: () => oauthProviderRegistry.getEnabledProviders(),
    getProvider: (id: OAuthProviderId) => oauthProviderRegistry.getProvider(id),
    isProviderEnabled: (id: OAuthProviderId) => oauthProviderRegistry.isProviderEnabled(id),
  };
};