# Authentication Interface Segregation

## SOLID Principle: Interface Segregation Fixed ✅

**Before**: Single monolithic `AuthContextValue` interface with 24 methods
**After**: 5 focused interfaces - components only depend on what they need!

## Interface Segregation Problem

The original `AuthContextValue` interface violated the Interface Segregation Principle:

```typescript
// ❌ VIOLATION: Components forced to depend on methods they don't use
interface AuthContextValue {
  // 7 state properties
  user, tokens, isAuthenticated, isLoading, isInitialized, error, ...
  
  // 4 basic auth methods
  login(), register(), logout(), refreshToken()
  
  // 3 password methods  
  changePassword(), requestPasswordReset(), confirmPasswordReset()
  
  // 2 OAuth methods
  loginWithOAuth(), handleOAuthCallback()
  
  // 4 WebAuthn methods
  registerPasskey(), authenticateWithPasskey(), deletePasskey(), refreshPasskeys()
  
  // 2 profile methods
  updateProfile(), refreshUser()
  
  // 2 utility methods
  clearError(), checkAuthStatus()
}
```

**Problem**: A simple login form was forced to depend on 20+ unused methods for OAuth, WebAuthn, profile management, etc.

## Solution: Focused Interfaces

### 1. BasicAuthContext
**Use for**: Login forms, logout buttons, auth guards
```typescript
interface BasicAuthContext {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  login(credentials: LoginCredentials): Promise<void>;
  register(data: RegisterData): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<void>;
  clearError(): void;
  checkAuthStatus(): Promise<boolean>;
}
```

### 2. PasswordAuthContext
**Use for**: Password change forms, reset password flows
```typescript
interface PasswordAuthContext {
  isLoading: boolean;
  error: string | null;
  
  changePassword(data: PasswordChangeData): Promise<void>;
  requestPasswordReset(data: PasswordResetRequest): Promise<void>;
  confirmPasswordReset(data: PasswordResetConfirm): Promise<void>;
  clearError(): void;
}
```

### 3. OAuthContext
**Use for**: OAuth login buttons, provider selection
```typescript
interface OAuthContext {
  oauthProviders: OAuthProvider[];
  isLoading: boolean;
  error: string | null;
  
  loginWithOAuth(provider: string, redirectUri?: string): Promise<void>;
  handleOAuthCallback(code: string, state: string, provider: string): Promise<void>;
  clearError(): void;
}
```

### 4. WebAuthnContext
**Use for**: Passkey registration, biometric auth
```typescript
interface WebAuthnContext {
  webauthnSupported: boolean;
  userCredentials: WebAuthnCredential[];
  isLoading: boolean;
  error: string | null;
  
  registerPasskey(name?: string): Promise<void>;
  authenticateWithPasskey(): Promise<void>;
  deletePasskey(credentialId: string): Promise<void>;
  refreshPasskeys(): Promise<void>;
  clearError(): void;
}
```

### 5. UserProfileContext
**Use for**: Profile forms, user settings, account management
```typescript
interface UserProfileContext {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  updateProfile(profile: Partial<UserProfile>): Promise<void>;
  refreshUser(): Promise<void>;
  clearError(): void;
}
```

## Usage Examples

### ✅ Good: Focused Dependencies

```typescript
// Login Form - Only needs basic authentication
import { useBasicAuth } from '../../contexts/AuthContext';

export const LoginForm = () => {
  const { login, isLoading, error, clearError } = useBasicAuth();
  // Component only receives 4 methods instead of 24!
};

// Password Reset Form - Only needs password management  
import { usePasswordAuth } from '../../contexts/AuthContext';

export const PasswordResetForm = () => {
  const { requestPasswordReset, isLoading, error } = usePasswordAuth();
  // Component only receives 4 methods instead of 24!
};

// OAuth Login Button - Only needs OAuth functionality
import { useOAuth } from '../../contexts/AuthContext';

export const OAuthButton = () => {
  const { loginWithOAuth, oauthProviders, isLoading } = useOAuth();
  // Component only receives 5 methods instead of 24!
};
```

### ❌ Bad: Monolithic Dependencies

