/**
 * User Manager Service
 * Single Responsibility: Handle user profile and account management
 * Extracted from AuthContext to follow SOLID principles
 */

import { authAPI } from '../lib/auth-api.ts';
import { authStorage } from '../lib/auth-storage.ts';
import type { 
  UserProfile,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  PasswordResetRequest,
  PasswordResetConfirm,
  AuthTokens 
} from '../types/auth.ts';

export interface UserManagerEvents {
  onUserUpdated: (user: UserProfile | null) => void;
  onProfileChanged: (user: UserProfile) => void;
  onPasswordChanged: () => void;
  onAccountDeleted: () => void;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  tokens?: AuthTokens;
  error?: string;
  requiresVerification?: boolean;
}

/**
 * User Manager - Handles user authentication and profile management
 */
export class UserManager {
  private currentUser: UserProfile | null = null;
  private events: Partial<UserManagerEvents> = {};

  constructor(events: Partial<UserManagerEvents> = {}) {
    this.events = events;
    this.loadStoredUser();
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Set current user
   */
  setCurrentUser(user: UserProfile | null): void {
    this.currentUser = user;
    if (user) {
      authStorage.saveUser(user);
    } else {
      authStorage.clearUser();
    }
    this.events.onUserUpdated?.(user);
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log('Attempting login for:', credentials.email);
      
      const response = await authAPI.login(credentials);
      
      if (response.success && response.user && response.tokens) {
        console.log('Login successful');
        this.setCurrentUser(response.user);
        
        return {
          success: true,
          user: response.user,
          tokens: response.tokens,
        };
      } else {
        const error = response.error || 'Login failed';
        console.error('Login failed:', error);
        
        return {
          success: false,
          error,
          requiresVerification: response.error?.includes('verify') || response.error?.includes('activation'),
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      console.error('Login error:', error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Register new user account
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      console.log('Attempting registration for:', data.email);
      
      const response = await authAPI.register(data);
      
      if (response.success) {
        console.log('Registration successful');
        
        // Some APIs return user/tokens immediately, others require verification
        if (response.user && response.tokens) {
          this.setCurrentUser(response.user);
          return {
            success: true,
            user: response.user,
            tokens: response.tokens,
          };
        } else {
          return {
            success: true,
            requiresVerification: true,
          };
        }
      } else {
        const error = response.error || 'Registration failed';
        console.error('Registration failed:', error);
        
        return {
          success: false,
          error,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      console.error('Registration error:', error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      console.log('Logging out user');
      
      // Call logout endpoint if user is logged in
      if (this.currentUser) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      this.setCurrentUser(null);
    }
  }

  /**
   * Refresh user profile from server
   */
  async refreshProfile(): Promise<UserProfile | null> {
    try {
      if (!this.currentUser) {
        return null;
      }

      console.log('Refreshing user profile');
      const response = await authAPI.getProfile();
      
      if (response.success && response.user) {
        this.setCurrentUser(response.user);
        return response.user;
      } else {
        console.error('Failed to refresh profile:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      console.log('Updating user profile');
      const response = await authAPI.updateProfile(updates);
      
      if (response.success && response.user) {
        console.log('Profile updated successfully');
        this.setCurrentUser(response.user);
        this.events.onProfileChanged?.(response.user);
        return true;
      } else {
        console.error('Profile update failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeData): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      console.log('Changing user password');
      const response = await authAPI.changePassword(data);
      
      if (response.success) {
        console.log('Password changed successfully');
        this.events.onPasswordChanged?.();
        return true;
      } else {
        console.error('Password change failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<boolean> {
    try {
      console.log('Requesting password reset for:', data.email);
      const response = await authAPI.requestPasswordReset(data);
      
      if (response.success) {
        console.log('Password reset requested successfully');
        return true;
      } else {
        console.error('Password reset request failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      return false;
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirm): Promise<boolean> {
    try {
      console.log('Confirming password reset');
      const response = await authAPI.confirmPasswordReset(data);
      
      if (response.success) {
        console.log('Password reset confirmed successfully');
        return true;
      } else {
        console.error('Password reset confirmation failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      return false;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      console.log('Deleting user account');
      const response = await authAPI.deleteAccount(password);
      
      if (response.success) {
        console.log('Account deleted successfully');
        this.setCurrentUser(null);
        this.events.onAccountDeleted?.();
        return true;
      } else {
        console.error('Account deletion failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions?.includes(permission) || 
           this.currentUser.role === 'admin' ||
           false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user account is verified
   */
  isVerified(): boolean {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.isVerified === true;
  }

  /**
   * Get user display name
   */
  getDisplayName(): string {
    if (!this.currentUser) {
      return 'Guest';
    }

    return this.currentUser.displayName || 
           this.currentUser.fullName ||
           this.currentUser.username ||
           this.currentUser.email ||
           'User';
  }

  /**
   * Get user avatar URL
   */
  getAvatarUrl(): string | null {
    if (!this.currentUser) {
      return null;
    }

    return this.currentUser.avatar || null;
  }

  /**
   * Get user initials for avatar fallback
   */
  getUserInitials(): string {
    const displayName = this.getDisplayName();
    const words = displayName.split(' ').filter(word => word.length > 0);
    
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    } else {
      return 'U';
    }
  }

  /**
   * Load user from storage on initialization
   */
  private loadStoredUser(): void {
    try {
      const storedUser = authStorage.getUser();
      if (storedUser) {
        this.currentUser = storedUser;
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    }
  }

  /**
   * Get user info for debugging
   */
  getUserInfo(): {
    isLoggedIn: boolean;
    userId: string | null;
    email: string | null;
    role: string | null;
    isVerified: boolean;
    permissions: string[];
  } {
    return {
      isLoggedIn: !!this.currentUser,
      userId: this.currentUser?.id || null,
      email: this.currentUser?.email || null,
      role: this.currentUser?.role || null,
      isVerified: this.isVerified(),
      permissions: this.currentUser?.permissions || [],
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.currentUser = null;
    this.events = {};
  }
}

export default UserManager;