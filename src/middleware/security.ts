import type { APIContext, MiddlewareNext } from "astro";

interface ISecurityHeaders {
  contentSecurityPolicy: string;
  frameOptions: string;
  contentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: string;
  strictTransportSecurity: string;
}

export class SecurityMiddleware {
  private static readonly DEFAULT_CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' ws: wss: https://api.github.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  private static readonly SECURITY_HEADERS: ISecurityHeaders = {
    contentSecurityPolicy: this.DEFAULT_CSP,
    frameOptions: "DENY",
    contentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: [
      "camera=(),",
      "microphone=(),",
      "geolocation=(),",
      "payment=(),",
      "usb=(),",
      "magnetometer=(),",
      "accelerometer=(),",
      "gyroscope=()",
    ].join(" "),
    strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  };

  public static async handle(context: APIContext, next: MiddlewareNext) {
    const response = await next();

    // Apply security headers
    this.applySecurityHeaders(response);

    // Apply CSRF protection
    this.applyCsrfProtection(context, response);

    return response;
  }

  private static applySecurityHeaders(response: Response): void {
    const headers = new Headers(response.headers);

    // Content Security Policy
    headers.set(
      "Content-Security-Policy",
      this.SECURITY_HEADERS.contentSecurityPolicy,
    );

    // X-Frame-Options
    headers.set("X-Frame-Options", this.SECURITY_HEADERS.frameOptions);

    // X-Content-Type-Options
    headers.set(
      "X-Content-Type-Options",
      this.SECURITY_HEADERS.contentTypeOptions,
    );

    // Referrer-Policy
    headers.set("Referrer-Policy", this.SECURITY_HEADERS.referrerPolicy);

    // Permissions-Policy
    headers.set("Permissions-Policy", this.SECURITY_HEADERS.permissionsPolicy);

    // Strict-Transport-Security (only in production)
    if (import.meta.env.PROD) {
      headers.set(
        "Strict-Transport-Security",
        this.SECURITY_HEADERS.strictTransportSecurity,
      );
    }

    // X-XSS-Protection (legacy browsers)
    headers.set("X-XSS-Protection", "1; mode=block");

    // Remove potentially sensitive headers
    headers.delete("Server");
    headers.delete("X-Powered-By");

    // Set secure cookie attributes
    const setCookieHeader = headers.get("Set-Cookie");
    if (setCookieHeader) {
      const secureCookie = this.makeSecureCookie(setCookieHeader);
      headers.set("Set-Cookie", secureCookie);
    }
  }

  private static applyCsrfProtection(
    context: APIContext,
    _response: Response,
  ): void {
    const method = context.request.method;

    // Generate CSRF token for forms
    if (method === "GET" && context.url.pathname.includes("auth")) {
      const csrfToken = this.generateCSRFToken();
      context.cookies.set("csrf-token", csrfToken, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict",
        maxAge: 3600, // 1 hour
      });
    }

    // Validate CSRF token for state-changing operations
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const tokenFromHeader = context.request.headers.get("X-CSRF-Token");
      const tokenFromCookie = context.cookies.get("csrf-token")?.value;

      if (
        !tokenFromHeader ||
        !tokenFromCookie ||
        tokenFromHeader !== tokenFromCookie
      ) {
        throw new Response("CSRF token validation failed", { status: 403 });
      }
    }
  }

  private static makeSecureCookie(cookieHeader: string): string {
    const cookies = cookieHeader.split(",").map((cookie) => {
      let secureCookie = cookie.trim();

      // Add Secure flag in production
      if (import.meta.env.PROD && !secureCookie.includes("Secure")) {
        secureCookie += "; Secure";
      }

      // Add HttpOnly if not present
      if (!secureCookie.includes("HttpOnly")) {
        secureCookie += "; HttpOnly";
      }

      // Add SameSite=Strict if not present
      if (!secureCookie.includes("SameSite")) {
        secureCookie += "; SameSite=Strict";
      }

      return secureCookie;
    });

    return cookies.join(", ");
  }

  private static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  public static getCSPForInlineStyles(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' ws: wss:",
    ].join("; ");
  }
}

export interface IRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private static readonly requests = new Map<string, number[]>();

  public static isAllowed(
    identifier: string,
    config: IRateLimitConfig = { windowMs: 900000, maxRequests: 100 },
  ): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const validRequests = userRequests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= config.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  public static getRemainingRequests(
    identifier: string,
    config: IRateLimitConfig = { windowMs: 900000, maxRequests: 100 },
  ): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter((time) => time > windowStart);

    return Math.max(0, config.maxRequests - validRequests.length);
  }

  public static cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter((time) => time > oneHourAgo);

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Auto-cleanup every hour
if (typeof window !== "undefined") {
  setInterval(() => RateLimiter.cleanup(), 3600000);
}

export default SecurityMiddleware.handle;
