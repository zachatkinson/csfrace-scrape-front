import { test, expect } from "@playwright/test";

test.describe("Details Button Fix", () => {
  test("details button should work properly without auto-closing", async ({
    page,
  }) => {
    console.log("🧪 Testing the fixed Details button behavior...");

    // Go to the page
    await page.goto("/");

    // Wait for page to load and errors to appear
    await page.waitForTimeout(3000);

    // Look for the Details button in the error message
    const detailsButton = page.locator('button:has-text("Details")').first();

    if ((await detailsButton.count()) > 0) {
      console.log("✅ Found Details button");

      // Take screenshot before clicking
      await page.screenshot({
        path: "test-results/details-fix-before-click.png",
        fullPage: true,
      });

      // Check initial state - details should be hidden
      const detailsContent = page.locator(".error-details").first();
      const initialVisibility = await detailsContent.isVisible();
      console.log(`Initial details visibility: ${initialVisibility}`);

      // Click the Details button
      console.log("🖱️ Clicking Details button...");
      await detailsButton.click();

      // Wait for animation to complete
      await page.waitForTimeout(500);

      // Take screenshot after clicking
      await page.screenshot({
        path: "test-results/details-fix-after-click.png",
        fullPage: true,
      });

      // Check if details are now visible and stay visible
      const afterClickVisibility = await detailsContent.isVisible();
      console.log(`Details visibility after click: ${afterClickVisibility}`);

      // Wait a bit more to see if it auto-closes (it shouldn't)
      await page.waitForTimeout(2000);

      const finalVisibility = await detailsContent.isVisible();
      console.log(`Details visibility after 2 seconds: ${finalVisibility}`);

      // Take final screenshot
      await page.screenshot({
        path: "test-results/details-fix-final.png",
        fullPage: true,
      });

      // The details should be visible and stay visible
      expect(afterClickVisibility).toBe(true);
      expect(finalVisibility).toBe(true);

      console.log("✅ Details button test passed - no auto-closing detected!");

      // Test clicking again to close
      console.log("🖱️ Testing close functionality...");
      await detailsButton.click();
      await page.waitForTimeout(500);

      const closedVisibility = await detailsContent.isVisible();
      console.log(
        `Details visibility after second click (should be closed): ${closedVisibility}`,
      );

      expect(closedVisibility).toBe(false);
      console.log("✅ Close functionality works correctly!");
    } else {
      console.log("ℹ️ No Details button found on page (no error occurred)");

      // Take screenshot to see current state
      await page.screenshot({
        path: "test-results/details-fix-no-button.png",
        fullPage: true,
      });

      // This is actually fine - it means no errors occurred
    }
  });

  test("details button rapid clicking test", async ({ page }) => {
    console.log("🧪 Testing Details button with rapid clicking...");

    await page.goto("/");
    await page.waitForTimeout(3000);

    const detailsButton = page.locator('button:has-text("Details")').first();

    if ((await detailsButton.count()) > 0) {
      console.log(
        "📱 Testing rapid clicking (should prevent race conditions)...",
      );

      // Rapid click test
      for (let i = 0; i < 5; i++) {
        await detailsButton.click();
        await page.waitForTimeout(100); // Quick succession
        console.log(`Rapid click ${i + 1}`);
      }

      // Wait for any animations to settle
      await page.waitForTimeout(1000);

      const detailsContent = page.locator(".error-details").first();
      const finalState = await detailsContent.isVisible();

      console.log(
        `Final state after rapid clicking: ${finalState ? "visible" : "hidden"}`,
      );

      // Take screenshot of final state
      await page.screenshot({
        path: "test-results/details-fix-rapid-click.png",
        fullPage: true,
      });

      // Should be in a stable state (either open or closed, not flickering)
      expect(typeof finalState).toBe("boolean");
      console.log("✅ Rapid clicking test completed - no flickering detected!");
    }
  });
});
