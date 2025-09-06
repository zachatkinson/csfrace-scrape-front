/**
 * Authentication Context
 * Simplified Context using Service-Oriented Architecture
 * Replaces the monolithic 704-line God Component with focused services
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback 
} from 'react';

import { AuthProvider as AuthProviderService, type AuthProviderEvents, type AuthState } from '../services/AuthProvider.ts';
import { isWebAuthnSupported } from '../lib/auth-api.ts';

import type {
  AuthContextValue,
  BasicAuthContext,
  PasswordAuthContext,
  OAuthContext,
  WebAuthnContext,
  UserProfileContext,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  PasswordResetRequest,
  PasswordResetConfirm,
  UserProfile,
} from '../types/auth.ts';

import { AuthEventType } from '../types/auth.ts';

// Enhanced auth state for React Context (includes legacy fields for compatibility)
interface ReactAuthState extends AuthState {
  isInitialized: boolean;
  oauthProviders: Array<{ name: string; displayName: string }>;
  webauthnSupported: boolean;
  userCredentials: Array<{ id: string; name: string }>;
}

// Initial state with enhanced fields for compatibility
const initialReactState: ReactAuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
  oauthProviders: [],
  webauthnSupported: false,
  userCredentials: [],
};

// Create context
const AuthContext = createContext<AuthContextValue | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth provider component - Now uses service composition instead of monolithic implementation
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<ReactAuthState>(initialReactState);
  const [authService, setAuthService] = useState<AuthProviderService | null>(null);

  // Initialize auth service and set up event handlers
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Create auth service with event handlers
        const service = new AuthProviderService(createAuthProviderEvents());
        setAuthService(service);
        
        // Initialize state from service
        const authState = service.getAuthState();
        setState({
          ...authState,
          isInitialized: true,
          webauthnSupported: isWebAuthnSupported(),
          oauthProviders: [],
          userCredentials: [],
        });

        // Load OAuth providers
        try {
          const providers = await service.getAvailableOAuthProviders();
          setState(prev => ({
            ...prev,
            oauthProviders: providers.map(p => ({ name: p.id, displayName: p.name })),
          }));
        } catch (error) {
          console.error('Failed to load OAuth providers:', error);
        }

        // Handle OAuth callback if present in URL
        const urlParams = new URLSearchParams(window.location.search);
        const isOAuthCallback = urlParams.get('oauth_callback');
        
        if (isOAuthCallback) {
          const provider = urlParams.get('provider');
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          const error = urlParams.get('error');
          
          if (provider && code && state) {
            try {
              await service.handleOAuthCallback(provider, code, state, error);
              // Clean up URL parameters
              window.history.replaceState({}, '', window.location.pathname);
            } catch (callbackError) {
              console.error('OAuth callback handling failed:', callbackError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: error instanceof Error ? error.message : 'Authentication initialization failed',
        }));
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      if (authService) {
        authService.destroy();
      }
    };
  }, []);

  // Create auth provider event handlers
  const createAuthProviderEvents = useCallback((): Partial<AuthProviderEvents> => {
    return {
      onAuthStateChanged: (authState) => {
        setState(prev => ({
          ...authState,
          isInitialized: prev.isInitialized,
          oauthProviders: prev.oauthProviders,
          webauthnSupported: prev.webauthnSupported,
          userCredentials: prev.userCredentials,
        }));
      },
      onLoginSuccess: (user) => {
        // Dispatch custom event for external listeners
        dispatchAuthEvent(AuthEventType.LOGIN, { user });
      },
      onLoginError: (error) => {
        console.error('Login error:', error);
      },
      onLogoutComplete: () => {
        // Dispatch custom event for external listeners
        dispatchAuthEvent(AuthEventType.LOGOUT, null);
      },
      onTokenRefreshFailed: () => {
        console.error('Token refresh failed');
      },
      onOAuthStart: (provider) => {
        console.log(`Starting OAuth flow for ${provider}`);
      },
      onOAuthSuccess: (provider, user) => {
        dispatchAuthEvent(AuthEventType.LOGIN, { user, provider });
      },
      onOAuthError: (provider, error) => {
        console.error(`OAuth ${provider} error:`, error);
      },
    };
  }, []);

  // Event dispatching for external listeners (maintains compatibility)
  const dispatchAuthEvent = useCallback((type: AuthEventType, payload: any) => {
    const event = new CustomEvent('auth_event', {
      detail: { type, payload, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }, []);

  // Service-oriented action wrappers
  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.login(credentials);
  }, [authService]);

  const register = useCallback(async (data: RegisterData) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.register(data);
  }, [authService]);

  const logout = useCallback(async () => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.logout();
  }, [authService]);

  const refreshToken = useCallback(async () => {
    if (!authService) throw new Error('Auth service not initialized');
    // This will be handled automatically by TokenManager
    return Promise.resolve();
  }, [authService]);

  // Password management - service-oriented wrappers
  const changePassword = useCallback(async (data: PasswordChangeData) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.changePassword(data);
  }, [authService]);

  const requestPasswordReset = useCallback(async (data: PasswordResetRequest) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.requestPasswordReset(data);
  }, [authService]);

  const confirmPasswordReset = useCallback(async (data: PasswordResetConfirm) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.confirmPasswordReset(data);
  }, [authService]);

  // OAuth authentication - service-oriented wrappers
  const loginWithOAuth = useCallback(async (provider: string, redirectUri?: string) => {
    if (!authService) throw new Error('Auth service not initialized');
    // For backward compatibility, we support redirectUri but use popup by default
    return authService.startOAuthFlow(provider, !redirectUri);
  }, [authService]);

  const handleOAuthCallback = useCallback(async (code: string, state: string, provider: string) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.handleOAuthCallback(provider, code, state);
  }, [authService]);

  // WebAuthn authentication (placeholders maintained for compatibility)
  const registerPasskey = useCallback(async (_name?: string) => {
    throw new Error('Passkey registration not yet implemented');
  }, []);

  const authenticateWithPasskey = useCallback(async () => {
    throw new Error('Passkey authentication not yet implemented');
  }, []);

  const deletePasskey = useCallback(async (_credentialId: string) => {
    throw new Error('Passkey deletion not yet implemented');
  }, []);

  const refreshPasskeys = useCallback(async () => {
    // Load WebAuthn credentials when implemented
    setState(prev => ({ ...prev, userCredentials: [] }));
  }, []);

  // User management - service-oriented wrappers
  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.updateProfile(profile);
  }, [authService]);

  const refreshUser = useCallback(async () => {
    if (!authService) throw new Error('Auth service not initialized');
    return authService.refreshProfile();
  }, [authService]);

  // Utilities - service-oriented wrappers
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!authService) return false;
    return authService.isAuthenticated();
  }, [authService]);


  // Context value
  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    loginWithOAuth,
    handleOAuthCallback,
    registerPasskey,
    authenticateWithPasskey,
    deletePasskey,
    refreshPasskeys,
    updateProfile,
    refreshUser,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for auth status checking
export function useAuthStatus() {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isInitialized,
    isLoggedIn: isAuthenticated && !!user,
    isReady: isInitialized && !isLoading,
  };
}

// Hook for auth errors
export function useAuthError() {
  const { error, clearError } = useAuth();
  
  useEffect(() => {
    return () => {
      if (error) clearError();
    };
  }, [error, clearError]);

  return { error, clearError };
}

// SOLID: Interface Segregation Principle - Focused Authentication Hooks
// Components should only depend on the authentication features they actually need!

/**
 * Basic Authentication Hook
 * For components that only need login/logout functionality
 * Perfect for: Login forms, logout buttons, auth guards
 */
