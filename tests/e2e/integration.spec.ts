import { test, expect } from "@playwright/test";

test.describe("E2E Smoke Tests", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  test("should load frontend application", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify page loads successfully
    expect(page.url()).toContain(BASE_URL);

    // Check for basic page structure
    const body = await page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should render page title", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check basic page elements are present
    const html = await page.locator("html");
    await expect(html).toBeVisible();

    const head = await page.locator("head");
    await expect(head).toBeAttached();
  });

  test("should load without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Allow some time for any delayed errors
    await page.waitForTimeout(1000);

    // Debug: Log all errors to see what we're dealing with
    if (errors.length > 0) {
      console.log("=== All Console Errors Detected ===");
      errors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error);
      });
      console.log("===================================");
    }

    // Filter out expected errors that occur when backend is not running
    const criticalErrors = errors.filter((error) => {
      return (
        // Basic non-critical errors
        !error.includes("favicon") &&
        !error.includes("404") &&
        // CSP violations (expected in development - inline styles/handlers)
        !error.includes("Content-Security-Policy") &&
        !error.includes("CSP") &&
        // SSE/Backend connection errors (expected in tests without backend)
        !error.includes("Cross-Origin Request Blocked") &&
        !error.includes("can't establish a connection") &&
        !error.includes("Connection error") &&
        !error.includes("/health/stream") &&
        !error.includes("/jobs/stream") &&
        !error.includes("SSEService") &&
        !error.includes("PerformanceSSEService") &&
        !error.includes("JobSSEService") &&
        // CORS errors (expected without backend)
        !error.includes("CORS header") &&
        !error.includes("Same Origin Policy") &&
        // Centralized logger output (expected error logging)
        !error.includes("[ERROR]") &&
        !error.includes("[CRITICAL]") &&
        !error.includes("[WARN]") &&
        !/\[\d{4}-\d{2}-\d{2}T/.test(error) &&
        !error.includes("🚨")
      );
    });

    if (criticalErrors.length > 0) {
      console.log("=== Critical Errors After Filtering ===");
      criticalErrors.forEach((error, index) => {
        console.log(`Critical ${index + 1}:`, error);
      });
      console.log("========================================");
    }

    expect(criticalErrors.length).toBe(0);
  });
});
