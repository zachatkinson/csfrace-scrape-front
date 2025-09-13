/**
 * Unified Authentication Form Component
 * Single flow for both login and registration with passkey-first design
 * Automatically determines if user exists and provides appropriate options
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';
import { useOAuth, useWebAuthn, useBasicAuth } from '../../contexts/AuthContext.tsx';
import { OAuthProviderList } from './oauth';

export interface UnifiedAuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

type AuthenticationState = 'initial' | 'passkey' | 'oauth' | 'post-oauth-passkey';

export const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({
  onSuccess,
  className = '',
}) => {
  // SOLID: Interface Segregation - Use focused auth hooks
  const { error: basicError, clearError, isLoading: basicLoading } = useBasicAuth();
  const { 
    loginWithOAuth, 
    isLoading: oauthLoading, 
    error: oauthError 
  } = useOAuth();
  const { 
    webauthnSupported, 
    authenticateWithPasskey,
    registerPasskey,
    isLoading: webauthnLoading, 
    error: webauthnError 
  } = useWebAuthn();
  
  // State management
  const [authState, setAuthState] = useState<AuthenticationState>('initial');
  const [showPostOAuthPasskey, setShowPostOAuthPasskey] = useState(false);
  
  // Combined error and loading states
  const error = basicError || oauthError || webauthnError;
  const isLoading = basicLoading || oauthLoading || webauthnLoading;

  // Handle passkey authentication (for existing users)
  const handlePasskeyAuth = useCallback(async () => {
    setAuthState('passkey');
    clearError();
    
    try {
      await authenticateWithPasskey();
      onSuccess?.();
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      setAuthState('initial');
    }
  }, [authenticateWithPasskey, onSuccess, clearError]);

  // Handle passkey registration (for new users or post-OAuth)
  const handlePasskeyRegister = useCallback(async () => {
    setAuthState('passkey');
    clearError();
    
    try {
      await registerPasskey();
      if (showPostOAuthPasskey) {
        // User just registered with OAuth, now adding passkey
        setShowPostOAuthPasskey(false);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Passkey registration failed:', error);
      setAuthState('initial');
    }
  }, [registerPasskey, onSuccess, clearError, showPostOAuthPasskey]);

  // Handle OAuth authentication
  const handleOAuthAuth = useCallback(async (providerName: string) => {
    setAuthState('oauth');
    clearError();
    
    try {
      await loginWithOAuth(providerName);
      
      // After successful OAuth, offer passkey registration
      if (webauthnSupported) {
        setShowPostOAuthPasskey(true);
        setAuthState('post-oauth-passkey');
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error(`OAuth authentication failed for ${providerName}:`, error);
      setAuthState('initial');
    }
  }, [loginWithOAuth, onSuccess, clearError, webauthnSupported]);

  // Handle skipping post-OAuth passkey setup
  const handleSkipPasskey = useCallback(() => {
    setShowPostOAuthPasskey(false);
    onSuccess?.();
  }, [onSuccess]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Post-OAuth passkey registration flow
  if (showPostOAuthPasskey) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
        <LiquidCard
          title="Enhance Your Security"
          subtitle="Add a passkey for faster, more secure sign-ins"
          className="w-full"
        >
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Setup Failed</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Passkey Setup Button */}
            <LiquidButton
              variant="primary"
              size="lg"
              fullWidth
              loading={authState === 'passkey' && isLoading}
              disabled={isLoading}
              onClick={handlePasskeyRegister}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            >
              {authState === 'passkey' && isLoading ? 'Setting up...' : 'Set Up Passkey'}
            </LiquidButton>

            {/* Benefits */}
            <div className="liquid-glass rounded-glass p-4 space-y-2">
              <div className="text-sm font-medium text-white mb-2">Why use a passkey?</div>
              <div className="text-xs text-white/70 space-y-1">
                <div>• Instant sign-in with biometrics</div>
                <div>• More secure than passwords</div>
                <div>• No need to remember anything</div>
                <div>• Works across all your devices</div>
              </div>
            </div>

            {/* Skip Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleSkipPasskey}
                disabled={isLoading}
                className="text-white/60 hover:text-white/80 transition-colors disabled:opacity-50 text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        </LiquidCard>
      </div>
    );
  }

  // Main authentication flow
  return (
    <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
      <LiquidCard
        title="Welcome to CSFrace"
        subtitle="Sign in securely with modern authentication"
        className="w-full"
      >
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Authentication Failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Passkey Authentication Section */}
          {webauthnSupported && (
            <div className="space-y-3">
              {/* Existing User - Use Passkey */}
              <LiquidButton
                variant="primary"
                size="lg"
                fullWidth
                loading={authState === 'passkey' && isLoading}
                disabled={isLoading}
                onClick={handlePasskeyAuth}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              >
                {authState === 'passkey' && isLoading ? 'Authenticating...' : 'Use Passkey'}
              </LiquidButton>

              {/* New User - Create Passkey */}
              <LiquidButton
                variant="secondary"
                size="lg"
                fullWidth
                loading={authState === 'passkey' && isLoading}
                disabled={isLoading}
                onClick={handlePasskeyRegister}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              >
                Create Account with Passkey
              </LiquidButton>
              
              <div className="text-center">
                <p className="text-xs text-white/60">
                  Secure authentication with your fingerprint, face, or security key
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/50 text-white/60">Or continue with</span>
            </div>
          </div>

          {/* OAuth Providers */}
          <OAuthProviderList
            providers={[]} // Use all enabled providers from registry
            mode="login" // OAuth handles both login and registration automatically
            loading={authState === 'oauth' && isLoading}
            disabled={isLoading}
            onProviderClick={handleOAuthAuth}
          />

          {/* Benefits Section */}
          <div className="liquid-glass rounded-glass p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-white">Modern Security</span>
            </div>
            <div className="text-xs text-white/70 space-y-1">
              <div>• No passwords to remember or lose</div>
              <div>• Biometric authentication for instant access</div>
              <div>• Secure OAuth 2.0 with trusted providers</div>
              <div>• Account creation and login in one flow</div>
            </div>
          </div>
        </div>
      </LiquidCard>
    </div>
  );
};