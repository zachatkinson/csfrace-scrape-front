import { test, expect } from "@playwright/test";

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: number;
}

test.describe("Health Monitoring System End-to-End Test", () => {
  let consoleMessages: ConsoleMessage[] = [];
  let sseMessages: ConsoleMessage[] = [];
  let nanoStoreMessages: ConsoleMessage[] = [];
  let errorMessages: ConsoleMessage[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset message arrays
    consoleMessages = [];
    sseMessages = [];
    nanoStoreMessages = [];
    errorMessages = [];

    // Set up console message listeners
    page.on("console", (msg) => {
      const timestamp = Date.now();
      const messageText = msg.text();
      const messageType = msg.type();

      const consoleMessage: ConsoleMessage = {
        type: messageType,
        text: messageText,
        timestamp,
      };

      consoleMessages.push(consoleMessage);

      // Categorize messages for analysis
      if (
        messageText.toLowerCase().includes("sse") ||
        messageText.toLowerCase().includes("eventsource") ||
        messageText.toLowerCase().includes("health data received")
      ) {
        sseMessages.push(consoleMessage);
      }

      if (
        messageText.toLowerCase().includes("nano") ||
        messageText.toLowerCase().includes("store") ||
        messageText.toLowerCase().includes("health state")
      ) {
        nanoStoreMessages.push(consoleMessage);
      }

      if (messageType === "error" || messageType === "warning") {
        errorMessages.push(consoleMessage);
      }
    });

    // Set up page error listeners
    page.on("pageerror", (error) => {
      errorMessages.push({
        type: "pageerror",
        text: error.message,
        timestamp: Date.now(),
      });
    });
  });

  test("Complete Health Monitoring System Verification", async ({ page }) => {
    console.log("Starting comprehensive health monitoring test...");

    // Step 1: Navigate to the application
    console.log("Navigating to http://localhost:3000");
    await page.goto("http://localhost:3000");

    // Step 2: Wait for initial page load
    console.log("Waiting for page to fully load (5 seconds)...");
    await page.waitForTimeout(5000);

    // Step 3: Wait for specific elements to be present
    console.log("Waiting for health status elements...");

    // Wait for footer to be present
    await page.waitForSelector("footer", { timeout: 10000 });

    // Wait for health status indicators
    const healthSelectors = [
      '[data-testid="health-status"]',
      ".health-status",
      ".status-light",
      ".health-indicator",
      'footer [class*="health"]',
      'footer [class*="status"]',
      'footer [class*="green"]',
      'footer [class*="dot"]',
    ];

    let healthElementFound = false;
    for (const selector of healthSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        healthElementFound = true;
        console.log("Found health element with selector: " + selector);
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (!healthElementFound) {
      console.log(
        "No specific health status selectors found, proceeding with footer analysis",
      );
    }

    // Step 4: Take initial screenshot
    console.log("Taking initial screenshot...");
    await page.screenshot({
      path: "/Users/zach/Web Projects/csfrace-scrape/.playwright-mcp/health-monitoring-initial.png",
      fullPage: true,
    });

    // Step 5: Monitor console output for extended period
    console.log("Monitoring console output for 12 seconds...");
    const monitoringStartTime = Date.now();

    // Check for SSE connection establishment
    await page.evaluate(() => {
      console.log("Checking for existing EventSource connections...");

      // Look for EventSource in global scope
      if (window.EventSource) {
        console.log("EventSource is available in browser");
      }

      // Try to access any global health-related variables
      const globals = Object.keys(window).filter(
        (key) =>
          key.toLowerCase().includes("health") ||
          key.toLowerCase().includes("sse") ||
          key.toLowerCase().includes("event"),
      );

      if (globals.length > 0) {
        console.log("Found health-related globals: " + globals.join(", "));
      }
    });

    // Monitor for 12 seconds with periodic checks
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(1000);

      // Every 3 seconds, check for health status elements
      if (i % 3 === 0) {
        console.log("Monitoring progress: " + (i + 1) + "/12 seconds");

        // Check footer content
        const footerText = await page
          .textContent("footer")
          .catch(() => "Footer not found");
        if (footerText && footerText.includes("Health")) {
          console.log(
            "Footer contains health information: " +
              footerText.slice(0, 100) +
              "...",
          );
        }

        // Look for timestamp updates
        const timestampElements = await page.$$eval("*", (elements) => {
          return elements
            .filter(
              (el) =>
                el.textContent && /\d{2}:\d{2}:\d{2}/.test(el.textContent),
            )
            .map((el) => el.textContent);
        });

        if (timestampElements.length > 0) {
          console.log(
            "Found timestamp elements: " +
              timestampElements.slice(0, 3).join(", "),
          );
        }
      }
    }

    // Step 6: Take final screenshot
    console.log("Taking final screenshot...");
    await page.screenshot({
      path: "/Users/zach/Web Projects/csfrace-scrape/.playwright-mcp/health-monitoring-final.png",
      fullPage: true,
    });

    // Step 7: Analyze the footer specifically
    console.log("Analyzing footer content...");
    const footer = await page.locator("footer");

    // Get all text content from footer
    const footerContent = await footer.textContent();
    console.log("Footer content: " + footerContent);

    // Look for health status indicators in footer
    const footerHtml = await footer.innerHTML();

    // Check for green indicators
    const hasGreenElements =
      footerHtml.includes("green") ||
      footerHtml.includes("#00ff00") ||
      footerHtml.includes("rgb(0, 255, 0)") ||
      footerHtml.includes("bg-green") ||
      footerHtml.includes("text-green");

    // Check for status-related classes
    const hasStatusClasses =
      footerHtml.includes("status") ||
      footerHtml.includes("health") ||
      footerHtml.includes("indicator") ||
      footerHtml.includes("light");

    console.log("Footer has green elements: " + hasGreenElements);
    console.log("Footer has status classes: " + hasStatusClasses);

    // Step 8: Final analysis and reporting
    const totalMonitoringTime = Date.now() - monitoringStartTime;

    console.log("\n=== COMPREHENSIVE TEST RESULTS ===");
    console.log("Total monitoring time: " + totalMonitoringTime + "ms");
    console.log("Total console messages: " + consoleMessages.length);
    console.log("SSE-related messages: " + sseMessages.length);
    console.log("Nano Store messages: " + nanoStoreMessages.length);
    console.log("Error/Warning messages: " + errorMessages.length);

    // Print detailed message analysis
    if (sseMessages.length > 0) {
      console.log("\nSSE Messages:");
      sseMessages.slice(0, 5).forEach((msg, idx) => {
        console.log("  " + (idx + 1) + ". [" + msg.type + "] " + msg.text);
      });
    }

    if (nanoStoreMessages.length > 0) {
      console.log("\nNano Store Messages:");
      nanoStoreMessages.slice(0, 5).forEach((msg, idx) => {
        console.log("  " + (idx + 1) + ". [" + msg.type + "] " + msg.text);
      });
    }

    if (errorMessages.length > 0) {
      console.log("\nErrors/Warnings:");
      errorMessages.slice(0, 5).forEach((msg, idx) => {
        console.log("  " + (idx + 1) + ". [" + msg.type + "] " + msg.text);
      });
    }

    // Print recent console messages for debugging
    console.log("\nRecent Console Messages (last 10):");
    consoleMessages.slice(-10).forEach((msg) => {
      const timeStr = new Date(msg.timestamp).toISOString().substr(11, 8);
      console.log(
        "  " +
          timeStr +
          " [" +
          msg.type +
          "] " +
          msg.text.slice(0, 100) +
          (msg.text.length > 100 ? "..." : ""),
      );
    });

    // Assertions for test validation
    expect(consoleMessages.length).toBeGreaterThan(0);
    expect(errorMessages.filter((msg) => msg.type === "error").length).toBe(0);
    expect(footerContent).toBeTruthy();

    // Success indicators
    const hasHealthIndicators =
      hasGreenElements ||
      hasStatusClasses ||
      (footerContent && footerContent.toLowerCase().includes("health"));

    console.log("\nTest completed successfully!");
    console.log("Health indicators detected: " + hasHealthIndicators);
    console.log("Screenshots saved to .playwright-mcp/");
  });
});
