/**
 * Auth Modal Manager - React Island Component
 * Handles the AuthModal integration in MainLayout
 * Listens for window events to open the modal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthModal } from '../auth/AuthModal.tsx';
import { AuthProvider } from '../../contexts/AuthContext.tsx';

const AuthModalComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Listen for the custom event from MainLayout
  useEffect(() => {
    // Ensure we're in the browser
    if (typeof window === 'undefined') return;
    
    const handleOpenAuthModal = (event: Event) => {
      console.log('🔴 AuthModal: Received openAuthModal event', event);
      setIsOpen(true);
    };
    
    const handleTestModal = () => {
      console.log('🧪 AuthModal: Test event received');
      setIsOpen(true);
    };
    
    try {
      window.addEventListener('openAuthModal', handleOpenAuthModal);
      window.addEventListener('testAuthModal', handleTestModal);
      console.log('🟢 AuthModal: Event listeners added successfully, current isOpen:', isOpen);
    } catch (error) {
      console.error('❌ AuthModal: Failed to add event listeners:', error);
    }
    
    return () => {
      try {
        window.removeEventListener('openAuthModal', handleOpenAuthModal);
        window.removeEventListener('testAuthModal', handleTestModal);
        console.log('🧹 AuthModal: Event listeners cleaned up');
      } catch (error) {
        console.error('❌ AuthModal: Failed to remove event listeners:', error);
      }
    };
  }, []); // Remove isOpen dependency to avoid re-registering listeners
  
  const handleClose = useCallback(() => {
    console.log('🔴 AuthModal: Closing modal');
    setIsOpen(false);
  }, []);
  
  const handleSuccess = useCallback(() => {
    console.log('✅ Authentication successful!');
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('authSuccess'));
  }, []);
  
  // Debug state changes
  useEffect(() => {
    console.log('🔄 AuthModal state changed, isOpen:', isOpen);
  }, [isOpen]);
  
  return (
    <div>
      {console.log('🎯 AuthModalComponent rendering, isOpen:', isOpen)}
      <AuthModal
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        initialMode="login"
      />
    </div>
  );
};

// Wrap with error boundary for SSR safety
const SafeAuthModalComponent: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => {
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    console.error('AuthModal failed to load');
    return null;
  }
  
  return <AuthModalComponent />;
};

export const AuthModalManager: React.FC = () => {
  // Only render on the client to avoid SSR issues
  if (typeof window === 'undefined') {
    return null;
  }
  
  return (
    <AuthProvider>
      <SafeAuthModalComponent />
    </AuthProvider>
  );
};

export default AuthModalManager;