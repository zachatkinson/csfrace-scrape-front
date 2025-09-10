/**
 * Modern SSO + Passkeys-Only Registration Component
 * Implements password-free account creation using OAuth and WebAuthn
 * Following modern authentication best practices for enhanced security and UX
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';
import { useOAuth, useWebAuthn, useBasicAuth } from '../../contexts/AuthContext.tsx';

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
          <div className="space-y-3">
            {/* Google OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthRegister('google')}
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Creating Account...' : 'Sign up with Google'}
            </LiquidButton>

            {/* GitHub OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthRegister('github')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Creating Account...' : 'Sign up with GitHub'}
            </LiquidButton>

            {/* Microsoft OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthRegister('microsoft')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Creating Account...' : 'Sign up with Microsoft'}
            </LiquidButton>

            {/* Facebook OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthRegister('facebook')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Creating Account...' : 'Sign up with Facebook'}
            </LiquidButton>

            {/* Apple OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthRegister('apple')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Creating Account...' : 'Sign up with Apple'}
            </LiquidButton>
          </div>

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