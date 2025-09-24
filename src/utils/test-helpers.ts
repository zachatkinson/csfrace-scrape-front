import { test, expect } from "@playwright/test";
import type { Page, BrowserContext } from "@playwright/test";

export interface ITestAuthUser {
  email: string;
  password: string;
  name: string;
}

export interface ISecurityTestOptions {
  checkCSP?: boolean;
  checkXSSProtection?: boolean;
  checkClickjacking?: boolean;
  checkMixedContent?: boolean;
}

export class SecurityTestHelpers {
  static async checkSecurityHeaders(page: Page): Promise<void> {
    await test.step("Check security headers", async () => {
      const response = await page.goto("/");
      expect(response).toBeTruthy();

      const headers = response?.headers();
      expect(headers).toBeDefined();
      if (!headers) return;

      // Content Security Policy
      expect(headers["content-security-policy"]).toBeDefined();
      expect(headers["content-security-policy"]).toContain(
        "default-src 'self'",
      );

      // X-Frame-Options
      expect(headers["x-frame-options"]).toBe("DENY");

      // X-Content-Type-Options
      expect(headers["x-content-type-options"]).toBe("nosniff");

      // Referrer-Policy
      expect(headers["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin",
      );

      // X-XSS-Protection
      expect(headers["x-xss-protection"]).toBe("1; mode=block");
    });
  }

  static async testXSSProtection(
    page: Page,
    inputSelector: string,
  ): Promise<void> {
    await test.step("Test XSS protection", async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
        'data:text/html,<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        "';alert(\"xss\");'",
        "<iframe src=\"javascript:alert('xss')\"></iframe>",
      ];

      for (const maliciousInput of maliciousInputs) {
        await page.fill(inputSelector, maliciousInput);
        await page.press(inputSelector, "Tab");

        // Check that no alert dialogs appear
        const dialogs: string[] = [];
        page.on("dialog", (dialog) => {
          dialogs.push(dialog.message());
          dialog.dismiss();
        });

        await page.waitForTimeout(1000);
        expect(dialogs).toHaveLength(0);

        // Check that the input is properly sanitized
        const value = await page.inputValue(inputSelector);
        expect(value).not.toContain("<script>");
        expect(value).not.toContain("javascript:");
        expect(value).not.toContain("onerror");
        expect(value).not.toContain("onload");
      }
    });
  }

  static async testCSRFProtection(
    page: Page,
    formSelector: string,
  ): Promise<void> {
    await test.step("Test CSRF protection", async () => {
      // Navigate to form page
      await page.goto("/");

      // Check for CSRF token in form
      const csrfToken = await page.getAttribute(
        `${formSelector} input[name="csrf-token"], ${formSelector} input[name="_token"]`,
        "value",
      );

      expect(csrfToken).toBeDefined();
      expect(csrfToken).toHaveLength(32); // Should be a 32-character token

      // Try to submit form without CSRF token (should fail)
      await page.evaluate((selector) => {
        const form = document.querySelector(selector) as HTMLFormElement;
        const csrfInput = form.querySelector(
          'input[name="csrf-token"], input[name="_token"]',
        ) as HTMLInputElement;
        if (csrfInput) {
          csrfInput.remove();
        }
      }, formSelector);

      const responsePromise = page.waitForResponse(
        (response) => response.status() === 403 || response.status() === 422,
      );

      await page.click(`${formSelector} button[type="submit"]`);

      const response = await responsePromise;
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  }

  static async testClickjackingProtection(page: Page): Promise<void> {
    await test.step("Test clickjacking protection", async () => {
      const response = await page.goto("/");
      const headers = response?.headers();
      expect(headers).toBeDefined();
      if (!headers) return;

      // Check X-Frame-Options header
      expect(headers["x-frame-options"]).toBe("DENY");

      // Check CSP frame-ancestors directive
      const csp = headers["content-security-policy"];
      expect(csp).toContain("frame-ancestors 'none'");
    });
  }

  static async testMixedContentProtection(page: Page): Promise<void> {
    await test.step("Test mixed content protection", async () => {
      const response = await page.goto("/");
      const headers = response?.headers();
      expect(headers).toBeDefined();
      if (!headers) return;

      // Check for upgrade-insecure-requests in CSP
      const csp = headers["content-security-policy"];
      expect(csp).toContain("upgrade-insecure-requests");
    });
  }

  static async runFullSecurityAudit(
    page: Page,
    options: ISecurityTestOptions = {},
  ): Promise<void> {
    const {
      checkCSP = true,
      checkXSSProtection = true,
      checkClickjacking = true,
      checkMixedContent = true,
    } = options;

    if (checkCSP) {
      await this.checkSecurityHeaders(page);
    }

    if (checkXSSProtection) {
      // Look for input fields to test XSS protection
      const inputSelectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[type="search"]',
        "textarea",
      ];

      for (const selector of inputSelectors) {
        const element = await page.$(selector);
        if (element) {
          await this.testXSSProtection(page, selector);
          break; // Test with first available input
        }
      }
    }

    if (checkClickjacking) {
      await this.testClickjackingProtection(page);
    }

    if (checkMixedContent) {
      await this.testMixedContentProtection(page);
    }
  }
}

export class AuthTestHelpers {
  static readonly TEST_USERS: Record<string, ITestAuthUser> = {
    valid: {
      email: "test@example.com",
      password: process.env.VITE_TEST_USER_PASSWORD || "SecureTestPass123!",
      name: "Test User",
    },
    admin: {
      email: "admin@example.com",
      password: process.env.VITE_TEST_ADMIN_PASSWORD || "SecureAdminPass123!",
      name: "Admin User",
    },
  };

