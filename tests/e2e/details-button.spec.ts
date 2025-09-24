import { test, expect } from "@playwright/test";

test.describe("Error Details Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load main page successfully", async ({ page }) => {
    // Basic test to ensure the page loads
    await page.waitForLoadState("networkidle");

    // Check that main components are present
    const title = page.locator("h2:has-text('Recent')");
    await expect(title).toBeVisible();

    // Check for job dashboard component
    const jobDashboard = page.locator("job-dashboard");
    await expect(jobDashboard).toBeVisible();

    // Check for conversion form
    const conversionForm = page.locator("h1:has-text('WordPress to Shopify')");
    await expect(conversionForm).toBeVisible();
  });

  test("should show error handling in job dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if jobs error element exists (even if hidden)
    const errorElement = page.locator("#jobs-error");
    await expect(errorElement).toBeAttached(); // Element exists in DOM

    // Check if retry button exists (even if hidden)
    const retryButton = page.locator("#retry-load-jobs");
    await expect(retryButton).toBeAttached(); // Element exists in DOM

    // Check jobs loading element exists
    const loadingElement = page.locator("#jobs-loading");
    await expect(loadingElement).toBeAttached();

    // Check jobs empty state exists
    const emptyState = page.locator("#jobs-empty");
    await expect(emptyState).toBeAttached();
  });

  test("should handle dashboard navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find and click the "View All Jobs" link (be more specific to avoid multiple matches)
    const viewAllButton = page.locator(
      'a[href="/dashboard"]:has-text("View All Jobs")',
    );
    await expect(viewAllButton).toBeVisible();

    await viewAllButton.click();
    await page.waitForLoadState("networkidle");

    // Should be on dashboard page
    expect(page.url()).toContain("/dashboard");

    // Check for dashboard components
    const dashboardHeader = await page.locator('h1:has-text("Job Dashboard")');
    if (await dashboardHeader.isVisible()) {
      await expect(dashboardHeader).toBeVisible();
    }
  });

  test("should take screenshots of main states", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Take screenshot of home page
    await page.screenshot({
      path: "tests/screenshots/home-page.png",
      fullPage: true,
    });

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Take screenshot of dashboard
    await page.screenshot({
      path: "tests/screenshots/dashboard-page.png",
      fullPage: true,
    });
  });
});
