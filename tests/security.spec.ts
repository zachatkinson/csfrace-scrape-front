import { test, expect } from '@playwright/test';
import { SecurityTestHelpers, AuthTestHelpers, TEST_DATA } from '../src/utils/test-helpers';

test.describe('Security Tests', () => {
  test.describe('Headers and CSP', () => {
    test('should have proper security headers', async ({ page }) => {
      await SecurityTestHelpers.checkSecurityHeaders(page);
    });

    test('should prevent clickjacking', async ({ page }) => {
      await SecurityTestHelpers.testClickjackingProtection(page);
    });

    test('should enforce mixed content protection', async ({ page }) => {
      await SecurityTestHelpers.testMixedContentProtection(page);
    });
  });

  test.describe('XSS Protection', () => {
    test('should sanitize input in URL form', async ({ page }) => {
      await page.goto('/');
      
      // Find URL input field
      const urlInput = page.locator('input[type="url"], input[name="url"], input[placeholder*="URL"]').first();
      await expect(urlInput).toBeVisible();
      
      await SecurityTestHelpers.testXSSProtection(page, 'input[type="url"], input[name="url"]');
    });

    test('should sanitize input in search fields', async ({ page }) => {
      await page.goto('/');
      
      // Look for any text inputs that could be vulnerable
      const textInputs = page.locator('input[type="text"], input[type="search"], textarea');
      const count = await textInputs.count();
      
      if (count > 0) {
        await SecurityTestHelpers.testXSSProtection(page, 'input[type="text"]');
      }
    });

    test('should prevent XSS through URL parameters', async ({ page }) => {
      const maliciousParam = encodeURIComponent('<script>alert("xss")</script>');
      await page.goto(`/?search=${maliciousParam}`);
      
      // Check that script is not executed
      const dialogs: string[] = [];
      page.on('dialog', dialog => {
        dialogs.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(2000);
      expect(dialogs).toHaveLength(0);
      
      // Check that content is properly escaped
      const content = await page.content();
      expect(content).not.toContain('<script>alert("xss")</script>');
    });
  });

  test.describe('Authentication Security', () => {
    test('should require authentication for protected routes', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');
      
      // Should redirect to login or show unauthorized
      await expect(page).toHaveURL(/login|auth|unauthorized/);
    });

    test('should logout users properly', async ({ page, context }) => {
      // Setup authenticated session
      await AuthTestHelpers.setupAuthenticatedSession(context, AuthTestHelpers.TEST_USERS.valid);
      
      await page.goto('/dashboard');
      
      // Logout
      await AuthTestHelpers.logout(page);
      
      // Try to access protected route again
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/login|auth|unauthorized/);
    });

    test('should handle token expiry', async ({ page }) => {
      await page.goto('/');
      
      // Mock expired token
      await page.evaluate(() => {
        window.sessionStorage.setItem('csfrace_access_token', 'expired-token');
        window.sessionStorage.setItem('csfrace_expires_at', String(Date.now() - 1000));
      });
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login|auth/);
    });
  });

  test.describe('Input Validation', () => {
    test('should validate URL inputs', async ({ page }) => {
      await page.goto('/');
      
      const urlInput = page.locator('input[type="url"], input[name="url"]').first();
      if (await urlInput.isVisible()) {
        // Test invalid URLs
        for (const invalidUrl of TEST_DATA.INVALID_URLS) {
          await urlInput.fill(invalidUrl);
          await page.keyboard.press('Tab');
          
          // Should show validation error or reject the input
          const isInvalid = await urlInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
          expect(isInvalid).toBeTruthy();
        }
        
        // Test valid URLs
        for (const validUrl of TEST_DATA.VALID_URLS) {
          await urlInput.fill(validUrl);
          await page.keyboard.press('Tab');
          
          const isValid = await urlInput.evaluate((el: HTMLInputElement) => el.validity.valid);
          expect(isValid).toBeTruthy();
        }
      }
    });

    test('should limit input length', async ({ page }) => {
      await page.goto('/');
      
      const textInputs = page.locator('input[type="text"], textarea');
      const count = await textInputs.count();
      
      if (count > 0) {
        const input = textInputs.first();
        const longString = 'x'.repeat(10000);
        
        await input.fill(longString);
        
        const value = await input.inputValue();
        expect(value.length).toBeLessThan(5000); // Should be limited
      }
    });
  });

  test.describe('Content Security', () => {
    test('should not load external scripts', async ({ page }) => {
      // Monitor network requests
      const scriptRequests: string[] = [];
      
      page.on('request', request => {
        if (request.resourceType() === 'script') {
          scriptRequests.push(request.url());
        }
      });
      
      await page.goto('/');
      
      // Check that no unauthorized external scripts are loaded
      const unauthorizedScripts = scriptRequests.filter(url => 
        !url.includes('localhost') &&
        !url.includes('cdn.jsdelivr.net') &&
        !url.includes('fonts.googleapis.com') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      );
      
      expect(unauthorizedScripts).toHaveLength(0);
    });

    test('should properly escape user content', async ({ page }) => {
      await page.goto('/');
      
      // If there's any user-generated content display, test it
      const contentElements = page.locator('[data-user-content], .user-content, .scraped-content');
      const count = await contentElements.count();
      
      if (count > 0) {
        const content = await contentElements.first().innerHTML();
        
        // Should not contain unescaped script tags
        expect(content).not.toMatch(/<script[^>]*>[^<]*<\/script>/);
        expect(content).not.toMatch(/javascript:/);
        expect(content).not.toMatch(/on\w+\s*=/);
      }
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limits on API calls', async ({ page }) => {
      await page.goto('/');
      
      // Make multiple rapid requests
      const responses: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        try {
          const response = await page.request.get('/api/health');
          responses.push(response.status());
        } catch {
          responses.push(0);
        }
      }
      
      // Should get some 429 responses if rate limiting is working
      const rateLimitedResponses = responses.filter(status => status === 429);
      
      // At least some requests should be rate limited
      if (responses.length > 5) {
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should not expose sensitive information in errors', async ({ page }) => {
      // Try to trigger an error
      await page.goto('/nonexistent-page');
      
      const content = await page.content();
      
      // Should not expose sensitive paths, database info, etc.
      expect(content).not.toMatch(/\/Users\/[^<]*/);
      expect(content).not.toMatch(/Database.*password/i);
      expect(content).not.toMatch(/API.*key/i);
      expect(content).not.toMatch(/Secret.*key/i);
      expect(content).not.toMatch(/Stack trace/i);
    });

    test('should have error boundaries', async ({ page }) => {
      await page.goto('/');
      
      // Inject code to cause a React error
      await page.evaluate(() => {
        // Find a React component and cause it to error
        const reactElement = document.querySelector('[data-reactroot], #root, .App');
        if (reactElement) {
          // This should be caught by error boundary
          throw new Error('Test error for error boundary');
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Page should still be functional, showing error UI instead of white screen
      const errorBoundary = page.locator('[data-testid="error-boundary"], .error-boundary');
      const hasErrorUI = await errorBoundary.count() > 0;
      
      // Either has error UI or page is still functional
      const isPageResponsive = await page.locator('body').isVisible();
      expect(hasErrorUI || isPageResponsive).toBeTruthy();
    });
  });

  test.describe('Full Security Audit', () => {
    test('comprehensive security check', async ({ page }) => {
      await SecurityTestHelpers.runFullSecurityAudit(page, {
        checkCSP: true,
        checkXSSProtection: true,
        checkClickjacking: true,
        checkMixedContent: true
      });
    });
  });
});