export function useBasicAuth(): BasicAuthContext {
  const context = useAuth();
  
  // Return only the basic auth interface - no OAuth, WebAuthn, etc.
  return {
    user: context.user,
    tokens: context.tokens,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    isInitialized: context.isInitialized,
    error: context.error,
    login: context.login,
    register: context.register,
    logout: context.logout,
    refreshToken: context.refreshToken,
    clearError: context.clearError,
    checkAuthStatus: context.checkAuthStatus,
  };
}

/**
 * Password Management Hook
 * For components that handle password operations
 * Perfect for: Password change forms, reset password flows
 */
export function usePasswordAuth(): PasswordAuthContext {
  const context = useAuth();
  
  return {
    isLoading: context.isLoading,
    error: context.error,
    changePassword: context.changePassword,
    requestPasswordReset: context.requestPasswordReset,
    confirmPasswordReset: context.confirmPasswordReset,
    clearError: context.clearError,
  };
}

/**
 * OAuth Authentication Hook
 * For components that handle OAuth flows
 * Perfect for: OAuth login buttons, provider selection
 */
export function useOAuth(): OAuthContext {
  const context = useAuth();
  
  return {
    oauthProviders: context.oauthProviders,
    isLoading: context.isLoading,
    error: context.error,
    loginWithOAuth: context.loginWithOAuth,
    handleOAuthCallback: context.handleOAuthCallback,
    clearError: context.clearError,
  };
}

