/**
 * OAuth Provider List Component
 * Single Responsibility: Manages the complete list of OAuth provider buttons
 * Open/Closed: Extensible for new providers through registry pattern
 * Interface Segregation: Clean separation of concerns for provider rendering
 */

import React, { useMemo } from 'react';
import type { IOAuthProviderListProps } from '../../../types/oauth';
import { OAuthButton } from './OAuthButton';
import { useOAuthProviders } from './OAuthProviderRegistry';

/**
 * OAuth Provider List Component
 * Renders all enabled OAuth provider buttons with consistent styling
 * 
 * Features:
 * - Automatic provider filtering based on registry
 * - Consistent spacing and layout
 * - Performance optimized with memoization
 * - Accessibility compliant with proper ARIA labels
 */
export const OAuthProviderList: React.FC<IOAuthProviderListProps> = React.memo(({
  providers: providedProviders,
  mode,
  loading,
  disabled,
  onProviderClick,
  className = '',
}) => {
  const { getEnabledProviders } = useOAuthProviders();

  /**
   * Determine which providers to display
   * Uses provided providers or falls back to enabled providers from registry
   */
  const displayProviders = useMemo(() => {
    return providedProviders && providedProviders.length > 0 
      ? providedProviders 
      : getEnabledProviders();
  }, [providedProviders, getEnabledProviders]);

  /**
   * Generate accessibility label for the provider list
   */
  const ariaLabel = useMemo(() => {
    const action = mode === 'login' ? 'sign in' : 'sign up';
    return `Choose a service to ${action} with`;
  }, [mode]);

  /**
   * Early return if no providers available
   * Prevents rendering empty container
   */
  if (!displayProviders || displayProviders.length === 0) {
    return null;
  }

  return (
    <div 
      className={`oauth-provider-list space-y-3 ${className}`.trim()}
      role="list"
      aria-label={ariaLabel}
      data-testid="oauth-provider-list"
      data-mode={mode}
      data-provider-count={displayProviders.length}
    >
      {displayProviders.map((provider) => (
        <div
          key={provider.id}
          role="listitem"
          className="oauth-provider-list__item"
        >
          <OAuthButton
            provider={provider}
            mode={mode}
            loading={loading}
            disabled={disabled}
            onClick={onProviderClick}
          />
        </div>
      ))}
    </div>
  );
});

// Display name for React DevTools
OAuthProviderList.displayName = 'OAuthProviderList';