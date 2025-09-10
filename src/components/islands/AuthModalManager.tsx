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
    const handleOpenAuthModal = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
    };
  }, []);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const handleSuccess = useCallback(() => {
    console.log('Authentication successful!');
    setIsOpen(false);
    // TODO: Refresh user state/redirect as needed
    // You might want to dispatch a custom event here too
    window.dispatchEvent(new CustomEvent('authSuccess'));
  }, []);
  
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      initialMode="login"
    />
  );
};

export const AuthModalManager: React.FC = () => {
  return (
    <AuthProvider>
      <AuthModalComponent />
    </AuthProvider>
  );
};

export default AuthModalManager;