/**
 * Authenticated Header Component
 * Navigation header with authentication state and user menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { AuthModal } from '../auth/AuthModal.tsx';
import { StandardizedSettingsPanel } from '../settings/StandardizedSettingsPanel.tsx';

export interface AuthenticatedHeaderProps {
  className?: string;
}

export const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({
  className = '',
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    logout, 
    isInitialized,
    oauthProviders,
    loginWithOAuth
  } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  // Toggle settings panel (updated for React component)
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Toggle auth panel (slide up from bottom)
  const toggleAuthPanel = () => {
    const authPanel = document.getElementById('auth-panel');
    if (authPanel) {
      const isOpen = !authPanel.classList.contains('translate-y-full');
      
      if (isOpen) {
        authPanel.classList.remove('translate-y-0', 'pointer-events-auto', 'bottom-20');
        authPanel.classList.add('translate-y-full', 'pointer-events-none', '-bottom-20');
      } else {
        authPanel.classList.remove('translate-y-full', 'pointer-events-none', '-bottom-20');
        authPanel.classList.add('translate-y-0', 'pointer-events-auto', 'bottom-20');
      }
    }
    setShowAuthPanel(!showAuthPanel);
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      await loginWithOAuth(provider);
      // The OAuth flow will redirect, so we don't need to do anything else here
    } catch (error) {
      console.error('OAuth login failed:', error);
      // TODO: Show error message to user
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${className}`.trim()}>
      <nav className="bg-black/90 backdrop-blur-lg border-b border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">CSFrace Scrape</span>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-white/80 hover:text-white transition-colors">
              Converter
            </a>
            {isAuthenticated && (
              <a href="/dashboard" className="text-white/80 hover:text-white transition-colors">
                Dashboard
              </a>
            )}
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Settings Button */}
            <button 
              onClick={toggleSettings}
              className="glass-button p-2 text-white/80 hover:text-white transition-all duration-200 relative"
              aria-label="Open Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Authentication Section */}
            {!isInitialized || isLoading ? (
              // Loading state
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 animate-spin border-2 border-white/20 border-t-white rounded-full" />
              </div>
            ) : isAuthenticated && user ? (
              // Authenticated user - show user info and logout button
              <div className="flex items-center space-x-3">
                {/* User Avatar & Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.profile?.display_name?.[0] || 
                     user.profile?.first_name?.[0] || 
                     user.username?.[0] || 
                     user.email[0]}
                  </div>
                  
                  {/* User Name (desktop) */}
                  <div className="hidden md:block text-left">
                    <div className="text-white text-sm font-medium">
                      {user.profile?.display_name || 
                       `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() ||
                       user.username ||
                       user.email.split('@')[0]}
                    </div>
                  </div>
                </div>

                {/* User Actions Button */}
                <button
                  onClick={toggleAuthPanel}
                  className="glass-button p-2 text-white/80 hover:text-white transition-all duration-200"
                  aria-label="User menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            ) : (
              // Not authenticated - show auth button
              <button
                onClick={toggleAuthPanel}
                className="glass-button px-4 py-2 text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode="login"
      />

      {/* Standardized Settings Panel */}
      <StandardizedSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Auth Panel - Slides up from bottom */}
      <div 
        id="auth-panel" 
        className="fixed -bottom-20 left-0 right-0 z-40 transform translate-y-full transition-transform duration-300 ease-out pointer-events-none"
      >
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="liquid-glass rounded-glass p-6 border border-white/20">
            {isAuthenticated && user ? (
              // Authenticated user panel
              <div className="space-y-6">
                {/* User Info Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {user.profile?.display_name?.[0] || 
                       user.profile?.first_name?.[0] || 
                       user.username?.[0] || 
                       user.email[0]}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {user.profile?.display_name || 
                         `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() ||
                         user.username ||
                         user.email.split('@')[0]}
                      </div>
                      <div className="text-white/60 text-sm">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={toggleAuthPanel}
                    className="glass-button p-2 text-white/80 hover:text-white"
                    aria-label="Close user panel"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <a
                    href="/dashboard"
                    className="glass-button p-4 text-center hover:bg-white/10 transition-colors group"
                    onClick={toggleAuthPanel}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div className="text-white text-sm font-medium">Dashboard</div>
                  </a>
                  
                  <a
                    href="/jobs"
                    className="glass-button p-4 text-center hover:bg-white/10 transition-colors group"
                    onClick={toggleAuthPanel}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2 text-green-400 group-hover:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <div className="text-white text-sm font-medium">Job History</div>
                  </a>
                  
                  <a
                    href="/profile"
                    className="glass-button p-4 text-center hover:bg-white/10 transition-colors group"
                    onClick={toggleAuthPanel}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2 text-purple-400 group-hover:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="text-white text-sm font-medium">Profile</div>
                  </a>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleAuthPanel();
                    }}
                    className="glass-button p-4 text-center hover:bg-red-500/10 transition-colors group"
                  >
                    <svg className="w-6 h-6 mx-auto mb-2 text-red-400 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <div className="text-white text-sm font-medium">Sign Out</div>
                  </button>
                </div>
              </div>
            ) : (
              // Not authenticated panel
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Welcome!</h2>
                    <p className="text-white/60">Sign in to start converting your WordPress content</p>
                  </div>
                  
                  <button 
                    onClick={toggleAuthPanel}
                    className="glass-button p-2 text-white/80 hover:text-white"
                    aria-label="Close auth panel"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Auth Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      toggleAuthPanel();
                    }}
                    className="glass-button p-6 text-center hover:bg-white/10 transition-colors group"
                  >
                    <svg className="w-8 h-8 mx-auto mb-3 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <div className="text-white text-lg font-medium mb-2">Sign In</div>
                    <div className="text-white/60 text-sm">Access your existing account</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      toggleAuthPanel();
                    }}
                    className="glass-button p-6 text-center hover:bg-white/10 transition-colors group"
                  >
                    <svg className="w-8 h-8 mx-auto mb-3 text-green-400 group-hover:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <div className="text-white text-lg font-medium mb-2">Create Account</div>
                    <div className="text-white/60 text-sm">Get started with a new account</div>
                  </button>
                </div>

                {/* OAuth Providers */}
                {oauthProviders.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white/60 text-sm text-center mb-3">Or continue with:</p>
                    <div className="flex gap-2 justify-center">
                      {oauthProviders.map((provider) => (
                        <button
                          key={provider.name}
                          onClick={() => handleOAuthLogin(provider.name)}
                          className={`glass-button px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors
                            ${provider.name === 'google' ? 'text-red-300 hover:text-red-200 hover:bg-red-500/20' : ''}
                            ${provider.name === 'github' ? 'text-gray-300 hover:text-gray-200 hover:bg-gray-500/20' : ''}
                            ${provider.name === 'microsoft' ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-500/20' : ''}
                          `}
                        >
                          {/* OAuth Provider Icons */}
                          {provider.name === 'google' && (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          )}
                          {provider.name === 'github' && (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                          )}
                          {provider.name === 'microsoft' && (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M0 0h11v11H0V0zm13 0h11v11H13V0zM0 13h11v11H0V13zm13 0h11v11H13V13z"/>
                            </svg>
                          )}
                          <span className="capitalize">{provider.display_name || provider.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features Preview */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-white/60 text-sm text-center mb-3">What you&apos;ll get:</p>
                  <div className="flex flex-wrap justify-center gap-4 text-xs">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">WordPress Conversion</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full">Batch Processing</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">Job History</span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">Real-time Progress</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};