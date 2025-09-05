/**
 * Authentication Modal Component
 * Unified modal for login, registration, and password reset
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LoginForm } from './LoginForm.tsx';
import { RegisterForm } from './RegisterForm.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot-password';
  onSuccess?: () => void;
  className?: string;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  className = '',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { isAuthenticated } = useAuth();

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onSuccess?.();
      onClose();
    }
  }, [isAuthenticated, onSuccess, onClose]);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
    onClose();
  }, [onSuccess, onClose]);

  const handleSwitchToRegister = useCallback(() => {
    setMode('register');
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    setMode('login');
  }, []);

  const handleForgotPassword = useCallback(() => {
    setMode('forgot-password');
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`.trim()}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" />

      {/* Modal Container */}
      <div className="relative w-full max-w-md mx-auto animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 -right-2 z-10 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="relative">
          {mode === 'login' && (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={handleSwitchToRegister}
              onForgotPassword={handleForgotPassword}
            />
          )}

          {mode === 'register' && (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}

          {mode === 'forgot-password' && (
            <ForgotPasswordForm
              onSuccess={() => setMode('login')}
              onBack={handleSwitchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Forgot Password Form Component
interface ForgotPasswordFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onBack,
}) => {
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = useCallback((email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    clearError();

    try {
      await requestPasswordReset({ email });
      setIsSubmitted(true);
      
      // Show success and redirect to login after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  }, [email, validateEmail, clearError, requestPasswordReset, onSuccess]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (emailError) {
      setEmailError('');
    }
    
    if (error) {
      clearError();
    }
  }, [emailError, error, clearError]);

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="liquid-glass rounded-glass p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
          <p className="text-white/60 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <button
            onClick={onBack}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="liquid-glass rounded-glass p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Reset Password</h3>
          <p className="text-white/60">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Error Display */}
          {error && (
            <div className="p-4 rounded-glass bg-red-500/20 border border-red-500/30 text-red-100 text-sm">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Request Failed</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 bg-black/20 border rounded-glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 transition-all ${
                  emailError
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-white/30 focus:border-blue-500/50 focus:ring-blue-500/50'
                }`}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
            {emailError && (
              <p className="text-red-400 text-sm">{emailError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className={`w-full py-3 px-4 rounded-glass font-medium transition-all ${
              isLoading || !email
                ? 'bg-gray-500/20 text-white/50 cursor-not-allowed'
                : 'bg-blue-600/80 hover:bg-blue-600 text-white shadow-glass hover:shadow-glass-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 text-sm"
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// CSS animations for the modal
const modalStyles = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scale-up {
    from { 
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  
  .animate-scale-up {
    animation: scale-up 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalStyles;
  document.head.appendChild(styleElement);
}