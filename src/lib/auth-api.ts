/**
 * Authentication API Client
 * Extends the main API client with authentication-specific endpoints
 */

import { apiClient } from "./api-client.ts";
import type {
  User,
  LoginCredentials,
  RegisterData,
  PasswordChangeData,
  PasswordResetRequest,
  PasswordResetConfirm,
  OAuthProvider,
  OAuthLoginRequest,
  WebAuthnCredential,
  WebAuthnRegistrationOptions,
  WebAuthnAuthenticationOptions,
  UserProfile,
} from "../types/auth.ts";

export interface AuthLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user: User;
}

export interface AuthRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface WebAuthnRegistrationResponse {
  options: WebAuthnRegistrationOptions;
  session_id: string;
}

export interface WebAuthnAuthenticationResponse {
  options: WebAuthnAuthenticationOptions;
  session_id: string;
}

export interface WebAuthnVerificationRequest {
  session_id: string;
  credential: PublicKeyCredential;
}

class AuthAPI {
  private baseClient = apiClient;

  // Basic Authentication
  async login(credentials: LoginCredentials): Promise<AuthLoginResponse> {
    const formData = new FormData();
    formData.append("username", credentials.email); // Backend expects 'username' field
    formData.append("password", credentials.password);

    const response = await fetch(`${this.baseClient["baseURL"]}/auth/token`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Login failed: ${response.statusText}`,
      );
    }

    return response.json();
  }

  async register(data: RegisterData): Promise<User> {
    return this.baseClient["request"]<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
      }),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthRefreshResponse> {
    const formData = new FormData();
    formData.append("refresh_token", refreshToken);

    const response = await fetch(`${this.baseClient["baseURL"]}/auth/refresh`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    return this.baseClient["request"]<User>("/auth/me");
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<User> {
    return this.baseClient["request"]<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  }

  // Password Management
  async changePassword(data: PasswordChangeData): Promise<void> {
    return this.baseClient["request"]<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    });
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    return this.baseClient["request"]<void>("/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email: data.email }),
    });
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    return this.baseClient["request"]<void>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({
        token: data.token,
        new_password: data.new_password,
      }),
    });
  }

  // OAuth
  async getOAuthProviders(): Promise<OAuthProvider[]> {
    return this.baseClient["request"]<OAuthProvider[]>("/auth/oauth/providers");
  }

  async initiateOAuthLogin(
    request: OAuthLoginRequest,
  ): Promise<{ authorization_url: string }> {
    return this.baseClient["request"]<{ authorization_url: string }>(
      "/auth/oauth/login",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
    codeVerifier?: string,
  ): Promise<AuthLoginResponse> {
    // Build query parameters for GET request
    const params = new URLSearchParams({
      code,
      state,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    });

    const response = await fetch(
      `${this.baseClient["baseURL"]}/auth/oauth/${provider}/callback?${params}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "OAuth callback failed");
    }

    return response.json();
  }

  // WebAuthn/Passkeys
  async getPasskeySummary(): Promise<WebAuthnCredential[]> {
    return this.baseClient["request"]<WebAuthnCredential[]>(
      "/auth/passkeys/summary",
    );
  }

  async beginPasskeyRegistration(
    name?: string,
  ): Promise<WebAuthnRegistrationResponse> {
    return this.baseClient["request"]<WebAuthnRegistrationResponse>(
      "/auth/passkeys/register/begin",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
    );
  }

  async completePasskeyRegistration(
    data: WebAuthnVerificationRequest,
  ): Promise<WebAuthnCredential> {
    return this.baseClient["request"]<WebAuthnCredential>(
      "/auth/passkeys/register/complete",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async beginPasskeyAuthentication(): Promise<WebAuthnAuthenticationResponse> {
    return this.baseClient["request"]<WebAuthnAuthenticationResponse>(
      "/auth/passkeys/authenticate/begin",
      {
        method: "POST",
      },
    );
  }

  async completePasskeyAuthentication(
    data: WebAuthnVerificationRequest,
  ): Promise<AuthLoginResponse> {
    return this.baseClient["request"]<AuthLoginResponse>(
      "/auth/passkeys/authenticate/complete",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  async deletePasskey(credentialId: string): Promise<void> {
    return this.baseClient["request"]<void>(`/auth/passkeys/${credentialId}`, {
      method: "DELETE",
    });
  }

  // User Management
  async getUsers(params?: { page?: number; page_size?: number }): Promise<{
    users: User[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.page_size)
      searchParams.append("page_size", params.page_size.toString());

    const query = searchParams.toString();
    const endpoint = `/auth/users${query ? `?${query}` : ""}`;

    return this.baseClient["request"](endpoint);
  }

  async getUser(userId: number): Promise<User> {
    return this.baseClient["request"]<User>(`/auth/users/${userId}`);
  }

  async updateUser(userId: number, data: Partial<User>): Promise<User> {
    return this.baseClient["request"]<User>(`/auth/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: number): Promise<void> {
    return this.baseClient["request"]<void>(`/auth/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Utility Methods
  setAuthToken(token: string): void {
    this.baseClient.setAPIKey(token);
  }

  clearAuthToken(): void {
    this.baseClient.setAPIKey("");
  }
}

// Singleton instance
export const authAPI = new AuthAPI();

// Utility Functions
export function isWebAuthnSupported(): boolean {
  return !!(
    typeof window !== "undefined" &&
    window.navigator &&
    window.navigator.credentials &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

export function generateOAuthState(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const value = array[0];
  if (value == null) {
    throw new Error("Failed to generate random value");
  }
  return value.toString(36);
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/[+/]/g, (m) => (m === "+" ? "-" : "_"))
    .replace(/=/g, "");
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/[+/]/g, (m) => (m === "+" ? "-" : "_"))
    .replace(/=/g, "");
}

export function formatWebAuthnError(error: unknown): string {
  if (
    !error ||
    typeof error !== "object" ||
    !("name" in error) ||
    typeof (error as { name: unknown }).name !== "string"
  ) {
    return "An unknown error occurred during authentication";
  }

  const errorWithName = error as { name: string };
  switch (errorWithName.name) {
    case "NotAllowedError":
      return "Authentication was cancelled or timed out";
    case "SecurityError":
      return "Authentication failed due to security reasons";
    case "NotSupportedError":
      return "This authentication method is not supported on your device";
    case "InvalidStateError":
      return "Authentication is not available right now";
    case "ConstraintError":
      return "Authentication failed due to device constraints";
    case "UnknownError":
      return "An unknown error occurred during authentication";
    default: {
      const message =
        typeof error === "object" &&
        error &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : errorWithName.name;
      return `Authentication failed: ${message || "Unknown error"}`;
    }
  }
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}

export function shouldRefreshToken(
  expiresAt: number,
  bufferMinutes: number = 5,
): boolean {
  const bufferMs = bufferMinutes * 60 * 1000;
  return Date.now() >= expiresAt - bufferMs;
}

export function parseJWTPayload<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const parts = token.split(".");
    const base64Url = parts[1];
    if (!base64Url) {
      return null;
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
