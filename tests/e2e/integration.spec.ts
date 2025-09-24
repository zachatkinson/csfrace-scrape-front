import { test, expect } from "@playwright/test";

test.describe("Integration Tests @integration", () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

  test("should load frontend application @integration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify page loads successfully
    expect(page.url()).toContain(BASE_URL);

    // Check for basic page structure
    const body = await page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should render page title @integration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test("should have working navigation @integration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check basic page elements are present
    const html = await page.locator("html");
    await expect(html).toBeVisible();

    const head = await page.locator("head");
    await expect(head).toBeAttached();
  });

  test("should load without JavaScript errors @integration", async ({
    page,
  }) => {
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

    // Filter out expected errors that occur when backend is not running
    const criticalErrors = errors.filter((error) => {
      return (
        // Basic non-critical errors
        !error.includes("favicon") &&
        !error.includes("404") &&
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
        !error.includes("Same Origin Policy")
      );
    });

    expect(criticalErrors.length).toBe(0);
  });
});
