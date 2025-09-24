import { test, expect } from "@playwright/test";

test.describe("Health Status Persistence", () => {
  test("should maintain page state between navigations", async ({ page }) => {
    // Start on home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify home page loads correctly
    const homeTitle = page.locator('h2:has-text("Recent")');
    await expect(homeTitle).toBeVisible();

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Navigate back to home
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify page still works after navigation
    await expect(homeTitle).toBeVisible();
  });

  test("should handle localStorage and sessionStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if browser storage is accessible
    const storageInfo = await page.evaluate(() => {
      try {
        // Test localStorage
        localStorage.setItem("test", "value");
        const localTest = localStorage.getItem("test");
        localStorage.removeItem("test");

        // Test sessionStorage
        sessionStorage.setItem("test", "value");
        const sessionTest = sessionStorage.getItem("test");
        sessionStorage.removeItem("test");

        return {
          localStorage: localTest === "value",
          sessionStorage: sessionTest === "value",
          storageKeys: {
            local: Object.keys(localStorage),
            session: Object.keys(sessionStorage),
          },
        };
      } catch (error) {
        return {
          localStorage: false,
          sessionStorage: false,
          error: error.message,
        };
      }
    });

    expect(storageInfo.localStorage).toBe(true);
    expect(storageInfo.sessionStorage).toBe(true);
  });

  test("should handle page refresh gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get initial page state
    const initialTitle = await page
      .locator('h2:has-text("Recent")')
      .textContent();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Page should still load correctly after refresh
    const refreshedTitle = await page
      .locator('h2:has-text("Recent")')
      .textContent();
    expect(refreshedTitle).toBe(initialTitle);
  });

  test("should maintain form state appropriately", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for form inputs
    const urlInput = page.locator('input[type="url"]').first();

    if (await urlInput.isVisible()) {
      // Fill in a test URL
      await urlInput.fill("https://example.com");

      // Verify the value was set
      const inputValue = await urlInput.inputValue();
      expect(inputValue).toBe("https://example.com");

      // Navigate away and back
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Form should be reset (this is expected behavior)
      const resetValue = await urlInput.inputValue();
      expect(resetValue).toBe(""); // Forms typically reset on navigation
    }
  });

  test("should handle multiple page types", async ({ page }) => {
    // Test different page types
    const pages = ["/", "/dashboard", "/test-health"];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState("networkidle");

      // Each page should load without errors
      const hasContent = await page.evaluate(() => {
        return document.body.innerHTML.length > 100; // Basic content check
      });

      expect(hasContent).toBe(true);
    }
  });

  test("should handle browser back/forward navigation", async ({ page }) => {
    // Start on home
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Use browser back button
    await page.goBack();
    await page.waitForLoadState("networkidle");

    // Should be back on home page
    const homeTitle = page.locator('h2:has-text("Recent")');
    await expect(homeTitle).toBeVisible();

    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState("networkidle");

    // Should be back on dashboard
    expect(page.url()).toContain("/dashboard");
  });

  test("should maintain consistent UI state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for consistent UI elements that should persist
    const mainLayout = page.locator("body");
    await expect(mainLayout).toBeVisible();

    // Check for any persistent UI elements like navigation
    const mainSection = page.locator("section").first();
    await expect(mainSection).toBeVisible();

    // Navigate and check UI consistency
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await expect(mainLayout).toBeVisible();
  });
});
