/**
 * OAuth Provider Button Component
 * Single Responsibility: Renders a single OAuth provider button
 * Open/Closed: Works with any provider through IOAuthProvider interface
 * Dependency Inversion: Depends on abstractions, not concrete implementations
 */

import React, { useCallback, useMemo } from 'react';
import { LiquidButton } from '../../liquid-glass';
import { IOAuthButtonProps } from '../../../types/oauth';

/**
 * OAuth Button Component
 * Renders a branded button for a specific OAuth provider
 * 
 * Features:
 * - Provider-specific branding and text
 * - Loading state management
 * - Accessibility compliant
 * - Memoized for performance
 */
export const OAuthButton: React.FC<IOAuthButtonProps> = React.memo(({
  provider,
  mode,
  loading,
  disabled,
  onClick,
  className = '',
}) => {
  /**
   * Handle button click with provider ID
   * Encapsulates the onClick handler to pass provider ID
   */
  const handleClick = useCallback(() => {
    if (!loading && !disabled) {
      onClick(provider.id);
    }
  }, [provider.id, onClick, loading, disabled]);

  /**
   * Determine button text based on mode and loading state
   * Memoized to prevent unnecessary recalculations
   */
  const buttonText = useMemo(() => {
    if (loading) {
      return provider.loadingText;
    }
    
    return mode === 'login' ? provider.loginText : provider.registerText;
  }, [loading, mode, provider.loginText, provider.registerText, provider.loadingText]);

  /**
   * Generate aria-label for accessibility
   * Provides clear description for screen readers
   */
  const ariaLabel = useMemo(() => {
    const action = mode === 'login' ? 'Sign in' : 'Sign up';
    return `${action} with ${provider.displayName}`;
  }, [mode, provider.displayName]);

  /**
   * Generate button description for screen readers
   * Additional context for accessibility
   */
  const ariaDescription = useMemo(() => {
    return `${provider.description}${loading ? ' - Loading...' : ''}`;
  }, [provider.description, loading]);

  return (
    <LiquidButton
      variant="secondary"
      size="lg"
      fullWidth
      loading={loading}
      disabled={disabled}
      onClick={handleClick}
      leftIcon={provider.icon}
      className={`oauth-button oauth-button--${provider.id} ${className}`.trim()}
      aria-label={ariaLabel}
      aria-description={ariaDescription}
      data-testid={`oauth-button-${provider.id}`}
      data-provider={provider.id}
      data-mode={mode}
    >
      {buttonText}
    </LiquidButton>
  );
});

// Display name for React DevTools
OAuthButton.displayName = 'OAuthButton';