/**
 * Simple Auth API Utilities - Following Astro Best Practices
 * DRY: Centralized auth API calls without service abstractions
 * SOLID: Single responsibility - just make API calls to Docker backend
 * 
 * NO SERVICES, NO MANAGERS, NO PROVIDERS - Just simple fetch() calls!
 */

import { getApiBaseUrl } from '../constants/api';
import { handleApiResponse } from './api-utils.ts';

const API_BASE = getApiBaseUrl();

/**
 * Login with email/password - Direct call to Docker backend
 */
export async function login(email: string, password: string) {
  const formData = new FormData();
  formData.append('username', email); // OAuth2 spec uses 'username'
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await handleApiResponse<{
    access_token: string;
    refresh_token: string;
    token_type: string;
  }>(response);
  
  // Store tokens in localStorage (simple, no service needed)
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data;
}

/**
 * Register new user - Direct call to Docker backend
 */
export async function register(email: string, password: string, fullName?: string) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
    }),
  });
  
  return handleApiResponse(response);
}

/**
 * Get current user - Direct call to Docker backend
 */
export async function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    // Token might be expired, try refresh
    const refreshed = await refreshToken();
    if (!refreshed) return null;
    
    // Retry with new token
    const retryResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    return handleApiResponse(retryResponse);
  }
  
  return handleApiResponse(response);
}

/**
 * Refresh access token - Direct call to Docker backend
 */
export async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    
    const data = await handleApiResponse<{
      access_token: string;
      refresh_token: string;
    }>(response);
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return true;
  } catch {
    // Refresh failed, clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return false;
  }
}

/**
 * Logout - Clear tokens locally
 */
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // Optionally call backend /auth/revoke-token if needed
  window.location.href = '/';
}

/**
 * OAuth login - Direct redirect to Docker backend
 */
export function loginWithOAuth(provider: 'google' | 'github') {
  window.location.href = `${API_BASE}/auth/oauth/${provider}/login`;
}

/**
 * WebAuthn/Passkey registration - Direct call to Docker backend
 */
export async function registerPasskey() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Not authenticated');
  
  // Step 1: Begin registration
  const beginResponse = await fetch(`${API_BASE}/auth/passkeys/register/begin`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const options = await handleApiResponse(beginResponse) as CredentialCreationOptions;

  // Step 2: Create credential using WebAuthn API
  const credential = await navigator.credentials.create(options);
  
  // Step 3: Complete registration
  const completeResponse = await fetch(`${API_BASE}/auth/passkeys/register/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credential),
  });
  
  return handleApiResponse(completeResponse);
}

/**
 * WebAuthn/Passkey authentication - Direct call to Docker backend
 */
export async function authenticateWithPasskey() {
  // Step 1: Begin authentication
  const beginResponse = await fetch(`${API_BASE}/auth/passkeys/authenticate/begin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  const options = await handleApiResponse(beginResponse) as CredentialRequestOptions;

  // Step 2: Get credential using WebAuthn API
  const credential = await navigator.credentials.get(options);
  
  // Step 3: Complete authentication
  const completeResponse = await fetch(`${API_BASE}/auth/passkeys/authenticate/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credential),
  });
  
  const data = await handleApiResponse<{
    access_token: string;
    refresh_token: string;
  }>(completeResponse);
  
  // Store tokens
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data;
}

/**
 * Simple auth state check
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}