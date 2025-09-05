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
  last_login_at?: string;
  profile?: UserProfile;
  permissions?: string[];
  roles?: string[];
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
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

export interface AuthError extends Error {
  code?: string;
  field?: string;
  statusCode?: number;
  timestamp?: string;
  validationErrors?: Record<string, string[]>;
}

export interface AuthResponse<T = any> {
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
  payload?: any;
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