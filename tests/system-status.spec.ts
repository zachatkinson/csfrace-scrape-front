import { test } from "@playwright/test";

test.describe("System Status Component", () => {
  test("should show green lights for all services", async ({ page }) => {
    // Navigate to the home page
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Wait a bit for SSE to potentially connect and update
    await page.waitForTimeout(3000);

    // Take a screenshot to see current state
    await page.screenshot({ path: "system-status-test.png", fullPage: true });

    // Look for System Status section
    const systemStatusSection = page
      .locator("text=System Status")
      .or(
        page
          .locator('[class*="system"]')
          .or(page.locator("text=Services").or(page.locator("text=Health"))),
      );

    if (await systemStatusSection.isVisible()) {
      console.log("✓ Found System Status section");
    } else {
      console.log("⚠️ Could not find System Status section");
    }

    // Look for service status indicators
    const services = ["frontend", "backend", "database", "cache"];
    for (const service of services) {
      const serviceElement = page
        .locator(`text=${service}`)
        .or(
          page
            .locator(`[data-service="${service}"]`)
            .or(page.locator(`[class*="${service}"]`)),
        );

      if (await serviceElement.isVisible()) {
        console.log(`✓ Found ${service} service indicator`);
      } else {
        console.log(`⚠️ Could not find ${service} service indicator`);
      }
    }

    // Look for status indicators (green, healthy, etc.)
    const healthyIndicators = page
      .locator("text=healthy")
      .or(
        page
          .locator('[class*="green"]')
          .or(
            page
              .locator('[class*="success"]')
              .or(page.locator('[style*="green"]')),
          ),
      );

    const healthyCount = await healthyIndicators.count();
    console.log(`Found ${healthyCount} healthy indicators`);

    // Look for loading indicators
    const loadingIndicators = page
      .locator("text=Loading")
      .or(
        page
          .locator('[class*="loading"]')
          .or(page.locator('[class*="spinner"]').or(page.locator("text=..."))),
      );

    const loadingCount = await loadingIndicators.count();
    console.log(`Found ${loadingCount} loading indicators`);

    // Look for gray/unknown status
    const grayIndicators = page
      .locator('[class*="gray"]')
      .or(page.locator('[style*="gray"]').or(page.locator("text=unknown")));

    const grayCount = await grayIndicators.count();
    console.log(`Found ${grayCount} gray indicators`);

    // Check console for SSE-related logs
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.waitForTimeout(1000);

    const sseRelatedLogs = consoleLogs.filter(
      (log) =>
        log.includes("SSE") ||
        log.includes("EventSource") ||
        log.includes("health") ||
        log.includes("stream"),
    );

    if (sseRelatedLogs.length > 0) {
      console.log("SSE-related console logs:");
      sseRelatedLogs.forEach((log) => console.log(`  ${log}`));
    }
  });
});
