import { test, expect } from "@playwright/test";

test.describe("Health Monitoring System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display basic page structure", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check that main page loads successfully
    const mainContent = page.locator("section").first();
    await expect(mainContent).toBeVisible();

    // Check for main components
    const conversionForm = page.locator("h2:has-text('Convert')");
    const jobDashboard = page.locator("h2:has-text('Recent')");

    await expect(conversionForm).toBeVisible();
    await expect(jobDashboard).toBeVisible();
  });

  test("should load test-health page successfully", async ({ page }) => {
    await page.goto("/test-health");
    await page.waitForLoadState("networkidle");

    // Check for health dashboard title
    const dashboardTitle = page.locator(
      'h1:has-text("System Health Dashboard")',
    );
    await expect(dashboardTitle).toBeVisible();

    // Check for refresh button
    const refreshButton = page.locator("#refresh-all-btn");
    await expect(refreshButton).toBeVisible();

    // Check for overall status section
    const overallStatus = page.locator("#overall-status");
    await expect(overallStatus).toBeVisible();

    // Test refresh functionality
    await refreshButton.click();
    await page.waitForTimeout(1000); // Allow time for refresh
  });

  test("should show system performance overview", async ({ page }) => {
    await page.goto("/test-health");
    await page.waitForLoadState("networkidle");

    // Check for performance metrics section
    const performanceSection = page.locator(
      'h3:has-text("System Performance Overview")',
    );
    await expect(performanceSection).toBeVisible();

    // Check for performance metrics
    const cpuUsage = page.locator("#cpu-usage");
    const memoryUsage = page.locator("#memory-usage");

    await expect(cpuUsage).toBeVisible();
    await expect(memoryUsage).toBeVisible();
  });

  test("should have export functionality", async ({ page }) => {
    await page.goto("/test-health");
    await page.waitForLoadState("networkidle");

    // Check for export buttons
    const exportJsonBtn = page.locator("#export-json-btn");
    const exportCsvBtn = page.locator("#export-csv-btn");

    await expect(exportJsonBtn).toBeVisible();
    await expect(exportCsvBtn).toBeVisible();

    // Test clicking export buttons (they may not work without backend, but should not error)
    await exportJsonBtn.click();
    await page.waitForTimeout(500);

    await exportCsvBtn.click();
    await page.waitForTimeout(500);
  });

  test("should display raw data preview", async ({ page }) => {
    await page.goto("/test-health");
    await page.waitForLoadState("networkidle");

    // Check for raw data sections
    const healthDataPreview = page.locator("#raw-health-data");
    const performanceDataPreview = page.locator("#raw-performance-data");

    await expect(healthDataPreview).toBeVisible();
    await expect(performanceDataPreview).toBeVisible();
  });

  test("should handle navigation between pages", async ({ page }) => {
    // Start on home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to test-health
    await page.goto("/test-health");
    await page.waitForLoadState("networkidle");

    // Verify we're on the correct page
    const healthTitle = page.locator('h1:has-text("System Health Dashboard")');
    await expect(healthTitle).toBeVisible();

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Page should load without errors
    expect(page.url()).toContain("/dashboard");
  });

  test("should take screenshots of health pages", async ({ page }) => {
    // Screenshot of home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "tests/screenshots/home-page-health.png",
      fullPage: true,
    });

    // Screenshot of health dashboard
    await page.goto("/test-health");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Allow time for any dynamic content
    await page.screenshot({
      path: "tests/screenshots/health-dashboard-full.png",
      fullPage: true,
    });

    // Screenshot of regular dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "tests/screenshots/dashboard-full.png",
      fullPage: true,
    });
  });
});
