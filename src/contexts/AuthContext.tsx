/**
 * Authentication Context - Docker Backend Only
 * Simple context that calls Docker backend directly
 * Following CLAUDE.md: NO LOCAL SERVICES RULE
 * DRY/SOLID: Uses centralized API configuration
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { getApiBaseUrl } from '../constants/api.ts';
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData
} from '../types/auth.ts';

// DRY/SOLID: Use centralized API base URL
const getApiBase = () => getApiBaseUrl();

// Simple auth state
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  oauthProviders: string[];
  webauthnSupported: boolean;
}

// Context interface
interface AuthContextValue extends AuthState {
  // Basic auth
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // OAuth
  loginWithOAuth: (provider: string) => Promise<void>;
  
  // WebAuthn/Passkeys
  registerPasskey: () => Promise<void>;
  authenticateWithPasskey: () => Promise<void>;
  
  // Utils
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
  oauthProviders: [],
  webauthnSupported: typeof window !== 'undefined' && 'credentials' in navigator,
};

// Create context
const AuthContext = createContext<AuthContextValue | null>(null);

// Simple API helpers - direct fetch calls to Docker backend
// DRY/SOLID: Use centralized API base URL
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API request failed: ${response.status}`);
  }

  return response.json();
};

// Token storage helpers
const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'auth_user';

const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

const getStoredTokens = (): AuthTokens | null => {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveUser = (user: UserProfile) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const getStoredUser = (): UserProfile | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const clearStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load from localStorage
        const storedTokens = getStoredTokens();
        const storedUser = getStoredUser();

        if (storedTokens && storedUser) {
          // Verify token is still valid by calling /auth/me
          try {
            const currentUser = await apiRequest('/auth/me', {
              headers: {
                'Authorization': `Bearer ${storedTokens.access_token}`,
              },
            });
            
            setState(prev => ({
              ...prev,
              user: currentUser,
              tokens: storedTokens,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            }));
          } catch {
            // Token invalid, clear storage
            clearStorage();
            setState(prev => ({
              ...prev,
              isLoading: false,
              isInitialized: true,
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isInitialized: true,
          }));
        }

        // Load OAuth providers from Docker backend
        try {
          const providers = await apiRequest('/auth/oauth/providers');
          setState(prev => ({ ...prev, oauthProviders: providers }));
        } catch (error) {
          console.error('Failed to load OAuth providers:', error);
        }

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Auth initialization failed',
          isLoading: false,
          isInitialized: true,
        }));
      }
    };

    initializeAuth();
  }, []);

  // Login with email/password
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Create FormData for OAuth2 token endpoint
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      const tokens = await fetch(`${getApiBase()}/auth/token`, {
        method: 'POST',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || 'Login failed');
        }
        return res.json();
      });
      
      // Get user profile
      const user = await apiRequest('/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      
      saveTokens(tokens);
      saveUser(user);
      
      setState(prev => ({
        ...prev,
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Register new user
  const register = useCallback(async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Auto-login after registration
      await login({ username: data.email, password: data.password });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Registration failed',
        isLoading: false,
      }));
      throw error;
    }
  }, [login]);

  // Logout user
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (state.tokens) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.tokens.access_token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearStorage();
      setState(prev => ({
        ...prev,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    }
  }, [state.tokens]);

  // OAuth login
  const loginWithOAuth = useCallback(async (provider: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Store provider in sessionStorage for callback page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_provider', provider);
      }
      
      // POST request with provider and redirect_uri in body
      const response = await apiRequest('/auth/oauth/login', {
        method: 'POST',
        body: JSON.stringify({
          provider: provider,
          redirect_uri: `${window.location.origin}/auth/callback`
        }),
      });
      
      // Redirect to OAuth provider URL
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error('No authorization URL returned from server');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'OAuth login failed',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Passkey registration
  const registerPasskey = useCallback(async () => {
    if (!state.tokens) throw new Error('Must be logged in to register passkey');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const options = await apiRequest('/auth/passkeys/register/begin', {
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
        },
      });
      
      // Use WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: options
      });
      
      await apiRequest('/auth/passkeys/register/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
        },
        body: JSON.stringify({ credential }),
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Passkey registration failed',
        isLoading: false,
      }));
      throw error;
    }
  }, [state.tokens]);

  // Passkey authentication
  const authenticateWithPasskey = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const options = await apiRequest('/auth/passkeys/authenticate/begin');
      
      // Use WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: options
      });
      
      const tokens = await apiRequest('/auth/passkeys/authenticate/complete', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      
      // Get user profile
      const user = await apiRequest('/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      
      saveTokens(tokens);
      saveUser(user);
      
      setState(prev => ({
        ...prev,
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Passkey authentication failed',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!state.tokens?.refresh_token) return;
    
    try {
      const newTokens = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: state.tokens.refresh_token }),
      });
      
      saveTokens(newTokens);
      setState(prev => ({ ...prev, tokens: newTokens }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  }, [state.tokens, logout]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check auth status
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!state.tokens) return false;
    
    try {
      await apiRequest('/auth/me', {
        headers: {
          'Authorization': `Bearer ${state.tokens.access_token}`,
        },
      });
      return true;
    } catch {
      return false;
    }
  }, [state.tokens]);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    loginWithOAuth,
    registerPasskey,
    authenticateWithPasskey,
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

// Focused hooks for Interface Segregation Principle
export function useBasicAuth() {
  const { user, tokens, isAuthenticated, isLoading, isInitialized, error, login, register, logout, refreshToken, clearError, checkAuthStatus } = useAuth();
  return { user, tokens, isAuthenticated, isLoading, isInitialized, error, login, register, logout, refreshToken, clearError, checkAuthStatus };
}

export function useOAuth() {
  const { oauthProviders, isLoading, error, loginWithOAuth, clearError } = useAuth();
  return { oauthProviders, isLoading, error, loginWithOAuth, clearError };
}

export function useWebAuthn() {
  const { webauthnSupported, isLoading, error, registerPasskey, authenticateWithPasskey, clearError } = useAuth();
  return { webauthnSupported, isLoading, error, registerPasskey, authenticateWithPasskey, clearError };
}

export function useUserProfile() {
  const { user, isLoading, error, clearError } = useAuth();
  
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    // TODO: Implement profile update call to Docker backend
    console.warn('Profile update not implemented yet');
    throw new Error('Profile update functionality not implemented');
  };
  
  return { user, isLoading, error, updateProfile, clearError };
}