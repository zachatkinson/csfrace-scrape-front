/**
 * Modern SSO + Passkeys-Only Registration Component
 * Implements password-free account creation using OAuth and WebAuthn
 * Following modern authentication best practices for enhanced security and UX
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';
import { useOAuth, useWebAuthn, useBasicAuth } from '../../contexts/AuthContext.tsx';
import { OAuthProviderList } from './oauth';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className = '',
}) => {
  // SOLID: Interface Segregation - Use focused auth hooks
  const { error: basicError, clearError, isLoading: basicLoading } = useBasicAuth();
  const { 
    oauthProviders, 
    loginWithOAuth, 
    isLoading: oauthLoading, 
    error: oauthError 
  } = useOAuth();
  const { 
    webauthnSupported, 
    registerPasskey, 
    isLoading: webauthnLoading, 
    error: webauthnError 
  } = useWebAuthn();
  
  // State for UI feedback
  const [currentAuthMethod, setCurrentAuthMethod] = useState<'none' | 'oauth' | 'webauthn'>('none');
  
  // Combined error state
  const error = basicError || oauthError || webauthnError;
  const isLoading = basicLoading || oauthLoading || webauthnLoading;

  // Available OAuth providers: google, github, microsoft, facebook, apple
  // const availableProviders = oauthProviders.filter(provider => 
  //   ['google', 'github', 'microsoft', 'facebook', 'apple'].includes(provider.name.toLowerCase())
  // );

  // Handle OAuth registration (same as login for OAuth)
  const handleOAuthRegister = useCallback(async (providerName: string) => {
    setCurrentAuthMethod('oauth');
    clearError();
    
    try {
      await loginWithOAuth(providerName);
      onSuccess?.();
    } catch (error) {
      console.error(`OAuth registration failed for ${providerName}:`, error);
      setCurrentAuthMethod('none');
    }
  }, [loginWithOAuth, onSuccess, clearError]);

  // Handle Passkey registration
  const handlePasskeyRegister = useCallback(async () => {
    setCurrentAuthMethod('webauthn');
    clearError();
    
    try {
      await registerPasskey();
      onSuccess?.();
    } catch (error) {
      console.error('Passkey registration failed:', error);
      setCurrentAuthMethod('none');
    }
  }, [registerPasskey, onSuccess, clearError]);

  // Clear any errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
      <LiquidCard
        title="Join CSFrace"
        subtitle="Create your account securely without passwords"
        className="w-full"
      >
        <div className="space-y-6">
          {/* Global Error Display */}
          {error && (
            <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Registration Failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Passkey Registration (Primary) */}
          {webauthnSupported && (
            <div>
              <LiquidButton
                variant="primary"
                size="lg"
                fullWidth
                loading={currentAuthMethod === 'webauthn' && isLoading}
                disabled={isLoading}
                onClick={handlePasskeyRegister}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              >
                {currentAuthMethod === 'webauthn' && isLoading ? 'Registering...' : 'Create Account with Passkey'}
              </LiquidButton>
              
              <div className="text-center mt-2">
                <p className="text-xs text-white/60">
                  Use your fingerprint, face, or security key to create account
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
              <span className="px-2 bg-black/50 text-white/60">Or sign up with</span>
            </div>
          </div>

          {/* OAuth Providers */}
          <OAuthProviderList
            providers={undefined} // Use all enabled providers from registry
            mode="register"
            loading={currentAuthMethod === 'oauth' && isLoading}
            disabled={isLoading}
            onProviderClick={handleOAuthRegister}
          />

          {/* Terms and Privacy Info */}
          <div className="liquid-glass rounded-glass p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-white">Account Creation Terms</span>
            </div>
            <div className="text-xs text-white/70 space-y-1">
              <div>• By creating an account, you agree to our Terms of Service</div>
              <div>• Your data is protected by our Privacy Policy</div>
              <div>• Account creation is instant and secure</div>
              <div>• No passwords to manage or remember</div>
            </div>
          </div>

          {/* Switch to Login */}
          {onSwitchToLogin && (
            <div className="text-center pt-2">
              <p className="text-white/60 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </LiquidCard>
    </div>
  );
};

export default RegisterForm;