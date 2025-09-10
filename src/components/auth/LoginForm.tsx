/**
 * Modern SSO + Passkeys-Only Login Form
 * Implements modern authentication without passwords - OAuth and WebAuthn only
 * Following industry best practices for security and user experience
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LiquidCard, LiquidButton } from '../liquid-glass';
import { useOAuth, useWebAuthn, useBasicAuth } from '../../contexts/AuthContext.tsx';

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  className?: string;
  // Remove onForgotPassword - no longer needed with SSO/Passkeys
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
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
    authenticateWithPasskey, 
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

  // Handle OAuth login
  const handleOAuthLogin = useCallback(async (providerName: string) => {
    setCurrentAuthMethod('oauth');
    clearError();
    
    try {
      await loginWithOAuth(providerName);
      onSuccess?.();
    } catch (error) {
      console.error(`OAuth login failed for ${providerName}:`, error);
      setCurrentAuthMethod('none');
    }
  }, [loginWithOAuth, onSuccess, clearError]);

  // Handle WebAuthn authentication
  const handlePasskeyLogin = useCallback(async () => {
    setCurrentAuthMethod('webauthn');
    clearError();
    
    try {
      await authenticateWithPasskey();
      onSuccess?.();
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      setCurrentAuthMethod('none');
    }
  }, [authenticateWithPasskey, onSuccess, clearError]);

  // Clear any errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`.trim()}>
      <LiquidCard
        title="Welcome to CSFrace"
        subtitle="Choose your preferred sign-in method - secure and password-free"
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
                  <p className="font-medium">Authentication Failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Passkey Authentication (Primary) */}
          {webauthnSupported && (
            <div>
              <LiquidButton
                variant="primary"
                size="lg"
                fullWidth
                loading={currentAuthMethod === 'webauthn' && isLoading}
                disabled={isLoading}
                onClick={handlePasskeyLogin}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              >
                {currentAuthMethod === 'webauthn' && isLoading ? 'Authenticating...' : 'Sign in with Passkey'}
              </LiquidButton>
              
              <div className="text-center mt-2">
                <p className="text-xs text-white/60">
                  Use your fingerprint, face, or security key
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
          <div className="space-y-3">
            {/* Google OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthLogin('google')}
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Connecting...' : 'Continue with Google'}
            </LiquidButton>

            {/* GitHub OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthLogin('github')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Connecting...' : 'Continue with GitHub'}
            </LiquidButton>

            {/* Microsoft OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthLogin('microsoft')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Connecting...' : 'Continue with Microsoft'}
            </LiquidButton>

            {/* Facebook OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthLogin('facebook')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Connecting...' : 'Continue with Facebook'}
            </LiquidButton>

            {/* Apple OAuth */}
            <LiquidButton
              variant="secondary"
              size="lg"
              fullWidth
              loading={currentAuthMethod === 'oauth' && isLoading}
              disabled={isLoading}
              onClick={() => handleOAuthLogin('apple')}
              leftIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C8.396 0 8.847 1.266 8.847 2.333h3.152C14.053.72 15.456 0 12.017 0zM19.5 10.167c0 5.52-3.98 7.997-6.833 7.997-2.853 0-4.5-2.477-4.5-7.997S9.814 2.17 12.667 2.17c2.853 0 6.833 2.477 6.833 7.997z"/>
                  <path d="M13.833 4c-.92 0-2.04 1.04-2.04 2s1.12 2.04 2.04 2.04 2.04-1.04 2.04-2-1.12-2-2.04-2z"/>
                </svg>
              }
            >
              {currentAuthMethod === 'oauth' && isLoading ? 'Connecting...' : 'Continue with Apple'}
            </LiquidButton>
          </div>

          {/* Benefits section */}
          <div className="liquid-glass rounded-glass p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-white">Password-free security</span>
            </div>
            <div className="text-xs text-white/70 space-y-1">
              <div>• No passwords to remember or lose</div>
              <div>• Enhanced security with biometric authentication</div>
              <div>• Quick sign-in with your existing accounts</div>
              <div>• Industry-standard OAuth 2.0 protection</div>
            </div>
          </div>

          {/* Switch to Register */}
          {onSwitchToRegister && (
            <div className="text-center pt-2">
              <p className="text-white/60 text-sm">
                New to CSFrace?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 font-medium"
                >
                  Create account
                </button>
              </p>
            </div>
          )}
        </div>
      </LiquidCard>
    </div>
  );
};