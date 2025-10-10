/**
 * Enterprise Authentication Context - Astro Best Practices
 * Server-side session checking with HTTP-only cookies
 * Following CLAUDE.md: NO LOCAL SERVICES RULE + Enterprise Security
 * DRY/SOLID: Uses centralized API configuration and direct backend integration
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getApiBaseUrl } from "../constants/api.ts";
import { createContextLogger } from "../utils/logger";
// Simple cookie helper for reading auth_user cookie
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

const getAuthStatusFromCookie = () => {
  const authUserCookie = getCookie("auth_user");
  if (!authUserCookie) return { isAuthenticated: false, isNewUser: false };

  try {
    return JSON.parse(decodeURIComponent(authUserCookie));
  } catch {
    return { isAuthenticated: false, isNewUser: false };
  }
};
import type {
  User,
  UserProfile,
  LoginCredentials,
  RegisterData,
} from "../types/auth.ts";

const logger = createContextLogger("AuthContext");

// WebAuthn credential interface for excludeCredentials/allowCredentials
interface WebAuthnCredentialDescriptor {
  type: string;
  id: string;
  transports?: string[];
}

// DRY/SOLID: Use centralized API base URL
const getApiBase = () => getApiBaseUrl();

// Enterprise auth state with server-side session checking
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  connectionStatus: "connecting" | "open" | "closed";
  oauthProviders: string[];
  webauthnSupported: boolean;
  authReason?: string; // Reason for auth status (e.g., 'valid_session', 'no_auth_cookies')
}

// Context interface
interface AuthContextValue extends AuthState {
  // Basic auth
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;

  // OAuth
  loginWithOAuth: (provider: string) => Promise<void>;

  // WebAuthn/Passkeys
  registerPasskey: () => Promise<void>;
  authenticateWithPasskey: () => Promise<void>;

  // Utils
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
  reconnectSSE: () => Promise<void>; // Now refreshes auth status instead of SSE
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
  connectionStatus: "closed",
  oauthProviders: [],
  webauthnSupported:
    typeof window !== "undefined" && "credentials" in navigator,
};

// Create context
const AuthContext = createContext<AuthContextValue | null>(null);

// HTTP-only cookies helper - no localStorage needed for tokens

// HTTP-only cookies helper - no localStorage needed for tokens
const apiRequestWithCookies = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    credentials: "include", // Include HTTP-only cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage: string;
    try {
      const errorData = await response.json();
      console.error("API request failed:", {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      errorMessage = errorData.detail || JSON.stringify(errorData);
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage || `API request failed: ${response.status}`);
  }

  return response.json();
};

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  // Using Astro best practices with server-side session checking instead of SSE

  // Initialize auth using Astro best practices - server-side session checking
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        logger.info(
          "Initializing authentication service using Astro best practices...",
        );

        // Check initial auth status from cookie
        const cookieAuthStatus = getAuthStatusFromCookie();
        logger.info("Cookie auth status", { cookieAuthStatus });

        let backendAuthStatus = { authenticated: false, user: null };

        try {
          // Check current session (backend will read HTTP-only cookies)
          const response = await fetch(`${getApiBase()}/auth/me`, {
            credentials: "include", // Include HTTP-only cookies
            headers: { Accept: "application/json" },
          });

          if (response.ok) {
            const user = await response.json();
            backendAuthStatus = { authenticated: true, user };
            logger.info("Backend auth verification successful", { user });
          } else {
            logger.info("Backend auth verification failed", {
              status: response.status,
            });
          }
        } catch (error) {
          logger.warn("Backend auth verification error", { error });
          // Fall back to cookie status if backend is unreachable
        }

        // Use backend status if available, otherwise fall back to cookie
        const finalAuthStatus = backendAuthStatus.authenticated
          ? backendAuthStatus
          : { authenticated: cookieAuthStatus.isAuthenticated, user: null };

        setState((prev) => ({
          ...prev,
          isAuthenticated: finalAuthStatus.authenticated,
          user: finalAuthStatus.user,
          authReason: finalAuthStatus.authenticated
            ? "valid_session"
            : "no_auth_cookies",
          isLoading: false,
          isInitialized: true,
          connectionStatus: "open", // Using HTTP requests instead of SSE
        }));

        // Load OAuth providers from backend
        try {
          const providers = await apiRequestWithCookies(
            "/auth/oauth/providers",
          );
          setState((prev) => ({ ...prev, oauthProviders: providers }));
        } catch (error) {
          logger.error("Failed to load OAuth providers", { error });
        }
      } catch (error) {
        logger.error("Auth initialization failed", { error });
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Auth initialization failed",
          isLoading: false,
          isInitialized: true,
          connectionStatus: "closed",
        }));
      }
    };

    initializeAuth();

    // Set up event-driven auth state detection (efficient, no polling!)
    const handleAuthStateChange = () => {
      const cookieAuthStatus = getAuthStatusFromCookie();
      setState((prev) => {
        // Only update if cookie status differs from current state
        if (prev.isAuthenticated !== cookieAuthStatus.isAuthenticated) {
          logger.info("Auth status changed via cookie event", {
            previous: prev.isAuthenticated,
            current: cookieAuthStatus.isAuthenticated,
          });
          return {
            ...prev,
            isAuthenticated: cookieAuthStatus.isAuthenticated,
            user: cookieAuthStatus.isAuthenticated ? prev.user : null,
          };
        }
        return prev;
      });
    };

    // Listen for OAuth callback success via postMessage
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "oauth_success") {
        logger.info("OAuth success message received", {
          provider: event.data.provider,
          hasTokens: !!event.data.tokens,
        });

        // Immediately verify auth status after OAuth success
        setTimeout(async () => {
          try {
            const response = await fetch(`${getApiBase()}/auth/me`, {
              credentials: "include",
              headers: { Accept: "application/json" },
            });

            if (response.ok) {
              const user = await response.json();
              setState((prev) => ({
                ...prev,
                isAuthenticated: true,
                user,
                authReason: "oauth_success",
                error: null,
              }));
              logger.info("OAuth verification successful", { user });
            }
          } catch (error) {
            logger.error("OAuth verification failed", { error });
          }
        }, 500); // Small delay to ensure cookies are set
      }
    };

    // Listen for manual auth state refresh events
    const handleAuthRefresh = () => {
      handleAuthStateChange();
    };

    // Add event listeners
    window.addEventListener("message", handleOAuthMessage);
    window.addEventListener("authStateChanged", handleAuthRefresh);

    // Optional: Listen for storage events (for multi-tab scenarios)
    window.addEventListener("storage", (e) => {
      if (e.key === "auth_user" || e.key?.startsWith("auth_")) {
        handleAuthStateChange();
      }
    });

    // Cleanup on unmount
    return () => {
      window.removeEventListener("message", handleOAuthMessage);
      window.removeEventListener("authStateChanged", handleAuthRefresh);
      window.removeEventListener("storage", handleAuthStateChange);
      logger.info("Cleaned up authentication service");
    };
  }, []);

  // Login with email/password
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create FormData for OAuth2 token endpoint
      const formData = new FormData();
      formData.append("username", credentials.email); // Backend expects 'username' field, we use email
      formData.append("password", credentials.password);

      const response = await fetch(`${getApiBase()}/auth/token`, {
        method: "POST",
        credentials: "include", // Include HTTP-only cookies
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Login failed");
      }

      // Backend sets HTTP-only cookies automatically
      // Check auth status immediately after login
      const userResponse = await fetch(`${getApiBase()}/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
          authReason: "login_successful",
        }));
        logger.info("Login successful", { user });

        // Trigger auth state change event for other components
        window.dispatchEvent(new CustomEvent("authStateChanged"));
      } else {
        throw new Error("Login succeeded but user data fetch failed");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Login failed",
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Register new user
  const register = useCallback(
    async (data: RegisterData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await apiRequestWithCookies("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });

        // Auto-login after registration
        await login({ email: data.email, password: data.password });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Registration failed",
          isLoading: false,
        }));
        throw error;
      }
    },
    [login],
  );

  // Logout user
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Call backend logout endpoint to clear HTTP-only cookies
      await fetch(`${getApiBase()}/auth/logout`, {
        method: "POST",
        credentials: "include", // Include HTTP-only cookies
        headers: { Accept: "application/json" },
      });

      // Update state immediately after successful logout
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        authReason: "logged_out",
      }));

      logger.info("Logout successful");
    } catch (error) {
      logger.error("Logout failed", { error });
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Logout failed",
        isLoading: false,
      }));
    }
  }, []);

  // OAuth login
  const loginWithOAuth = useCallback(async (provider: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Store provider in sessionStorage for callback page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("oauth_provider", provider);
      }

      // POST request with provider and redirect_uri in body
      const response = await apiRequestWithCookies("/auth/oauth/login", {
        method: "POST",
        body: JSON.stringify({
          provider: provider,
          redirect_uri: `${window.location.origin}/auth/oauth/${provider}/callback`,
        }),
      });

      // Redirect to OAuth provider URL
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error("No authorization URL returned from server");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "OAuth login failed",
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Passkey registration
  // Helper function to convert base64url to ArrayBuffer
  const base64urlToBuffer = (base64url: string): ArrayBuffer => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Helper function to convert ArrayBuffer to base64url
  const bufferToBase64url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  const registerPasskey = useCallback(async () => {
    if (!state.isAuthenticated)
      throw new Error("Must be logged in to register passkey");

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Backend returns { public_key, challenge_key, device_name }
      const response = await apiRequestWithCookies(
        "/auth/passkeys/register/begin",
        {
          method: "POST",
          body: JSON.stringify({
            device_name: "Default Device",
          }),
        },
      );

      // Convert base64url strings to ArrayBuffers for WebAuthn API
      const publicKeyOptions = {
        ...response.public_key,
        challenge: base64urlToBuffer(response.public_key.challenge),
        user: {
          ...response.public_key.user,
          id: base64urlToBuffer(response.public_key.user.id),
        },
        excludeCredentials:
          response.public_key.excludeCredentials?.map(
            (cred: WebAuthnCredentialDescriptor) => ({
              ...cred,
              id: base64urlToBuffer(cred.id),
            }),
          ) || [],
      };

      // Use WebAuthn API with converted options
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential;

      const credentialResponse =
        credential.response as AuthenticatorAttestationResponse;

      // Send credential with challenge_key to backend
      await apiRequestWithCookies("/auth/passkeys/register/complete", {
        method: "POST",
        body: JSON.stringify({
          credential_response: {
            id: credential.id,
            rawId: bufferToBase64url(credential.rawId),
            type: credential.type,
            response: {
              attestationObject: bufferToBase64url(
                credentialResponse.attestationObject,
              ),
              clientDataJSON: bufferToBase64url(
                credentialResponse.clientDataJSON,
              ),
            },
          },
          challenge_key: response.challenge_key,
          device_name: response.device_name,
        }),
      });

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Passkey registration failed",
        isLoading: false,
      }));
      throw error;
    }
  }, [state.isAuthenticated]);

  // Passkey authentication
  const authenticateWithPasskey = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Backend returns { public_key, challenge_key }
      const response = await apiRequestWithCookies(
        "/auth/passkeys/authenticate/begin",
        {
          method: "POST",
          body: JSON.stringify({
            username: null, // Usernameless/discoverable authentication
          }),
        },
      );

      // Convert base64url challenge to ArrayBuffer for WebAuthn API
      const publicKeyOptions = {
        ...response.public_key,
        challenge: base64urlToBuffer(response.public_key.challenge),
        allowCredentials:
          response.public_key.allowCredentials?.map(
            (cred: WebAuthnCredentialDescriptor) => ({
              ...cred,
              id: base64urlToBuffer(cred.id),
            }),
          ) || [],
      };

      // Use WebAuthn API with converted options
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      // Send credential with challenge_key to backend
      await apiRequestWithCookies("/auth/passkeys/authenticate/complete", {
        method: "POST",
        body: JSON.stringify({
          credential_response: credential,
          challenge_key: response.challenge_key,
        }),
      });

      // Backend sets HTTP-only cookies automatically
      // Check auth status immediately after passkey auth
      const userResponse = await fetch(`${getApiBase()}/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
          authReason: "passkey_auth_successful",
        }));
        logger.info("Passkey authentication successful", { user });
      } else {
        throw new Error("Passkey auth succeeded but user data fetch failed");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Passkey authentication failed",
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  // Refresh auth status (replaces SSE reconnect)
  const reconnectSSE = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Check current auth status with backend
      const response = await fetch(`${getApiBase()}/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const user = await response.json();
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false,
          connectionStatus: "open",
          authReason: "auth_refreshed",
          error: null,
        }));
        logger.info("Auth status refreshed successfully", { user });
      } else {
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          connectionStatus: "open",
          authReason: "auth_refresh_failed",
          error: null,
        }));
        logger.info("Auth status refresh - not authenticated");
      }
    } catch (error) {
      logger.error("Auth status refresh failed", { error });
      setState((prev) => ({
        ...prev,
        connectionStatus: "closed",
        isLoading: false,
        error: "Connection failed - please check your internet connection",
      }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Check auth status
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${getApiBase()}/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const isAuthenticated = response.ok;
      logger.info("Auth status check", {
        isAuthenticated,
        status: response.status,
      });

      return isAuthenticated;
    } catch (error) {
      logger.error("Auth status check failed", { error });
      return false;
    }
  }, []);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    loginWithOAuth,
    registerPasskey,
    authenticateWithPasskey,
    clearError,
    checkAuthStatus,
    reconnectSSE,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Focused hooks for Interface Segregation Principle
export function useBasicAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus,
    connectionStatus,
    authReason,
    reconnectSSE,
  } = useAuth();
  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    logout,
    clearError,
    checkAuthStatus,
    connectionStatus,
    authReason,
    reconnectSSE,
  };
}

export function useOAuth() {
  const { oauthProviders, isLoading, error, loginWithOAuth, clearError } =
    useAuth();
  return { oauthProviders, isLoading, error, loginWithOAuth, clearError };
}

export function useWebAuthn() {
  const {
    webauthnSupported,
    isLoading,
    error,
    registerPasskey,
    authenticateWithPasskey,
    clearError,
  } = useAuth();
  return {
    webauthnSupported,
    isLoading,
    error,
    registerPasskey,
    authenticateWithPasskey,
    clearError,
  };
}

export function useUserProfile() {
  const context = useAuth();
  const { user, isLoading, error, clearError } = context;
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const updateProfile = useCallback(
    async (profileData: Partial<UserProfile>) => {
      if (!context.isAuthenticated) {
        throw new Error("Must be authenticated to update profile");
      }

      setIsUpdating(true);
      setUpdateError(null);

      try {
        // Call Docker backend profile update endpoint
        const response = await apiRequestWithCookies("/auth/profile", {
          method: "PATCH",
          body: JSON.stringify(profileData),
        });

        logger.info("Profile updated successfully", { response });

        // Refresh auth status to get updated user data (best practice: use existing context method)
        await context.reconnectSSE();

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Profile update failed";
        setUpdateError(errorMessage);
        logger.error("Profile update failed", { error: err });
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [context],
  );

  return {
    user,
    isLoading: isLoading || isUpdating,
    error: error || updateError,
    updateProfile,
    clearError: () => {
      clearError();
      setUpdateError(null);
    },
  };
}
