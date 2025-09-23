import { defineConfig } from "vitest/config";
import { getViteConfig } from "astro/config";

export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
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
      // Include patterns for test files
      include: [
        "src/**/*.{test,spec}.{js,ts,tsx}",
        "tests/unit/**/*.{js,ts,tsx}",
      ],
      // Exclude patterns
      exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
      // Test timeout
      testTimeout: 10000,
    },
  }),
);
