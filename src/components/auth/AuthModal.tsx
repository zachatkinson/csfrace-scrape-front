/**
 * Authentication Modal Component  
 * Unified modal for SSO + Passkeys-only authentication
 * Now supports only login and registration modes - no password reset needed
 */

import React, { useState, useCallback, useEffect } from 'react';
import { LoginForm } from './LoginForm.tsx';
import { RegisterForm } from './RegisterForm.tsx';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
  className?: string;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  className = '',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

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
      <div className="absolute inset-0 backdrop-blur-md bg-white/10 animate-fade-in" />

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
            />
          )}

          {mode === 'register' && (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}

        </div>
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