/**
 * WebAuthn/Passkey Authentication Hook
 * For components that handle passkey authentication
 * Perfect for: Passkey registration, biometric auth
 */
export function useWebAuthn(): WebAuthnContext {
  const context = useAuth();
  
  return {
    webauthnSupported: context.webauthnSupported,
    userCredentials: context.userCredentials,
    isLoading: context.isLoading,
    error: context.error,
    registerPasskey: context.registerPasskey,
    authenticateWithPasskey: context.authenticateWithPasskey,
    deletePasskey: context.deletePasskey,
    refreshPasskeys: context.refreshPasskeys,
    clearError: context.clearError,
  };
}

/**
 * User Profile Management Hook
 * For components that manage user profiles
 * Perfect for: Profile forms, user settings, account management
 */
export function useUserProfile(): UserProfileContext {
  const context = useAuth();
  
  return {
    user: context.user,
    isLoading: context.isLoading,
    error: context.error,
    updateProfile: context.updateProfile,
    refreshUser: context.refreshUser,
    clearError: context.clearError,
  };
}

/**
 * Enhanced focused auth hook with multiple concerns
 * Use this when a component genuinely needs multiple auth features
 * Example: A comprehensive account settings page that handles everything
 * 
 * @param features - Array of auth features needed by the component
 * @returns Focused context with only requested features
 */
export function useFocusedAuth<T extends Array<'basic' | 'password' | 'oauth' | 'webauthn' | 'profile'>>(
  features: T
): Pick<AuthContextValue, 
  T extends readonly ('basic')[] ? keyof BasicAuthContext :
  T extends readonly ('password')[] ? keyof PasswordAuthContext :
  T extends readonly ('oauth')[] ? keyof OAuthContext :
  T extends readonly ('webauthn')[] ? keyof WebAuthnContext :
  T extends readonly ('profile')[] ? keyof UserProfileContext :
  keyof AuthContextValue
> {
  const context = useAuth();
  const result: any = {};
  
  for (const feature of features) {
    switch (feature) {
      case 'basic':
        Object.assign(result, {
          user: context.user,
          tokens: context.tokens,
          isAuthenticated: context.isAuthenticated,
          isLoading: context.isLoading,
          isInitialized: context.isInitialized,
          error: context.error,
          login: context.login,
          register: context.register,
          logout: context.logout,
          refreshToken: context.refreshToken,
          clearError: context.clearError,
          checkAuthStatus: context.checkAuthStatus,
        });
        break;
      case 'password':
        Object.assign(result, {
          changePassword: context.changePassword,
          requestPasswordReset: context.requestPasswordReset,
          confirmPasswordReset: context.confirmPasswordReset,
        });
        break;
      case 'oauth':
        Object.assign(result, {
          oauthProviders: context.oauthProviders,
          loginWithOAuth: context.loginWithOAuth,
          handleOAuthCallback: context.handleOAuthCallback,
        });
        break;
      case 'webauthn':
        Object.assign(result, {
          webauthnSupported: context.webauthnSupported,
          userCredentials: context.userCredentials,
          registerPasskey: context.registerPasskey,
          authenticateWithPasskey: context.authenticateWithPasskey,
          deletePasskey: context.deletePasskey,
          refreshPasskeys: context.refreshPasskeys,
        });
        break;
      case 'profile':
        Object.assign(result, {
          updateProfile: context.updateProfile,
          refreshUser: context.refreshUser,
        });
        break;
    }
  }
  
  // Ensure common utilities are always available
  if (!result.isLoading) result.isLoading = context.isLoading;
  if (!result.error) result.error = context.error;
  if (!result.clearError) result.clearError = context.clearError;
  
  return result;
}

/**
 * Migration Helper Hook
 * @deprecated Use focused hooks instead: useBasicAuth, useOAuth, etc.
 * This hook helps identify which focused hook(s) a component should use.
 */
export function useLegacyAuth(): AuthContextValue & {
  _migrationHint: {
    suggestedHook: string;
    reason: string;
  };
} {
  const context = useAuth();
  
  return {
    ...context,
    _migrationHint: {
      suggestedHook: 'useBasicAuth, useOAuth, usePasswordAuth, useWebAuthn, or useUserProfile',
      reason: 'Use focused hooks to follow Interface Segregation Principle',
    },
  };
}