```typescript
// DON'T DO THIS - Forces dependency on 24 methods!
import { useAuth } from '../../contexts/AuthContext';

export const LoginForm = () => {
  // Gets all 24 methods but only needs 4
  const { 
    login, isLoading, error, clearError,
    // UNUSED: OAuth methods
    loginWithOAuth, handleOAuthCallback,
    // UNUSED: WebAuthn methods  
    registerPasskey, authenticateWithPasskey, deletePasskey, refreshPasskeys,
    // UNUSED: Profile methods
    updateProfile, refreshUser,
    // UNUSED: Password methods
    changePassword, requestPasswordReset, confirmPasswordReset,
    // ... 10+ more unused methods
  } = useAuth();
};
```

## Migration Guide

### Step 1: Identify Component Needs
```typescript
// Analyze what each component actually uses
const LoginForm = () => {
  const { login, isLoading, error, clearError } = useAuth();
  //      ^^^^^ Only uses these 4 methods
  //      → Should use useBasicAuth()
};
```

### Step 2: Replace with Focused Hook
```typescript
// Before
import { useAuth } from '../../contexts/AuthContext';
const { login, isLoading, error, clearError } = useAuth();

// After  
import { useBasicAuth } from '../../contexts/AuthContext';
const { login, isLoading, error, clearError } = useBasicAuth();
```

### Step 3: For Multiple Concerns
```typescript
// If component needs multiple auth features
import { useFocusedAuth } from '../../contexts/AuthContext';

const AccountSettings = () => {
  const auth = useFocusedAuth(['basic', 'password', 'profile']);
  // Gets only methods for basic auth, password management, and profiles
  // Still excludes OAuth and WebAuthn methods
};
```

## Benefits Achieved

### 1. **Clearer Dependencies** 
- Components explicitly declare which auth features they need
- Easy to understand component requirements at a glance

### 2. **Better Testability**
- Smaller surface area for mocking in tests  
- Only need to mock the interface methods actually used

### 3. **Reduced Coupling**
- Components aren't coupled to authentication features they don't use
- Easier to refactor individual auth features

### 4. **Improved Performance**
- React can better optimize renders when dependencies are focused
- Smaller hook objects mean less memory usage

### 5. **Better Developer Experience**
- IDEs can provide better autocomplete on focused interfaces
- Easier to reason about component behavior

## Component Categories

### Basic Auth Only
- LoginForm → `useBasicAuth()`
- LogoutButton → `useBasicAuth()` 
- ProtectedRoute → `useBasicAuth()`
- AuthenticatedHeader → `useBasicAuth()`

### Password Management
- PasswordChangeForm → `usePasswordAuth()`
- ForgotPasswordForm → `usePasswordAuth()`
- ResetPasswordForm → `usePasswordAuth()`

### OAuth Features
- OAuthButton → `useOAuth()`
- SocialLoginPanel → `useOAuth()`
- OAuthCallbackHandler → `useOAuth()`

### WebAuthn Features  
- PasskeyButton → `useWebAuthn()`
- BiometricAuthForm → `useWebAuthn()`
- SecurityKeyManager → `useWebAuthn()`

### Profile Management
- ProfileForm → `useUserProfile()`
- AccountSettings → `useUserProfile()`
- UserAvatar → `useUserProfile()`

### Multiple Concerns
- ComprehensiveAuthModal → `useFocusedAuth(['basic', 'oauth', 'webauthn'])`
- CompleteAccountPage → `useFocusedAuth(['basic', 'password', 'profile'])`

## Legacy Support

The original `useAuth()` hook remains available but is deprecated:

```typescript
// Still works but discouraged
const { login, ... } = useAuth();  // 24 methods

// Preferred approach
const { login, ... } = useBasicAuth();  // 6 methods
```

## SOLID Principles Applied

✅ **Single Responsibility**: Each interface has one clear purpose  
✅ **Open/Closed**: New auth features can be added without changing existing interfaces  
✅ **Liskov Substitution**: All focused contexts can be substituted consistently  
✅ **Interface Segregation**: Clients only depend on methods they use  
✅ **Dependency Inversion**: Components depend on abstractions, not concrete implementations  

This refactoring exemplifies how proper Interface Segregation leads to cleaner, more maintainable, and better-performing code!