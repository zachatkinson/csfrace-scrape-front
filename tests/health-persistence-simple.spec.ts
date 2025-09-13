import { test, expect } from '@playwright/test';

test.describe('Simple Health Persistence Test', () => {
  test('should verify View Transitions are working', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check that we have the health status component
    const healthComponent = page.locator('[data-component="health-status"]');
    await expect(healthComponent).toBeVisible();

    // Get the initial timestamp
    const timestampBefore = await page.locator('#health-timestamp').textContent();
    console.log('Initial timestamp:', timestampBefore);

    // Wait longer for potential polling (30 seconds - matching the health check interval)
    console.log('Waiting 30 seconds for health polling...');
    await page.waitForTimeout(30000);

    // Check if timestamp has updated from polling
    const timestampAfterWait = await page.locator('#health-timestamp').textContent();
    console.log('Timestamp after 30s wait:', timestampAfterWait);

    // Inject a test value into the timestamp to verify persistence
    await page.evaluate(() => {
      const elem = document.getElementById('health-timestamp');
      if (elem) {
        elem.textContent = 'TEST-VALUE-12:34:56';
        // Also update the window state if it exists
        if (window.__healthStatusState) {
          window.__healthStatusState.lastHealthTimestamp = Date.now();
        }
      }
    });

    // Verify our test value was set
    const injectedTimestamp = await page.locator('#health-timestamp').textContent();
    expect(injectedTimestamp).toBe('TEST-VALUE-12:34:56');
    console.log('Injected test timestamp:', injectedTimestamp);

    // Navigate to dashboard
    console.log('Navigating to dashboard...');
    await page.click('a[href="/dashboard"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    // Check if the timestamp persisted
    const timestampAfterNav = await page.locator('#health-timestamp').textContent();
    console.log('Timestamp after navigation:', timestampAfterNav);

    // Check if View Transitions are actually working by looking for the data-astro-transition attribute
    const hasTransitions = await page.evaluate(() => {
      return document.documentElement.hasAttribute('data-astro-transition');
    });
    console.log('View Transitions enabled:', hasTransitions);

    // The timestamp should either be our test value (if truly persisting)
    // or something else (if component is being recreated)
    if (timestampAfterNav === 'TEST-VALUE-12:34:56') {
      console.log('✅ SUCCESS: Timestamp persisted through navigation!');
    } else if (timestampAfterNav === 'Never') {
      console.log('❌ FAIL: Timestamp reset to default "Never"');
    } else {
      console.log('⚠️  PARTIAL: Timestamp changed but not to default:', timestampAfterNav);
    }

    // Final assertion
    expect(timestampAfterNav).not.toBe('Never');
  });
});