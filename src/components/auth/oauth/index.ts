/**
 * OAuth Components Barrel Export
 * Single entry point for all OAuth-related components and utilities
 * Promotes clean imports and better module organization
 */

// Core Components
export { OAuthButton } from './OAuthButton';
export { OAuthProviderList } from './OAuthProviderList';

// Provider System
export { oauthProviderRegistry, useOAuthProviders } from './OAuthProviderRegistry';

// Icon Components
export {
  GoogleIcon,
  GitHubIcon,
  MicrosoftIcon,
  FacebookIcon,
  AppleIcon,
  createProviderIcon,
} from './OAuthProviderIcons';

// Type Definitions (re-export from types)
export type {
  OAuthProviderId,
  IOAuthProvider,
  IOAuthProviderMetadata,
  IOAuthProviderAction,
  IOAuthButtonProps,
  IOAuthProviderListProps,
  IOAuthProviderRegistry,
} from '../../../types/oauth';