import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';

// =============================================================================
// ASTRO 2025 ULTIMATE EFFICIENCY: BUILD-TIME VARIABLE INJECTION
// =============================================================================
// Read package.json at build time to inject actual versions
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const astroVersion = packageJson.dependencies.astro.replace('^', '');
const buildTime = new Date().toISOString();
const serverPort = 3000; // From config below

// Backend service info (for efficiency - reduce API calls for static data)
const backendFramework = 'FastAPI + Python 3.13'; // Update when backend changes
const expectedBackendPort = 8000; // From backend configuration
const backendVersion = '1.2.0'; // Update when backend version changes
const backendDefaultUptime = '< 1 hour'; // Fallback when backend is offline

// https://astro.build/config
export default defineConfig({
  integrations: [
    react({
      // Enable React components in .astro files
      include: ['**/react/*', '**/components/**/*'],
    }),
  ],
  output: 'server',
  adapter: netlify({
    edgeMiddleware: true
  }),
  server: {
    port: 3000,
    host: true
  },
  // Security configuration - simplified CSP for now
  experimental: {
    csp: true
  },
  // Vite configuration for Liquid Glass optimization
  vite: {
    plugins: [tailwindcss()],
    // ASTRO 2025: Inject build-time constants (zero runtime overhead)
    define: {
      'import.meta.env.VITE_ASTRO_VERSION': JSON.stringify(astroVersion),
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
      'import.meta.env.VITE_SERVER_PORT': JSON.stringify(serverPort),
      'import.meta.env.VITE_BACKEND_FRAMEWORK': JSON.stringify(backendFramework),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(expectedBackendPort),
      'import.meta.env.VITE_BACKEND_VERSION': JSON.stringify(backendVersion),
      'import.meta.env.VITE_BACKEND_DEFAULT_UPTIME': JSON.stringify(backendDefaultUptime),
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'dompurify', 'crypto-js'],
    },
    build: {
      // Bundle optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk for third-party libraries
            vendor: ['react', 'react-dom'],
            // Security utilities chunk
            security: ['dompurify', 'crypto-js'],
            // UI libraries chunk
            ui: ['@headlessui/react', '@heroicons/react'],
          },
        },
      },
      // Enable source maps in development only
      sourcemap: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
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