  static async login(page: Page, user: ITestAuthUser): Promise<void> {
    await test.step(`Login as ${user.email}`, async () => {
      await page.goto("/auth/login");

      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      await page.click('button[type="submit"]');

      // Wait for successful login redirect
      await page.waitForURL(/dashboard|home/);

      // Verify authentication state
      const authToken = await page.evaluate(() =>
        window.sessionStorage.getItem("csfrace_access_token"),
      );
      expect(authToken).toBeTruthy();
    });
  }

  static async logout(page: Page): Promise<void> {
    await test.step("Logout user", async () => {
      await page.click(
        '[data-testid="logout-button"], button:has-text("Logout")',
      );

      // Wait for logout redirect
      await page.waitForURL(/login|home/);

      // Verify auth state is cleared
      const authToken = await page.evaluate(() =>
        window.sessionStorage.getItem("csfrace_access_token"),
      );
      expect(authToken).toBeFalsy();
    });
  }

  static async setupAuthenticatedSession(
    context: BrowserContext,
    user: ITestAuthUser,
  ): Promise<void> {
    await test.step(`Setup authenticated session for ${user.email}`, async () => {
      const page = await context.newPage();
      await this.login(page, user);
      await page.close();
    });
  }
}

export class PerformanceTestHelpers {
  static async measurePageLoad(page: Page, url: string): Promise<number> {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    const endTime = Date.now();

    return endTime - startTime;
  }

  static async measureFirstContentfulPaint(
    page: Page,
    url: string,
  ): Promise<number> {
    await page.goto(url);

    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === "first-contentful-paint") {
              observer.disconnect();
              resolve(entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ["paint"] });
      });
    });

    return fcp;
  }

  static async auditBundleSize(
    page: Page,
  ): Promise<{ totalSize: number; jsSize: number; cssSize: number }> {
    await page.goto("/");

    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];

      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;

      entries.forEach((entry) => {
        const size = entry.transferSize || 0;
        totalSize += size;

        if (entry.name.endsWith(".js") || entry.name.includes("javascript")) {
          jsSize += size;
        } else if (entry.name.endsWith(".css") || entry.name.includes("css")) {
          cssSize += size;
        }
      });

      return { totalSize, jsSize, cssSize };
    });

    return resources;
  }
}

export class AccessibilityTestHelpers {
  static async checkKeyboardNavigation(page: Page): Promise<void> {
    await test.step("Check keyboard navigation", async () => {
      await page.goto("/");

      // Tab through interactive elements
      const focusableElements = await page.$$(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])',
      );

      expect(focusableElements.length).toBeGreaterThan(0);

      // Test Tab navigation
      await page.keyboard.press("Tab");
      const focusedElement = page.locator(":focus");
      expect(focusedElement).toBeDefined();

      // Test Shift+Tab navigation
      await page.keyboard.press("Shift+Tab");
    });
  }

  static async checkColorContrast(page: Page): Promise<void> {
    await test.step("Check color contrast", async () => {
      await page.goto("/");

      const contrastIssues = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("*"));
        const issues: string[] = [];

        elements.forEach((element) => {
          const styles = window.getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          // Simple contrast check (would need proper contrast calculation in real implementation)
          if (color === backgroundColor) {
            issues.push(
              `Element has same color and background-color: ${element.tagName}`,
            );
          }
        });

        return issues;
      });

      expect(contrastIssues).toHaveLength(0);
    });
  }
}

// Common test data
export const TEST_DATA = {
  VALID_URLS: [
    "https://example.com",
    "https://wordpress.com/blog",
    "https://github.com/user/repo",
  ],

  INVALID_URLS: [
    "not-a-url",
    "ftp://example.com",
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
  ],

  XSS_PAYLOADS: [
    '<script>alert("xss")</script>',
    '"><script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
    'javascript:alert("xss")',
    'data:text/html,<script>alert("xss")</script>',
  ],
} as const;
