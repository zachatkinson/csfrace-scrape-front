import { defineConfig, envField } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import { readFileSync } from "fs";

import tailwindcss from "@tailwindcss/vite";
import { codecovVitePlugin } from "@codecov/vite-plugin";

// =============================================================================
// ASTRO 2025 ULTIMATE EFFICIENCY: BUILD-TIME VARIABLE INJECTION
// =============================================================================
// Read package.json at build time to inject actual versions
const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
const astroVersion = packageJson.dependencies.astro.replace("^", "");
const buildTime = new Date().toISOString();
const serverPort = 3000; // From config below

// Backend service info (for efficiency - reduce API calls for static data)
const backendFramework = "FastAPI + Python 3.13"; // Update when backend changes
const expectedBackendPort = 8000; // From backend configuration
const backendVersion = "1.2.0"; // Update when backend version changes
const backendDefaultUptime = "< 1 hour"; // Fallback when backend is offline

// https://astro.build/config
export default defineConfig({
  // Type-safe environment variables schema (Astro 5.0+ best practice)
  env: {
    schema: {
      // Server-side environment variables for backend communication
      SERVER_API_BASE_URL: envField.string({
        context: "server",
        access: "public",
        default: "http://localhost",
        optional: true,
      }),

      // Client-side environment variable for SSE connection
      PUBLIC_BACKEND_SSE_URL: envField.string({
        context: "client",
        access: "public",
        default: "http://localhost",
        optional: true,
      }),

      // Client-side environment variables for frontend functionality
      PUBLIC_ASTRO_VERSION: envField.string({
        context: "client",
        access: "public",
        default: astroVersion,
        optional: true,
      }),
      PUBLIC_BUILD_TIME: envField.string({
        context: "client",
        access: "public",
        default: buildTime,
        optional: true,
      }),
      PUBLIC_SERVER_PORT: envField.number({
        context: "client",
        access: "public",
        default: serverPort,
        optional: true,
      }),
      PUBLIC_BACKEND_FRAMEWORK: envField.string({
        context: "client",
        access: "public",
        default: backendFramework,
        optional: true,
      }),
      PUBLIC_BACKEND_PORT: envField.number({
        context: "client",
        access: "public",
        default: expectedBackendPort,
        optional: true,
      }),
      PUBLIC_BACKEND_VERSION: envField.string({
        context: "client",
        access: "public",
        default: backendVersion,
        optional: true,
      }),

      // SSE Performance Configuration (Astro 5.0+ best practice)
      SSE_POLLING_INTERVAL_MS: envField.number({
        context: "server",
        access: "public",
        default: 30000, // 30 seconds - industry standard for health monitoring
        optional: true,
      }),
      SSE_POLLING_INTERVAL_UNHEALTHY_MS: envField.number({
        context: "server",
        access: "public",
        default: 15000, // 15 seconds when problems detected
        optional: true,
      }),
      SSE_POLLING_INTERVAL_STABLE_MS: envField.number({
        context: "server",
        access: "public",
        default: 60000, // 60 seconds when all systems stable
        optional: true,
      }),
      SSE_DEBOUNCE_DELAY_MS: envField.number({
        context: "server",
        access: "public",
        default: 2000, // 2 second debounce for rapid changes
        optional: true,
      }),
      SSE_RESPONSE_TIME_THRESHOLD_MS: envField.number({
        context: "server",
        access: "public",
        default: 10, // Ignore response time changes < 10ms
        optional: true,
      }),
      SSE_CONNECTION_COUNT_THRESHOLD: envField.number({
        context: "server",
        access: "public",
        default: 5, // Ignore connection count changes < 5
        optional: true,
      }),
      SSE_MAX_CONCURRENT_CONNECTIONS: envField.number({
        context: "server",
        access: "public",
        default: 10, // Max concurrent SSE connections
        optional: true,
      }),
    },
  },

  integrations: [
    react({
      // Enable React components in .astro files
      include: ["**/react/*", "**/components/**/*"],
    }),
  ],
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  server: {
    port: 3000,
    host: true,
  },
  // Security configuration - simplified CSP for now
  experimental: {
    csp: true,
  },
  // Vite configuration for Liquid Glass optimization
  vite: {
    // Server configuration for nginx reverse proxy support
    server: {
      host: true,
      hmr: {
        // Use the same port as nginx proxy (80) for WebSocket connections
        clientPort: process.env.NODE_ENV === "development" ? 80 : 3000,
      },
      // Allow nginx proxy requests from nginx container
      allowedHosts: [
        "localhost",
        "frontend",
        "frontend-dev",
        "nginx",
        "nginx-dev",
        ".localhost",
      ],
    },

    // ASTRO 2025: Inject build-time constants (zero runtime overhead)
    define: {
      "import.meta.env.VITE_ASTRO_VERSION": JSON.stringify(astroVersion),
      "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime),
      "import.meta.env.VITE_SERVER_PORT": JSON.stringify(serverPort),
      "import.meta.env.VITE_BACKEND_FRAMEWORK":
        JSON.stringify(backendFramework),
      "import.meta.env.VITE_BACKEND_PORT": JSON.stringify(expectedBackendPort),
      "import.meta.env.VITE_BACKEND_VERSION": JSON.stringify(backendVersion),
      "import.meta.env.VITE_BACKEND_DEFAULT_UPTIME":
        JSON.stringify(backendDefaultUptime),
    },

    optimizeDeps: {
      include: ["react", "react-dom", "dompurify", "crypto-js"],
    },

    build: {
      // Bundle optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for third-party libraries
            vendor: ["react", "react-dom"],
            // Security utilities chunk
            security: ["dompurify", "crypto-js"],
            // UI libraries chunk
            ui: ["@headlessui/react", "@heroicons/react"],
          },
        },
      },
      // Enable source maps in development only
      sourcemap:
        !process.env.NODE_ENV || process.env.NODE_ENV === "development",
      // Minification
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === "production",
          drop_debugger: true,
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },

    css: {
      postcss: {
        plugins: [],
      },
    },

    plugins: [
      tailwindcss(),
      // Put the Codecov Vite plugin after all other plugins
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: "csfrace-frontend",
        uploadToken: process.env.CODECOV_TOKEN || "",
      }),
    ] as any,
  },
  // Environment variables configuration
  // Backend API URLs should be defined in .env files as:
  // VITE_API_BASE_URL=http://localhost:8000
  // VITE_WS_BASE_URL=ws://localhost:8000

  // ASTRO 2025 BEST PRACTICE: Build-time variable injection
  // For ultimate efficiency, consider injecting build-time constants:
  // VITE_ASTRO_VERSION=5.13.5 (from package.json)
  // VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  // VITE_SERVER_PORT=3000 (from this config)
});
