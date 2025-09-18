/**
 * Modern SSO + Passkeys-Only Login Form
 * Implements modern authentication without passwords - OAuth and WebAuthn only
 * Following industry best practices for security and user experience
 */

import React, { useState, useCallback, useEffect } from "react";
import { LiquidCard, LiquidButton } from "../liquid-glass";
import {
  useOAuth,
  useWebAuthn,
  useBasicAuth,
} from "../../contexts/AuthContext.tsx";
import { OAuthProviderList } from "./oauth";

export interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  className?: string;
  // Remove onForgotPassword - no longer needed with SSO/Passkeys
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  className = "",
}) => {
  // SOLID: Interface Segregation - Use focused auth hooks
  const {
    error: basicError,
    clearError,
    isLoading: basicLoading,
  } = useBasicAuth();
  const {
    loginWithOAuth,
    isLoading: oauthLoading,
    error: oauthError,
  } = useOAuth();
  const {
    webauthnSupported,
    authenticateWithPasskey,
    isLoading: webauthnLoading,
    error: webauthnError,
  } = useWebAuthn();

  // State for UI feedback
  const [currentAuthMethod, setCurrentAuthMethod] = useState<
    "none" | "oauth" | "webauthn"
  >("none");

  // Combined error state
  const error = basicError || oauthError || webauthnError;
  const isLoading = basicLoading || oauthLoading || webauthnLoading;

  // Available OAuth providers: google, github, microsoft, facebook, apple
  // const availableProviders = oauthProviders.filter(provider =>
  //   ['google', 'github', 'microsoft', 'facebook', 'apple'].includes(provider.name.toLowerCase())
  // );

  // Handle OAuth login
  const handleOAuthLogin = useCallback(
    async (providerName: string) => {
      setCurrentAuthMethod("oauth");
      clearError();

      try {
        await loginWithOAuth(providerName);
        onSuccess?.();
      } catch (error) {
        console.error(`OAuth login failed for ${providerName}:`, error);
        setCurrentAuthMethod("none");
      }
    },
    [loginWithOAuth, onSuccess, clearError],
  );

  // Handle WebAuthn authentication
  const handlePasskeyLogin = useCallback(async () => {
    setCurrentAuthMethod("webauthn");
    clearError();

    try {
      await authenticateWithPasskey();
      onSuccess?.();
    } catch (error) {
      console.error("Passkey authentication failed:", error);
      setCurrentAuthMethod("none");
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
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
                loading={currentAuthMethod === "webauthn" && isLoading}
                disabled={isLoading}
                onClick={handlePasskeyLogin}
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                }
              >
                {currentAuthMethod === "webauthn" && isLoading
                  ? "Authenticating..."
                  : "Sign in with Passkey"}
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
              <span className="px-2 bg-black/50 text-white/60">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Providers */}
          <OAuthProviderList
            providers={[]} // Use all enabled providers from registry
            mode="login"
            loading={currentAuthMethod === "oauth" && isLoading}
            disabled={isLoading}
            onProviderClick={handleOAuthLogin}
          />

          {/* Benefits section */}
          <div className="liquid-glass rounded-glass p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-white">
                Password-free security
              </span>
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
                New to CSFrace?{" "}
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
