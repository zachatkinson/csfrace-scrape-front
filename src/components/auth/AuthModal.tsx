/**
 * Unified Authentication Modal - React Component
 * Following modern Astro + React best practices
 * DRY: Reusable authentication UI component
 * SOLID: Single responsibility for authentication modal
 */

import React, { useState, useEffect } from "react";
import { createContextLogger } from "../../utils/logger";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Create logger instance for this component
const logger = createContextLogger("AuthModal");

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement OAuth login with backend
      logger.info("OAuth login initiated", { provider });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement passkey authentication
      logger.info("Passkey authentication initiated");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Passkey authentication failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="liquid-glass rounded-glass p-6 border border-white/20 relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Welcome to CSFrace</h3>
            <p className="text-white/70 text-sm mt-1">
              Sign in securely with modern authentication
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm mb-4">
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
                    strokeWidth="2"
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

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 rounded-glass flex items-center justify-center">
              <div className="flex items-center space-x-2 text-white">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Authenticating...</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Passkey Authentication Section */}
            <div className="space-y-3">
              <button
                onClick={handlePasskeyLogin}
                disabled={isLoading}
                className="glass-button w-full px-4 py-3 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-600/90 hover:to-purple-700/90 text-white font-medium rounded-lg border border-white/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m0 0V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Use Passkey</span>
              </button>

              <div className="text-center">
                <p className="text-xs text-white/60">
                  Secure authentication with your fingerprint, face, or security
                  key
                </p>
              </div>
            </div>

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
            <div className="space-y-2">
              {[
                {
                  name: "Google",
                  provider: "google",
                  bgColor: "bg-white hover:bg-gray-100",
                  textColor: "text-gray-800",
                },
                {
                  name: "GitHub",
                  provider: "github",
                  bgColor: "bg-gray-900 hover:bg-gray-800",
                  textColor: "text-white",
                },
                {
                  name: "Microsoft",
                  provider: "microsoft",
                  bgColor: "bg-blue-600 hover:bg-blue-700",
                  textColor: "text-white",
                },
              ].map(({ name, provider, bgColor, textColor }) => (
                <button
                  key={provider}
                  onClick={() => handleOAuthLogin(provider)}
                  disabled={isLoading}
                  className={`glass-button w-full px-4 py-3 ${bgColor} ${textColor} font-medium rounded-lg border transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span>Continue with {name}</span>
                </button>
              ))}
            </div>

            {/* Benefits Section */}
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
                  Modern Security
                </span>
              </div>
              <div className="text-xs text-white/70 space-y-1">
                <div>• No passwords to remember or lose</div>
                <div>• Biometric authentication for instant access</div>
                <div>• Secure OAuth 2.0 with trusted providers</div>
                <div>• Account creation and login in one flow</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
