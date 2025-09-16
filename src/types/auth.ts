/**
 * Authentication Types
 * TypeScript interfaces for the authentication system
 */

export interface User {
  id: number;
  email: string;
  username?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string | undefined;
  profile?: UserProfile | undefined;
  permissions?: string[] | undefined;
  roles?: string[] | undefined;
}

export interface UserProfile {
  first_name?: string | undefined;
  last_name?: string | undefined;
  display_name?: string | undefined;
  avatar_url?: string | undefined;
  bio?: string | undefined;
  timezone?: string | undefined;
  language?: string | undefined;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string | undefined;
  expires_at: number; // Calculated expiry timestamp
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  terms_accepted: boolean;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface OAuthProvider {
  name: string;
  display_name: string;
  icon_url?: string;
  authorization_url: string;
  enabled: boolean;
}

export interface OAuthLoginRequest {
  provider: string;
  redirect_uri?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export interface WebAuthnCredential {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  device_type?: string;
  is_backup_eligible: boolean;
}

export interface WebAuthnRegistrationOptions {
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  challenge: string;
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout: number;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    residentKey?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct';
}

export interface WebAuthnAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials?: Array<{
    type: string;
    id: string;
    transports?: string[];
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  oauthProviders: OAuthProvider[];
  webauthnSupported: boolean;
  userCredentials: WebAuthnCredential[];
}

// SOLID: Interface Segregation Principle - Focused, purpose-specific interfaces
// No more monolithic AuthContextValue with 24 methods!

/**
 * Basic Authentication Interface
 * For components that only need login/logout functionality
 */
export interface BasicAuthContext {
  // Core authentication state
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Basic authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // Core utilities
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

/**
 * Password Management Interface
 * For components that handle password operations
 */
export interface PasswordAuthContext {
  // Password-specific methods
  changePassword: (data: PasswordChangeData) => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  
  // Minimal required state
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * OAuth Interface
 * For components that handle OAuth authentication
 */
export interface OAuthContext {
  // OAuth state
  oauthProviders: OAuthProvider[];
  isLoading: boolean;
  error: string | null;
  
  // OAuth methods
  loginWithOAuth: (provider: string, redirectUri?: string) => Promise<void>;
  handleOAuthCallback: (code: string, state: string, provider: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
}

/**
 * WebAuthn/Passkey Interface
 * For components that handle passkey authentication
 */
export interface WebAuthnContext {
  // WebAuthn state
  webauthnSupported: boolean;
  userCredentials: WebAuthnCredential[];
  isLoading: boolean;
  error: string | null;
  
  // WebAuthn methods
  registerPasskey: (name?: string) => Promise<void>;
  authenticateWithPasskey: () => Promise<void>;
  deletePasskey: (credentialId: string) => Promise<void>;
  refreshPasskeys: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
}

/**
 * User Profile Management Interface
 * For components that manage user profiles
 */
export interface UserProfileContext {
  // User state
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Profile methods
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
}

/**
 * Complete Authentication Context (Legacy)
 * @deprecated Use focused interfaces instead: BasicAuthContext, OAuthContext, etc.
 * This interface will be removed in a future version.
 * 
 * Components should depend only on the interfaces they actually need:
 * - BasicAuthContext for login/logout
 * - PasswordAuthContext for password management
 * - OAuthContext for OAuth flows
 * - WebAuthnContext for passkey authentication
 * - UserProfileContext for profile management
 */
export interface AuthContextValue extends AuthState {
  // Basic Authentication
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // Password Management
  changePassword: (data: PasswordChangeData) => Promise<void>;
  requestPasswordReset: (data: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  
  // OAuth
  loginWithOAuth: (provider: string, redirectUri?: string) => Promise<void>;
  handleOAuthCallback: (code: string, state: string, provider: string) => Promise<void>;
  
  // WebAuthn/Passkeys
  registerPasskey: (name?: string) => Promise<void>;
  authenticateWithPasskey: () => Promise<void>;
  deletePasskey: (credentialId: string) => Promise<void>;
  refreshPasskeys: () => Promise<void>;
  
  // User Management
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

/**
 * Composite Authentication Context
 * For components that need multiple authentication features
 * Use this sparingly - prefer focused interfaces when possible
 */
export interface CompositeAuthContext extends 
  BasicAuthContext,
  PasswordAuthContext,
  OAuthContext,
  WebAuthnContext,
  UserProfileContext {}

/**
 * Auth Context Provider Configuration
 * Defines which features should be enabled in the auth provider
 */
export interface AuthContextConfig {
  enablePasswordAuth?: boolean;
  enableOAuth?: boolean;
  enableWebAuthn?: boolean;
  enableUserProfiles?: boolean;
  oauthProviders?: string[];
  webauthnRpId?: string;
}

export interface AuthError extends Error {
  code?: string;
  field?: string;
  statusCode?: number;
  timestamp?: string;
  validationErrors?: Record<string, string[]>;
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AuthError;
  message?: string;
}

// Storage Keys
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'csfrace_access_token',
  REFRESH_TOKEN: 'csfrace_refresh_token',
  USER: 'csfrace_user',
  EXPIRES_AT: 'csfrace_expires_at',
  OAUTH_STATE: 'csfrace_oauth_state',
} as const;

// Auth Event Types
export enum AuthEventType {
  LOGIN = 'auth:login',
  LOGOUT = 'auth:logout',
  TOKEN_REFRESH = 'auth:token_refresh',
  SESSION_EXPIRED = 'auth:session_expired',
  USER_UPDATED = 'auth:user_updated',
  ERROR = 'auth:error',
}

export interface AuthEvent {
  type: AuthEventType;
  payload?: unknown;
  timestamp: number;
}

// Utility Types
export type AuthAction = 
  | { type: 'AUTH_INIT' }
  | { type: 'AUTH_LOADING'; payload: boolean }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: User }
  | { type: 'AUTH_UPDATE_TOKENS'; payload: AuthTokens }
  | { type: 'AUTH_SET_OAUTH_PROVIDERS'; payload: OAuthProvider[] }
  | { type: 'AUTH_SET_WEBAUTHN_CREDENTIALS'; payload: WebAuthnCredential[] };