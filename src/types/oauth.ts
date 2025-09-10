/**
 * OAuth Provider Type Definitions
 * Defines the core interfaces for OAuth provider abstraction
 * Following SOLID principles with proper interface segregation
 */

import type { ReactNode } from 'react';

/**
 * OAuth Provider Identifier
 * Extensible enum pattern for type safety
 */
export type OAuthProviderId = 
  | 'google' 
  | 'github' 
  | 'microsoft' 
  | 'facebook' 
  | 'apple';

/**
 * OAuth Provider Metadata Interface
 * Single Responsibility: Defines provider presentation data
 */
export interface IOAuthProviderMetadata {
  readonly id: OAuthProviderId;
  readonly name: string;
  readonly displayName: string;
  readonly icon: ReactNode;
  readonly brandColor: string;
  readonly description: string;
}

/**
 * OAuth Provider Action Interface
 * Interface Segregation: Separates action concerns from metadata
 */
export interface IOAuthProviderAction {
  readonly loginText: string;
  readonly registerText: string;
  readonly loadingText: string;
}

/**
 * Complete OAuth Provider Definition
 * Composition pattern combining metadata and actions
 */
export interface IOAuthProvider extends IOAuthProviderMetadata, IOAuthProviderAction {}

/**
 * OAuth Button Props Interface
 * Dependency Inversion: Abstract button props for any provider
 */
export interface IOAuthButtonProps {
  readonly provider: IOAuthProvider;
  readonly mode: 'login' | 'register';
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClick: (providerId: OAuthProviderId) => void;
  readonly className?: string;
}

/**
 * OAuth Provider List Props Interface
 * Open/Closed: Extensible without modifying existing code
 */
export interface IOAuthProviderListProps {
  readonly providers: readonly IOAuthProvider[];
  readonly mode: 'login' | 'register';
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onProviderClick: (providerId: OAuthProviderId) => void;
  readonly className?: string;
}

/**
 * OAuth Provider Registry Interface
 * Single Responsibility: Provider registration and retrieval
 */
export interface IOAuthProviderRegistry {
  readonly getProvider: (id: OAuthProviderId) => IOAuthProvider | undefined;
  readonly getAllProviders: () => readonly IOAuthProvider[];
  readonly getEnabledProviders: () => readonly IOAuthProvider[];
  readonly isProviderEnabled: (id: OAuthProviderId) => boolean;
}