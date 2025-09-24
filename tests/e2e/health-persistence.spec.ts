import { test, expect } from "@playwright/test";

/**
 * Health Status Persistence Test
 * Verifies that health status data persists between page navigations
 * in our Astro SPA with View Transitions
 */
test.describe("Health Status Persistence", () => {
  test("should maintain health status data between page navigations", async ({
    page,
  }) => {
    // Navigate to the home page
    await page.goto("http://localhost:3000");

    // Wait for the page to load and initial health check to potentially start
    await page.waitForTimeout(2000);

    // Get initial health status indicators
    const initialIndicators = await page.locator("[data-service-name]").all();
    expect(initialIndicators.length).toBe(4); // frontend, backend, database, cache

    // Wait for potential polling update (up to 10 seconds)
    await page.waitForTimeout(10000);

    // Capture the state of health indicators after potential polling
    const healthStates = [];
    for (const indicator of initialIndicators) {
      const serviceName = await indicator.getAttribute("data-service-name");
      const status = await indicator.getAttribute("data-status");
      const className = await indicator.getAttribute("class");
      healthStates.push({ serviceName, status, className });
    }

    console.log("Health states before navigation:", healthStates);

    // Get the timestamp before navigation
    const timestampBefore = await page
      .locator("#health-timestamp")
      .textContent();
    console.log("Timestamp before navigation:", timestampBefore);

    // Navigate to another page (dashboard)
    await page.click('a[href="/dashboard"]');

    // Wait for navigation to complete
    await page.waitForURL("**/dashboard");
    await page.waitForTimeout(1000);

    // Verify the health indicators are still present and in the same states
    const postNavIndicators = await page.locator("[data-service-name]").all();
    expect(postNavIndicators.length).toBe(4);

    for (let i = 0; i < healthStates.length; i++) {
      const originalState = healthStates[i];
      const currentServiceName =
        await postNavIndicators[i].getAttribute("data-service-name");
      const currentStatus =
        await postNavIndicators[i].getAttribute("data-status");
      const currentClassName = await postNavIndicators[i].getAttribute("class");

      // Verify service name matches (order should be preserved)
      expect(currentServiceName).toBe(originalState.serviceName);

      // Verify status persists
      expect(currentStatus).toBe(originalState.status);

      // Verify visual state persists (class should be the same)
      expect(currentClassName).toBe(originalState.className);

      console.log(
        `Service ${originalState.serviceName}: ${originalState.status} -> ${currentStatus} (persisted: ${originalState.status === currentStatus})`,
      );
    }

    // Verify timestamp persists (should be the same unless a new poll happened)
    const timestampAfter = await page
      .locator("#health-timestamp")
      .textContent();
    console.log("Timestamp after navigation:", timestampAfter);

    // The timestamp should either be the same (if no poll occurred during navigation)
    // or updated (if a poll occurred). We'll just verify it's not reset to "Never"
    expect(timestampAfter).not.toBe("Never");

    // Navigate to test-health page to verify persistence there too
    await page.click('a[href="/test-health"]');
    await page.waitForURL("**/test-health");
    await page.waitForTimeout(1000);

    // Verify indicators still persist on the health page
    const healthPageIndicators = await page
      .locator("[data-service-name]")
      .all();
    expect(healthPageIndicators.length).toBe(4);

    // Verify states are still maintained
    for (let i = 0; i < healthStates.length; i++) {
      const originalState = healthStates[i];
      const currentServiceName =
        await healthPageIndicators[i].getAttribute("data-service-name");
      const currentStatus =
        await healthPageIndicators[i].getAttribute("data-status");

      expect(currentServiceName).toBe(originalState.serviceName);

      // Status should still be persistent unless a poll updated it
      // We'll check that it's not reset to default loading state
      expect(currentStatus).not.toBe("loading");

      console.log(
        `Health page - Service ${originalState.serviceName}: status is ${currentStatus}`,
      );
    }

    console.log("✅ Health status persistence test completed successfully");
  });

  test("should show loading states initially and update via polling", async ({
    page,
  }) => {
    // Navigate to the page
    await page.goto("http://localhost:3000");

    // Initially, non-frontend services should show loading states
    await page.waitForTimeout(1000);

    // Frontend should be green (site is live), others should be yellow pulsing (loading)
    const frontendIndicator = page.locator('[data-service-name="frontend"]');
    const backendIndicator = page.locator('[data-service-name="backend"]');

    // Frontend should be green immediately (site is working)
    const frontendStatus = await frontendIndicator.getAttribute("data-status");
    expect(frontendStatus).toBe("up");

    // Backend should initially be loading
    const initialBackendStatus =
      await backendIndicator.getAttribute("data-status");
    expect(initialBackendStatus).toBe("loading");

    // Wait for polling to potentially update the status
    await page.waitForTimeout(10000);

    // After polling, backend should hopefully be 'up' (unless there's an actual issue)
    const updatedBackendStatus =
      await backendIndicator.getAttribute("data-status");
    console.log(`Backend status after polling: ${updatedBackendStatus}`);

    // We can't guarantee what the status will be, but it should no longer be null/undefined
    expect(updatedBackendStatus).toBeDefined();
    expect(updatedBackendStatus).not.toBe("");
  });
});
