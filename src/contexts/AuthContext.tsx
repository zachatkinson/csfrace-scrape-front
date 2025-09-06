/**
 * Authentication Context
 * Provides global authentication state and actions using React Context
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  useRef 
} from 'react';

import { authAPI, isWebAuthnSupported, generateOAuthState } from '../lib/auth-api.ts';
import { authStorage, SECURITY_CONFIG } from '../lib/auth-storage.ts';

import type {
  AuthState,
  AuthContextValue,
  AuthAction,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  PasswordResetRequest,
  PasswordResetConfirm,
  UserProfile,
} from '../types/auth.ts';

import { AuthEventType } from '../types/auth.ts';

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
  oauthProviders: [],
  webauthnSupported: false,
  userCredentials: [],
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INIT':
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        webauthnSupported: isWebAuthnSupported(),
      };

    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? state.error : null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        error: null,
        userCredentials: [],
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'AUTH_UPDATE_TOKENS':
      return {
        ...state,
        tokens: action.payload,
      };

    case 'AUTH_SET_OAUTH_PROVIDERS':
      return {
        ...state,
        oauthProviders: action.payload,
      };

    case 'AUTH_SET_WEBAUTHN_CREDENTIALS':
      return {
        ...state,
        userCredentials: action.payload,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextValue | null>(null);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimeoutRef = useRef<number | undefined>(undefined);
  const storageCleanupRef = useRef<(() => void) | null>(null);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for OAuth callback in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const isOAuthCallback = urlParams.get('oauth_callback');
        
        if (isOAuthCallback) {
          const provider = urlParams.get('provider');
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          
          if (provider && code && state) {
            try {
              await handleOAuthCallback(code, state, provider);
              // Clean up URL parameters
              window.history.replaceState({}, '', window.location.pathname);
            } catch (error) {
              console.error('OAuth callback handling failed:', error);
            }
          }
        }

        const stored = authStorage.getAuthState();
        
        if (stored.isAuthenticated && stored.user && stored.tokens) {
          // Set API token
          authAPI.setAuthToken(stored.tokens.access_token);
          
          // Dispatch success action
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: stored.user,
              tokens: stored.tokens,
            },
          });

          // Load OAuth providers and WebAuthn credentials
          await Promise.all([
            loadOAuthProviders(),
            loadWebAuthnCredentials(),
          ]);

          // Set up token refresh if needed
          if (authStorage.shouldRefreshToken()) {
            await refreshToken();
          } else {
            setupTokenRefresh(stored.tokens.expires_at);
          }
        } else {
          // Load OAuth providers even when not authenticated for login UI
          await loadOAuthProviders();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        await logout();
      } finally {
        dispatch({ type: 'AUTH_INIT' });
      }
    };

    initializeAuth();

    // Set up storage change listener for cross-tab sync
    storageCleanupRef.current = authStorage.onStorageChange((event) => {
      handleStorageChange(event);
    });

    // Set up OAuth message listener for popup-based flow
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'oauth_callback') {
        try {
          await handleOAuthCallback(event.data.code, event.data.state, event.data.provider);
        } catch (error) {
          console.error('OAuth popup callback failed:', error);
          dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'OAuth authentication failed' });
        }
      } else if (event.data?.type === 'oauth_error') {
        dispatch({ type: 'AUTH_ERROR', payload: event.data.error || 'OAuth authentication failed' });
      }
    };

    window.addEventListener('message', handleOAuthMessage);

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (storageCleanupRef.current) {
        storageCleanupRef.current();
      }
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  // Handle storage changes from other tabs
  const handleStorageChange = useCallback((event: { type: string; data: any }) => {
    switch (event.type) {
      case 'auth_cleared':
      case 'tokens_cleared':
        dispatch({ type: 'AUTH_LOGOUT' });
        authAPI.clearAuthToken();
        break;
      case 'user_updated':
        if (event.data) {
          dispatch({ type: 'AUTH_UPDATE_USER', payload: event.data });
        }
        break;
      case 'tokens_updated':
        if (event.data) {
          dispatch({ type: 'AUTH_UPDATE_TOKENS', payload: event.data });
          authAPI.setAuthToken(event.data.access_token);
          setupTokenRefresh(event.data.expires_at);
        }
        break;
    }
  }, []);

  // Setup automatic token refresh
  const setupTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const refreshTime = expiresAt - SECURITY_CONFIG.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000;
    const delay = Math.max(0, refreshTime - Date.now());

    if (delay > 0) {
      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Automatic token refresh failed:', error);
          await logout();
        }
      }, delay);
    }
  }, []);

  // Load OAuth providers
  const loadOAuthProviders = useCallback(async () => {
    try {
      const providers = await authAPI.getOAuthProviders();
      dispatch({ type: 'AUTH_SET_OAUTH_PROVIDERS', payload: providers });
    } catch (error) {
      console.error('Failed to load OAuth providers:', error);
    }
  }, []);

  // Load WebAuthn credentials
  const loadWebAuthnCredentials = useCallback(async () => {
    if (!state.webauthnSupported || !state.isAuthenticated) return;

    try {
      const credentials = await authAPI.getPasskeySummary();
      dispatch({ type: 'AUTH_SET_WEBAUTHN_CREDENTIALS', payload: credentials });
    } catch (error) {
      console.error('Failed to load WebAuthn credentials:', error);
    }
  }, [state.webauthnSupported, state.isAuthenticated]);

  // Event dispatching for external listeners
  const dispatchAuthEvent = useCallback((type: AuthEventType, payload: any) => {
    const event = new CustomEvent('auth_event', {
      detail: { type, payload, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }, []);

  // Authentication actions
  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      const response = await authAPI.login(credentials);
      
      const tokens: AuthTokens = {
        access_token: response.access_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
        expires_at: Date.now() + (response.expires_in * 1000),
        ...(response.refresh_token != null && { refresh_token: response.refresh_token }),
      };

      // Store authentication data
      authStorage.setTokens(tokens);
      authStorage.setUser(response.user);
      authAPI.setAuthToken(tokens.access_token);

      // Update state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, tokens },
      });

      // Load additional data
      await Promise.all([
        loadOAuthProviders(),
        loadWebAuthnCredentials(),
      ]);

      // Setup token refresh
      setupTokenRefresh(tokens.expires_at);

      // Dispatch login event
      dispatchAuthEvent(AuthEventType.LOGIN, { user: response.user });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, [loadOAuthProviders, loadWebAuthnCredentials, setupTokenRefresh]);

  const register = useCallback(async (data: RegisterData) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      await authAPI.register(data);
      
      dispatch({ type: 'AUTH_LOADING', payload: false });
      
      // Auto-login after successful registration
      await login({ 
        email: data.email, 
        password: data.password 
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      // Clear timeouts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      // Clear storage
      authStorage.clearAllAuthData();
      authAPI.clearAuthToken();

      // Update state
      dispatch({ type: 'AUTH_LOGOUT' });

      // Dispatch logout event
      dispatchAuthEvent(AuthEventType.LOGOUT, null);

    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      await logout();
      return;
    }

    try {
      const response = await authAPI.refreshToken(refreshToken);
      
      const tokens: AuthTokens = {
        access_token: response.access_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
        refresh_token: response.refresh_token || refreshToken,
        expires_at: Date.now() + (response.expires_in * 1000),
      };

      // Update storage and API client
      authStorage.setTokens(tokens);
      authAPI.setAuthToken(tokens.access_token);

      // Update state
      dispatch({ type: 'AUTH_UPDATE_TOKENS', payload: tokens });

      // Setup next refresh
      setupTokenRefresh(tokens.expires_at);

      // Dispatch token refresh event
      dispatchAuthEvent(AuthEventType.TOKEN_REFRESH, { tokens });

    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  }, [logout, setupTokenRefresh]);

  // Password management
  const changePassword = useCallback(async (data: PasswordChangeData) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      await authAPI.changePassword(data);
      dispatch({ type: 'AUTH_LOADING', payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password change failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const requestPasswordReset = useCallback(async (data: PasswordResetRequest) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      await authAPI.requestPasswordReset(data);
      dispatch({ type: 'AUTH_LOADING', payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset request failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const confirmPasswordReset = useCallback(async (data: PasswordResetConfirm) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      await authAPI.confirmPasswordReset(data);
      dispatch({ type: 'AUTH_LOADING', payload: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  // OAuth authentication
  const loginWithOAuth = useCallback(async (provider: string, redirectUri?: string) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      const request = {
        provider: provider,
        ...(redirectUri != null && { redirect_uri: redirectUri })
      };
      const response = await authAPI.initiateOAuthLogin(request);
      
      // Store state for security validation
      const state = generateOAuthState();
      authStorage.setOAuthState(state, provider);
      
      // Redirect to OAuth provider
      window.location.href = response.authorization_url;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth login failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string, provider: string) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      // Validate state parameter
      const storedState = authStorage.getOAuthState();
      if (!storedState || storedState.state !== state || storedState.provider !== provider) {
        throw new Error('Invalid OAuth state parameter');
      }
      
      // Clear stored state
      authStorage.clearOAuthState();
      
      // Handle OAuth callback
      const response = await authAPI.handleOAuthCallback(provider, code, state);
      
      const tokens: AuthTokens = {
        access_token: response.access_token,
        token_type: response.token_type,
        expires_in: response.expires_in,
        expires_at: Date.now() + (response.expires_in * 1000),
        ...(response.refresh_token != null && { refresh_token: response.refresh_token }),
      };

      // Store authentication data
      authStorage.setTokens(tokens);
      authStorage.setUser(response.user);
      authAPI.setAuthToken(tokens.access_token);

      // Update state
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, tokens },
      });

      // Load additional data
      await Promise.all([
        loadOAuthProviders(),
        loadWebAuthnCredentials(),
      ]);

      // Setup token refresh
      setupTokenRefresh(tokens.expires_at);

      // Dispatch login event
      dispatchAuthEvent(AuthEventType.LOGIN, { user: response.user, provider });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth callback failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, [loadOAuthProviders, loadWebAuthnCredentials, setupTokenRefresh, dispatchAuthEvent]);

  // WebAuthn authentication (placeholder for next phase)
  const registerPasskey = useCallback(async (_name?: string) => {
    // Will implement in WebAuthn phase
    throw new Error('Passkey registration not yet implemented');
  }, []);

  const authenticateWithPasskey = useCallback(async () => {
    // Will implement in WebAuthn phase
    throw new Error('Passkey authentication not yet implemented');
  }, []);

  const deletePasskey = useCallback(async (_credentialId: string) => {
    // Will implement in WebAuthn phase
    throw new Error('Passkey deletion not yet implemented');
  }, []);

  const refreshPasskeys = useCallback(async () => {
    await loadWebAuthnCredentials();
  }, [loadWebAuthnCredentials]);

  // User management
  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    
    try {
      const updatedUser = await authAPI.updateProfile(profile);
      
      authStorage.setUser(updatedUser);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
      
      // Dispatch user update event
      dispatchAuthEvent(AuthEventType.USER_UPDATED, { user: updatedUser });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const user = await authAPI.getCurrentUser();
      authStorage.setUser(user);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [state.isAuthenticated]);

  // Utilities
  const clearError = useCallback(() => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!state.isAuthenticated) return false;
    
    const isValid = authStorage.isTokenValid();
    if (!isValid) {
      await logout();
      return false;
    }

    return true;
  }, [state.isAuthenticated, logout]);


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