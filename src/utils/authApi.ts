/**
 * Modern Auth API Utilities - Cookie-Based Authentication
 *
 * IMPORTANT: This file now uses HTTP-only cookies instead of localStorage.
 * No client-side token management needed - everything handled by browser cookies.
 *
 * Authentication state is managed by Astro middleware, not client-side.
 */

/// <reference lib="dom" />

const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost";

/**
 * Login with email/password - Uses HTTP-only cookies
 * Backend automatically sets secure cookies on successful login
 */
export async function login(email: string, password: string): Promise<boolean> {
  const formData = new FormData();
  formData.append("username", email); // OAuth2 spec uses 'username'
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/auth/token`, {
    method: "POST",
    body: formData,
    credentials: "include", // Include HTTP-only cookies
  });

  if (response.ok) {
    // Backend sets HTTP-only cookies automatically
    // No client-side token storage needed
    return true;
  }

  throw new Error("Login failed");
}

/**
 * Register new user - Uses HTTP-only cookies
 */
export async function register(
  email: string,
  password: string,
  fullName?: string,
): Promise<boolean> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // Include HTTP-only cookies
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
    }),
  });

  if (response.ok) {
    return true;
  }

  const error = await response.text();
  throw new Error(error || "Registration failed");
}

/**
 * Get current user - Uses HTTP-only cookies
 * NOTE: This is now handled by Astro middleware.
 * Use Astro.locals.user instead of calling this directly.
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include", // Include HTTP-only cookies
    headers: {
      Accept: "application/json",
    },
  });

  if (response.ok) {
    return await response.json();
  }

  return null;
}

/**
 * Logout - Clear HTTP-only cookies
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include", // Include HTTP-only cookies
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Logout request failed, but continuing...");
    }
  } catch (error) {
    console.error("Logout failed:", error);
    // Don't throw - logout should always succeed from UI perspective
  }

  // Redirect to clear any cached state
  window.location.href = "/";
}

/**
 * OAuth login - Redirect through nginx proxy
 */
export function loginWithOAuth(provider: "google" | "github") {
  window.location.href = `${API_BASE}/auth/oauth/${provider}/login`;
}

/**
 * WebAuthn/Passkey registration - Uses HTTP-only cookies
 */
export async function registerPasskey() {
  // Step 1: Begin registration
  const beginResponse = await fetch(
    `${API_BASE}/auth/passkeys/register/begin`,
    {
      method: "POST",
      credentials: "include", // Include HTTP-only cookies
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!beginResponse.ok) {
    throw new Error("Failed to begin passkey registration");
  }

  const options = await beginResponse.json();

  // Step 2: Create credential using WebAuthn API
  const credential = await navigator.credentials.create(options);

  // Step 3: Complete registration
  const completeResponse = await fetch(
    `${API_BASE}/auth/passkeys/register/complete`,
    {
      method: "POST",
      credentials: "include", // Include HTTP-only cookies
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credential),
    },
  );

  if (!completeResponse.ok) {
    throw new Error("Failed to complete passkey registration");
  }

  return await completeResponse.json();
}

/**
 * WebAuthn/Passkey authentication - Uses HTTP-only cookies
 */
export async function authenticateWithPasskey(): Promise<boolean> {
  // Step 1: Begin authentication
  const beginResponse = await fetch(
    `${API_BASE}/auth/passkeys/authenticate/begin`,
    {
      method: "POST",
      credentials: "include", // Include HTTP-only cookies
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!beginResponse.ok) {
    throw new Error("Failed to begin passkey authentication");
  }

  const options = await beginResponse.json();

  // Step 2: Get credential using WebAuthn API
  const credential = await navigator.credentials.get(options);

  // Step 3: Complete authentication
  const completeResponse = await fetch(
    `${API_BASE}/auth/passkeys/authenticate/complete`,
    {
      method: "POST",
      credentials: "include", // Include HTTP-only cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credential),
    },
  );

  if (completeResponse.ok) {
    // Backend sets HTTP-only cookies automatically
    return true;
  }

  throw new Error("Passkey authentication failed");
}

/**
 * DEPRECATED FUNCTIONS REMOVED
 *
 * The following functions have been removed as part of the migration
 * to HTTP-only cookie authentication:
 *
 * - isAuthenticated(): Use Astro.locals.isAuthenticated instead
 * - getAuthHeaders(): Use credentials: "include" instead
 *
 * Authentication state is now managed by Astro middleware.
 */
