import { test, expect } from "@playwright/test";

test.describe("Details Button Debug", () => {
  test("capture details button behavior with video and screenshots", async ({
    page,
  }) => {
    // Enable video recording
    const videoPath = await page.video()?.path();
    console.log("Video will be saved to:", videoPath);

    // Create a test error to trigger the ErrorBoundary
    await test.step("Navigate and trigger error boundary", async () => {
      await page.goto("/");

      // Inject an error to trigger the ErrorBoundary
      await page.evaluate(() => {
        // Create a mock React error
        const errorEvent = new Error("Test error for details button debugging");

        // Try to find a React component and trigger an error
        const reactRoot = document.querySelector(
          "#root, [data-reactroot], .App",
        );
        if (reactRoot) {
          // Simulate a React component error
          const event = new CustomEvent("error", { detail: errorEvent });
          window.dispatchEvent(event);

          // Alternative: try to trigger through React devtools if available
          if (
            (window as Record<string, unknown>).__REACT_DEVTOOLS_GLOBAL_HOOK__
          ) {
            throw errorEvent;
          }
        }

        // Fallback: manually insert error boundary content for testing
        const errorBoundaryHTML = `
          <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
            <div class="max-w-md w-full mx-4">
              <div class="bg-white rounded-lg shadow-xl p-6 border border-red-200">
                <div class="flex items-center mb-4">
                  <div class="flex-shrink-0">
                    <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-lg font-medium text-gray-900">Something went wrong</h3>
                    <p class="text-sm text-gray-500">An unexpected error occurred while loading this page.</p>
                  </div>
                </div>
                
                <div class="mt-4">
                  <button class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
                    Try again
                  </button>
                </div>

                <details class="mt-4" data-testid="error-details">
                  <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Show error details
                  </summary>
                  <div class="mt-2 p-3 bg-gray-50 rounded-md text-xs font-mono">
                    <p class="font-semibold text-gray-700 mb-2">Error ID: TEST123</p>
                    <p class="text-red-600 mb-2">Error: Test error for details button debugging</p>
                    <pre class="whitespace-pre-wrap text-gray-600 overflow-auto max-h-32">
Error: Test error for details button debugging
    at Object.eval (test:1:1)
    at eval (test:1:1)
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          </div>
        `;

        document.body.innerHTML = errorBoundaryHTML;
      });

      await page.waitForTimeout(1000);
    });

    await test.step("Take initial screenshot", async () => {
      await page.screenshot({
        path: "test-results/details-button-before.png",
        fullPage: true,
      });
    });

    await test.step("Test details button behavior with detailed capture", async () => {
      const detailsElement = page.locator(
        'details[data-testid="error-details"]',
      );
      const summaryElement = page.locator(
        'details[data-testid="error-details"] summary',
      );

      // Wait for the details element to be visible
      await expect(detailsElement).toBeVisible();
      await expect(summaryElement).toBeVisible();

      // Take screenshot before clicking
      await page.screenshot({
        path: "test-results/details-button-ready.png",
        fullPage: true,
      });

      // Check initial state
      const initialState = await detailsElement.getAttribute("open");
      console.log("Initial details state:", initialState);

      // Click the summary and capture the sequence
      await test.step("Click and capture sequence", async () => {
        // Take screenshot just before click
        await page.screenshot({
          path: "test-results/details-button-pre-click.png",
          fullPage: true,
        });

        // Click the summary element
        await summaryElement.click();

        // Take rapid screenshots to capture the transition
        await page.screenshot({
          path: "test-results/details-button-just-after-click.png",
          fullPage: true,
        });

        // Wait a bit and capture again
        await page.waitForTimeout(100);
        await page.screenshot({
          path: "test-results/details-button-100ms-after.png",
          fullPage: true,
        });

        await page.waitForTimeout(200);
        await page.screenshot({
          path: "test-results/details-button-300ms-after.png",
          fullPage: true,
        });

        await page.waitForTimeout(500);
        await page.screenshot({
          path: "test-results/details-button-800ms-after.png",
          fullPage: true,
        });

        await page.waitForTimeout(1000);
        await page.screenshot({
          path: "test-results/details-button-1800ms-after.png",
          fullPage: true,
        });
      });

      // Check state after clicking
      const afterClickState = await detailsElement.getAttribute("open");
      console.log("Details state after click:", afterClickState);

      // Check if content is visible
      const detailsContent = page.locator(
        'details[data-testid="error-details"] div',
      );
      const isContentVisible = await detailsContent.isVisible();
      console.log("Details content visible:", isContentVisible);

      // Monitor for any automatic state changes
      await test.step("Monitor for auto-close behavior", async () => {
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(200);
          const currentState = await detailsElement.getAttribute("open");
          const contentVisible = await detailsContent.isVisible();

          console.log(
            `Check ${i + 1}: open=${currentState}, contentVisible=${contentVisible}`,
          );

          if (i === 4) {
            // Middle of monitoring
            await page.screenshot({
              path: "test-results/details-button-monitoring.png",
              fullPage: true,
            });
          }
        }
      });
    });

    await test.step("Test with different click methods", async () => {
      const detailsElement = page.locator(
        'details[data-testid="error-details"]',
      );
      const summaryElement = page.locator(
        'details[data-testid="error-details"] summary',
      );

      // Reset state by clicking if open
      const currentState = await detailsElement.getAttribute("open");
      if (currentState !== null) {
        await summaryElement.click();
        await page.waitForTimeout(500);
      }

      // Try double-click
      await test.step("Test double-click behavior", async () => {
        await summaryElement.dblclick();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: "test-results/details-button-double-click.png",
          fullPage: true,
        });

        const stateAfterDblClick = await detailsElement.getAttribute("open");
        console.log("State after double-click:", stateAfterDblClick);
      });

      // Try programmatic toggle
      await test.step("Test programmatic toggle", async () => {
        await page.evaluate(() => {
          const details = document.querySelector(
            'details[data-testid="error-details"]',
          ) as HTMLDetailsElement;
          if (details) {
            console.log("Before toggle:", details.open);
            details.open = !details.open;
            console.log("After toggle:", details.open);
          }
        });

        await page.waitForTimeout(500);
        await page.screenshot({
          path: "test-results/details-button-programmatic.png",
          fullPage: true,
        });
      });
    });

    await test.step("Check for JavaScript errors and event listeners", async () => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      // Check for conflicting event listeners
      const eventListenerInfo = await page.evaluate(() => {
        const details = document.querySelector(
          'details[data-testid="error-details"]',
        );
        const summary = document.querySelector(
          'details[data-testid="error-details"] summary',
        );

        const getEventListeners = (element: Element | null) => {
          if (!element) return [];
          // This is a simplified check - in real browsers you might need devtools
          const events: string[] = [];
          const eventTypes = ["click", "toggle", "change", "focus", "blur"];
          eventTypes.forEach((type) => {
            if ((element as Record<string, unknown>)[`on${type}`]) {
              events.push(type);
            }
          });
          return events;
        };

        return {
          detailsEvents: getEventListeners(details),
          summaryEvents: getEventListeners(summary),
          detailsOpen: (details as HTMLDetailsElement)?.open,
        };
      });

      console.log("Event listener info:", eventListenerInfo);
      console.log("JavaScript errors:", errors);
    });

    await test.step("Final screenshot", async () => {
      await page.screenshot({
        path: "test-results/details-button-final.png",
        fullPage: true,
      });
    });
  });

  test("test details element in isolation", async ({ page }) => {
    // Test a simple details element to compare behavior
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Details Test</title>
        <style>
          body { padding: 20px; font-family: Arial, sans-serif; }
          details { margin: 20px 0; }
          summary { cursor: pointer; padding: 10px; background: #f0f0f0; }
          .details-content { padding: 10px; background: #f9f9f9; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Details Element Test</h1>
        
        <details id="test-details-1">
          <summary>Simple Details Test</summary>
          <div class="details-content">
            This is the content that should stay open when clicked.
          </div>
        </details>
        
        <details id="test-details-2">
          <summary>Details with Complex Content</summary>
          <div class="details-content">
            <p>This has multiple elements:</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <pre>Some preformatted text</pre>
          </div>
        </details>
        
        <details id="test-details-3" open>
          <summary>Pre-opened Details</summary>
          <div class="details-content">
            This should already be open when the page loads.
          </div>
        </details>
      </body>
      </html>
    `);

    await page.screenshot({
      path: "test-results/details-isolation-initial.png",
      fullPage: true,
    });

    // Test each details element
    for (let i = 1; i <= 3; i++) {
      await test.step(`Test details element ${i}`, async () => {
        const details = page.locator(`#test-details-${i}`);
        const summary = page.locator(`#test-details-${i} summary`);

        const initialState = await details.getAttribute("open");
        console.log(`Details ${i} initial state:`, initialState);

        await summary.click();
        await page.waitForTimeout(500);

        const afterClickState = await details.getAttribute("open");
        console.log(`Details ${i} after click state:`, afterClickState);

        await page.screenshot({
          path: `test-results/details-isolation-${i}-clicked.png`,
          fullPage: true,
        });

        // Wait and check if it auto-closes
        await page.waitForTimeout(2000);
        const finalState = await details.getAttribute("open");
        console.log(`Details ${i} final state:`, finalState);

        if (finalState !== afterClickState) {
          console.log(`⚠️  Details ${i} changed state automatically!`);
        }
      });
    }
  });
});
