import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: process.env.PLAYWRIGHT_RUNNING ? [] : ["./src/test/setup.ts"],
    // Output JUnit XML for Codecov Test Analytics
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./test-results.junit.xml",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "coverage/**",
        "**/*.config.*",
        "**/*.d.ts",
        "src/test/**",
        "src/**/*.test.*",
        "src/**/*.spec.*",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Include patterns for test files (exclude .spec.ts which are for Playwright)
    include: ["src/**/*.test.{js,ts,tsx}", "tests/unit/**/*.{js,ts,tsx}"],
    // Exclude patterns (exclude all .spec.ts files as they are for Playwright)
    exclude: [
      "node_modules/**",
      "dist/**",
      "**/*.spec.ts",
      "tests/e2e/**",
      "tests/integration/**",
      "tests/screenshots/**",
    ],
    // Test timeout
    testTimeout: 10000,
  },
});
