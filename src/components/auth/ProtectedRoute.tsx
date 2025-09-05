/**
 * Protected Route Component
 * Restricts access to authenticated users only
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { AuthModal } from './AuthModal.tsx';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireRoles?: string[];
  requirePermissions?: string[];
  className?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo,
  requireRoles = [],
  requirePermissions = [],
  className = '',
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user 
  } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Wait for auth to initialize
  if (!isInitialized || isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`.trim()}>
        <div className="liquid-glass rounded-glass p-8 text-center max-w-md mx-auto">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Authenticating...</h3>
          <p className="text-white/60 text-sm">
            Please wait while we verify your session
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // If custom fallback provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // If redirect URL provided, redirect
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo;
      return null;
    }

    // Default: show auth modal or login prompt
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${className}`.trim()}>
        <div className="text-center max-w-md mx-auto">
          <div className="liquid-glass rounded-glass p-8 mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-white/60 mb-6">
              You need to be signed in to access this page.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-3 px-6 bg-blue-600/80 hover:bg-blue-600 text-white font-medium rounded-glass transition-all shadow-glass hover:shadow-glass-lg"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="login"
          onSuccess={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  // Check role requirements
  if (requireRoles.length > 0) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requireRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${className}`.trim()}>
          <div className="liquid-glass rounded-glass p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-white/60 mb-4">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-white/40 text-sm">
              Required roles: {requireRoles.join(', ')}
            </p>
          </div>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requirePermissions.length > 0) {
    const userPermissions = user.permissions || [];
    const hasRequiredPermission = requirePermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${className}`.trim()}>
          <div className="liquid-glass rounded-glass p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Insufficient Permissions</h3>
            <p className="text-white/60 mb-4">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-white/40 text-sm">
              Required permissions: {requirePermissions.join(', ')}
            </p>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

// Hook for checking if a route should be protected
export function useRouteProtection(
  requireRoles: string[] = [],
  requirePermissions: string[] = []
): {
  isAuthorized: boolean;
  isLoading: boolean;
  user: any;
  missingRoles: string[];
  missingPermissions: string[];
} {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading || !isAuthenticated || !user) {
    return {
      isAuthorized: false,
      isLoading,
      user: null,
      missingRoles: requireRoles,
      missingPermissions: requirePermissions,
    };
  }

  const userRoles = user.roles || [];
  const userPermissions = user.permissions || [];

  const missingRoles = requireRoles.filter(role => !userRoles.includes(role));
  const missingPermissions = requirePermissions.filter(permission => 
    !userPermissions.includes(permission)
  );

  const isAuthorized = missingRoles.length === 0 && missingPermissions.length === 0;

  return {
    isAuthorized,
    isLoading: false,
    user,
    missingRoles,
    missingPermissions,
  };
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireRoles?: string[];
    requirePermissions?: string[];
    fallback?: React.ComponentType;
    redirectTo?: string;
  } = {}
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ProtectedRoute
        requireRoles={options.requireRoles}
        requirePermissions={options.requirePermissions}
        fallback={options.fallback ? <options.fallback /> : undefined}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}