/**
 * Astro Authentication Middleware - Modern Cookie-Based Auth
 *
 * Following official Astro best practices for authentication:
 * - Reads HTTP-only cookies set by backend
 * - Validates JWT tokens server-side
 * - Sets Astro.locals.user for components
 * - No client-side token management needed
 *
 * This replaces all localStorage token logic with secure server-side auth.
 */

import { defineMiddleware } from "astro:middleware";
import { createContextLogger } from "./utils/logger.ts";

// Use the Astro App.Locals User type from env.d.ts
// eslint-disable-next-line no-undef
type LocalsUser = App.Locals["user"];

// Create context-specific logger for authentication middleware
const authLogger = createContextLogger("Auth-Middleware");

// Backend API base URL - use nginx service for Docker internal networking
// Frontend container needs to route through nginx container, not localhost
const API_BASE = import.meta.env.VITE_SERVER_API_URL || "http://nginx-dev";

interface AuthResponse {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Validate user session by calling backend /auth/me with HTTP-only cookies
 */
async function validateUserSession(
  request: Request,
): Promise<NonNullable<LocalsUser> | null> {
  try {
    // Extract cookies from request to forward to backend
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      if (import.meta.env.DEV) {
        authLogger.debug("No cookies found in request headers");
      }
      return null;
    }

    if (import.meta.env.DEV) {
      authLogger.debug(`Found cookies: ${cookieHeader.substring(0, 100)}...`);
    }

    // Call backend /auth/me endpoint with cookies
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Accept: "application/json",
        "User-Agent": "Astro-Middleware/1.0",
      },
    });

    if (!response.ok) {
      // Log the specific auth failure for debugging
      if (import.meta.env.DEV) {
        authLogger.debug(
          `Backend auth failed: ${response.status} ${response.statusText}`,
        );
      }
      return null;
    }

    const userData: AuthResponse = await response.json();

    // Convert backend user format to Astro locals User type
    const user: NonNullable<LocalsUser> = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.full_name || userData.username,
      isActive: userData.is_active,
      isSuperuser: userData.is_superuser,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    };

    return user;
  } catch (error) {
    authLogger.error("Session validation failed", error);
    return null;
  }
}

/**
 * Check if request is for authentication-related endpoints that don't need auth
 */
function isAuthEndpoint(pathname: string): boolean {
  const authPaths = ["/api/auth/", "/auth/", "/login", "/register", "/oauth"];

  return authPaths.some((path) => pathname.startsWith(path));
}

/**
 * Main authentication middleware
 * Runs on every request to set authentication state
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, url, isPrerendered } = context;

  // Skip auth validation for prerendered pages (can't access request.headers)
  if (isPrerendered) {
    locals.user = null;
    locals.isAuthenticated = false;
    locals.isAdmin = false;
    return next();
  }

  // Skip auth validation for static assets and auth endpoints
  if (
    url.pathname.startsWith("/_astro/") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico") ||
    isAuthEndpoint(url.pathname)
  ) {
    return next();
  }

  try {
    // Validate user session using HTTP-only cookies
    const user = await validateUserSession(request);

    // Set authentication state in Astro.locals for all components
    locals.user = user;
    locals.isAuthenticated = !!user;
    locals.isAdmin = user?.isSuperuser || false;

    // Log authentication state for debugging (development only)
    if (import.meta.env.DEV) {
      authLogger.debug(
        `${url.pathname} - User: ${user ? user.username : "anonymous"} (cookies: ${request.headers.get("cookie") ? "present" : "none"})`,
      );
    }
  } catch (error) {
    authLogger.error("Unexpected error in middleware", error);

    // Fail securely - no auth state set
    locals.user = null;
    locals.isAuthenticated = false;
    locals.isAdmin = false;
  }

  return next();
});
