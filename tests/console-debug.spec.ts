import { test, expect } from "@playwright/test";

test.describe("Console Debug", () => {
  test("capture all console logs and page behavior", async ({ page }) => {
    // Capture console logs
    const logs: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();

      logs.push(`[${type.toUpperCase()}] ${text}`);

      if (type === "error") {
        errors.push(text);
      } else if (type === "warning") {
        warnings.push(text);
      }

      console.log(`[${type.toUpperCase()}] ${text}`);
    });

    // Capture page errors
    page.on("pageerror", (exception) => {
      const errorText = `PAGE ERROR: ${exception.message}`;
      errors.push(errorText);
      console.log(errorText);
    });

    await test.step("Load the main page and capture console activity", async () => {
      console.log("🔍 Loading page...");
      await page.goto("/");

      // Wait for page to fully load
      await page.waitForLoadState("networkidle");

      console.log("📊 Page loaded, waiting for JavaScript execution...");
      await page.waitForTimeout(3000);

      console.log("\n=== CONSOLE LOG SUMMARY ===");
      console.log(`Total logs: ${logs.length}`);
      console.log(`Errors: ${errors.length}`);
      console.log(`Warnings: ${warnings.length}`);

      if (errors.length > 0) {
        console.log("\n🚨 ERRORS FOUND:");
        errors.forEach((error) => console.log(`  - ${error}`));
      }

      if (warnings.length > 0) {
        console.log("\n⚠️  WARNINGS FOUND:");
        warnings.forEach((warning) => console.log(`  - ${warning}`));
      }

      console.log("\n📝 ALL LOGS:");
      logs.forEach((log) => console.log(`  ${log}`));
    });

    await test.step("Check for details elements on page", async () => {
      const detailsElements = await page.locator("details").count();
      console.log(`\n🔍 Found ${detailsElements} details elements on page`);

      if (detailsElements > 0) {
        for (let i = 0; i < detailsElements; i++) {
          const details = page.locator("details").nth(i);
          const summary = page.locator("details summary").nth(i);

          const isVisible = await details.isVisible();
          const summaryText = await summary.textContent();
          const isOpen = await details.getAttribute("open");

          console.log(
            `Details ${i + 1}: visible=${isVisible}, open=${isOpen}, summary="${summaryText}"`,
          );
        }
      }
    });

    await test.step("Test any visible details elements", async () => {
      const detailsElements = page.locator("details");
      const count = await detailsElements.count();

      for (let i = 0; i < count; i++) {
        const details = detailsElements.nth(i);
        const summary = details.locator("summary");

        if (await details.isVisible()) {
          console.log(`\n🧪 Testing details element ${i + 1}...`);

          // Clear previous logs for this test
          logs.length = 0;
          errors.length = 0;

          const initialState = await details.getAttribute("open");
          console.log(`Initial state: open=${initialState}`);

          // Click the summary
          await summary.click();

          // Wait for any changes
          await page.waitForTimeout(1000);

          const afterClickState = await details.getAttribute("open");
          console.log(`After click state: open=${afterClickState}`);

          // Check for any new console activity during click
          if (logs.length > 0) {
            console.log("📝 Logs during click:");
            logs.forEach((log) => console.log(`  ${log}`));
          }

          if (errors.length > 0) {
            console.log("🚨 Errors during click:");
            errors.forEach((error) => console.log(`  ${error}`));
          }

          // Monitor for auto-closing
          for (let j = 0; j < 5; j++) {
            await page.waitForTimeout(200);
            const currentState = await details.getAttribute("open");
            if (currentState !== afterClickState) {
              console.log(
                `⚠️  Details element auto-changed state at check ${j + 1}: ${afterClickState} → ${currentState}`,
              );
              break;
            }
          }
        }
      }
    });

    await test.step("Check for API calls and network activity", async () => {
      console.log("\n🌐 Making test API call to trigger getApiBaseUrl...");

      // Clear logs
      logs.length = 0;
      errors.length = 0;

      // Try to trigger the API call that's causing the error
      await page.evaluate(() => {
        // Simulate what happens when jobs are loaded
        console.log("📞 Attempting to call getApiBaseUrl from client...");

        // Check if function exists
        if (
          typeof (window as Record<string, unknown>).getApiBaseUrl ===
          "function"
        ) {
          console.log("✅ getApiBaseUrl function found on window");
          try {
            const url = (window as Record<string, unknown>).getApiBaseUrl();
            console.log("🔗 API URL:", url);
          } catch (error) {
            console.error("❌ Error calling getApiBaseUrl:", error);
          }
        } else {
          console.log("❌ getApiBaseUrl function not found on window");
          console.log(
            "Available functions:",
            Object.keys(window).filter(
              (key) =>
                typeof (window as Record<string, unknown>)[key] === "function",
            ),
          );
        }

        // Check for environment variables
        console.log("🔧 Environment check:");
        console.log(
          "import.meta.env.PUBLIC_API_URL:",
          (import.meta as Record<string, unknown>).env?.PUBLIC_API_URL,
        );
        console.log(
          "import.meta.env.VITE_API_URL:",
          (import.meta as Record<string, unknown>).env?.VITE_API_URL,
        );
      });

      await page.waitForTimeout(1000);

      if (logs.length > 0 || errors.length > 0) {
        console.log("\n📊 API Test Results:");
        logs.forEach((log) => console.log(`  ${log}`));
        errors.forEach((error) => console.log(`  ERROR: ${error}`));
      }
    });

    await test.step("Check DOM state and React components", async () => {
      console.log("\n🔍 Checking DOM and React state...");

      const domInfo = await page.evaluate(() => {
        return {
          hasReactRoot: !!document.querySelector(
            "#root, [data-reactroot], .App",
          ),
          hasErrorBoundary: !!document.querySelector(
            '.error-boundary, [data-testid="error-boundary"]',
          ),
          scriptsCount: document.querySelectorAll("script").length,
          hasInlineScripts: Array.from(
            document.querySelectorAll("script"),
          ).some((s) => !s.src),
          bodyClasses: document.body.className,
          activeElement: document.activeElement?.tagName,
        };
      });

      console.log("DOM Info:", JSON.stringify(domInfo, null, 2));
    });

    // Take a final screenshot
    await page.screenshot({
      path: "test-results/console-debug-final.png",
      fullPage: true,
    });

    console.log("\n✅ Console debug test completed");
    console.log("📸 Screenshot saved to: test-results/console-debug-final.png");

    // Report final summary
    expect(logs.length).toBeGreaterThan(0); // Should have some logs
    console.log(
      `\n📊 Final Summary: ${logs.length} total logs, ${errors.length} errors, ${warnings.length} warnings`,
    );
  });

  test("minimal page load to isolate issues", async ({ page }) => {
    // Very simple test just to load the page and see basic console output
    console.log("\n🔬 === MINIMAL PAGE LOAD TEST ===");

    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        errors.push(text);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      }
    });

    page.on("pageerror", (exception) => {
      const errorText = exception.message;
      errors.push(errorText);
      console.log(`💥 PAGE ERROR: ${errorText}`);
      console.log(`🔍 Stack: ${exception.stack}`);
    });

    await page.goto("/");
    await page.waitForTimeout(5000); // Wait 5 seconds for errors to surface

    console.log(`\n📊 Total errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log("🚨 ERROR DETAILS:");
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log("✅ No errors found!");
    }
  });
});
